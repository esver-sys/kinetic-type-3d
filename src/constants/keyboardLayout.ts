import { KeyDefinition } from '../types/typing'

interface RawKeySpec {
  code: string
  label: string
  shiftLabel?: string
  subLabel?: string
  width?: number
  category?: 'alpha' | 'modifier' | 'accent'
  soundSize?: 'standard' | 'medium' | 'space'
}

const ROWS: RawKeySpec[][] = [
  // Row 0 (Number Row) — sums to 15.0u
  [
    { code: 'Backquote', label: '`', shiftLabel: '~', subLabel: 'ESC', category: 'modifier' },
    { code: 'Digit1', label: '1', shiftLabel: '!' },
    { code: 'Digit2', label: '2', shiftLabel: '@' },
    { code: 'Digit3', label: '3', shiftLabel: '#' },
    { code: 'Digit4', label: '4', shiftLabel: '$' },
    { code: 'Digit5', label: '5', shiftLabel: '%' },
    { code: 'Digit6', label: '6', shiftLabel: '^' },
    { code: 'Digit7', label: '7', shiftLabel: '&' },
    { code: 'Digit8', label: '8', shiftLabel: '*' },
    { code: 'Digit9', label: '9', shiftLabel: '(' },
    { code: 'Digit0', label: '0', shiftLabel: ')' },
    { code: 'Minus', label: '-', shiftLabel: '_' },
    { code: 'Equal', label: '=', shiftLabel: '+' },
    { code: 'Backspace', label: 'BACK', width: 2, category: 'modifier', soundSize: 'medium' },
  ],
  // Row 1 (QWERTY) — sums to 15.0u
  [
    { code: 'Tab', label: 'TAB', width: 1.5, category: 'modifier', soundSize: 'medium' },
    { code: 'KeyQ', label: 'Q' },
    { code: 'KeyW', label: 'W' },
    { code: 'KeyE', label: 'E' },
    { code: 'KeyR', label: 'R' },
    { code: 'KeyT', label: 'T' },
    { code: 'KeyY', label: 'Y' },
    { code: 'KeyU', label: 'U' },
    { code: 'KeyI', label: 'I' },
    { code: 'KeyO', label: 'O' },
    { code: 'KeyP', label: 'P' },
    { code: 'BracketLeft', label: '[', shiftLabel: '{' },
    { code: 'BracketRight', label: ']', shiftLabel: '}' },
    { code: 'Backslash', label: '\\', shiftLabel: '|', width: 1.5, category: 'modifier', soundSize: 'medium' },
  ],
  // Row 2 (Home Row) — sums to 15.0u
  [
    { code: 'CapsLock', label: 'CAPS', width: 1.75, category: 'modifier', soundSize: 'medium' },
    { code: 'KeyA', label: 'A' },
    { code: 'KeyS', label: 'S' },
    { code: 'KeyD', label: 'D' },
    { code: 'KeyF', label: 'F', subLabel: '—' },
    { code: 'KeyG', label: 'G' },
    { code: 'KeyH', label: 'H' },
    { code: 'KeyJ', label: 'J', subLabel: '—' },
    { code: 'KeyK', label: 'K' },
    { code: 'KeyL', label: 'L' },
    { code: 'Semicolon', label: ';', shiftLabel: ':' },
    { code: 'Quote', label: "'", shiftLabel: '"' },
    { code: 'Enter', label: 'ENTER', width: 2.25, category: 'accent', soundSize: 'medium' },
  ],
  // Row 3 (Bottom Alpha Row) — sums to 15.0u
  [
    { code: 'ShiftLeft', label: 'SHIFT', width: 2.25, category: 'modifier', soundSize: 'medium' },
    { code: 'KeyZ', label: 'Z' },
    { code: 'KeyX', label: 'X' },
    { code: 'KeyC', label: 'C' },
    { code: 'KeyV', label: 'V' },
    { code: 'KeyB', label: 'B' },
    { code: 'KeyN', label: 'N' },
    { code: 'KeyM', label: 'M' },
    { code: 'Comma', label: ',', shiftLabel: '<' },
    { code: 'Period', label: '.', shiftLabel: '>' },
    { code: 'Slash', label: '/', shiftLabel: '?' },
    { code: 'ShiftRight', label: 'SHIFT', width: 2.75, category: 'modifier', soundSize: 'medium' },
  ],
  // Row 4 (Bottom Modifier Row) — sums to 15.0u
  [
    { code: 'ControlLeft', label: 'CTRL', width: 1.25, category: 'modifier', soundSize: 'medium' },
    { code: 'MetaLeft', label: 'CMD', width: 1.25, category: 'modifier', soundSize: 'medium' },
    { code: 'AltLeft', label: 'ALT', width: 1.25, category: 'modifier', soundSize: 'medium' },
    { code: 'Space', label: '', width: 6.25, category: 'alpha', soundSize: 'space' },
    { code: 'AltRight', label: 'ALT', width: 1.25, category: 'modifier', soundSize: 'medium' },
    { code: 'MetaRight', label: 'FN', width: 1.25, category: 'modifier', soundSize: 'medium' },
    { code: 'ContextMenu', label: 'OPT', width: 1.25, category: 'modifier', soundSize: 'medium' },
    { code: 'ControlRight', label: 'CTRL', width: 1.25, category: 'modifier', soundSize: 'medium' },
  ],
]

export const KEYBOARD_WIDTH_U = 15
export const KEYBOARD_ROWS_U = 5

export const KEYBOARD_LAYOUT: KeyDefinition[] = ROWS.flatMap((rowSpecs, rowIndex) => {
  let cursorX = -KEYBOARD_WIDTH_U / 2
  const z = rowIndex - (KEYBOARD_ROWS_U - 1) / 2

  return rowSpecs.map((spec) => {
    const width = spec.width ?? 1
    const centerX = cursorX + width / 2
    cursorX += width

    return {
      code: spec.code,
      label: spec.label,
      shiftLabel: spec.shiftLabel,
      subLabel: spec.subLabel,
      row: rowIndex as 0 | 1 | 2 | 3 | 4,
      width,
      category: spec.category ?? 'alpha',
      x: centerX,
      z,
      soundSize: spec.soundSize ?? 'standard',
    }
  })
})

export const KEY_BY_CODE: Record<string, KeyDefinition> = Object.fromEntries(
  KEYBOARD_LAYOUT.map((k) => [k.code, k]),
)

const CODE_ALIASES: Record<string, string> = {
  NumpadEnter: 'Enter',
  Escape: 'Backquote',
  Delete: 'Backspace',
  OSLeft: 'MetaLeft',
  OSRight: 'MetaRight',
  IntlBackslash: 'Backslash',
}

export function normalizeKeyCode(code: string): string {
  return CODE_ALIASES[code] ?? code
}
