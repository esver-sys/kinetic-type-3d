export type UiLanguage = 'en' | 'zh'

export type PracticeMode = 'time' | 'words' | 'code' | 'chinese'

export type TimeOption = 15 | 30 | 60
export type WordsOption = 10 | 25 | 50
export type ChineseSubMode = 'phrases' | 'prose' | 'pinyin'

export type CodeLanguage = 'typescript' | 'rust' | 'python' | 'css'

export type SoundProfile = 'tactile-brown' | 'clicky-blue' | 'thocky-linear' | 'mute'

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

export interface KeyDefinition {
  /** Standard KeyboardEvent.code (e.g. 'KeyA', 'Space', 'ShiftLeft') */
  code: string
  /** Primary legend displayed on keycap */
  label: string
  /** Secondary shifted legend displayed above/beside primary legend */
  shiftLabel?: string
  /** Tiny front/corner sub-legend (e.g. 'ESC' on Backquote) */
  subLabel?: string
  /** Row index from top (0 = number row, 4 = bottom modifier row) */
  row: 0 | 1 | 2 | 3 | 4
  /** Width in standard 1u key units */
  width: number
  /** Visual classification for subtle two-tone PBT styling */
  category: 'alpha' | 'modifier' | 'accent'
  /** X center coordinate in key units (centered around 0) */
  x: number
  /** Z center coordinate in key units (centered around 0) */
  z: number
  /** Relative sound pitch/depth size factor */
  soundSize: 'standard' | 'medium' | 'space'
}

export interface KeyPhysicsState {
  pressed: boolean
  /** Timestamp (performance.now()) until which a fast tap keeps minimum visual travel impulse */
  pressPulseUntil: number
  /** Timestamp (performance.now()) of most recent press */
  lastPressedAt: number
  /** Timestamp (performance.now()) of most recent error flash on this key */
  errorFlashAt: number
  /** Current vertical depression offset in Three.js world units */
  currentY: number
  /** Vertical velocity for spring-damper integration */
  velocityY: number
  /** Current localized glow intensity [0..1+] */
  glowIntensity: number
  /** Current red error flash intensity [0..1] */
  errorIntensity: number
}

export interface CodeSnippet {
  id: string
  language: CodeLanguage
  title: string
  code: string
}
