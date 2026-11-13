import { ChineseProsePassage, CodeLanguage, CodeSnippet, PinyinEntry } from '../types/typing'

const COMMON_WORDS: string[] = [
  'the', 'be', 'of', 'and', 'a', 'to', 'in', 'he', 'have', 'it', 'that', 'for',
  'they', 'with', 'as', 'not', 'on', 'she', 'at', 'by', 'this', 'we', 'you',
  'do', 'but', 'from', 'or', 'which', 'one', 'would', 'all', 'will', 'there',
  'say', 'who', 'make', 'when', 'can', 'more', 'if', 'no', 'man', 'out',
  'other', 'so', 'what', 'time', 'up', 'go', 'about', 'than', 'into', 'could',
  'state', 'only', 'new', 'year', 'some', 'take', 'come', 'these', 'know',
  'see', 'use', 'get', 'like', 'then', 'first', 'any', 'work', 'now', 'may',
  'such', 'give', 'over', 'think', 'most', 'even', 'find', 'day', 'also',
  'after', 'way', 'many', 'must', 'look', 'before', 'great', 'back', 'through',
  'long', 'where', 'much', 'should', 'well', 'people', 'down', 'own', 'just',
  'because', 'good', 'each', 'those', 'feel', 'seem', 'how', 'high', 'too',
  'place', 'little', 'world', 'very', 'still', 'nation', 'hand', 'old', 'life',
  'tell', 'write', 'become', 'here', 'show', 'house', 'both', 'between', 'need',
  'mean', 'call', 'develop', 'under', 'last', 'right', 'move', 'thing', 'general',
  'school', 'never', 'same', 'another', 'begin', 'while', 'number', 'part',
  'turn', 'real', 'leave', 'might', 'want', 'point', 'form', 'off', 'child',
  'few', 'small', 'since', 'against', 'ask', 'late', 'home', 'interest', 'large',
  'person', 'end', 'open', 'public', 'follow', 'during', 'present', 'without',
  'again', 'hold', 'govern', 'around', 'possible', 'head', 'consider', 'word',
  'program', 'problem', 'however', 'lead', 'system', 'set', 'order', 'eye',
  'plan', 'run', 'keep', 'face', 'fact', 'group', 'play', 'stand', 'increase',
  'early', 'course', 'change', 'help', 'line', 'pulse', 'drift', 'frame',
  'craft', 'spark', 'focus', 'rhythm', 'motion', 'light', 'glass', 'metal',
  'spring', 'sound', 'key', 'switch', 'layer', 'depth', 'space', 'swift',
  'silent', 'shadow', 'clean', 'sharp', 'solid', 'fluid', 'clear', 'calm',
  'rapid', 'smooth', 'steady', 'bright', 'stream', 'vector', 'signal', 'orbit',
  'prism', 'carbon', 'slate', 'amber', 'quartz', 'vertex', 'shader', 'matrix',
  'kernel', 'buffer', 'render', 'canvas', 'engine', 'input', 'clock', 'cycle',
]

export function generateWordText(wordCount: number): string {
  const words: string[] = []
  let prev = ''
  for (let i = 0; i < wordCount; i++) {
    let pick = COMMON_WORDS[Math.floor(Math.random() * COMMON_WORDS.length)]
    if (pick === prev) {
      pick = COMMON_WORDS[(COMMON_WORDS.indexOf(pick) + 7) % COMMON_WORDS.length]
    }
    words.push(pick)
    prev = pick
  }
  return words.join(' ')
}

export const CODE_SNIPPETS: CodeSnippet[] = [
  {
    id: 'ts-spring',
    language: 'typescript',
    title: 'Damped Spring Solver',
    code: [
      'export function stepSpring(value: number, target: number, dt: number) {',
      '  const stiffness = 380;',
      '  const damping = 26;',
      '  const force = (target - value) * stiffness;',
      '  return value + (force - value * damping) * Math.min(dt, 0.032);',
      '}',
    ].join('\n'),
  },
  {
    id: 'ts-debounce',
    language: 'typescript',
    title: 'Typed Event Bus',
    code: [
      'type Listener<T> = (payload: T) => void;',
      '',
      'export function createBus<T>() {',
      '  const subs = new Set<Listener<T>>();',
      '  return {',
      '    emit: (data: T) => subs.forEach((fn) => fn(data)),',
      '    on: (fn: Listener<T>) => { subs.add(fn); return () => subs.delete(fn); },',
      '  };',
      '}',
    ].join('\n'),
  },
  {
    id: 'rs-ring',
    language: 'rust',
    title: 'Ring Buffer Push',
    code: [
      'pub struct Ring<T, const N: usize> {',
      '    buf: [Option<T>; N],',
      '    head: usize,',
      '}',
      '',
      'impl<T, const N: usize> Ring<T, N> {',
      '    pub fn push(&mut self, item: T) {',
      '        self.buf[self.head % N] = Some(item);',
      '        self.head = self.head.wrapping_add(1);',
      '    }',
      '}',
    ].join('\n'),
  },
  {
    id: 'py-wpm',
    language: 'python',
    title: 'Rolling WPM Window',
    code: [
      'def rolling_wpm(chars: int, elapsed: float) -> float:',
      '    if elapsed <= 0.25:',
      '        return 0.0',
      '    minutes = elapsed / 60.0',
      '    return round((chars / 5.0) / minutes, 1)',
    ].join('\n'),
  },
  {
    id: 'css-glass',
    language: 'css',
    title: 'Frosted Glass Surface',
    code: [
      '.glass-panel {',
      '  background: rgba(14, 18, 26, 0.72);',
      '  backdrop-filter: blur(20px) saturate(140%);',
      '  border: 1px solid rgba(255, 255, 255, 0.09);',
      '  box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.65);',
      '}',
    ].join('\n'),
  },
]

export const CODE_LANGUAGES: { id: CodeLanguage; label: string }[] = [
  { id: 'typescript', label: 'TS' },
  { id: 'rust', label: 'RS' },
  { id: 'python', label: 'PY' },
  { id: 'css', label: 'CSS' },
]

export function pickCodeSnippet(language?: CodeLanguage, excludeId?: string): CodeSnippet {
  const pool = language
    ? CODE_SNIPPETS.filter((s) => s.language === language)
    : CODE_SNIPPETS
  const filtered = pool.filter((s) => s.id !== excludeId)
  const candidates = filtered.length > 0 ? filtered : pool
  return candidates[Math.floor(Math.random() * candidates.length)]
}

const CHINESE_PHRASES: string[] = [
  '清风拂面', '机械键盘', '行云流水', '光影交错', '专注当下', '极简设计',
  '星河璀璨', '触感回弹', '指尖跃动', '静谧夜晚', '云淡风轻', '万物生长',
  '灵感迸发', '节奏明快', '清晨微光', '山川湖海', '琥珀流光', '霓虹掠影',
  '声声清脆', '水落石出', '心无旁骛', '春暖花开', '月色如水', '微风轻拂',
  '细雨绵绵', '星辰大海', '流年似水', '海阔天空', '明月清风', '风华正茂',
  '精益求精', '水到渠成', '独具匠心', '妙笔生花', '豁然开朗', '朝气蓬勃',
  '稳步前行', '优雅从容', '沉稳内敛', '瞬息万变', '灯火阑珊', '素履以往',
  '浮光掠影', '日新月异', '循序渐进', '得心应手', '温润如玉', '凌空飞跃',
]

export function generateChinesePhraseText(phraseCount = 12): string {
  const picked: string[] = []
  let prev = ''
  for (let i = 0; i < phraseCount; i++) {
    let phrase = CHINESE_PHRASES[Math.floor(Math.random() * CHINESE_PHRASES.length)]
    if (phrase === prev) {
      phrase = CHINESE_PHRASES[(CHINESE_PHRASES.indexOf(phrase) + 5) % CHINESE_PHRASES.length]
    }
    picked.push(phrase)
    prev = phrase
  }
  return picked.join('，') + '。'
}

export const CHINESE_PROSE_PASSAGES: ChineseProsePassage[] = [
  {
    id: 'prose-keyboard',
    title: '指尖韵律',
    text: '夜色沉静，桌面的微光映出磨砂金属的轮廓。每一次按下轴体，清脆的回弹与声浪随之共振，文字如同溪流般在屏幕上顺滑展开。',
  },
  {
    id: 'prose-spring',
    title: '春夜随笔',
    text: '微风穿过窗棂带来淡淡花香，远处的灯火在薄雾中渐渐柔和。此时此刻不必急躁，只需守住呼吸的节奏，一字一句写下心中的画面。',
  },
  {
    id: 'prose-craft',
    title: '造物之美',
    text: '真正优秀的设计往往藏在细节之中，克制的留白、恰到好处的阻尼与即时反馈，让人在专注创作时忘却工具本身的存在。',
  },
  {
    id: 'prose-mountains',
    title: '山海行旅',
    text: '清晨从山谷出发，云海在脚下缓缓翻涌。阳光穿透薄雾洒在林间石阶上，每一步都踏实而明亮，前路也随之开阔起来。',
  },
]

export function pickChineseProse(excludeId?: string): ChineseProsePassage {
  const filtered = CHINESE_PROSE_PASSAGES.filter((p) => p.id !== excludeId)
  const candidates = filtered.length > 0 ? filtered : CHINESE_PROSE_PASSAGES
  return candidates[Math.floor(Math.random() * candidates.length)]
}

const PINYIN_POOL: PinyinEntry[] = [
  { hanzi: '微风', pinyin: 'wei feng' },
  { hanzi: '极光', pinyin: 'ji guang' },
  { hanzi: '机械', pinyin: 'ji xie' },
  { hanzi: '键盘', pinyin: 'jian pan' },
  { hanzi: '清脆', pinyin: 'qing cui' },
  { hanzi: '回弹', pinyin: 'hui tan' },
  { hanzi: '星辰', pinyin: 'xing chen' },
  { hanzi: '专注', pinyin: 'zhuan zhu' },
  { hanzi: '光影', pinyin: 'guang ying' },
  { hanzi: '节奏', pinyin: 'jie zou' },
  { hanzi: '山川', pinyin: 'shan chuan' },
  { hanzi: '湖海', pinyin: 'hu hai' },
  { hanzi: '清晨', pinyin: 'qing chen' },
  { hanzi: '夜晚', pinyin: 'ye wan' },
  { hanzi: '灵感', pinyin: 'ling gan' },
  { hanzi: '琥珀', pinyin: 'hu po' },
  { hanzi: '流畅', pinyin: 'liu chang' },
  { hanzi: '安静', pinyin: 'an jing' },
  { hanzi: '创造', pinyin: 'chuang zao' },
  { hanzi: '从容', pinyin: 'cong rong' },
  { hanzi: '明月', pinyin: 'ming yue' },
  { hanzi: '春风', pinyin: 'chun feng' },
  { hanzi: '细雨', pinyin: 'xi yu' },
  { hanzi: '设计', pinyin: 'she ji' },
  { hanzi: '未来', pinyin: 'wei lai' },
  { hanzi: '瞬间', pinyin: 'shun jian' },
  { hanzi: '闪烁', pinyin: 'shan shuo' },
  { hanzi: '自由', pinyin: 'zi you' },
]

export function generatePinyinPrompt(wordCount = 14): {
  text: string
  /** Maps every character index in `text` to its corresponding Chinese word */
  hanziByIndex: Record<number, PinyinEntry>
} {
  const entries: PinyinEntry[] = []
  let prev = ''
  for (let i = 0; i < wordCount; i++) {
    let pick = PINYIN_POOL[Math.floor(Math.random() * PINYIN_POOL.length)]
    if (pick.pinyin === prev) {
      pick = PINYIN_POOL[(PINYIN_POOL.indexOf(pick) + 3) % PINYIN_POOL.length]
    }
    entries.push(pick)
    prev = pick.pinyin
  }

  const hanziByIndex: Record<number, PinyinEntry> = {}
  let text = ''
  entries.forEach((entry, idx) => {
    const start = text.length
    text += entry.pinyin
    const end = text.length
    for (let k = start; k < end; k++) {
      hanziByIndex[k] = entry
    }
    if (idx < entries.length - 1) {
      hanziByIndex[text.length] = entry
      text += ' '
    }
  })

  return { text, hanziByIndex }
}
