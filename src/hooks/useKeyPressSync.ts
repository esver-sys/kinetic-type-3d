import { useCallback, useRef } from 'react'
import { KEY_BY_CODE, KEYBOARD_LAYOUT, normalizeKeyCode } from '../constants/keyboardLayout'
import { KeyPhysicsState } from '../types/typing'

export interface ActiveKeySpotlight {
  x: number
  z: number
  at: number
  isError: boolean
}

function createInitialKeyMap(): Record<string, KeyPhysicsState> {
  const map: Record<string, KeyPhysicsState> = {}
  for (const key of KEYBOARD_LAYOUT) {
    map[key.code] = {
      pressed: false,
      pressPulseUntil: 0,
      lastPressedAt: 0,
      errorFlashAt: 0,
      currentY: 0,
      velocityY: 0,
      glowIntensity: 0,
      errorIntensity: 0,
    }
  }
  return map
}

export function useKeyPressSync() {
  const keyStatesRef = useRef<Record<string, KeyPhysicsState>>(createInitialKeyMap())
  const spotlightRef = useRef<ActiveKeySpotlight>({
    x: 0,
    z: 0,
    at: -10000,
    isError: false,
  })

  const pressKey = useCallback((rawCode: string, isError = false) => {
    const code = normalizeKeyCode(rawCode)
    const state = keyStatesRef.current[code]
    const def = KEY_BY_CODE[code]
    const now = performance.now()

    if (state) {
      state.pressed = true
      state.pressPulseUntil = now + 80
      state.lastPressedAt = now
      if (isError) {
        state.errorFlashAt = now
      }
    }

    if (def) {
      spotlightRef.current.x = def.x
      spotlightRef.current.z = def.z
      spotlightRef.current.at = now
      spotlightRef.current.isError = isError
    }
  }, [])

  const releaseKey = useCallback((rawCode: string) => {
    const code = normalizeKeyCode(rawCode)
    const state = keyStatesRef.current[code]
    if (state) {
      state.pressed = false
    }
  }, [])

  const releaseAll = useCallback(() => {
    const all = keyStatesRef.current
    for (const code of Object.keys(all)) {
      all[code].pressed = false
    }
  }, [])

  return {
    keyStatesRef,
    spotlightRef,
    pressKey,
    releaseKey,
    releaseAll,
  }
}
