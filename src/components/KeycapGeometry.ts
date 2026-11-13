import * as THREE from 'three'
import { KeyDefinition } from '../types/typing'

interface PerimeterPoint {
  x: number
  z: number
}

function createRoundedRectPerimeter(
  width: number,
  depth: number,
  radius: number,
  segmentsPerCorner = 4,
): PerimeterPoint[] {
  const hw = width / 2
  const hd = depth / 2
  const r = Math.min(radius, hw * 0.45, hd * 0.45)

  // Trace CCW when viewed from +Y: (+X, +Z) -> (+X, -Z) -> (-X, -Z) -> (-X, +Z)
  const corners = [
    { cx: hw - r, cz: hd - r, startAngle: Math.PI / 2, endAngle: 0 }, // front-right (+X, +Z)
    { cx: hw - r, cz: -hd + r, startAngle: 0, endAngle: -Math.PI / 2 }, // back-right (+X, -Z)
    { cx: -hw + r, cz: -hd + r, startAngle: -Math.PI / 2, endAngle: -Math.PI }, // back-left (-X, -Z)
    { cx: -hw + r, cz: hd - r, startAngle: -Math.PI, endAngle: -1.5 * Math.PI }, // front-left (-X, +Z)
  ]

  const pts: PerimeterPoint[] = []
  for (const corner of corners) {
    for (let i = 0; i <= segmentsPerCorner; i++) {
      const t = i / segmentsPerCorner
      const a = corner.startAngle + (corner.endAngle - corner.startAngle) * t
      pts.push({
        x: corner.cx + Math.cos(a) * r,
        z: corner.cz + Math.sin(a) * r,
      })
    }
  }
  return pts
}

const ROW_PROFILES: Record<number, { height: number; slant: number }> = {
  0: { height: 0.49, slant: 0.11 },
  1: { height: 0.44, slant: 0.06 },
  2: { height: 0.41, slant: 0.01 },
  3: { height: 0.42, slant: -0.04 },
  4: { height: 0.44, slant: -0.06 },
}

const geometryCache = new Map<string, THREE.BufferGeometry>()

export function getKeycapGeometry(widthU: number, row: number): THREE.BufferGeometry {
  const cacheKey = `${widthU.toFixed(2)}_${row}`
  const existing = geometryCache.get(cacheKey)
  if (existing) return existing

  const profile = ROW_PROFILES[row] ?? ROW_PROFILES[2]
  const H = profile.height
  const slant = profile.slant

  const baseW = widthU - 0.075
  const baseD = 0.915

  const shoulderW = widthU - 0.22
  const shoulderD = 0.76

  const topW = shoulderW - 0.055
  const topD = shoulderD - 0.055

  // Slight backward offset for top surface matching Cherry sculpted profile
  const zShiftTop = -0.025

  const segs = 4
  const ringBase = createRoundedRectPerimeter(baseW, baseD, 0.075, segs)
  const ringMid = createRoundedRectPerimeter(
    baseW * 0.58 + shoulderW * 0.42,
    baseD * 0.58 + shoulderD * 0.42,
    0.07,
    segs,
  )
  const ringShoulder = createRoundedRectPerimeter(shoulderW, shoulderD, 0.065, segs)
  const ringTop = createRoundedRectPerimeter(topW, topD, 0.055, segs)

  const n = ringBase.length

  const evalTopY = (x: number, zLocal: number) => {
    // Cylindrical ergonomic finger scoop on 1u keys, gentler on wide modifiers/space
    const normX = Math.min(1, Math.abs(x) / Math.max(0.35, topW * 0.5))
    const scoopDepth = widthU > 3 ? 0.004 : 0.018
    const scoop = scoopDepth * (normX * normX - 0.6)
    const tilt = -zLocal * Math.sin(slant)
    return H + tilt + scoop
  }

  const rings: { x: number; y: number; z: number }[][] = [
    ringBase.map((p) => ({ x: p.x, y: 0, z: p.z })),
    ringMid.map((p) => ({
      x: p.x,
      y: H * 0.45,
      z: p.z + zShiftTop * 0.45,
    })),
    ringShoulder.map((p) => ({
      x: p.x,
      y: H - 0.042 - p.z * Math.sin(slant) * 0.8,
      z: p.z + zShiftTop * 0.92,
    })),
    ringTop.map((p) => ({
      x: p.x,
      y: evalTopY(p.x, p.z),
      z: p.z + zShiftTop,
    })),
  ]

  const positions: number[] = []
  const uvs: number[] = []
  const sideIndices: number[] = []
  const topIndices: number[] = []

  // Push side ring vertices
  const ringOffsets: number[] = []
  for (let r = 0; r < rings.length; r++) {
    ringOffsets.push(positions.length / 3)
    const ring = rings[r]
    for (let i = 0; i < n; i++) {
      const v = ring[i]
      positions.push(v.x, v.y, v.z)
      uvs.push(0.02, 0.02)
    }
  }

  // Side walls between consecutive rings
  for (let r = 0; r < rings.length - 1; r++) {
    const aOff = ringOffsets[r]
    const bOff = ringOffsets[r + 1]
    for (let i = 0; i < n; i++) {
      const next = (i + 1) % n
      const a0 = aOff + i
      const a1 = aOff + next
      const b0 = bOff + i
      const b1 = bOff + next

      sideIndices.push(a0, a1, b1)
      sideIndices.push(a0, b1, b0)
    }
  }

  // Top surface: separate vertices so normals & UVs are crisp and isolated from wall bevels
  const topPerimeterOffset = positions.length / 3
  for (let i = 0; i < n; i++) {
    const p = ringTop[i]
    const y = evalTopY(p.x, p.z)
    positions.push(p.x, y, p.z + zShiftTop)
    const u = p.x / topW + 0.5
    const v = 1 - (p.z / topD + 0.5)
    uvs.push(u, v)
  }

  // Inner intermediate ring for smooth cylindrical scoop shading on the top dish
  const innerScale = 0.48
  const innerRingOffset = positions.length / 3
  for (let i = 0; i < n; i++) {
    const p = ringTop[i]
    const ix = p.x * innerScale
    const iz = p.z * innerScale
    const iy = evalTopY(ix, iz)
    positions.push(ix, iy, iz + zShiftTop)
    const u = ix / topW + 0.5
    const v = 1 - (iz / topD + 0.5)
    uvs.push(u, v)
  }

  const centerIdx = positions.length / 3
  positions.push(0, evalTopY(0, 0), zShiftTop)
  uvs.push(0.5, 0.5)

  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n
    // Outer top band
    const o0 = topPerimeterOffset + i
    const o1 = topPerimeterOffset + next
    const in0 = innerRingOffset + i
    const in1 = innerRingOffset + next
    topIndices.push(o0, o1, in1)
    topIndices.push(o0, in1, in0)

    // Center fan
    topIndices.push(in0, in1, centerIdx)
  }

  const allIndices = [...sideIndices, ...topIndices]

  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geom.setIndex(allIndices)
  geom.clearGroups()
  geom.addGroup(0, sideIndices.length, 0)
  geom.addGroup(sideIndices.length, topIndices.length, 1)
  geom.computeVertexNormals()

  geometryCache.set(cacheKey, geom)
  return geom
}

export interface KeycapTexturePair {
  map: THREE.CanvasTexture
  emissiveMap: THREE.CanvasTexture
}

const textureCache = new Map<string, KeycapTexturePair>()
const pendingFontRedraws: Array<() => void> = []
let fontListenerAttached = false

function drawKeycapCanvases(
  keyDef: KeyDefinition,
  dCtx: CanvasRenderingContext2D,
  eCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  // 1. Base PBT plastic fill + subtle tactile micro-grain
  const baseColor =
    keyDef.category === 'modifier'
      ? '#131720'
      : keyDef.category === 'accent'
        ? '#1a202c'
        : '#1b202a'

  dCtx.fillStyle = baseColor
  dCtx.fillRect(0, 0, width, height)

  // Subtle top bevel sheen vignette
  const grad = dCtx.createLinearGradient(0, 0, 0, height)
  grad.addColorStop(0, 'rgba(255,255,255,0.045)')
  grad.addColorStop(0.5, 'rgba(255,255,255,0.0)')
  grad.addColorStop(1, 'rgba(0,0,0,0.18)')
  dCtx.fillStyle = grad
  dCtx.fillRect(0, 0, width, height)

  // Deterministic subtle PBT micro-grain dots
  let seed = keyDef.code.charCodeAt(0) * 131 + keyDef.row * 37
  for (let i = 0; i < 650; i++) {
    seed = (seed * 16807) % 2147483647
    const gx = seed % width
    seed = (seed * 16807) % 2147483647
    const gy = seed % height
    dCtx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.018)' : 'rgba(0,0,0,0.025)'
    dCtx.fillRect(gx, gy, 2, 2)
  }

  // Emissive mask base: pure black + subtle inner hairline perimeter rim
  eCtx.fillStyle = '#000000'
  eCtx.fillRect(0, 0, width, height)
  eCtx.strokeStyle = 'rgba(255,255,255,0.12)'
  eCtx.lineWidth = 4
  eCtx.strokeRect(8, 8, width - 16, height - 16)

  // 2. Render double-shot legends onto both diffuse & emissive mask
  const drawLegends = (ctx: CanvasRenderingContext2D, mainColor: string, subColor: string) => {
    ctx.textBaseline = 'middle'

    if (keyDef.code === 'Space') {
      const barW = width * 0.42
      const barH = 10
      const bx = (width - barW) / 2
      const by = height * 0.5 - barH / 2
      ctx.fillStyle = mainColor
      ctx.beginPath()
      ctx.roundRect(bx, by, barW, barH, 5)
      ctx.fill()
      return
    }

    const isWideWord = keyDef.label.length > 1

    if (keyDef.shiftLabel) {
      ctx.textAlign = 'center'
      ctx.font = '600 56px "JetBrains Mono Variable", "JetBrains Mono", monospace'
      ctx.fillStyle = subColor
      ctx.fillText(keyDef.shiftLabel, width * 0.5, height * 0.31)

      ctx.font = '600 62px "JetBrains Mono Variable", "JetBrains Mono", monospace'
      ctx.fillStyle = mainColor
      ctx.fillText(keyDef.label, width * 0.5, height * 0.66)

      if (keyDef.subLabel) {
        ctx.textAlign = 'right'
        ctx.font = '700 32px "Inter Variable", "Inter", sans-serif'
        ctx.fillStyle = subColor
        ctx.fillText(keyDef.subLabel, width - 24, height - 30)
      }
      return
    }

    if (isWideWord) {
      ctx.textAlign = 'center'
      const fontSize = keyDef.width >= 2 ? 44 : 40
      ctx.font = `600 ${fontSize}px "Inter Variable", "Inter", system-ui, sans-serif`
      ctx.fillStyle = mainColor
      ctx.fillText(keyDef.label, width * 0.5, height * 0.52)
      return
    }

    ctx.textAlign = 'center'
    ctx.font = '600 84px "JetBrains Mono Variable", "JetBrains Mono", monospace'
    ctx.fillStyle = mainColor
    ctx.fillText(keyDef.label, width * 0.5, height * 0.48)

    if (keyDef.subLabel === '—') {
      const barW = 48
      const barH = 7
      ctx.fillStyle = mainColor
      ctx.beginPath()
      ctx.roundRect(width * 0.5 - barW / 2, height * 0.8 - barH / 2, barW, barH, 3.5)
      ctx.fill()
    }
  }

  drawLegends(dCtx, 'rgba(232, 238, 246, 0.90)', 'rgba(176, 190, 210, 0.72)')
  drawLegends(eCtx, 'rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.78)')
}

export function getKeycapTextures(keyDef: KeyDefinition): KeycapTexturePair {
  const cached = textureCache.get(keyDef.code)
  if (cached) return cached

  const aspect = Math.max(1, keyDef.width / 1)
  const height = 256
  const width = Math.min(1024, Math.round(height * Math.min(aspect, 4)))

  const diffCanvas = document.createElement('canvas')
  diffCanvas.width = width
  diffCanvas.height = height
  const dCtx = diffCanvas.getContext('2d')!

  const emCanvas = document.createElement('canvas')
  emCanvas.width = width
  emCanvas.height = height
  const eCtx = emCanvas.getContext('2d')!

  drawKeycapCanvases(keyDef, dCtx, eCtx, width, height)

  const map = new THREE.CanvasTexture(diffCanvas)
  map.colorSpace = THREE.SRGBColorSpace
  map.anisotropy = 8
  map.needsUpdate = true

  const emissiveMap = new THREE.CanvasTexture(emCanvas)
  emissiveMap.anisotropy = 8
  emissiveMap.needsUpdate = true

  pendingFontRedraws.push(() => {
    drawKeycapCanvases(keyDef, dCtx, eCtx, width, height)
    map.needsUpdate = true
    emissiveMap.needsUpdate = true
  })

  if (!fontListenerAttached && typeof document !== 'undefined' && document.fonts) {
    fontListenerAttached = true
    void document.fonts.ready.then(() => {
      for (const redraw of pendingFontRedraws) {
        redraw()
      }
    })
  }

  const pair = { map, emissiveMap }
  textureCache.set(keyDef.code, pair)
  return pair
}
