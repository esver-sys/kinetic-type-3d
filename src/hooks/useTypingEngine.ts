import { useCallback, useEffect, useRef, useState } from 'react'
import { soundEngine } from '../audio/soundEngine'
import { getTargetKeyCodes } from '../constants/holoMatrixLayout'
import {
  generateChinesePhraseText,
  generatePinyinPrompt,
  generateWordText,
  pickChineseClassic,
  pickChinesePoetry,
  pickChineseProse,
  pickCodeSnippet,
  pickEnglishPassage,
} from '../constants/prompts'
import {
  ChineseProsePassage,
  ChineseSubMode,
  CodeLanguage,
  CodeSnippet,
  EnglishPassage,
  PassageSubMode,
  PinyinEntry,
  PracticeMode,
  PromptChar,
  TestSummary,
  TimeOption,
  WordsOption,
  WpmSample,
} from '../types/typing'

export type TestStatus = 'idle' | 'running' | 'finished'

interface UseTypingEngineOptions {
  triggerPulse: (rawCode: string, isError?: boolean, strength?: number) => void
  setKeyDown?: (rawCode: string, isDown: boolean) => void
  releaseAllKeys?: () => void
  setExpectedCodes?: (codes: string[]) => void
  streakIntensityRef: React.MutableRefObject<number>
  isInputPaused?: boolean
}

function buildPromptChars(text: string): PromptChar[] {
  return Array.from(text).map((char) => ({
    char,
    status: 'pending',
    errorPulse: 0,
  }))
}

function containsCjk(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text)
}

function normalizeCustomPassageText(raw: string): string {
  const lines = raw
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length === 0) return ''
  let merged = lines[0]
  for (let i = 1; i < lines.length; i++) {
    const prevEnd = merged[merged.length - 1]
    const nextStart = lines[i][0]
    const cjkBoundary =
      /[\u4e00-\u9fff，。？！；：、」』）】]/.test(prevEnd) &&
      /[\u4e00-\u9fff「『（【]/.test(nextStart)
    merged += (cjkBoundary ? '' : ' ') + lines[i]
  }
  return merged.replace(/[ \t]+/g, ' ').trim()
}

const HALF_TO_FULL_PUNCT: Record<string, string> = {
  ',': '，',
  '.': '。',
  '?': '？',
  '!': '！',
  ':': '：',
  ';': '；',
  '\\': '、',
}

function isExpectedCharMatch(
  expectedChar: string,
  typedChar: string,
  allowFullWidthFallback: boolean,
): boolean {
  if (typedChar === expectedChar) return true
  if (!allowFullWidthFallback) return false
  return HALF_TO_FULL_PUNCT[typedChar] === expectedChar
}

export function useTypingEngine({
  triggerPulse,
  setKeyDown,
  releaseAllKeys,
  setExpectedCodes,
  streakIntensityRef,
  isInputPaused = false,
}: UseTypingEngineOptions) {
  const [mode, setMode] = useState<PracticeMode>('passage')
  const [passageSubMode, setPassageSubMode] = useState<PassageSubMode>('prose')
  const [timeOption, setTimeOption] = useState<TimeOption>(30)
  const [wordsOption, setWordsOption] = useState<WordsOption>(25)
  const [codeLanguage, setCodeLanguage] = useState<CodeLanguage>('typescript')
  const [chineseSubMode, setChineseSubMode] = useState<ChineseSubMode>('prose')
  const [activeEnglishPassage, setActiveEnglishPassage] = useState<EnglishPassage>(() =>
    pickEnglishPassage(),
  )
  const [activeSnippet, setActiveSnippet] = useState<CodeSnippet>(() =>
    pickCodeSnippet('typescript'),
  )
  const [activeProse, setActiveProse] = useState<ChineseProsePassage>(() =>
    pickChineseProse(),
  )
  const [customPassageText, setCustomPassageText] = useState('')
  const [pinyinHanziMap, setPinyinHanziMap] = useState<Record<number, PinyinEntry>>({})

  const [chars, setChars] = useState<PromptChar[]>(() =>
    buildPromptChars(activeProse.text),
  )
  const [cursor, setCursor] = useState(0)
  const [status, setStatus] = useState<TestStatus>('idle')

  const [wpm, setWpm] = useState(0)
  const [rawWpm, setRawWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(100)
  const [combo, setCombo] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number>(30)
  const [tabArmed, setTabArmed] = useState(false)
  const [summary, setSummary] = useState<TestSummary | null>(null)
  const [sessionId, setSessionId] = useState(1)
  const [composingText, setComposingText] = useState('')

  // Mutable refs for zero-latency synchronous access inside keydown handler & timer
  const imeInputRef = useRef<HTMLInputElement | null>(null)
  const isComposingRef = useRef(false)
  const lastCompositionCommitRef = useRef(0)
  const lastPressedCodeRef = useRef<string>('Space')

  const statusRef = useRef<TestStatus>('idle')
  const charsRef = useRef<PromptChar[]>(chars)
  const cursorRef = useRef(0)
  const modeRef = useRef<PracticeMode>(mode)
  const passageSubModeRef = useRef<PassageSubMode>(passageSubMode)
  const timeOptionRef = useRef<TimeOption>(timeOption)
  const wordsOptionRef = useRef<WordsOption>(wordsOption)
  const codeLanguageRef = useRef<CodeLanguage>(codeLanguage)
  const chineseSubModeRef = useRef<ChineseSubMode>(chineseSubMode)
  const activeEnglishPassageRef = useRef<EnglishPassage>(activeEnglishPassage)
  const activeSnippetRef = useRef<CodeSnippet>(activeSnippet)
  const activeProseRef = useRef<ChineseProsePassage>(activeProse)
  const customPassageTextRef = useRef<string>(customPassageText)
  const customHasCjkRef = useRef<boolean>(false)
  const modalOpenRef = useRef<boolean>(isInputPaused)

  useEffect(() => {
    modalOpenRef.current = isInputPaused
    if (isInputPaused) {
      releaseAllKeys?.()
    }
  }, [isInputPaused, releaseAllKeys])

  const startTimeRef = useRef<number>(0)
  const wpmRef = useRef(0)
  const comboRef = useRef(0)
  const maxComboRef = useRef(0)
  const totalUnitsRef = useRef(0)
  const correctUnitsRef = useRef(0)
  const incorrectUnitsRef = useRef(0)
  const totalKeystrokesRef = useRef(0)
  const tabArmedRef = useRef(false)
  const tabHeldRef = useRef(false)
  const tabTimerRef = useRef<number | null>(null)
  const samplesRef = useRef<WpmSample[]>([])
  const lastSampleSecondRef = useRef(0)
  const prevSampleCorrectRef = useRef(0)
  const prevSampleTotalRef = useRef(0)

  const isHanziImeMode = useCallback(() => {
    if (modeRef.current === 'chinese') {
      return chineseSubModeRef.current !== 'pinyin'
    }
    if (modeRef.current === 'passage') {
      if (
        passageSubModeRef.current === 'prose' ||
        passageSubModeRef.current === 'poetry' ||
        passageSubModeRef.current === 'classics'
      ) {
        return true
      }
      if (passageSubModeRef.current === 'custom') return customHasCjkRef.current
    }
    return false
  }, [])

  const getSpeedUnit = useCallback((): 'WPM' | 'CPM' => {
    return isHanziImeMode() ? 'CPM' : 'WPM'
  }, [isHanziImeMode])

  const computeSpeed = useCallback(
    (charCount: number, minutes: number) => {
      if (isHanziImeMode()) {
        return Math.round(charCount / minutes)
      }
      return Math.round(charCount / 5 / minutes)
    },
    [isHanziImeMode],
  )

  const focusImeIfNeeded = useCallback(() => {
    if (modalOpenRef.current) return
    if (isHanziImeMode() && statusRef.current !== 'finished') {
      imeInputRef.current?.focus({ preventScroll: true })
    } else if (!isHanziImeMode() && document.activeElement === imeInputRef.current) {
      imeInputRef.current?.blur()
    }
  }, [isHanziImeMode])

  useEffect(() => {
    const id = window.requestAnimationFrame(() => focusImeIfNeeded())
    return () => window.cancelAnimationFrame(id)
  }, [focusImeIfNeeded])

  const disarmTab = useCallback(() => {
    tabArmedRef.current = false
    setTabArmed(false)
    if (tabTimerRef.current !== null) {
      window.clearTimeout(tabTimerRef.current)
      tabTimerRef.current = null
    }
  }, [])

  const armTab = useCallback(() => {
    tabArmedRef.current = true
    setTabArmed(true)
    if (tabTimerRef.current !== null) {
      window.clearTimeout(tabTimerRef.current)
    }
    tabTimerRef.current = window.setTimeout(() => {
      tabArmedRef.current = false
      setTabArmed(false)
      tabTimerRef.current = null
    }, 1800)
  }, [])

  const countCorrectTypedChars = useCallback((list: PromptChar[]) => {
    let count = 0
    for (let i = 0; i < list.length; i++) {
      if (list[i].status === 'correct' && !list[i].autoFilled) {
        count++
      }
    }
    return count
  }, [])

  const updateStreakRef = useCallback(
    (currentSpeed: number, currentCombo: number) => {
      const comboFactor = Math.min(1, currentCombo / 45)
      const speedFactor = isHanziImeMode()
        ? Math.min(1, Math.max(0, (currentSpeed - 20) / 70))
        : Math.min(1, Math.max(0, (currentSpeed - 30) / 90))
      streakIntensityRef.current = Math.min(1, comboFactor * 0.58 + speedFactor * 0.42)
    },
    [isHanziImeMode, streakIntensityRef],
  )

  const buildModeLabel = useCallback(() => {
    if (modeRef.current === 'passage') {
      if (passageSubModeRef.current === 'en') {
        return `Prose · ${activeEnglishPassageRef.current.title}`
      }
      if (passageSubModeRef.current === 'prose') {
        return `散文 · ${activeProseRef.current.title}`
      }
      if (passageSubModeRef.current === 'poetry') {
        return `古诗 · ${activeProseRef.current.title}`
      }
      if (passageSubModeRef.current === 'classics') {
        return `名篇 · ${activeProseRef.current.title}`
      }
      return customHasCjkRef.current ? '明文 · 自定义中文' : 'Prose · Custom Text'
    }
    if (modeRef.current === 'time') return `Time · ${timeOptionRef.current}s`
    if (modeRef.current === 'words') return `Words · ${wordsOptionRef.current}`
    if (modeRef.current === 'code') {
      return `Code · ${activeSnippetRef.current.language.toUpperCase()}`
    }
    if (chineseSubModeRef.current === 'phrases') return '中文 · 词组'
    if (chineseSubModeRef.current === 'prose') return `中文 · ${activeProseRef.current.title}`
    return '中文 · 拼音'
  }, [])

  const finishTest = useCallback(() => {
    if (statusRef.current === 'finished') return
    statusRef.current = 'finished'
    setStatus('finished')
    isComposingRef.current = false
    setComposingText('')
    if (imeInputRef.current) {
      imeInputRef.current.value = ''
      imeInputRef.current.blur()
    }

    const now = performance.now()
    const elapsedSec = Math.max(0.5, (now - startTimeRef.current) / 1000)
    const minutes = elapsedSec / 60
    const correctChars = countCorrectTypedChars(charsRef.current)
    const finalWpm = computeSpeed(correctChars, minutes)
    const finalRawWpm = computeSpeed(totalUnitsRef.current, minutes)
    const total = totalUnitsRef.current
    const finalAcc =
      total > 0 ? Math.round((correctUnitsRef.current / total) * 100) : 100

    const samples = [...samplesRef.current]
    if (samples.length === 0) {
      samples.push({
        second: Math.max(1, Math.round(elapsedSec)),
        wpm: finalWpm,
        rawWpm: finalRawWpm,
      })
    }

    let consistency = 100
    if (samples.length >= 2) {
      const smoothed = samples.map((_, idx) => {
        const start = Math.max(0, idx - 1)
        const end = Math.min(samples.length - 1, idx + 1)
        let sum = 0
        for (let j = start; j <= end; j++) {
          sum += samples[j].rawWpm
        }
        return sum / (end - start + 1)
      })
      const activeVals = smoothed.filter((v) => v > 0)
      const vals = activeVals.length >= 2 ? activeVals : smoothed
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length
      if (mean > 0) {
        const variance =
          vals.reduce((sum, v) => sum + (v - mean) * (v - mean), 0) / vals.length
        const stdDev = Math.sqrt(variance)
        const cv = stdDev / mean
        consistency = Math.round(Math.max(0, Math.min(100, 100 * Math.exp(-0.62 * cv))))
      }
    }

    setWpm(finalWpm)
    setRawWpm(finalRawWpm)
    setAccuracy(finalAcc)
    streakIntensityRef.current = 0.25

    setSummary({
      wpm: finalWpm,
      rawWpm: finalRawWpm,
      speedUnit: getSpeedUnit(),
      accuracy: finalAcc,
      consistency,
      maxCombo: maxComboRef.current,
      correctChars,
      incorrectChars: incorrectUnitsRef.current,
      totalKeystrokes: totalKeystrokesRef.current,
      elapsedSeconds: Number(elapsedSec.toFixed(1)),
      modeLabel: buildModeLabel(),
      samples,
    })
  }, [buildModeLabel, computeSpeed, countCorrectTypedChars, getSpeedUnit, streakIntensityRef])

  const resetTest = useCallback(
    (overrides?: {
      mode?: PracticeMode
      passageSubMode?: PassageSubMode
      timeOption?: TimeOption
      wordsOption?: WordsOption
      codeLanguage?: CodeLanguage
      chineseSubMode?: ChineseSubMode
      customText?: string
      cycleSnippet?: boolean
      cycleChinese?: boolean
      cyclePassage?: boolean
    }) => {
      const nextMode = overrides?.mode ?? modeRef.current
      const nextPassageSub = overrides?.passageSubMode ?? passageSubModeRef.current
      const nextTime = overrides?.timeOption ?? timeOptionRef.current
      const nextWords = overrides?.wordsOption ?? wordsOptionRef.current
      const nextLang = overrides?.codeLanguage ?? codeLanguageRef.current
      const nextChineseSub = overrides?.chineseSubMode ?? chineseSubModeRef.current

      modeRef.current = nextMode
      passageSubModeRef.current = nextPassageSub
      timeOptionRef.current = nextTime
      wordsOptionRef.current = nextWords
      codeLanguageRef.current = nextLang
      chineseSubModeRef.current = nextChineseSub

      if (overrides?.mode !== undefined) setMode(nextMode)
      if (overrides?.passageSubMode !== undefined) setPassageSubMode(nextPassageSub)
      if (overrides?.timeOption !== undefined) setTimeOption(nextTime)
      if (overrides?.wordsOption !== undefined) setWordsOption(nextWords)
      if (overrides?.codeLanguage !== undefined) setCodeLanguage(nextLang)
      if (overrides?.chineseSubMode !== undefined) setChineseSubMode(nextChineseSub)

      if (overrides?.customText !== undefined) {
        const cleaned = normalizeCustomPassageText(overrides.customText)
        customPassageTextRef.current = cleaned
        customHasCjkRef.current = containsCjk(cleaned)
        setCustomPassageText(cleaned)
      }

      let nextText = ''
      let nextPinyinMap: Record<number, PinyinEntry> = {}

      if (nextMode === 'passage') {
        if (nextPassageSub === 'en') {
          const passage = pickEnglishPassage(
            overrides?.cyclePassage ? activeEnglishPassageRef.current.id : undefined,
          )
          activeEnglishPassageRef.current = passage
          setActiveEnglishPassage(passage)
          nextText = passage.text
        } else if (nextPassageSub === 'poetry') {
          const poem = pickChinesePoetry(
            overrides?.cyclePassage || overrides?.cycleChinese
              ? activeProseRef.current.id
              : undefined,
          )
          activeProseRef.current = poem
          setActiveProse(poem)
          nextText = poem.text
        } else if (nextPassageSub === 'classics') {
          const classic = pickChineseClassic(
            overrides?.cyclePassage || overrides?.cycleChinese
              ? activeProseRef.current.id
              : undefined,
          )
          activeProseRef.current = classic
          setActiveProse(classic)
          nextText = classic.text
        } else if (nextPassageSub === 'prose') {
          const prose = pickChineseProse(
            overrides?.cyclePassage || overrides?.cycleChinese
              ? activeProseRef.current.id
              : undefined,
          )
          activeProseRef.current = prose
          setActiveProse(prose)
          nextText = prose.text
        } else {
          if (!customPassageTextRef.current) {
            const fallback = activeProseRef.current.text
            customPassageTextRef.current = fallback
            customHasCjkRef.current = containsCjk(fallback)
            setCustomPassageText(fallback)
          }
          nextText = customPassageTextRef.current
        }
      } else if (nextMode === 'time') {
        nextText = generateWordText(95)
      } else if (nextMode === 'words') {
        nextText = generateWordText(nextWords)
      } else if (nextMode === 'code') {
        const snippet = pickCodeSnippet(
          nextLang,
          overrides?.cycleSnippet ? activeSnippetRef.current.id : undefined,
        )
        activeSnippetRef.current = snippet
        setActiveSnippet(snippet)
        nextText = snippet.code
      } else {
        if (nextChineseSub === 'phrases') {
          nextText = generateChinesePhraseText(12)
        } else if (nextChineseSub === 'prose') {
          const prose = pickChineseProse(
            overrides?.cycleChinese ? activeProseRef.current.id : undefined,
          )
          activeProseRef.current = prose
          setActiveProse(prose)
          nextText = prose.text
        } else {
          const generated = generatePinyinPrompt(14)
          nextText = generated.text
          nextPinyinMap = generated.hanziByIndex
        }
      }

      const nextChars = buildPromptChars(nextText)
      charsRef.current = nextChars
      cursorRef.current = 0
      statusRef.current = 'idle'
      wpmRef.current = 0
      comboRef.current = 0
      maxComboRef.current = 0
      totalUnitsRef.current = 0
      correctUnitsRef.current = 0
      incorrectUnitsRef.current = 0
      totalKeystrokesRef.current = 0
      samplesRef.current = []
      lastSampleSecondRef.current = 0
      prevSampleCorrectRef.current = 0
      prevSampleTotalRef.current = 0
      streakIntensityRef.current = 0
      isComposingRef.current = false
      setComposingText('')
      if (imeInputRef.current) {
        imeInputRef.current.value = ''
      }
      disarmTab()

      setPinyinHanziMap(nextPinyinMap)
      setChars(nextChars)
      setCursor(0)
      setStatus('idle')
      setWpm(0)
      setRawWpm(0)
      setAccuracy(100)
      setCombo(0)
      setTimeLeft(nextTime)
      setSummary(null)
      setSessionId((s) => s + 1)

      window.requestAnimationFrame(() => {
        focusImeIfNeeded()
      })
    },
    [disarmTab, focusImeIfNeeded, streakIntensityRef],
  )

  const applyCustomPassage = useCallback(
    (rawText: string) => {
      const cleaned = normalizeCustomPassageText(rawText)
      if (!cleaned) return
      resetTest({
        mode: 'passage',
        passageSubMode: 'custom',
        customText: cleaned,
      })
    },
    [resetTest],
  )

  const commitText = useCallback(
    (text: string, sourceCode?: string, isDirectKeypress = false) => {
      if (!text || statusRef.current === 'finished') return
      const keyCode = sourceCode ?? lastPressedCodeRef.current

      if (statusRef.current === 'idle') {
        statusRef.current = 'running'
        startTimeRef.current = performance.now()
        setStatus('running')
      }

      const hanziIme = isHanziImeMode()
      const list = [...charsRef.current]
      let idx = cursorRef.current
      let hadError = false
      let hadCorrect = false

      const glyphs = Array.from(text)
      for (let g = 0; g < glyphs.length; g++) {
        if (idx >= list.length) break
        const typedChar = glyphs[g]
        const expected = list[idx]
        const isMatch = isExpectedCharMatch(expected.char, typedChar, hanziIme)

        totalUnitsRef.current += 1

        if (isMatch) {
          correctUnitsRef.current += 1
          comboRef.current += 1
          if (comboRef.current > maxComboRef.current) {
            maxComboRef.current = comboRef.current
          }
          hadCorrect = true

          list[idx] = { ...expected, status: 'correct', autoFilled: false }
          idx += 1

          // In code mode, auto-advance past structural leading spaces after Enter
          if (modeRef.current === 'code' && expected.char === '\n') {
            while (idx < list.length && list[idx].char === ' ') {
              list[idx] = { ...list[idx], status: 'correct', autoFilled: true }
              idx++
            }
          }
        } else {
          incorrectUnitsRef.current += 1
          comboRef.current = 0
          hadError = true

          list[idx] = {
            ...expected,
            status: 'incorrect',
            errorPulse: expected.errorPulse + 1,
            autoFilled: false,
          }
          idx += 1
        }
      }

      if (modeRef.current === 'time' && list.length - idx < 120) {
        const extra = buildPromptChars(' ' + generateWordText(45))
        list.push(...extra)
      }

      if (hadError) {
        triggerPulse(keyCode, true, 1.35)
        soundEngine.playErrorPulse()
      } else if (hadCorrect && isDirectKeypress) {
        const boost = keyCode === 'Space' || keyCode === 'Enter' ? 1.25 : 1.0
        triggerPulse(keyCode, false, boost)
        soundEngine.playTypingChime(keyCode, comboRef.current)
      } else if (hadCorrect) {
        triggerPulse(keyCode, false, 1.3)
        soundEngine.playTypingChime(keyCode, comboRef.current)
      }

      charsRef.current = list
      cursorRef.current = idx
      setChars(list)
      setCursor(idx)
      setCombo(comboRef.current)

      const acc =
        totalUnitsRef.current > 0
          ? Math.round((correctUnitsRef.current / totalUnitsRef.current) * 100)
          : 100
      setAccuracy(acc)

      const elapsedSec = (performance.now() - startTimeRef.current) / 1000
      if (elapsedSec >= 0.45) {
        const liveSpeed = computeSpeed(countCorrectTypedChars(list), elapsedSec / 60)
        wpmRef.current = liveSpeed
        setWpm(liveSpeed)
        updateStreakRef(liveSpeed, comboRef.current)
      } else {
        updateStreakRef(0, comboRef.current)
      }

      if (modeRef.current !== 'time' && idx >= list.length) {
        finishTest()
      }
    },
    [
      computeSpeed,
      countCorrectTypedChars,
      finishTest,
      isHanziImeMode,
      triggerPulse,
      updateStreakRef,
    ],
  )

  const handleBackspaceAction = useCallback(() => {
    if (statusRef.current !== 'running' || cursorRef.current <= 0) return
    const next = [...charsRef.current]
    let prevIdx = cursorRef.current - 1

    while (prevIdx > 0 && next[prevIdx].autoFilled) {
      next[prevIdx] = { ...next[prevIdx], status: 'pending', autoFilled: false }
      prevIdx--
    }

    next[prevIdx] = {
      ...next[prevIdx],
      status: 'pending',
      autoFilled: false,
    }

    charsRef.current = next
    cursorRef.current = prevIdx
    setChars(next)
    setCursor(prevIdx)
  }, [])

  // Live timer + speed sampler while running
  useEffect(() => {
    if (status !== 'running') return

    const id = window.setInterval(() => {
      if (statusRef.current !== 'running') return
      const now = performance.now()
      const elapsedSec = (now - startTimeRef.current) / 1000

      if (modeRef.current === 'time') {
        const remaining = Math.max(0, timeOptionRef.current - elapsedSec)
        setTimeLeft(Math.ceil(remaining))
        if (remaining <= 0) {
          finishTest()
          return
        }
      }

      if (elapsedSec >= 0.45) {
        const minutes = elapsedSec / 60
        const correct = countCorrectTypedChars(charsRef.current)
        const liveWpm = computeSpeed(correct, minutes)
        const liveRaw = computeSpeed(totalUnitsRef.current, minutes)
        wpmRef.current = liveWpm
        setWpm(liveWpm)
        setRawWpm(liveRaw)
        updateStreakRef(liveWpm, comboRef.current)
      }

      const wholeSecond = Math.floor(elapsedSec)
      if (wholeSecond > lastSampleSecondRef.current && wholeSecond >= 1) {
        const deltaSec = wholeSecond - lastSampleSecondRef.current
        const currentCorrect = countCorrectTypedChars(charsRef.current)
        const currentTotal = totalUnitsRef.current
        const intervalCorrect = Math.max(0, currentCorrect - prevSampleCorrectRef.current)
        const intervalTotal = Math.max(0, currentTotal - prevSampleTotalRef.current)

        const instantWpm = computeSpeed(intervalCorrect, deltaSec / 60)
        const instantRaw = computeSpeed(intervalTotal, deltaSec / 60)

        samplesRef.current.push({
          second: wholeSecond,
          wpm: instantWpm,
          rawWpm: instantRaw,
        })

        lastSampleSecondRef.current = wholeSecond
        prevSampleCorrectRef.current = currentCorrect
        prevSampleTotalRef.current = currentTotal
      }
    }, 80)

    return () => window.clearInterval(id)
  }, [computeSpeed, countCorrectTypedChars, finishTest, status, updateStreakRef])

  // Sync next expected crystal key indicator on the 3D Holo Input Matrix
  useEffect(() => {
    if (!setExpectedCodes) return
    if (status === 'finished' || isHanziImeMode()) {
      setExpectedCodes([])
      return
    }
    setExpectedCodes(getTargetKeyCodes(chars[cursor]?.char))
  }, [chars, cursor, isHanziImeMode, setExpectedCodes, status])

  // Global low-latency telemetry capture & harmonic feedback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalOpenRef.current) return
      if (
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLInputElement && e.target !== imeInputRef.current)
      ) {
        return
      }

      soundEngine.unlockFromGesture()

      if (!e.repeat) {
        setKeyDown?.(e.code, true)
      }

      if (e.ctrlKey || e.metaKey || e.altKey) {
        if (!e.repeat) {
          triggerPulse(e.code, false, 0.55)
        }
        return
      }

      lastPressedCodeRef.current = e.code

      // Handle Tab for Tab+Enter quick restart
      if (e.code === 'Tab') {
        e.preventDefault()
        if (!e.repeat) {
          tabHeldRef.current = true
          armTab()
          triggerPulse(e.code, false, 0.7)
        }
        return
      }

      // Handle Enter when Tab+Enter quick restart is armed or held
      if (e.code === 'Enter' && (tabArmedRef.current || tabHeldRef.current)) {
        e.preventDefault()
        triggerPulse(e.code, false, 1.35)
        soundEngine.playHoloBurst()
        resetTest()
        return
      }

      if (statusRef.current === 'finished') {
        if (e.code === 'Escape') {
          e.preventDefault()
          triggerPulse(e.code, false, 0.9)
          resetTest()
        }
        return
      }

      // Modifier-only keys emit soft subtle spatial ripple
      if (
        e.code === 'ShiftLeft' ||
        e.code === 'ShiftRight' ||
        e.code === 'CapsLock'
      ) {
        if (!e.repeat) {
          triggerPulse(e.code, false, 0.5)
        }
        return
      }

      if (e.code === 'Escape') {
        if (!isComposingRef.current && !e.isComposing) {
          e.preventDefault()
          triggerPulse(e.code, false, 0.9)
          if (statusRef.current === 'running') {
            resetTest()
          }
        } else {
          triggerPulse(e.code, false, 0.65)
        }
        return
      }

      // Track total physical keystrokes
      if (!e.repeat) {
        totalKeystrokesRef.current += 1
      }

      // Chinese IME mode: trigger gentle harmonic chime & pulse immediately, let IME input handle composition/commit
      if (isHanziImeMode()) {
        if (document.activeElement !== imeInputRef.current) {
          imeInputRef.current?.focus({ preventScroll: true })
        }

        if (e.isComposing || isComposingRef.current || e.key === 'Process' || e.keyCode === 229) {
          if (tabArmedRef.current) disarmTab()
          if (!e.repeat) {
            triggerPulse(e.code, false, 0.78)
            soundEngine.playTypingChime(e.code, comboRef.current)
          }
          return
        }

        if (tabArmedRef.current) disarmTab()

        if (e.code === 'Backspace') {
          e.preventDefault()
          triggerPulse(e.code, false, 0.7)
          handleBackspaceAction()
          return
        }

        if (!e.repeat) {
          triggerPulse(e.code, false, 0.78)
          soundEngine.playTypingChime(e.code, comboRef.current)
        }
        return
      }

      // Standard direct keyboard modes (Time / Words / Code / Chinese Pinyin)
      if (e.isComposing) return

      if (tabArmedRef.current) {
        disarmTab()
      }

      if (e.code === 'Backspace') {
        e.preventDefault()
        triggerPulse(e.code, false, 0.7)
        handleBackspaceAction()
        return
      }

      let typedChar: string | null = null
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        typedChar = ' '
      } else if (e.code === 'Enter') {
        e.preventDefault()
        typedChar = '\n'
      } else if (e.key.length === 1) {
        if (e.key === "'" || e.key === '/') {
          e.preventDefault()
        }
        typedChar = e.key
      } else {
        return
      }

      commitText(typedChar, e.code, true)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeyDown?.(e.code, false)
      if (e.code === 'Tab') {
        tabHeldRef.current = false
      }
    }

    const handleBlur = () => {
      tabHeldRef.current = false
      releaseAllKeys?.()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [
    armTab,
    commitText,
    disarmTab,
    handleBackspaceAction,
    isHanziImeMode,
    releaseAllKeys,
    resetTest,
    setKeyDown,
    triggerPulse,
  ])

  const onImeCompositionStart = useCallback(() => {
    isComposingRef.current = true
    setComposingText('')
  }, [])

  const onImeCompositionUpdate = useCallback((data: string) => {
    isComposingRef.current = true
    setComposingText(data)
  }, [])

  const onImeCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      isComposingRef.current = false
      setComposingText('')
      const text = e.data || e.currentTarget.value
      e.currentTarget.value = ''
      lastCompositionCommitRef.current = performance.now()
      if (text) {
        commitText(text, lastPressedCodeRef.current, false)
      }
    },
    [commitText],
  )

  const onImeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const nativeEvt = e.nativeEvent as InputEvent
      if (isComposingRef.current || nativeEvt.isComposing) {
        return
      }
      if (
        performance.now() - lastCompositionCommitRef.current < 30 &&
        nativeEvt.inputType === 'insertCompositionText'
      ) {
        e.currentTarget.value = ''
        return
      }
      const val = e.currentTarget.value
      e.currentTarget.value = ''
      if (val) {
        commitText(val, lastPressedCodeRef.current, false)
      }
    },
    [commitText],
  )

  return {
    mode,
    passageSubMode,
    timeOption,
    wordsOption,
    codeLanguage,
    chineseSubMode,
    activeEnglishPassage,
    activeSnippet,
    activeProse,
    customPassageText,
    hasCustomCjk: customHasCjkRef.current,
    isHanziIme: isHanziImeMode(),
    pinyinHanziMap,
    chars,
    cursor,
    status,
    wpm,
    rawWpm,
    speedUnit: getSpeedUnit(),
    accuracy,
    combo,
    timeLeft,
    tabArmed,
    summary,
    sessionId,
    composingText,
    imeInputRef,
    focusImeIfNeeded,
    onImeCompositionStart,
    onImeCompositionUpdate,
    onImeCompositionEnd,
    onImeChange,
    resetTest,
    applyCustomPassage,
  }
}
