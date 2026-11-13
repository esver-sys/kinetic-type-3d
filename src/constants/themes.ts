import { AccentId, AccentTheme } from '../types/typing'

export const ACCENT_THEMES: Record<AccentId, AccentTheme> = {
  cyan: {
    id: 'cyan',
    label: 'Neon Cyan',
    hex: '#22d3ee',
    secondaryHex: '#0ea5e9',
    glowRgba: 'rgba(34, 211, 238, 0.36)',
    softBgRgba: 'rgba(34, 211, 238, 0.11)',
    borderRgba: 'rgba(34, 211, 238, 0.32)',
    textClass: 'text-cyan-300',
  },
  amber: {
    id: 'amber',
    label: 'Warm Amber',
    hex: '#f59e0b',
    secondaryHex: '#fb923c',
    glowRgba: 'rgba(245, 158, 11, 0.36)',
    softBgRgba: 'rgba(245, 158, 11, 0.11)',
    borderRgba: 'rgba(245, 158, 11, 0.32)',
    textClass: 'text-amber-300',
  },
  violet: {
    id: 'violet',
    label: 'Electric Violet',
    hex: '#a78bfa',
    secondaryHex: '#818cf8',
    glowRgba: 'rgba(167, 139, 250, 0.36)',
    softBgRgba: 'rgba(167, 139, 250, 0.11)',
    borderRgba: 'rgba(167, 139, 250, 0.32)',
    textClass: 'text-violet-300',
  },
  emerald: {
    id: 'emerald',
    label: 'Mint Emerald',
    hex: '#34d399',
    secondaryHex: '#10b981',
    glowRgba: 'rgba(52, 211, 153, 0.34)',
    softBgRgba: 'rgba(52, 211, 153, 0.11)',
    borderRgba: 'rgba(52, 211, 153, 0.32)',
    textClass: 'text-emerald-300',
  },
  coral: {
    id: 'coral',
    label: 'Crimson Coral',
    hex: '#fb7185',
    secondaryHex: '#f43f5e',
    glowRgba: 'rgba(251, 113, 133, 0.36)',
    softBgRgba: 'rgba(251, 113, 133, 0.11)',
    borderRgba: 'rgba(251, 113, 133, 0.32)',
    textClass: 'text-rose-300',
  },
}

export const ACCENT_LIST: AccentTheme[] = [
  ACCENT_THEMES.cyan,
  ACCENT_THEMES.amber,
  ACCENT_THEMES.violet,
  ACCENT_THEMES.emerald,
  ACCENT_THEMES.coral,
]
