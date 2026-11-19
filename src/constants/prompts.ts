import {
  ChineseProsePassage,
  CodeLanguage,
  CodeSnippet,
  EnglishPassage,
  PinyinEntry,
} from '../types/typing'

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

export const ENGLISH_PASSAGES: EnglishPassage[] = [
  {
    id: 'en-flow',
    title: 'The Rhythm of Flow',
    text: 'True typing speed does not begin with rushing each single letter. When your shoulders relax and your eyes stay a few characters ahead of your fingers, movement turns effortless, almost like playing scales on glass in a quiet room.',
  },
  {
    id: 'en-orbital',
    title: 'Orbital Nightfall',
    text: 'Above the thin blue curve of Earth, station lights dim into deep indigo. Telemetry screens trace silent orbits across the horizon while soft synthesized chords drift through the observation deck, marking another calm watch among the stars.',
  },
  {
    id: 'en-craft',
    title: 'Invisible Craft',
    text: 'Great interfaces rarely ask for attention. Clear contrast, honest spacing, and immediate tactile response let thoughts move straight from mind to screen without friction, turning simple repetition into quiet satisfaction.',
  },
  {
    id: 'en-morning',
    title: 'First Light in the Valley',
    text: 'Before the city wakes, cool mist settles along the riverbend and turns every pine ridge pale silver. A single cup of warm tea steams beside the window while morning birds trace wide circles across an open sky.',
  },
  {
    id: 'en-precision',
    title: 'Precision Over Haste',
    text: 'Accuracy builds lasting speed far faster than brute force ever can. Slow down just enough to feel every syllable settle cleanly into place; once muscle memory learns a phrase cleanly, rhythm follows on its own.',
  },
  {
    id: 'en-voyager',
    title: 'Message Beyond Neptune',
    text: 'Far past the outer frost line, a small metal probe coasts through near total silence. Every faint radio pulse it returns has traveled billions of kilometers through cold darkness, carrying fragile measurements of the border between suns.',
  },
  {
    id: 'en-rain',
    title: 'Afternoon Rain on Slate',
    text: 'Sudden summer rain drums lightly on the dark courtyard roof, washing dust off warm leaves. Inside the study, lamps glow softly against dusk while thoughts line up one sentence at a time without hurry.',
  },
  {
    id: 'en-music',
    title: 'Harmonies in Code',
    text: 'Behind every musical chord lies simple mathematics: ratios of frequencies resonating together in air. When oscillators lock into clean intervals and fade through warm filters, pure numbers begin to sound surprisingly human.',
  },
  {
    id: 'en-thoreau-walden',
    title: 'Thoreau · Walden',
    text: 'I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach, and not, when I came to die, discover that I had not lived.',
  },
  {
    id: 'en-aurelius-mind',
    title: 'Marcus Aurelius · Meditations',
    text: 'You have power over your mind, not outside events. Realize this, and you will find strength. Very little is needed to make a happy life; it is all within yourself, in your way of thinking.',
  },
  {
    id: 'en-emerson-self',
    title: 'Emerson · Self-Reliance',
    text: 'To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment. Nothing can bring you peace but yourself. Trust thyself: every heart vibrates to that iron string.',
  },
  {
    id: 'en-fitzgerald-gatsby',
    title: 'Fitzgerald · The Great Gatsby',
    text: 'In my younger and more vulnerable years my father gave me some advice that I have been turning over in my mind ever since. Whenever you feel like criticizing anyone, just remember that all the people in this world have not had the advantages that you have had.',
  },
]

export function pickEnglishPassage(excludeId?: string): EnglishPassage {
  const filtered = ENGLISH_PASSAGES.filter((p) => p.id !== excludeId)
  const candidates = filtered.length > 0 ? filtered : ENGLISH_PASSAGES
  return candidates[Math.floor(Math.random() * candidates.length)]
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
  '清风拂面', '全息矩阵', '行云流水', '光影交错', '专注当下', '极简设计',
  '星河璀璨', '晶莹折射', '指尖跃动', '静谧夜晚', '云淡风轻', '万物生长',
  '灵感迸发', '节奏明快', '清晨微光', '山川湖海', '琥珀流光', '霓虹掠影',
  '声声清越', '水落石出', '心无旁骛', '春暖花开', '月色如水', '微风轻拂',
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
    id: 'prose-matrix',
    title: '星夜韵律',
    text: '夜色沉静下来，屏幕前幽蓝的微光映出悬浮晶格的轮廓。随着指尖轻快地起落，柔润的和弦与细碎的星光波纹同步漫开，文字仿佛顺着呼吸在夜晚自由生长。',
  },
  {
    id: 'prose-spring',
    title: '春夜随笔',
    text: '微风穿过窗棂带来淡淡花香，远处的灯火在薄雾中渐渐柔和。此时此刻不必急躁，只需守住呼吸与心跳的节拍，一字一句把心中浮现的风景认真写下来。',
  },
  {
    id: 'prose-craft',
    title: '造物之美',
    text: '真正舒适的体验往往藏在细微之处。克制的留白、清晰的对比度以及毫无迟滞的即时反馈，能让人在专注思考与书写的过程中，忘记界面本身的存在。',
  },
  {
    id: 'prose-mountains',
    title: '山海行旅',
    text: '清晨沿着山谷步道缓慢上行，乳白色的云海在脚下悄然翻涌。朝阳穿透树梢洒在沾露的石阶上，微凉的山风迎面吹过，眼前的天际线也跟着开阔明亮起来。',
  },
  {
    id: 'prose-orbit',
    title: '轨道观星',
    text: '在近地轨道的观测舱望向下方，蓝色大气层边缘闪烁着微弱的晨昏线。无线电信号跨越万米寂静传来，将远方的问候化作几行温柔的数据脉冲。',
  },
  {
    id: 'prose-rain',
    title: '夏午听雨',
    text: '午后突如其来的阵雨敲打着檐下青石，把空气里积攒的燥热一点点洗净。窗内暖灯静静亮起，热茶腾起轻烟，正好趁这片刻安宁练上一小段文字。',
  },
  {
    id: 'prose-focus',
    title: '心流时刻',
    text: '打字快而不乱的关键并不在于用力抢拍，而在于提前看清下一个词组。当手腕放轻、目光平稳前移时，准确率与流畅度往往会比刻意求快更早来到。',
  },
  {
    id: 'prose-lanterns',
    title: '古城夜色',
    text: '暮色四合以后，河岸两旁的灯笼陆续点亮，倒映在平静的水面上微微摇晃。小船划开细碎的金光缓缓远去，只留下桨声与夜风停在古桥石栏旁。',
  },
]

export function pickChineseProse(excludeId?: string): ChineseProsePassage {
  const filtered = CHINESE_PROSE_PASSAGES.filter((p) => p.id !== excludeId)
  const candidates = filtered.length > 0 ? filtered : CHINESE_PROSE_PASSAGES
  return candidates[Math.floor(Math.random() * candidates.length)]
}

export const CHINESE_POETRY_PASSAGES: ChineseProsePassage[] = [
  {
    id: 'poem-shuidiao',
    title: '苏轼 · 水调歌头',
    text: '明月几时有？把酒问青天。不知天上宫阙，今夕是何年。我欲乘风归去，又恐琼楼玉宇，高处不胜寒。起舞弄清影，何似在人间。转朱阁，低绮户，照无眠。不应有恨，何事长向别时圆？人有悲欢离合，月有阴晴圆缺，此事古难全。但愿人长久，千里共婵娟。',
  },
  {
    id: 'poem-shanju',
    title: '王维 · 山居秋暝',
    text: '空山新雨后，天气晚来秋。明月松间照，清泉石上流。竹喧归浣女，莲动下渔舟。随意春芳歇，王孙自可留。',
  },
  {
    id: 'poem-denggao',
    title: '杜甫 · 登高',
    text: '风急天高猿啸哀，渚清沙白鸟飞回。无边落木萧萧下，不尽长江滚滚来。万里悲秋常作客，百年多病独登台。艰难苦恨繁霜鬓，潦倒新停浊酒杯。',
  },
  {
    id: 'poem-qiantanghu',
    title: '白居易 · 钱塘湖春行',
    text: '孤山寺北贾亭西，水面初平云脚低。几处早莺争暖树，谁家新燕啄春泥。乱花渐欲迷人眼，浅草才能没马蹄。最爱湖东行不足，绿杨阴里白沙堤。',
  },
  {
    id: 'poem-chunjiang',
    title: '张若虚 · 春江花月夜',
    text: '春江潮水连海平，海上明月共潮生。滟滟随波千万里，何处春江无月明！江流宛转绕芳甸，月照花林皆似霰。空里流霜不觉飞，汀上白沙看不见。',
  },
  {
    id: 'poem-qingyuan',
    title: '辛弃疾 · 青玉案',
    text: '东风夜放花千树。更吹落、星如雨。宝马雕车香满路。凤箫声动，玉壶光转，一夜鱼龙舞。蛾儿雪柳黄金缕。笑语盈盈暗香去。众里寻他千百度。蓦然回首，那人却在，灯火阑珊处。',
  },
  {
    id: 'poem-shengshengman',
    title: '李清照 · 声声慢',
    text: '寻寻觅觅，冷冷清清，凄凄惨惨戚戚。乍暖还寒时候，最难将息。三杯两盏淡酒，怎敌他、晚来风急！雁过也，正伤心，却是旧时相识。满地黄花堆积，憔悴损，如今有谁堪摘？',
  },
  {
    id: 'poem-qiangjinjiu',
    title: '李白 · 将进酒',
    text: '君不见黄河之水天上来，奔流到海不复回。君不见高堂明镜悲白发，朝如青丝暮成雪。人生得意须尽欢，莫使金樽空对月。天生我材必有用，千金散尽还复来。',
  },
]

export function pickChinesePoetry(excludeId?: string): ChineseProsePassage {
  const filtered = CHINESE_POETRY_PASSAGES.filter((p) => p.id !== excludeId)
  const candidates = filtered.length > 0 ? filtered : CHINESE_POETRY_PASSAGES
  return candidates[Math.floor(Math.random() * candidates.length)]
}

export const CHINESE_CLASSICS_PASSAGES: ChineseProsePassage[] = [
  {
    id: 'classic-yueyanglou',
    title: '范仲淹 · 岳阳楼记',
    text: '至若春和景明，波澜不惊，上下天光，一碧万顷；沙鸥翔集，锦鳞游泳，岸芷汀兰，郁郁青青。而或长烟一空，皓月千里，浮光跃金，静影沉璧，渔歌互答，此乐何极！',
  },
  {
    id: 'classic-chibi',
    title: '苏轼 · 赤壁赋',
    text: '清风徐来，水波不兴。举酒属客，诵明月之诗，歌窈窕之章。少焉，月出于东山之上，徘徊于斗牛之间。白露横江，水光接天。纵一苇之所如，凌万顷之茫然。',
  },
  {
    id: 'classic-zuiweng',
    title: '欧阳修 · 醉翁亭记',
    text: '若夫日出而林霏开，云归而岩穴暝，晦明变化者，山间之朝暮也。野芳发而幽香，佳木秀而繁阴，风霜高洁，水落而石出者，山间之四时也。朝而往，暮而归，四时之景不同，而乐亦无穷也。',
  },
  {
    id: 'classic-tengwang',
    title: '王勃 · 滕王阁序',
    text: '时维九月，序属三秋。潦水尽而寒潭清，烟光凝而暮山紫。俨骖騑于上路，访风景于崇阿；临帝子之长洲，得天人之旧馆。层峦耸翠，上出重霄；飞阁流丹，下临无地。落霞与孤鹜齐飞，秋水共长天一色。',
  },
  {
    id: 'classic-loushiming',
    title: '刘禹锡 · 陋室铭',
    text: '山不在高，有仙则名。水不在深，有龙则灵。斯是陋室，惟吾德馨。苔痕上阶绿，草色入帘青。谈笑有鸿儒，往来无白丁。可以调素琴，阅金经。无丝竹之乱耳，无案牍之劳形。南阳诸葛庐，西蜀子云亭。孔子云：何陋之有？',
  },
  {
    id: 'classic-ailianshuo',
    title: '周敦颐 · 爱莲说',
    text: '水陆草木之花，可爱者甚蕃。晋陶渊明独爱菊。自李唐来，世人甚爱牡丹。予独爱莲之出淤泥而不染，濯清涟而不妖，中通外直，不蔓不枝，香远益清，亭亭净植，可远观而不可亵玩焉。',
  },
  {
    id: 'classic-taohuayuan',
    title: '陶渊明 · 桃花源记',
    text: '晋太元中，武陵人捕鱼为业。缘溪行，忘路之远近。忽逢桃花林，夹岸数百步，中无杂树，芳草鲜美，落英缤纷。渔人甚异之，复前行，欲穷其林。林尽水源，便得一山，山有小口，仿佛若有光。',
  },
  {
    id: 'classic-congcong',
    title: '朱自清 · 匆匆',
    text: '燕子去了，有再来的时候；杨柳枯了，有再青的时候；桃花谢了，有再开的时候。但是，聪明的，你告诉我，我们的日子为什么一去不复返呢？是有人偷了他们吧：那是谁？又藏在何处呢？',
  },
]

export function pickChineseClassic(excludeId?: string): ChineseProsePassage {
  const filtered = CHINESE_CLASSICS_PASSAGES.filter((p) => p.id !== excludeId)
  const candidates = filtered.length > 0 ? filtered : CHINESE_CLASSICS_PASSAGES
  return candidates[Math.floor(Math.random() * candidates.length)]
}

const PINYIN_POOL: PinyinEntry[] = [
  { hanzi: '微风', pinyin: 'wei feng' },
  { hanzi: '极光', pinyin: 'ji guang' },
  { hanzi: '全息', pinyin: 'quan xi' },
  { hanzi: '矩阵', pinyin: 'ju zhen' },
  { hanzi: '清澈', pinyin: 'qing che' },
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
