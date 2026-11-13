import { useCallback, useRef } from 'react'
import { HOLO_KEY_BY_CODE } from '../constants/holoMatrixLayout'
import { ShockwavePulse, TelemetryPulseState } from '../types/typing'

function keyCodeToAzimuth(code: string): number {
  let h = 2166136261
  for (let i = 0; i < code.length; i++) {
    h ^= code.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const normalized = (h >>> 0) / 0xffffffff
  return normalized * Math.PI * 2
}

const POOL_SIZE = 16

function createShockwavePool(): ShockwavePulse[] {
  const pool: ShockwavePulse[] = []
  for (let i = 0; i < POOL_SIZE; i++) {
    pool.push({
      id: 0,
      at: -100000,
      angle: 0,
      originX: 0,
      originZ: 0,
      isError: false,
      strength: 1,
    })
  }
  return pool
}

export function useTelemetryPulse() {
  const telemetryRef = useRef<TelemetryPulseState>({
    lastPulseAt: -100000,
    lastPulseId: 0,
    lastAngle: 0,
    lastIsError: false,
    pulseStrength: 0,
    shockwaves: createShockwavePool(),
    keyStates: {},
    expectedCodes: [],
  })

  const writeIndexRef = useRef(0)

  const triggerPulse = useCallback((rawCode: string, isError = false, strength = 1.0) => {
    const state = telemetryRef.current
    const now = performance.now()
    const keySpec = HOLO_KEY_BY_CODE[rawCode]
    const originX = keySpec?.x ?? 0
    const originZ = keySpec?.z ?? 0
    const angle = keySpec ? Math.atan2(originZ, originX) : keyCodeToAzimuth(rawCode)
    const nextId = state.lastPulseId + 1

    state.lastPulseId = nextId
    state.lastPulseAt = now
    state.lastAngle = angle
    state.lastIsError = isError
    state.pulseStrength = strength

    if (keySpec) {
      const existing = state.keyStates[rawCode]
      if (existing) {
        if (isError) existing.errorAt = now
      } else {
        state.keyStates[rawCode] = {
          down: false,
          pressedAt: now,
          releasedAt: now,
          errorAt: isError ? now : -100000,
        }
      }
    }

    const slot = state.shockwaves[writeIndexRef.current]
    slot.id = nextId
    slot.at = now
    slot.angle = angle
    slot.originX = originX
    slot.originZ = originZ
    slot.isError = isError
    slot.strength = strength

    writeIndexRef.current = (writeIndexRef.current + 1) % POOL_SIZE
  }, [])

  const setKeyDown = useCallback((rawCode: string, isDown: boolean) => {
    const state = telemetryRef.current
    const now = performance.now()
    let entry = state.keyStates[rawCode]
    if (!entry) {
      entry = {
        down: isDown,
        pressedAt: isDown ? now : -100000,
        releasedAt: isDown ? -100000 : now,
        errorAt: -100000,
      }
      state.keyStates[rawCode] = entry
      return
    }
    if (isDown) {
      entry.down = true
      entry.pressedAt = now
    } else if (entry.down) {
      entry.down = false
      entry.releasedAt = now
    }
  }, [])

  const releaseAllKeys = useCallback(() => {
    const state = telemetryRef.current
    const now = performance.now()
    for (const key in state.keyStates) {
      if (state.keyStates[key].down) {
        state.keyStates[key].down = false
        state.keyStates[key].releasedAt = now
      }
    }
  }, [])

  const setExpectedCodes = useCallback((codes: string[]) => {
    telemetryRef.current.expectedCodes = codes
  }, [])

  return {
    telemetryRef,
    triggerPulse,
    setKeyDown,
    releaseAllKeys,
    setExpectedCodes,
  }
}
