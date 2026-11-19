import {
  AccentId,
  ChineseSubMode,
  MusicTrackId,
  PassageSubMode,
  PracticeMode,
  SynthStemId,
  UiLanguage,
} from '../types/typing'

export interface UiStrings {
  brand: {
    subtitle: string
  }
  modes: Record<PracticeMode, string>
  passageSubModes: Record<PassageSubMode, string>
  chineseSubModes: Record<ChineseSubMode, string>
  tracks: Record<MusicTrackId, { short: string; full: string }>
  stems: Record<SynthStemId, string>
  audio: {
    play: string
    pause: string
    launchPrompt: string
    chimesOn: string
    chimesOff: string
    mute: string
    unmute: string
    volume: string
    stemsTooltip: string
    barLabel: string
  }
  accents: Record<AccentId, string>
  hud: {
    wpm: string
    cpm: string
    acc: string
    combo: string
  }
  prompt: {
    startTyping: string
    startWithAudio: string
    imeHint: string
    pinyinTarget: string
    liveTelemetry: string
    pressEnterRestart: string
    quickRestart: string
    restartTooltip: string
    nextSnippet: string
    nextPassage: string
    customBtnTooltip: string
  }
  customModal: {
    title: string
    subtitle: string
    placeholder: string
    detectedZh: string
    detectedEn: string
    charsUnit: string
    fillSampleEn: string
    fillSampleZh: string
    cancel: string
    apply: string
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
    brand: {
      subtitle: 'HOLO // TYPE',
    },
    modes: {
      passage: 'Prose',
      time: 'Time',
      words: 'Words',
      code: 'Code',
      chinese: '中文',
    },
    passageSubModes: {
      prose: 'Prose',
      poetry: 'Poetry',
      classics: 'Classics',
      en: 'EN',
      custom: 'Custom',
    },
    chineseSubModes: {
      prose: 'Prose',
      phrases: 'Phrases',
      pinyin: 'Pinyin',
    },
    tracks: {
      'stellar-drift': { short: 'Stellar', full: 'Starlight Horizon · 104 BPM' },
      'orbital-nocturne': { short: 'Nocturne', full: 'Orbital Nocturne · 84 BPM' },
      'quantum-pulse': { short: 'Quantum', full: 'Quantum Drive · 116 BPM' },
      'nebula-elegy': { short: 'Nebula', full: 'Nebula Elegy · 92 BPM' },
    },
    stems: {
      drums: 'Drums',
      bass: 'Bass',
      pad: 'Pads',
      lead: 'Lead',
    },
    audio: {
      play: 'Play ambient synth',
      pause: 'Pause ambient synth',
      launchPrompt: 'Synth',
      chimesOn: 'Holo key chimes ON',
      chimesOff: 'Holo key chimes OFF',
      mute: 'Mute audio',
      unmute: 'Unmute audio',
      volume: 'Volume',
      stemsTooltip: 'Stems',
      barLabel: 'BAR',
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
      startWithAudio: 'Type anywhere to begin · ambient synth auto-syncs',
      imeHint: 'Use Chinese IME to type characters directly',
      pinyinTarget: 'Word',
      liveTelemetry: 'Holo matrix sync active',
      pressEnterRestart: 'Press Enter now to restart',
      quickRestart: 'quick restart',
      restartTooltip: 'Restart (Tab + Enter)',
      nextSnippet: 'Next snippet',
      nextPassage: 'Next passage',
      customBtnTooltip: 'Paste custom passage text',
    },
    customModal: {
      title: 'Custom Plain Text',
      subtitle: 'Paste any English or Chinese article, notes, or lyrics to practice immediately.',
      placeholder: 'Paste or type your practice text here...',
      detectedZh: 'Detected Chinese · IME + CPM',
      detectedEn: 'Detected English · Direct WPM',
      charsUnit: 'chars',
      fillSampleEn: 'Sample EN',
      fillSampleZh: 'Sample 中文',
      cancel: 'Cancel',
      apply: 'Start Practice',
    },
    summary: {
      sessionComplete: 'Telemetry Complete',
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
    brand: {
      subtitle: 'HOLO // TYPE',
    },
    modes: {
      passage: '明文',
      time: '计时',
      words: '词数',
      code: '代码',
      chinese: '中文',
    },
    passageSubModes: {
      prose: '散文',
      poetry: '古诗',
      classics: '名篇',
      en: '英文',
      custom: '自定义',
    },
    chineseSubModes: {
      prose: '短文',
      phrases: '词组',
      pinyin: '拼音',
    },
    tracks: {
      'stellar-drift': { short: '星际漫游', full: '星际漫游 · 104 BPM' },
      'orbital-nocturne': { short: '轨道夜曲', full: '轨道夜曲 · 84 BPM' },
      'quantum-pulse': { short: '量子脉冲', full: '量子脉冲 · 116 BPM' },
      'nebula-elegy': { short: '星云诗篇', full: '星云诗篇 · 92 BPM' },
    },
    stems: {
      drums: '鼓组',
      bass: '低音',
      pad: '和弦',
      lead: '旋律',
    },
    audio: {
      play: '播放代码合成伴奏',
      pause: '暂停伴奏',
      launchPrompt: '伴奏',
      chimesOn: '全息和弦键音：开',
      chimesOff: '全息和弦键音：关',
      mute: '静音',
      unmute: '取消静音',
      volume: '伴奏音量',
      stemsTooltip: '分轨调节',
      barLabel: '小节',
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
      startWithAudio: '直接敲击键盘即可开始，首次击键同步开启伴奏',
      imeHint: '请切换中文输入法，直接输入屏幕汉字',
      pinyinTarget: '当前词义',
      liveTelemetry: '全息矩阵输入同步中',
      pressEnterRestart: '按 Enter 立即重新开始',
      quickRestart: '快速重开',
      restartTooltip: '重新开始 (Tab + Enter)',
      nextSnippet: '换一段代码',
      nextPassage: '换一篇明文',
      customBtnTooltip: '粘贴自定义明文练习',
    },
    customModal: {
      title: '导入自定义明文',
      subtitle: '粘贴任意中文或英文段落、随笔或歌词即可直接开始跟打，会自动识别输入法与计速模式。',
      placeholder: '在这里粘贴或输入你想练习的文章段落...',
      detectedZh: '识别为中文 · 自动启用汉字输入法 (字/分)',
      detectedEn: '识别为英文/符号 · 直接键入 (WPM)',
      charsUnit: '字',
      fillSampleEn: '填入英文范例',
      fillSampleZh: '填入中文范例',
      cancel: '取消',
      apply: '开始练习',
    },
    summary: {
      sessionComplete: '遥测同步完成',
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
