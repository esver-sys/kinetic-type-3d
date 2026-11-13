import { AccentId, ChineseSubMode, PracticeMode, SoundProfile, UiLanguage } from '../types/typing'

export interface UiStrings {
  modes: Record<PracticeMode, string>
  chineseSubModes: Record<ChineseSubMode, string>
  sounds: Record<SoundProfile, string>
  accents: Record<AccentId, string>
  hud: {
    wpm: string
    cpm: string
    acc: string
    combo: string
  }
  prompt: {
    startTyping: string
    imeHint: string
    pinyinTarget: string
    liveTelemetry: string
    pressEnterRestart: string
    quickRestart: string
    restartTooltip: string
    nextSnippet: string
  }
  summary: {
    sessionComplete: string
    netWpm: string
    netCpm: string
    raw: string
    accuracy: string
    consistency: string
    peak: string
    ok: string
    err: string
    velocityCurve: string
    keystrokes: string
    runAgain: string
    pressEnterNow: string
    quickRestart: string
  }
}

export const UI_STRINGS: Record<UiLanguage, UiStrings> = {
  en: {
    modes: {
      time: 'Time',
      words: 'Words',
      code: 'Code',
      chinese: '中文',
    },
    chineseSubModes: {
      phrases: 'Phrases',
      prose: 'Prose',
      pinyin: 'Pinyin',
    },
    sounds: {
      'tactile-brown': 'Brown',
      'clicky-blue': 'Blue',
      'thocky-linear': 'Linear',
      mute: 'Mute',
    },
    accents: {
      cyan: 'Neon Cyan',
      amber: 'Warm Amber',
      violet: 'Electric Violet',
      emerald: 'Mint Emerald',
      coral: 'Crimson Coral',
    },
    hud: {
      wpm: 'WPM',
      cpm: 'CPM',
      acc: 'ACC',
      combo: 'COMBO',
    },
    prompt: {
      startTyping: 'Start typing anywhere to begin',
      imeHint: 'Use Chinese IME to type characters directly',
      pinyinTarget: 'Word',
      liveTelemetry: 'Live telemetry',
      pressEnterRestart: 'Press Enter now to restart',
      quickRestart: 'quick restart',
      restartTooltip: 'Restart (Tab + Enter)',
      nextSnippet: 'Next snippet',
    },
    summary: {
      sessionComplete: 'Session Complete',
      netWpm: 'Net WPM',
      netCpm: 'Net CPM',
      raw: 'raw',
      accuracy: 'Accuracy',
      consistency: 'Consistency',
      peak: 'peak',
      ok: 'ok',
      err: 'err',
      velocityCurve: 'Velocity Curve',
      keystrokes: 'keystrokes',
      runAgain: 'Run Again',
      pressEnterNow: 'press Enter now',
      quickRestart: 'quick restart',
    },
  },
  zh: {
    modes: {
      time: '计时',
      words: '词数',
      code: '代码',
      chinese: '中文',
    },
    chineseSubModes: {
      phrases: '词组',
      prose: '诗文',
      pinyin: '拼音',
    },
    sounds: {
      'tactile-brown': '茶轴',
      'clicky-blue': '青轴',
      'thocky-linear': '线性',
      mute: '静音',
    },
    accents: {
      cyan: '霓虹青',
      amber: '暖珀金',
      violet: '电光紫',
      emerald: '薄荷绿',
      coral: '绯红珊瑚',
    },
    hud: {
      wpm: 'WPM',
      cpm: '字/分',
      acc: '准确率',
      combo: '连击',
    },
    prompt: {
      startTyping: '直接敲击键盘即可开始',
      imeHint: '请切换中文输入法，直接输入屏幕汉字',
      pinyinTarget: '当前词义',
      liveTelemetry: '实时遥测中',
      pressEnterRestart: '按 Enter 立即重新开始',
      quickRestart: '快速重开',
      restartTooltip: '重新开始 (Tab + Enter)',
      nextSnippet: '换一段内容',
    },
    summary: {
      sessionComplete: '练习完成',
      netWpm: '净速度 WPM',
      netCpm: '净速度 字/分',
      raw: '原始',
      accuracy: '准确率',
      consistency: '稳定度',
      peak: '最高连击',
      ok: '正确',
      err: '错误',
      velocityCurve: '速度曲线',
      keystrokes: '次击键',
      runAgain: '再来一次',
      pressEnterNow: '立即按 Enter 重开',
      quickRestart: '快速重开',
    },
  },
}
