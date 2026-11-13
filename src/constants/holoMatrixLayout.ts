export interface HoloKeySpec {
  code: string
  label: string
  subLabel?: string
  row: number
  /** Center X in 3D matrix coordinates */
  x: number
  /** Center Z in 3D matrix coordinates */
  z: number
  /** Wafer X width after clean gap */
  width: number
  /** Wafer Z depth after clean gap */
  depth: number
  isModifier?: boolean
}

const KEY_UNIT = 0.8
const KEY_GAP = 0.08
const ROW_UNITS = 15

interface RawKeyDef {
  code: string
  label: string
  subLabel?: string
  u: number
  isModifier?: boolean
}

const RAW_ROWS: RawKeyDef[][] = [
  [
    { code: 'Backquote', label: '`', subLabel: '~', u: 1 },
    { code: 'Digit1', label: '1', subLabel: '!', u: 1 },
    { code: 'Digit2', label: '2', subLabel: '@', u: 1 },
    { code: 'Digit3', label: '3', subLabel: '#', u: 1 },
    { code: 'Digit4', label: '4', subLabel: '$', u: 1 },
    { code: 'Digit5', label: '5', subLabel: '%', u: 1 },
    { code: 'Digit6', label: '6', subLabel: '^', u: 1 },
    { code: 'Digit7', label: '7', subLabel: '&', u: 1 },
    { code: 'Digit8', label: '8', subLabel: '*', u: 1 },
    { code: 'Digit9', label: '9', subLabel: '(', u: 1 },
    { code: 'Digit0', label: '0', subLabel: ')', u: 1 },
    { code: 'Minus', label: '-', subLabel: '_', u: 1 },
    { code: 'Equal', label: '=', subLabel: '+', u: 1 },
    { code: 'Backspace', label: 'DEL', u: 2, isModifier: true },
  ],
  [
    { code: 'Tab', label: 'TAB', u: 1.5, isModifier: true },
    { code: 'KeyQ', label: 'Q', u: 1 },
    { code: 'KeyW', label: 'W', u: 1 },
    { code: 'KeyE', label: 'E', u: 1 },
    { code: 'KeyR', label: 'R', u: 1 },
    { code: 'KeyT', label: 'T', u: 1 },
    { code: 'KeyY', label: 'Y', u: 1 },
    { code: 'KeyU', label: 'U', u: 1 },
    { code: 'KeyI', label: 'I', u: 1 },
    { code: 'KeyO', label: 'O', u: 1 },
    { code: 'KeyP', label: 'P', u: 1 },
    { code: 'BracketLeft', label: '[', subLabel: '{', u: 1 },
    { code: 'BracketRight', label: ']', subLabel: '}', u: 1 },
    { code: 'Backslash', label: '\\', subLabel: '|', u: 1.5 },
  ],
  [
    { code: 'CapsLock', label: 'CAPS', u: 1.75, isModifier: true },
    { code: 'KeyA', label: 'A', u: 1 },
    { code: 'KeyS', label: 'S', u: 1 },
    { code: 'KeyD', label: 'D', u: 1 },
    { code: 'KeyF', label: 'F', u: 1 },
    { code: 'KeyG', label: 'G', u: 1 },
    { code: 'KeyH', label: 'H', u: 1 },
    { code: 'KeyJ', label: 'J', u: 1 },
    { code: 'KeyK', label: 'K', u: 1 },
    { code: 'KeyL', label: 'L', u: 1 },
    { code: 'Semicolon', label: ';', subLabel: ':', u: 1 },
    { code: 'Quote', label: "'", subLabel: '"', u: 1 },
    { code: 'Enter', label: 'ENTER', u: 2.25, isModifier: true },
  ],
  [
    { code: 'ShiftLeft', label: 'SHIFT', u: 2.25, isModifier: true },
    { code: 'KeyZ', label: 'Z', u: 1 },
    { code: 'KeyX', label: 'X', u: 1 },
    { code: 'KeyC', label: 'C', u: 1 },
    { code: 'KeyV', label: 'V', u: 1 },
    { code: 'KeyB', label: 'B', u: 1 },
    { code: 'KeyN', label: 'N', u: 1 },
    { code: 'KeyM', label: 'M', u: 1 },
    { code: 'Comma', label: ',', subLabel: '<', u: 1 },
    { code: 'Period', label: '.', subLabel: '>', u: 1 },
    { code: 'Slash', label: '/', subLabel: '?', u: 1 },
    { code: 'ShiftRight', label: 'SHIFT', u: 2.75, isModifier: true },
  ],
  [
    { code: 'ControlLeft', label: 'CTRL', u: 1.25, isModifier: true },
    { code: 'MetaLeft', label: 'SYS', u: 1.25, isModifier: true },
    { code: 'AltLeft', label: 'ALT', u: 1.25, isModifier: true },
    { code: 'Space', label: 'SPACE // SYNC', u: 6.25 },
    { code: 'AltRight', label: 'ALT', u: 1.25, isModifier: true },
    { code: 'Fn', label: 'FN', u: 1.25, isModifier: true },
    { code: 'ContextMenu', label: 'OPT', u: 1.25, isModifier: true },
    { code: 'ControlRight', label: 'CTRL', u: 1.25, isModifier: true },
  ],
]

export const HOLO_MATRIX_WIDTH = ROW_UNITS * KEY_UNIT
export const HOLO_MATRIX_DEPTH = RAW_ROWS.length * KEY_UNIT

export const HOLO_MATRIX_KEYS: HoloKeySpec[] = (() => {
  const keys: HoloKeySpec[] = []
  RAW_ROWS.forEach((rowDefs, rowIndex) => {
    let cursorU = 0
    const z = (rowIndex - 2) * KEY_UNIT
    for (const def of rowDefs) {
      const centerU = cursorU + def.u * 0.5 - ROW_UNITS * 0.5
      keys.push({
        code: def.code,
        label: def.label,
        subLabel: def.subLabel,
        row: rowIndex,
        x: centerU * KEY_UNIT,
        z,
        width: def.u * KEY_UNIT - KEY_GAP,
        depth: KEY_UNIT - KEY_GAP,
        isModifier: def.isModifier,
      })
      cursorU += def.u
    }
  })
  return keys
})()

export const HOLO_KEY_BY_CODE: Record<string, HoloKeySpec> = Object.fromEntries(
  HOLO_MATRIX_KEYS.map((k) => [k.code, k]),
)

const UNSHIFTED_SYMBOL_MAP: Record<string, string> = {
  '`': 'Backquote',
  '-': 'Minus',
  '=': 'Equal',
  '[': 'BracketLeft',
  ']': 'BracketRight',
  '\\': 'Backslash',
  ';': 'Semicolon',
  "'": 'Quote',
  ',': 'Comma',
  '.': 'Period',
  '/': 'Slash',
}

const SHIFTED_SYMBOL_MAP: Record<string, string> = {
  '~': 'Backquote',
  '!': 'Digit1',
  '@': 'Digit2',
  '#': 'Digit3',
  $: 'Digit4',
  '%': 'Digit5',
  '^': 'Digit6',
  '&': 'Digit7',
  '*': 'Digit8',
  '(': 'Digit9',
  ')': 'Digit0',
  _: 'Minus',
  '+': 'Equal',
  '{': 'BracketLeft',
  '}': 'BracketRight',
  '|': 'Backslash',
  ':': 'Semicolon',
  '"': 'Quote',
  '<': 'Comma',
  '>': 'Period',
  '?': 'Slash',
}

/**
 * Resolves the upcoming expected prompt character into corresponding 3D wafer key codes
 * so the Holographic Input Matrix guides focus directly on what the user types next.
 */
export function getTargetKeyCodes(char: string | undefined): string[] {
  if (!char) return []
  if (char === ' ') return ['Space']
  if (char === '\n') return ['Enter']
  if (char >= 'a' && char <= 'z') return [`Key${char.toUpperCase()}`]
  if (char >= 'A' && char <= 'Z') return [`Key${char}`, 'ShiftLeft']
  if (char >= '0' && char <= '9') return [`Digit${char}`]
  if (UNSHIFTED_SYMBOL_MAP[char]) return [UNSHIFTED_SYMBOL_MAP[char]]
  if (SHIFTED_SYMBOL_MAP[char]) return [SHIFTED_SYMBOL_MAP[char], 'ShiftLeft']
  return []
}
