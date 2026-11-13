import React, { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { soundEngine } from '../audio/soundEngine'
import {
  HOLO_MATRIX_DEPTH,
  HOLO_MATRIX_KEYS,
  HOLO_MATRIX_WIDTH,
  HoloKeySpec,
} from '../constants/holoMatrixLayout'
import { AccentTheme, TelemetryPulseState } from '../types/typing'

interface SciFi3DSceneProps {
  accent: AccentTheme
  telemetryRef: React.MutableRefObject<TelemetryPulseState>
  streakIntensityRef: React.MutableRefObject<number>
  onCoreClick: (code?: string) => void
}

const ERROR_COLOR = new THREE.Color('#ff2446')
const CRYSTAL_BASE_COLOR = new THREE.Color('#0c1524')
const CRYSTAL_EMISSIVE_IDLE = new THREE.Color('#091b2e')
const GLYPH_IDLE_COLOR = new THREE.Color('#cbd5e1')
const SOCKET_IDLE_COLOR = new THREE.Color('#09111e')
const WING_BAR_COUNT = 8
const SHOCKWAVE_POOL_SIZE = 16
const STAR_COUNT = 380

let cachedGlowTex: THREE.CanvasTexture | null = null
let cachedDeckTex: THREE.CanvasTexture | null = null
let cachedSocketTex: THREE.CanvasTexture | null = null
const waferGlyphTexCache = new Map<string, THREE.CanvasTexture>()

function getGlowSpriteTexture(): THREE.CanvasTexture {
  if (cachedGlowTex) return cachedGlowTex
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  )
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)')
  grad.addColorStop(0.32, 'rgba(255, 255, 255, 0.58)')
  grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.14)')
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  cachedGlowTex = tex
  return tex
}

function getMatrixDeckTexture(): THREE.CanvasTexture {
  if (cachedDeckTex) return cachedDeckTex
  const w = 1024
  const h = 512
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, w, h)

  // Fine technical blueprint micro-grid across optical deck
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)'
  ctx.lineWidth = 1
  const stepX = w / 30
  const stepY = h / 10
  for (let x = 0; x <= w; x += stepX) {
    ctx.beginPath()
    ctx.moveTo(x, 12)
    ctx.lineTo(x, h - 12)
    ctx.stroke()
  }
  for (let y = 0; y <= h; y += stepY) {
    ctx.beginPath()
    ctx.moveTo(12, y)
    ctx.lineTo(w - 12, y)
    ctx.stroke()
  }

  // Outer perimeter etched corner brackets
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)'
  ctx.lineWidth = 3
  const pad = 10
  const corner = 38
  const corners = [
    [pad, pad, 1, 1],
    [w - pad, pad, -1, 1],
    [pad, h - pad, 1, -1],
    [w - pad, h - pad, -1, -1],
  ] as const
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath()
    ctx.moveTo(cx + dx * corner, cy)
    ctx.lineTo(cx, cy)
    ctx.lineTo(cx, cy + dy * corner)
    ctx.stroke()
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.anisotropy = 4
  tex.needsUpdate = true
  cachedDeckTex = tex
  return tex
}

function getEmitterSocketTexture(): THREE.CanvasTexture {
  if (cachedSocketTex) return cachedSocketTex
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, size, size)

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.08,
    size / 2,
    size / 2,
    size * 0.5,
  )
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
  grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.32)')
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  // Etched frame ring inside socket
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.58)'
  ctx.lineWidth = 3
  ctx.strokeRect(10, 10, size - 20, size - 20)

  const tex = new THREE.CanvasTexture(canvas)
  tex.anisotropy = 4
  tex.needsUpdate = true
  cachedSocketTex = tex
  return tex
}

function getWaferGlyphTexture(spec: HoloKeySpec): THREE.CanvasTexture {
  const existing = waferGlyphTexCache.get(spec.code)
  if (existing) return existing

  const aspectRatio = Math.max(1, spec.width / spec.depth)
  const h = 128
  const w = Math.min(512, Math.round(h * aspectRatio))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, w, h)

  // Futuristic corner reticle ticks inside crystal face
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)'
  ctx.lineWidth = 2.5
  const inset = 10
  const tick = 14
  const corners = [
    [inset, inset, 1, 1],
    [w - inset, inset, -1, 1],
    [inset, h - inset, 1, -1],
    [w - inset, h - inset, -1, -1],
  ] as const
  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath()
    ctx.moveTo(cx + dx * tick, cy)
    ctx.lineTo(cx, cy)
    ctx.lineTo(cx, cy + dy * tick)
    ctx.stroke()
  }

  // Faint border trace
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(6, 6, w - 12, h - 12)

  // Secondary top-left shifted glyph
  if (spec.subLabel) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.58)'
    ctx.font = '600 26px "JetBrains Mono", ui-monospace, monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(spec.subLabel, 18, 16)
  }

  // Primary engraved legend
  ctx.fillStyle = 'rgba(255, 255, 255, 0.96)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  if (spec.code === 'Space') {
    ctx.font = '500 20px "JetBrains Mono", ui-monospace, monospace'
    ctx.fillText(spec.label, w / 2, h / 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'
    ctx.fillRect(w * 0.25, h - 22, w * 0.5, 3)
  } else if (spec.isModifier) {
    ctx.font = '600 22px "JetBrains Mono", ui-monospace, monospace'
    ctx.fillText(spec.label, w / 2, h / 2)
  } else if (spec.subLabel) {
    ctx.font = '700 34px "JetBrains Mono", ui-monospace, monospace'
    ctx.fillText(spec.label, w * 0.56, h * 0.62)
  } else {
    ctx.font = '700 46px "JetBrains Mono", ui-monospace, monospace'
    ctx.fillText(spec.label, w / 2, h / 2 + 2)
    // Tactile homing micro-bar for F / J index wafers
    if (spec.code === 'KeyF' || spec.code === 'KeyJ') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.78)'
      ctx.fillRect(w / 2 - 14, h - 24, 28, 3.5)
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.anisotropy = 4
  tex.needsUpdate = true
  waferGlyphTexCache.set(spec.code, tex)
  return tex
}

const StarfieldParticles: React.FC<{
  accentColor: THREE.Color
  streakRef: React.MutableRefObject<number>
  energyRef: React.MutableRefObject<number>
}> = ({ accentColor, streakRef, energyRef }) => {
  const matRef = useRef<THREE.PointsMaterial>(null)
  const sprite = useMemo(() => getGlowSpriteTexture(), [])

  const { geometry, basePositions, speeds } = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3)
    const spd = new Float32Array(STAR_COUNT)
    for (let i = 0; i < STAR_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 44
      positions[i * 3 + 1] = -2.2 + Math.random() * 16
      positions[i * 3 + 2] = -32 + Math.random() * 40
      spd[i] = 0.6 + Math.random() * 1.4
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return { geometry: geo, basePositions: positions, speeds: spd }
  }, [])

  useEffect(() => {
    return () => {
      geometry.dispose()
    }
  }, [geometry])

  const starTint = useMemo(() => new THREE.Color('#cbd5e1'), [])
  const scratchTint = useMemo(() => new THREE.Color(), [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.04)
    const attr = geometry.getAttribute('position') as THREE.BufferAttribute
    // Typing WPM/Combo drives star warp velocity cleanly; background synth adds gentle ambient motion
    const driftSpeed = 0.55 + streakRef.current * 5.2 + energyRef.current * 0.9

    for (let i = 0; i < STAR_COUNT; i++) {
      const zIdx = i * 3 + 2
      let z = basePositions[zIdx] + speeds[i] * driftSpeed * dt
      if (z > 8.5) {
        z = -32
      }
      basePositions[zIdx] = z
    }
    attr.needsUpdate = true

    if (matRef.current) {
      scratchTint.copy(starTint).lerp(accentColor, 0.25 + streakRef.current * 0.55)
      matRef.current.color.copy(scratchTint)
      matRef.current.opacity = 0.34 + streakRef.current * 0.3 + energyRef.current * 0.14
    }
  })

  return (
    <points geometry={geometry}>
      <pointsMaterial
        ref={matRef}
        map={sprite}
        size={0.18}
        sizeAttenuation
        transparent
        opacity={0.42}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/**
 * 61 Floating Optical Crystal Sensor Wafers with Damped Spring Key Travel,
 * Radial Keystroke Ripples, Next-Key Targeting Reticle, and Recessed Socket Pads.
 */
const HoloCrystalMatrixKeys: React.FC<{
  accentColor: THREE.Color
  secondaryColor: THREE.Color
  telemetryRef: React.MutableRefObject<TelemetryPulseState>
  streakRef: React.MutableRefObject<number>
  audioEnergyRef: React.MutableRefObject<number>
  onWaferClick: (code: string) => void
}> = ({
  accentColor,
  secondaryColor,
  telemetryRef,
  streakRef,
  audioEnergyRef,
  onWaferClick,
}) => {
  const waferGroupRefs = useRef<Array<THREE.Group | null>>([])
  const waferMatRefs = useRef<Array<THREE.MeshStandardMaterial | null>>([])
  const glyphMatRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([])
  const auraMatRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([])
  const socketMatRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([])

  const depthRef = useRef<Float32Array>(new Float32Array(HOLO_MATRIX_KEYS.length))
  const velocityRef = useRef<Float32Array>(new Float32Array(HOLO_MATRIX_KEYS.length))

  const socketTex = useMemo(() => getEmitterSocketTexture(), [])
  const glyphTextures = useMemo(
    () => HOLO_MATRIX_KEYS.map((spec) => getWaferGlyphTexture(spec)),
    [],
  )

  const scratchColor = useMemo(() => new THREE.Color(), [])
  const scratchEmissive = useMemo(() => new THREE.Color(), [])
  const scratchGlyph = useMemo(() => new THREE.Color(), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.035)
    const now = performance.now()
    const time = state.clock.elapsedTime
    const telemetry = telemetryRef.current
    const keyStates = telemetry.keyStates
    const expected = telemetry.expectedCodes
    const shockwaves = telemetry.shockwaves
    const flow = streakRef.current
    const ambient = audioEnergyRef.current

    const depths = depthRef.current
    const vels = velocityRef.current

    for (let i = 0; i < HOLO_MATRIX_KEYS.length; i++) {
      const spec = HOLO_MATRIX_KEYS[i]
      const group = waferGroupRefs.current[i]
      const waferMat = waferMatRefs.current[i]
      const glyphMat = glyphMatRefs.current[i]
      const auraMat = auraMatRefs.current[i]
      const socketMat = socketMatRefs.current[i]
      if (!group || !waferMat || !glyphMat || !auraMat || !socketMat) continue

      const ks = keyStates[spec.code]
      const isDown = Boolean(ks?.down)
      const pressAge = ks ? now - ks.pressedAt : 99999
      const releaseAge = ks ? now - ks.releasedAt : 99999
      const errorAge = ks ? now - ks.errorAt : 99999

      // Tactile target travel: quick hold or clean tap dip above socket (-0.14)
      const targetDepress =
        isDown || (!ks?.releasedAt && pressAge < 95) || pressAge < 70 ? -0.078 : 0

      // Tight magnetic spring physics for crisp keystroke feel
      const stiffness = isDown ? 560 : 410
      const damping = isDown ? 36 : 26
      const force = (targetDepress - depths[i]) * stiffness - vels[i] * damping
      vels[i] += force * dt
      depths[i] += vels[i] * dt
      // Hard clamp prevents wafer from ever reaching socket plane (-0.14)
      if (depths[i] < -0.088) {
        depths[i] = -0.088
        vels[i] = Math.max(0, vels[i])
      } else if (depths[i] > 0.016) {
        depths[i] = 0.016
        vels[i] = Math.min(0, vels[i])
      }

      const errorShake =
        errorAge >= 0 && errorAge < 340
          ? Math.sin(now * 0.09) * 0.024 * Math.pow(1 - errorAge / 340, 1.5)
          : 0

      // Gentle magnetic hover breathe + spring displacement
      const hoverFloat = Math.sin(time * 2.0 + spec.x * 0.45 + spec.z * 0.65) * 0.004
      group.position.set(spec.x + errorShake, depths[i] + hoverFloat, spec.z)

      // Compute concentric radial shockwave from typed origin coordinates
      let waveGlow = 0
      let waveError = 0
      for (let w = 0; w < shockwaves.length; w++) {
        const sw = shockwaves[w]
        const age = now - sw.at
        if (age < 0 || age > 480) continue
        const dist = Math.hypot(spec.x - sw.originX, spec.z - sw.originZ)
        const ringRadius = (age / 480) * 6.8
        const ringWidth = 1.05
        const ringStrength = Math.max(0, 1 - Math.abs(dist - ringRadius) / ringWidth)
        const fade = Math.pow(1 - age / 480, 1.45) * sw.strength
        const contrib = ringStrength * fade * 0.65
        if (sw.isError) waveError = Math.max(waveError, contrib)
        else waveGlow = Math.max(waveGlow, contrib)
      }

      const pressGlow =
        isDown
          ? 1.0
          : pressAge >= 0 && pressAge < 360
            ? Math.pow(1 - pressAge / 360, 1.6)
            : releaseAge < 180
              ? Math.pow(1 - releaseAge / 180, 1.6) * 0.55
              : 0

      const directError =
        errorAge >= 0 && errorAge < 420 ? Math.pow(1 - errorAge / 420, 1.5) : 0

      const isTarget = expected.includes(spec.code)
      const targetPulse = isTarget ? 0.52 + Math.sin(time * 5.2) * 0.18 : 0

      const totalError = Math.min(1, directError * 1.1 + waveError * 0.85)
      const activeEnergy = Math.min(
        1.4,
        pressGlow * 1.15 + waveGlow * 0.8 + targetPulse * 0.72 + flow * 0.16,
      )

      scratchColor
        .copy(accentColor)
        .lerp(secondaryColor, waveGlow * 0.45)
        .lerp(ERROR_COLOR, totalError)

      scratchEmissive
        .copy(CRYSTAL_EMISSIVE_IDLE)
        .lerp(scratchColor, Math.min(1, 0.1 + activeEnergy * 0.72 + ambient * 0.08))

      waferMat.color.copy(CRYSTAL_BASE_COLOR).lerp(scratchColor, 0.1 + activeEnergy * 0.35)
      waferMat.emissive.copy(scratchEmissive)
      waferMat.emissiveIntensity =
        0.16 +
        ambient * 0.14 +
        flow * 0.25 +
        targetPulse * 0.65 +
        waveGlow * 0.75 +
        pressGlow * 1.15 +
        totalError * 1.35

      scratchGlyph
        .copy(GLYPH_IDLE_COLOR)
        .lerp(accentColor, Math.min(1, targetPulse * 0.9 + pressGlow * 0.85 + flow * 0.2))
        .lerp(ERROR_COLOR, totalError)
      glyphMat.color.copy(scratchGlyph)
      glyphMat.opacity = Math.min(
        1,
        (spec.isModifier ? 0.56 : 0.78) + targetPulse * 0.25 + pressGlow * 0.3 + totalError * 0.3,
      )

      auraMat.color.copy(scratchColor)
      auraMat.opacity = Math.min(
        0.92,
        0.06 +
          ambient * 0.06 +
          flow * 0.12 +
          targetPulse * 0.44 +
          waveGlow * 0.48 +
          pressGlow * 0.75 +
          totalError * 0.8,
      )

      socketMat.color.copy(
        activeEnergy > 0.18 || totalError > 0.1 ? scratchColor : SOCKET_IDLE_COLOR,
      )
      socketMat.opacity = Math.min(
        0.95,
        0.22 + targetPulse * 0.45 + pressGlow * 0.7 + waveGlow * 0.4 + totalError * 0.75,
      )
    }
  })

  return (
    <group>
      {/* Fixed Recessed Emitter Sockets beneath every optical wafer at y = -0.14 */}
      {HOLO_MATRIX_KEYS.map((spec, idx) => (
        <mesh
          key={`sock-${spec.code}`}
          position={[spec.x, -0.14, spec.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[spec.width * 0.92, spec.depth * 0.92]} />
          <meshBasicMaterial
            ref={(el) => {
              socketMatRefs.current[idx] = el
            }}
            map={socketTex}
            color="#0f172a"
            transparent
            opacity={0.28}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* 61 Floating Crystalline Sensor Wafers */}
      {HOLO_MATRIX_KEYS.map((spec, idx) => (
        <group
          key={spec.code}
          ref={(el) => {
            waferGroupRefs.current[idx] = el
          }}
          position={[spec.x, 0, spec.z]}
          onPointerDown={(e) => {
            e.stopPropagation()
            onWaferClick(spec.code)
          }}
        >
          {/* Thin Sapphire-Obsidian Translucent Crystal Plate */}
          <mesh>
            <boxGeometry args={[spec.width, 0.06, spec.depth]} />
            <meshStandardMaterial
              ref={(el) => {
                waferMatRefs.current[idx] = el
              }}
              color="#0c1524"
              emissive="#091b2e"
              emissiveIntensity={0.2}
              roughness={0.18}
              metalness={0.78}
              transparent
              opacity={0.86}
            />
          </mesh>

          {/* Underside Plasma Glow Aura Card (moves with wafer, always above socket -0.14) */}
          <mesh position={[0, -0.032, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[spec.width * 0.96, spec.depth * 0.96]} />
            <meshBasicMaterial
              ref={(el) => {
                auraMatRefs.current[idx] = el
              }}
              color={accentColor}
              transparent
              opacity={0.12}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* Top Laser-Etched Glass Glyph Reticle */}
          <mesh position={[0, 0.032, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[spec.width * 0.95, spec.depth * 0.95]} />
            <meshBasicMaterial
              ref={(el) => {
                glyphMatRefs.current[idx] = el
              }}
              map={glyphTextures[idx]}
              color="#cbd5e1"
              transparent
              opacity={spec.isModifier ? 0.58 : 0.78}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/**
 * Expanding Optical Shockwave Rings across the Holographic Floor Deck
 */
const MatrixShockwaves: React.FC<{
  accentColor: THREE.Color
  telemetryRef: React.MutableRefObject<TelemetryPulseState>
}> = ({ accentColor, telemetryRef }) => {
  const meshRefs = useRef<Array<THREE.Mesh | null>>([])
  const matRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([])
  const ringGeo = useMemo(() => new THREE.RingGeometry(0.86, 1.0, 48), [])

  useEffect(() => {
    return () => {
      ringGeo.dispose()
    }
  }, [ringGeo])

  useFrame(() => {
    const now = performance.now()
    const waves = telemetryRef.current.shockwaves

    for (let i = 0; i < SHOCKWAVE_POOL_SIZE; i++) {
      const mesh = meshRefs.current[i]
      const mat = matRefs.current[i]
      const sw = waves[i]
      if (!mesh || !mat || !sw) continue

      const age = now - sw.at
      const duration = 560
      if (age < 0 || age > duration) {
        mesh.visible = false
        continue
      }

      mesh.visible = true
      const progress = age / duration
      const eased = 1 - Math.pow(1 - progress, 2.2)
      const radius = 0.25 + eased * (3.2 * Math.min(1.25, sw.strength))

      mesh.position.set(sw.originX, -0.148, sw.originZ)
      mesh.scale.set(radius, radius, 1)
      mat.color.copy(sw.isError ? ERROR_COLOR : accentColor)
      mat.opacity = Math.pow(1 - progress, 1.8) * (sw.isError ? 0.78 : 0.45)
    }
  })

  return (
    <group>
      {Array.from({ length: SHOCKWAVE_POOL_SIZE }).map((_, idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            meshRefs.current[idx] = el
          }}
          rotation={[-Math.PI / 2, 0, 0]}
          geometry={ringGeo}
          visible={false}
        >
          <meshBasicMaterial
            ref={(el) => {
              matRefs.current[idx] = el
            }}
            color={accentColor}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Twin Flanking Magnetic Stabilizer Wings displaying live WPM/Combo kinetic telemetry
 * alongside delicate background audio energy breathing.
 */
const StabilizerWings: React.FC<{
  accentColor: THREE.Color
  secondaryColor: THREE.Color
  streakRef: React.MutableRefObject<number>
  energyRef: React.MutableRefObject<number>
}> = ({ accentColor, secondaryColor, streakRef, energyRef }) => {
  const barMatRefs = useRef<Array<THREE.MeshStandardMaterial | null>>([])
  const scratchColor = useMemo(() => new THREE.Color(), [])

  useFrame(() => {
    const flow = streakRef.current
    const energy = energyRef.current
    const litLevel = flow * 0.78 + energy * 0.22

    for (let side = 0; side < 2; side++) {
      for (let b = 0; b < WING_BAR_COUNT; b++) {
        const mat = barMatRefs.current[side * WING_BAR_COUNT + b]
        if (!mat) continue
        const threshold = (b + 1) / WING_BAR_COUNT
        const active = Math.max(0, Math.min(1, (litLevel - threshold + 0.18) * 4.5))
        scratchColor.copy(accentColor).lerp(secondaryColor, b / (WING_BAR_COUNT - 1))
        mat.color.copy(scratchColor)
        mat.emissive.copy(scratchColor)
        mat.emissiveIntensity = 0.14 + active * 1.35 + energy * 0.25
        mat.opacity = 0.28 + active * 0.68
      }
    }
  })

  return (
    <group>
      {([-1, 1] as const).map((dir, sideIdx) => (
        <group key={dir} position={[dir * (HOLO_MATRIX_WIDTH * 0.5 + 0.62), -0.1, 0]}>
          {/* Machined Angled Titanium Wing Pylon */}
          <mesh rotation={[0, 0, dir * -0.18]}>
            <boxGeometry args={[0.36, 0.09, HOLO_MATRIX_DEPTH * 0.88]} />
            <meshStandardMaterial color="#0e1728" roughness={0.28} metalness={0.88} />
          </mesh>

          {/* 8 Progressive Kinetic Streak Energy Bars */}
          {Array.from({ length: WING_BAR_COUNT }).map((_, b) => {
            const zPos = ((WING_BAR_COUNT - 1) * 0.5 - b) * 0.36
            return (
              <mesh key={b} position={[dir * -0.02, 0.052, zPos]}>
                <boxGeometry args={[0.18, 0.018, 0.18]} />
                <meshStandardMaterial
                  ref={(el) => {
                    barMatRefs.current[sideIdx * WING_BAR_COUNT + b] = el
                  }}
                  color={accentColor}
                  emissive={accentColor}
                  emissiveIntensity={0.25}
                  transparent
                  opacity={0.4}
                  roughness={0.2}
                />
              </mesh>
            )
          })}
        </group>
      ))}
    </group>
  )
}

const HoloMatrixRig: React.FC<SciFi3DSceneProps> = ({
  accent,
  telemetryRef,
  streakIntensityRef,
  onCoreClick,
}) => {
  const { camera, size } = useThree()
  const parallaxGroupRef = useRef<THREE.Group>(null)
  const deckRimMatRef = useRef<THREE.MeshStandardMaterial>(null)
  const pointerRef = useRef({ x: 0, y: 0 })
  const smoothStreakRef = useRef(0)
  const energyRef = useRef(0)
  const halfBinsRef = useRef<Float32Array>(new Float32Array(32))

  const accentColor = useMemo(() => new THREE.Color(accent.hex), [accent.hex])
  const secondaryColor = useMemo(
    () => new THREE.Color(accent.secondaryHex),
    [accent.secondaryHex],
  )
  const deckTex = useMemo(() => getMatrixDeckTexture(), [])
  const scratchRim = useMemo(() => new THREE.Color(), [])

  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height)
    const zoomScale = aspect < 1.75 ? 1.75 / aspect : 1
    camera.position.set(0, 6.2 * zoomScale, 12.2 * zoomScale)
    camera.lookAt(0, 1.35, -0.4)
    camera.updateProjectionMatrix()
  }, [camera, size.width, size.height])

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      pointerRef.current.x = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1
      pointerRef.current.y = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.04)
    const now = performance.now()
    const audio = soundEngine.sampleAudioMetrics(halfBinsRef.current)
    energyRef.current += (audio.energy - energyRef.current) * Math.min(1, dt * 10)
    smoothStreakRef.current +=
      (streakIntensityRef.current - smoothStreakRef.current) * Math.min(1, dt * 5)

    // Gentle responsive mouse-move parallax tilt
    if (parallaxGroupRef.current) {
      const targetRotY = pointerRef.current.x * 0.055
      const targetRotX = -pointerRef.current.y * 0.036
      const targetPosX = pointerRef.current.x * 0.18
      const targetPosY = -pointerRef.current.y * 0.09

      parallaxGroupRef.current.rotation.y +=
        (targetRotY - parallaxGroupRef.current.rotation.y) * Math.min(1, dt * 6)
      parallaxGroupRef.current.rotation.x +=
        (targetRotX - parallaxGroupRef.current.rotation.x) * Math.min(1, dt * 6)
      parallaxGroupRef.current.position.x +=
        (targetPosX - parallaxGroupRef.current.position.x) * Math.min(1, dt * 6)
      parallaxGroupRef.current.position.y +=
        (targetPosY - parallaxGroupRef.current.position.y) * Math.min(1, dt * 6)
    }

    const pulseAge = now - telemetryRef.current.lastPulseAt
    const errorFlash =
      telemetryRef.current.lastIsError && pulseAge >= 0 && pulseAge < 320
        ? Math.pow(1 - pulseAge / 320, 1.5)
        : 0
    const keyFlash =
      !telemetryRef.current.lastIsError && pulseAge >= 0 && pulseAge < 220
        ? Math.pow(1 - pulseAge / 220, 1.8)
        : 0

    if (deckRimMatRef.current) {
      scratchRim.copy(accentColor).lerp(ERROR_COLOR, errorFlash)
      deckRimMatRef.current.color.copy(scratchRim)
      deckRimMatRef.current.emissive.copy(scratchRim)
      deckRimMatRef.current.emissiveIntensity =
        0.45 + smoothStreakRef.current * 0.95 + keyFlash * 0.7 + energyRef.current * 0.25 + errorFlash * 1.4
    }
  })

  const handleWaferClick = (code: string) => {
    soundEngine.unlockFromGesture()
    const keySpec = HOLO_MATRIX_KEYS.find((k) => k.code === code)
    if (keySpec) {
      const st = telemetryRef.current
      const now = performance.now()
      st.keyStates[code] = {
        down: false,
        pressedAt: now,
        releasedAt: -100000,
        errorAt: -100000,
      }
    }
    soundEngine.playTypingChime(code, 4)
    onCoreClick(code)
  }

  return (
    <group ref={parallaxGroupRef}>
      <ambientLight intensity={0.34} color="#94a3b8" />
      <directionalLight position={[6, 11, 8]} intensity={1.35} color="#f1f5f9" />
      <directionalLight position={[-7, 6, 4]} intensity={0.85} color={accent.secondaryHex} />
      <directionalLight position={[0, 4, -8]} intensity={0.75} color={accent.hex} />

      <StarfieldParticles
        accentColor={accentColor}
        streakRef={smoothStreakRef}
        energyRef={energyRef}
      />

      {/* Obsidian Reflective Floor Horizon Grid */}
      <group position={[0, -1.75, -2]}>
        <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[72, 54]} />
          <meshStandardMaterial color="#04060b" roughness={0.72} metalness={0.35} />
        </mesh>
        <gridHelper args={[54, 42, '#162c44', '#0b1220']} position={[0, 0, 0]} />
      </group>

      {/* Tilted Floating Sci-Fi Holographic Crystal Input Matrix */}
      <group
        position={[0, -0.45, 0]}
        rotation={[0.28, 0, 0]}
        onPointerDown={() => {
          soundEngine.unlockFromGesture()
          onCoreClick()
        }}
      >
        {/* Ultra-Slim Open Optical Emitter Platter below hovering crystal wafers */}
        <mesh position={[0, -0.178, 0]}>
          <boxGeometry args={[HOLO_MATRIX_WIDTH + 0.56, 0.048, HOLO_MATRIX_DEPTH + 0.52]} />
          <meshStandardMaterial color="#090f1b" roughness={0.34} metalness={0.88} />
        </mesh>

        {/* Etched Blueprint Grid Overlay on Optical Deck */}
        <mesh position={[0, -0.152, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[HOLO_MATRIX_WIDTH + 0.44, HOLO_MATRIX_DEPTH + 0.4]} />
          <meshBasicMaterial
            map={deckTex}
            color={accent.hex}
            transparent
            opacity={0.34}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Slim Perimeter Holographic Energy Filament Rails (Front / Back / Sides) */}
        <mesh position={[0, -0.15, (HOLO_MATRIX_DEPTH + 0.52) * 0.5]}>
          <boxGeometry args={[HOLO_MATRIX_WIDTH + 0.56, 0.016, 0.024]} />
          <meshStandardMaterial
            ref={deckRimMatRef}
            color={accent.hex}
            emissive={accent.hex}
            emissiveIntensity={0.65}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[0, -0.15, -(HOLO_MATRIX_DEPTH + 0.52) * 0.5]}>
          <boxGeometry args={[HOLO_MATRIX_WIDTH + 0.56, 0.016, 0.024]} />
          <meshBasicMaterial color={accent.secondaryHex} transparent opacity={0.5} />
        </mesh>

        {/* Twin Kinetic Stabilizer Pylon Wings */}
        <StabilizerWings
          accentColor={accentColor}
          secondaryColor={secondaryColor}
          streakRef={smoothStreakRef}
          energyRef={energyRef}
        />

        {/* Expanding Floor Shockwaves originating directly from typed crystal positions */}
        <MatrixShockwaves accentColor={accentColor} telemetryRef={telemetryRef} />

        {/* 61 Floating Crystalline Sensor Wafers */}
        <HoloCrystalMatrixKeys
          accentColor={accentColor}
          secondaryColor={secondaryColor}
          telemetryRef={telemetryRef}
          streakRef={smoothStreakRef}
          audioEnergyRef={energyRef}
          onWaferClick={handleWaferClick}
        />
      </group>
    </group>
  )
}

export const SciFi3DScene: React.FC<SciFi3DSceneProps> = (props) => {
  return (
    <div className="fixed inset-0 z-0 select-none">
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
        }}
        camera={{ fov: 38, near: 0.5, far: 95, position: [0, 6.2, 12.2] }}
      >
        <HoloMatrixRig {...props} />
      </Canvas>
    </div>
  )
}
