import React, { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { soundEngine } from '../audio/soundEngine'
import { KEYBOARD_LAYOUT } from '../constants/keyboardLayout'
import { AccentTheme, KeyDefinition, KeyPhysicsState, SoundProfile } from '../types/typing'
import { ActiveKeySpotlight } from '../hooks/useKeyPressSync'
import { getKeycapGeometry, getKeycapTextures } from './KeycapGeometry'

interface Keyboard3DSceneProps {
  accent: AccentTheme
  soundProfile: SoundProfile
  keyStatesRef: React.MutableRefObject<Record<string, KeyPhysicsState>>
  spotlightRef: React.MutableRefObject<ActiveKeySpotlight>
  streakIntensityRef: React.MutableRefObject<number>
  pressKey: (rawCode: string, isError?: boolean) => void
  releaseKey: (rawCode: string) => void
}

let cachedGlowTexture: THREE.CanvasTexture | null = null

function getRadialGlowTexture(): THREE.CanvasTexture {
  if (cachedGlowTexture) return cachedGlowTexture
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
  grad.addColorStop(0.28, 'rgba(255, 255, 255, 0.72)')
  grad.addColorStop(0.62, 'rgba(255, 255, 255, 0.22)')
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  cachedGlowTexture = tex
  return tex
}

let cachedDeskMatGlow: THREE.CanvasTexture | null = null

function getDeskMatGlowTexture(): THREE.CanvasTexture {
  if (cachedDeskMatGlow) return cachedDeskMatGlow
  const w = 512
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  ctx.clearRect(0, 0, w, h)
  ctx.save()
  ctx.translate(w / 2, h / 2)
  ctx.scale(1.0, 0.45)
  const grad = ctx.createRadialGradient(0, 0, 40, 0, 0, w * 0.48)
  grad.addColorStop(0, 'rgba(255,255,255,0.85)')
  grad.addColorStop(0.45, 'rgba(255,255,255,0.42)')
  grad.addColorStop(0.8, 'rgba(255,255,255,0.1)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(0, 0, w * 0.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  cachedDeskMatGlow = tex
  return tex
}

const ERROR_COLOR = new THREE.Color('#ff2446')

interface KeycapUnitProps {
  keyDef: KeyDefinition
  accentColorObj: THREE.Color
  keyStatesRef: React.MutableRefObject<Record<string, KeyPhysicsState>>
  streakRef: React.MutableRefObject<number>
  soundProfileRef: React.MutableRefObject<SoundProfile>
  pressKey: (rawCode: string, isError?: boolean) => void
  releaseKey: (rawCode: string) => void
}

const KeycapUnit: React.FC<KeycapUnitProps> = React.memo(
  ({
    keyDef,
    accentColorObj,
    keyStatesRef,
    streakRef,
    soundProfileRef,
    pressKey,
    releaseKey,
  }) => {
    const capGroupRef = useRef<THREE.Group>(null)
    const sideMatRef = useRef<THREE.MeshStandardMaterial>(null)
    const topMatRef = useRef<THREE.MeshStandardMaterial>(null)
    const ledMatRef = useRef<THREE.MeshBasicMaterial>(null)
    const ledMeshRef = useRef<THREE.Mesh>(null)

    const geometry = useMemo(
      () => getKeycapGeometry(keyDef.width, keyDef.row),
      [keyDef.width, keyDef.row],
    )
    const textures = useMemo(() => getKeycapTextures(keyDef), [keyDef])
    const glowTex = useMemo(() => getRadialGlowTexture(), [])
    const scratchColor = useMemo(() => new THREE.Color(), [])

    useFrame((_, delta) => {
      const state = keyStatesRef.current[keyDef.code]
      if (!state || !capGroupRef.current) return

      const now = performance.now()
      const dt = Math.min(delta, 0.032)

      // Keep minimum downward travel pulse for ultra-fast (<16ms) key taps
      const isActivelyDown = state.pressed || now < state.pressPulseUntil
      const targetY = isActivelyDown ? -0.145 : 0

      // Snappy tactile damped spring
      const stiffness = isActivelyDown ? 980 : 620
      const damping = isActivelyDown ? 38 : 30
      const force = (targetY - state.currentY) * stiffness
      const accel = force - state.velocityY * damping
      state.velocityY += accel * dt
      state.currentY += state.velocityY * dt

      // Clamp tiny micro-oscillations when resting
      if (!isActivelyDown && Math.abs(state.currentY) < 0.0008 && Math.abs(state.velocityY) < 0.005) {
        state.currentY = 0
        state.velocityY = 0
      }

      capGroupRef.current.position.y = state.currentY
      // Subtle forward pitch under finger press
      const depressionRatio = Math.max(0, -state.currentY / 0.145)
      capGroupRef.current.rotation.x = depressionRatio * 0.028

      // Glow & error flash decay
      const timeSincePress = now - state.lastPressedAt
      const timeSinceError = now - state.errorFlashAt

      const targetGlow = isActivelyDown
        ? 1.0
        : Math.max(0, 1 - timeSincePress / 300)
      state.glowIntensity += (targetGlow - state.glowIntensity) * Math.min(1, dt * 22)

      const targetErr = state.errorFlashAt > 0 ? Math.max(0, 1 - timeSinceError / 360) : 0
      state.errorIntensity += (targetErr - state.errorIntensity) * Math.min(1, dt * 24)

      const err = state.errorIntensity
      const glow = state.glowIntensity
      const baseGlow = 0.2 + streakRef.current * 0.42

      scratchColor.copy(accentColorObj).lerp(ERROR_COLOR, Math.min(1, err * 1.35))

      if (topMatRef.current) {
        topMatRef.current.emissive.copy(scratchColor)
        topMatRef.current.emissiveIntensity = baseGlow + glow * 2.1 + err * 2.4
      }

      if (sideMatRef.current) {
        sideMatRef.current.emissive.copy(scratchColor)
        sideMatRef.current.emissiveIntensity =
          0.015 + streakRef.current * 0.03 + glow * 0.16 + err * 0.45
      }

      if (ledMatRef.current && ledMeshRef.current) {
        ledMatRef.current.color.copy(scratchColor)
        const ledStrength = Math.min(1, 0.06 + streakRef.current * 0.12 + glow * 0.85 + err * 0.95)
        ledMatRef.current.opacity = ledStrength
        const pulseScale = 1 + glow * 0.22 + err * 0.28
        ledMeshRef.current.scale.set(keyDef.width * 1.15 * pulseScale, 1.15 * pulseScale, 1)
      }
    })

    return (
      <group position={[keyDef.x, 0, keyDef.z]}>
        {/* Recessed switch housing base */}
        <mesh position={[0, 0.03, 0]}>
          <boxGeometry args={[Math.min(0.45, keyDef.width * 0.4), 0.08, 0.42]} />
          <meshStandardMaterial color="#181c26" roughness={0.6} metalness={0.2} />
        </mesh>

        {/* Localized per-key LED halo sprite */}
        <mesh
          ref={ledMeshRef}
          position={[0, 0.052, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            ref={ledMatRef}
            map={glowTex}
            color={accentColorObj}
            transparent
            opacity={0.08}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Sculpted moving keycap */}
        <group ref={capGroupRef}>
          <mesh
            geometry={geometry}
            position={[0, 0.08, 0]}
            castShadow
            receiveShadow
            onPointerDown={(e) => {
              e.stopPropagation()
              soundEngine.unlock()
              pressKey(keyDef.code, false)
              soundEngine.playKeyDown(soundProfileRef.current, keyDef.soundSize)
            }}
            onPointerUp={(e) => {
              e.stopPropagation()
              releaseKey(keyDef.code)
              soundEngine.playKeyUp(soundProfileRef.current, keyDef.soundSize)
            }}
            onPointerOut={() => {
              releaseKey(keyDef.code)
            }}
          >
            <meshStandardMaterial
              ref={sideMatRef}
              attach="material-0"
              color={keyDef.category === 'modifier' ? '#131721' : '#1b202b'}
              roughness={0.58}
              metalness={0.08}
              emissive={accentColorObj}
              emissiveIntensity={0.02}
            />
            <meshStandardMaterial
              ref={topMatRef}
              attach="material-1"
              map={textures.map}
              emissiveMap={textures.emissiveMap}
              emissive={accentColorObj}
              emissiveIntensity={0.22}
              roughness={0.5}
              metalness={0.06}
            />
          </mesh>
        </group>
      </group>
    )
  },
)

KeycapUnit.displayName = 'KeycapUnit'

interface KeyboardRigProps {
  accent: AccentTheme
  soundProfile: SoundProfile
  keyStatesRef: React.MutableRefObject<Record<string, KeyPhysicsState>>
  spotlightRef: React.MutableRefObject<ActiveKeySpotlight>
  streakIntensityRef: React.MutableRefObject<number>
  pressKey: (rawCode: string, isError?: boolean) => void
  releaseKey: (rawCode: string) => void
}

const KeyboardRig: React.FC<KeyboardRigProps> = ({
  accent,
  soundProfile,
  keyStatesRef,
  spotlightRef,
  streakIntensityRef,
  pressKey,
  releaseKey,
}) => {
  const { camera, size } = useThree()
  const parallaxGroupRef = useRef<THREE.Group>(null)
  const underglowMatRef = useRef<THREE.MeshStandardMaterial>(null)
  const deskBloomMatRef = useRef<THREE.MeshBasicMaterial>(null)
  const underLightRef = useRef<THREE.PointLight>(null)
  const rovingLightRef = useRef<THREE.PointLight>(null)
  const pointerRef = useRef({ x: 0, y: 0 })
  const smoothStreakRef = useRef(0)
  const soundProfileRef = useRef<SoundProfile>(soundProfile)

  useEffect(() => {
    soundProfileRef.current = soundProfile
  }, [soundProfile])

  const accentColorObj = useMemo(() => new THREE.Color(accent.hex), [accent.hex])
  const deskGlowTex = useMemo(() => getDeskMatGlowTexture(), [])

  // Responsive camera framing so 15.8u keyboard + side bezels + underglow stay cleanly framed across viewports
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height)
    const zoomScale = aspect < 1.82 ? 1.82 / aspect : 1
    camera.position.set(0, 10.6 * zoomScale, 15.8 * zoomScale)
    camera.lookAt(0, 1.95, -1.5)
    camera.updateProjectionMatrix()
  }, [camera, size.width, size.height])

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1
      const ny = (e.clientY / Math.max(1, window.innerHeight)) * 2 - 1
      pointerRef.current.x = nx
      pointerRef.current.y = ny
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.04)
    const now = performance.now()

    // Smooth WPM/Combo ambient flow
    smoothStreakRef.current +=
      (streakIntensityRef.current - smoothStreakRef.current) * Math.min(1, dt * 4.5)
    const flow = smoothStreakRef.current

    // Gentle mouse-move parallax tilt on entire keyboard scene
    if (parallaxGroupRef.current) {
      const targetRotY = pointerRef.current.x * 0.045
      const targetRotX = -pointerRef.current.y * 0.03
      const targetPosX = pointerRef.current.x * 0.18
      const targetPosY = -pointerRef.current.y * 0.09

      parallaxGroupRef.current.rotation.y +=
        (targetRotY - parallaxGroupRef.current.rotation.y) * Math.min(1, dt * 6.5)
      parallaxGroupRef.current.rotation.x +=
        (targetRotX - parallaxGroupRef.current.rotation.x) * Math.min(1, dt * 6.5)
      parallaxGroupRef.current.position.x +=
        (targetPosX - parallaxGroupRef.current.position.x) * Math.min(1, dt * 6.5)
      parallaxGroupRef.current.position.y +=
        (targetPosY - parallaxGroupRef.current.position.y) * Math.min(1, dt * 6.5)
    }

    // Underglow & desk bloom intensification with WPM streaks
    if (underglowMatRef.current) {
      underglowMatRef.current.color.copy(accentColorObj)
      underglowMatRef.current.emissive.copy(accentColorObj)
      underglowMatRef.current.emissiveIntensity = 0.65 + flow * 1.55
    }

    if (deskBloomMatRef.current) {
      deskBloomMatRef.current.color.copy(accentColorObj)
      deskBloomMatRef.current.opacity = 0.22 + flow * 0.42
    }

    if (underLightRef.current) {
      underLightRef.current.color.copy(accentColorObj)
      underLightRef.current.intensity = 2.6 + flow * 5.2
    }

    // Roving dynamic key specular point light
    if (rovingLightRef.current) {
      const sp = spotlightRef.current
      const age = now - sp.at
      const activeFactor = Math.max(0, 1 - age / 340)
      rovingLightRef.current.position.x +=
        (sp.x - rovingLightRef.current.position.x) * Math.min(1, dt * 26)
      rovingLightRef.current.position.z +=
        (sp.z - rovingLightRef.current.position.z) * Math.min(1, dt * 26)
      rovingLightRef.current.color.copy(sp.isError ? ERROR_COLOR : accentColorObj)
      rovingLightRef.current.intensity = activeFactor * (sp.isError ? 5.5 : 4.2 + flow * 2.5)
    }
  })

  return (
    <group ref={parallaxGroupRef}>
      {/* Studio Softbox Overhead Key Lighting */}
      <ambientLight intensity={0.48} color="#cad6ec" />
      <directionalLight
        position={[3.5, 11.5, 7.5]}
        intensity={1.75}
        color="#f1f5f9"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={2}
        shadow-camera-far={28}
        shadow-camera-left={-11}
        shadow-camera-right={11}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-8, 7.5, -5]} intensity={1.05} color="#cbd5e1" />
      <directionalLight position={[9, 6, -4]} intensity={0.75} color="#94a3b8" />
      <spotLight
        position={[0, 8, -7]}
        angle={0.55}
        penumbra={0.9}
        intensity={1.1}
        color={accent.hex}
      />

      {/* Tilted Keyboard Assembly */}
      <group rotation={[0.075, 0, 0]} position={[0, -0.15, 0.25]}>
        {/* Matte Dark Studio Desk Mat */}
        <mesh position={[0, -0.35, 0.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[46, 26]} />
          <meshStandardMaterial color="#090c12" roughness={0.92} metalness={0.05} />
        </mesh>

        {/* Soft Desk-Mat RGB Underglow Spill */}
        <mesh position={[0, -0.34, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[22.5, 11.2]} />
          <meshBasicMaterial
            ref={deskBloomMatRef}
            map={deskGlowTex}
            color={accent.hex}
            transparent
            opacity={0.28}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Under-Chassis Accent Point Light */}
        <pointLight
          ref={underLightRef}
          position={[0, -0.22, 0]}
          color={accent.hex}
          intensity={2.8}
          distance={12}
          decay={2}
        />

        {/* Roving Specular Keypress Light */}
        <pointLight
          ref={rovingLightRef}
          position={[0, 0.9, 0]}
          color={accent.hex}
          intensity={0}
          distance={4.8}
          decay={2}
        />

        {/* Polycarbonate Translucent Underglow Perimeter Ring */}
        <mesh position={[0, -0.21, 0]}>
          <boxGeometry args={[15.88, 0.11, 5.88]} />
          <meshStandardMaterial
            ref={underglowMatRef}
            color={accent.hex}
            emissive={accent.hex}
            emissiveIntensity={0.8}
            roughness={0.25}
            metalness={0.1}
          />
        </mesh>

        {/* Dark Anodized Aluminum Lower Chassis Core */}
        <mesh position={[0, -0.09, 0]} castShadow receiveShadow>
          <boxGeometry args={[15.82, 0.18, 5.82]} />
          <meshStandardMaterial color="#181d28" roughness={0.3} metalness={0.74} />
        </mesh>

        {/* Brushed Dark Titanium Switch Plate */}
        <mesh position={[0, 0.015, 0]} receiveShadow>
          <boxGeometry args={[15.2, 0.05, 5.18]} />
          <meshStandardMaterial color="#0b0e14" roughness={0.44} metalness={0.62} />
        </mesh>

        {/* CNC Chamfered Aluminum Top Frame Bezel (4 rails enclosing recessed key well) */}
        {/* Top Bezel */}
        <mesh position={[0, 0.14, -2.72]} castShadow receiveShadow>
          <boxGeometry args={[15.86, 0.34, 0.34]} />
          <meshStandardMaterial color="#232a38" roughness={0.25} metalness={0.72} />
        </mesh>
        {/* Bottom Front Wrist-Edge Bezel */}
        <mesh position={[0, 0.12, 2.72]} castShadow receiveShadow>
          <boxGeometry args={[15.86, 0.3, 0.34]} />
          <meshStandardMaterial color="#232a38" roughness={0.25} metalness={0.72} />
        </mesh>
        {/* Left Bezel */}
        <mesh position={[-7.76, 0.13, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.34, 0.32, 5.12]} />
          <meshStandardMaterial color="#232a38" roughness={0.25} metalness={0.72} />
        </mesh>
        {/* Right Bezel */}
        <mesh position={[7.76, 0.13, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.34, 0.32, 5.12]} />
          <meshStandardMaterial color="#232a38" roughness={0.25} metalness={0.72} />
        </mesh>

        {/* Subtle Machined Accent Light Bar on Top Right Bezel */}
        <mesh position={[6.55, 0.315, -2.72]}>
          <boxGeometry args={[1.4, 0.016, 0.06]} />
          <meshStandardMaterial
            color={accent.hex}
            emissive={accent.hex}
            emissiveIntensity={1.35}
            roughness={0.2}
          />
        </mesh>

        {/* 61 Sculpted Cherry-Profile Mechanical Keycaps */}
        <group position={[0, 0.03, 0]}>
          {KEYBOARD_LAYOUT.map((keyDef) => (
            <KeycapUnit
              key={keyDef.code}
              keyDef={keyDef}
              accentColorObj={accentColorObj}
              keyStatesRef={keyStatesRef}
              streakRef={smoothStreakRef}
              soundProfileRef={soundProfileRef}
              pressKey={pressKey}
              releaseKey={releaseKey}
            />
          ))}
        </group>
      </group>
    </group>
  )
}

export const Keyboard3DScene: React.FC<Keyboard3DSceneProps> = (props) => {
  return (
    <div className="fixed inset-0 z-0 select-none">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.12,
        }}
        camera={{ fov: 32, near: 0.5, far: 80, position: [0, 9.8, 14.4] }}
      >
        <KeyboardRig {...props} />
      </Canvas>
    </div>
  )
}
