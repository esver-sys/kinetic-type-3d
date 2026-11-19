export type UiLanguage = 'en' | 'zh'

export type PracticeMode = 'passage' | 'time' | 'words' | 'code' | 'chinese'

export type TimeOption = 15 | 30 | 60
export type WordsOption = 10 | 25 | 50
export type PassageSubMode = 'prose' | 'poetry' | 'classics' | 'en' | 'custom'
export type ChineseSubMode = 'phrases' | 'prose' | 'pinyin'

export type CodeLanguage = 'typescript' | 'rust' | 'python' | 'css'

export type MusicTrackId =
  | 'stellar-drift'
  | 'orbital-nocturne'
  | 'quantum-pulse'
  | 'nebula-elegy'

export type SynthStemId = 'drums' | 'bass' | 'pad' | 'lead'

export type StemEnableMap = Record<SynthStemId, boolean>

export type AccentId = 'cyan' | 'amber' | 'violet' | 'emerald' | 'coral'

export interface AccentTheme {
  id: AccentId
  label: string
  hex: string
  secondaryHex: string
  glowRgba: string
  softBgRgba: string
  borderRgba: string
  textClass: string
}

export type CharStatus = 'pending' | 'correct' | 'incorrect'

export interface PromptChar {
  char: string
  status: CharStatus
  /** Monotonically bumped on each error at this index so CSS shake animation reliably retriggers */
  errorPulse: number
  /** True when auto-filled (e.g. structural leading indentation after pressing Enter in Code mode) */
  autoFilled?: boolean
}

export interface WpmSample {
  second: number
  wpm: number
  rawWpm: number
}

export interface TestSummary {
  wpm: number
  rawWpm: number
  speedUnit: 'WPM' | 'CPM'
  accuracy: number
  consistency: number
  maxCombo: number
  correctChars: number
  incorrectChars: number
  totalKeystrokes: number
  elapsedSeconds: number
  modeLabel: string
  samples: WpmSample[]
}

export interface PinyinEntry {
  hanzi: string
  pinyin: string
}

export interface ChineseProsePassage {
  id: string
  title: string
  text: string
}

export interface EnglishPassage {
  id: string
  title: string
  text: string
}

export interface ShockwavePulse {
  /** Monotonically incrementing pulse id */
  id: number
  /** Timestamp (performance.now()) when triggered */
  at: number
  /** Polar azimuth [0..2PI] derived from pressed key code */
  angle: number
  /** Origin X coordinate on the 3D holographic matrix */
  originX: number
  /** Origin Z coordinate on the 3D holographic matrix */
  originZ: number
  /** True when triggered by typing error */
  isError: boolean
  /** Intensity scalar (1.0 normal, >1 for Enter/Space/high-combo) */
  strength: number
}

export interface KeyPressState {
  down: boolean
  pressedAt: number
  releasedAt: number
  errorAt: number
}

export interface TelemetryPulseState {
  lastPulseAt: number
  lastPulseId: number
  lastAngle: number
  lastIsError: boolean
  pulseStrength: number
  shockwaves: ShockwavePulse[]
  keyStates: Record<string, KeyPressState>
  expectedCodes: string[]
}

export interface CodeSnippet {
  id: string
  language: CodeLanguage
  title: string
  code: string
}
