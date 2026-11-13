import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CornerDownLeft } from 'lucide-react'
import { UI_STRINGS } from '../constants/i18n'
import {
  AccentTheme,
  ChineseSubMode,
  PinyinEntry,
  PracticeMode,
  PromptChar,
  UiLanguage,
} from '../types/typing'
import { TestStatus } from '../hooks/useTypingEngine'

interface TypingPromptProps {
  uiLang: UiLanguage
  mode: PracticeMode
  chineseSubMode: ChineseSubMode
  status: TestStatus
  chars: PromptChar[]
  cursor: number
  combo: number
  tabArmed: boolean
  sessionId: number
  pinyinHanziMap: Record<number, PinyinEntry>
  composingText: string
  imeInputRef: React.RefObject<HTMLInputElement | null>
  onFocusIme: () => void
  onImeCompositionStart: () => void
  onImeCompositionUpdate: (data: string) => void
  onImeCompositionEnd: (e: React.CompositionEvent<HTMLInputElement>) => void
  onImeChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  accent: AccentTheme
}

interface WordToken {
  startIndex: number
  items: { item: PromptChar; index: number }[]
}

export const TypingPrompt: React.FC<TypingPromptProps> = ({
  uiLang,
  mode,
  chineseSubMode,
  status,
  chars,
  cursor,
  combo,
  tabArmed,
  sessionId,
  pinyinHanziMap,
  composingText,
  imeInputRef,
  onFocusIme,
  onImeCompositionStart,
  onImeCompositionUpdate,
  onImeCompositionEnd,
  onImeChange,
  accent,
}) => {
  const t = UI_STRINGS[uiLang]
  const isHanziMode = mode === 'chinese' && chineseSubMode !== 'pinyin'
  const isPinyinMode = mode === 'chinese' && chineseSubMode === 'pinyin'

  const containerRef = useRef<HTMLDivElement>(null)
  const charRefs = useRef<Array<HTMLSpanElement | null>>([])
  const [caret, setCaret] = useState({ x: 0, y: 0, height: 28, visible: false })
  const [scrollY, setScrollY] = useState(0)

  const wordTokens = useMemo<WordToken[]>(() => {
    if (mode === 'code') return []
    const tokens: WordToken[] = []

    if (isHanziMode) {
      const cjkPunct = new Set(['，', '。', '？', '！', '：', '；', '、', ',', '.', '?', '!'])
      if (chineseSubMode === 'phrases') {
        // Keep each short phrase + its trailing punctuation intact on the same line
        let current: WordToken = { startIndex: 0, items: [] }
        for (let i = 0; i < chars.length; i++) {
          const ch = chars[i]
          current.items.push({ item: ch, index: i })
          if (cjkPunct.has(ch.char)) {
            tokens.push(current)
            current = { startIndex: i + 1, items: [] }
          }
        }
        if (current.items.length > 0) tokens.push(current)
        return tokens
      }

      // Prose: attach any trailing punctuation to the preceding character (kinsoku)
      for (let i = 0; i < chars.length; i++) {
        const ch = chars[i]
        if (cjkPunct.has(ch.char) && tokens.length > 0) {
          tokens[tokens.length - 1].items.push({ item: ch, index: i })
        } else {
          tokens.push({ startIndex: i, items: [{ item: ch, index: i }] })
        }
      }
      return tokens
    }

    let current: WordToken = { startIndex: 0, items: [] }

    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i]
      current.items.push({ item: ch, index: i })
      if (ch.char === ' ') {
        tokens.push(current)
        current = { startIndex: i + 1, items: [] }
      }
    }
    if (current.items.length > 0) {
      tokens.push(current)
    }
    return tokens
  }, [chars, chineseSubMode, isHanziMode, mode])

  const codeLines = useMemo(() => {
    if (mode !== 'code') return []
    const lines: { item: PromptChar; index: number }[][] = [[]]
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i]
      lines[lines.length - 1].push({ item: ch, index: i })
      if (ch.char === '\n') {
        lines.push([])
      }
    }
    return lines
  }, [chars, mode])

  const activePinyinEntry = useMemo(() => {
    if (!isPinyinMode || chars.length === 0) return null
    const clampedIdx = Math.min(cursor, chars.length - 1)
    return pinyinHanziMap[clampedIdx] ?? null
  }, [chars.length, cursor, isPinyinMode, pinyinHanziMap])

  const updateCaret = useRef(() => {})
  updateCaret.current = () => {
    const container = containerRef.current
    if (!container) return

    const targetIdx = Math.min(cursor, Math.max(0, chars.length - 1))
    const targetEl = charRefs.current[targetIdx]
    if (!targetEl) return

    const isAtEnd = cursor >= chars.length
    const x = isAtEnd ? targetEl.offsetLeft + targetEl.offsetWidth : targetEl.offsetLeft
    const y = targetEl.offsetTop
    const height = targetEl.offsetHeight || 28

    setCaret({ x, y, height, visible: true })

    const lineStep = mode === 'code' ? 32 : isHanziMode ? 44 : 42
    const keepMargin = mode === 'code' ? lineStep * 2 : lineStep
    const desiredScroll = Math.max(0, y - keepMargin)
    setScrollY(desiredScroll)
  }

  useLayoutEffect(() => {
    updateCaret.current()
  }, [cursor, chars, mode, chineseSubMode, sessionId])

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      updateCaret.current()
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const flowGlow = combo >= 20 ? 0.28 : status === 'running' ? 0.14 : 0.08

  const renderChar = (item: PromptChar, index: number) => {
    const isNewline = item.char === '\n'
    const isSpace = item.char === ' '

    let colorClass = 'text-slate-400/50'
    let bgClass = ''

    if (item.status === 'correct') {
      colorClass = item.autoFilled ? 'text-slate-400/60' : 'text-slate-50'
    } else if (item.status === 'incorrect') {
      colorClass = 'text-rose-400'
      bgClass = isSpace || isNewline ? 'bg-rose-500/20 rounded-[4px]' : ''
    }

    const shouldShake = item.status === 'incorrect' && item.errorPulse > 0

    return (
      <span
        key={`${index}-${item.errorPulse}`}
        ref={(el) => {
          charRefs.current[index] = el
        }}
        className={`relative inline-block transition-colors duration-75 ${colorClass} ${bgClass} ${
          isHanziMode ? 'px-[1px]' : ''
        } ${shouldShake ? 'animate-char-shake' : ''}`}
      >
        {isNewline ? (
          <span className="inline-flex items-center px-0.5 align-middle opacity-55">
            <CornerDownLeft className="h-3.5 w-3.5" />
          </span>
        ) : isSpace ? (
          '\u00A0'
        ) : (
          item.char
        )}
      </span>
    )
  }

  return (
    <div
      className="relative z-10 mx-auto w-full max-w-4xl px-4 pointer-events-auto"
      onClick={() => onFocusIme()}
    >
      {/* Anchored transparent input placed below the prompt card so OS IME candidate bars never obscure prompt text */}
      {isHanziMode && (
        <input
          ref={imeInputRef}
          type="text"
          aria-label="Chinese IME input"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          onCompositionStart={onImeCompositionStart}
          onCompositionUpdate={(e) =>
            onImeCompositionUpdate(e.data ?? e.currentTarget.value ?? '')
          }
          onCompositionEnd={onImeCompositionEnd}
          onChange={onImeChange}
          className="pointer-events-none absolute z-30 h-6 w-2 opacity-0"
          style={{
            left: `clamp(28px, ${Math.round(caret.x + 42)}px, calc(100% - 340px))`,
            top: 'calc(100% + 6px)',
          }}
        />
      )}

      <motion.div
        key={sessionId}
        initial={{ opacity: 0.72, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        className="relative overflow-hidden rounded-3xl border bg-slate-950/55 px-6 py-5 sm:px-8 sm:py-6 backdrop-blur-xl transition-shadow duration-500"
        style={{
          borderColor: tabArmed
            ? accent.borderRgba
            : `rgba(255, 255, 255, ${0.08 + flowGlow * 0.25})`,
          boxShadow: `0 24px 60px -18px rgba(0, 0, 0, 0.8), 0 0 44px -16px rgba(${
            accent.id === 'cyan'
              ? '34, 211, 238'
              : accent.id === 'amber'
                ? '245, 158, 11'
                : accent.id === 'violet'
                  ? '167, 139, 250'
                  : accent.id === 'emerald'
                    ? '52, 211, 153'
                    : '251, 113, 133'
          }, ${flowGlow})`,
        }}
      >
        {/* Subtle glass top specular edge */}
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Masked Smooth Viewport */}
        <div
          className={`relative overflow-hidden ${
            mode === 'code'
              ? 'h-[154px] sm:h-[168px]'
              : isHanziMode
                ? 'h-[130px] sm:h-[136px]'
                : 'h-[124px] sm:h-[132px]'
          }`}
          style={{
            maskImage:
              scrollY > 4
                ? 'linear-gradient(to bottom, transparent 0%, black 18%, black 85%, transparent 100%)'
                : 'linear-gradient(to bottom, black 0%, black 85%, transparent 100%)',
            WebkitMaskImage:
              scrollY > 4
                ? 'linear-gradient(to bottom, transparent 0%, black 18%, black 85%, transparent 100%)'
                : 'linear-gradient(to bottom, black 0%, black 85%, transparent 100%)',
          }}
        >
          <div
            ref={containerRef}
            className={`relative font-mono tracking-normal select-none transition-transform duration-200 ease-out ${
              mode === 'code'
                ? 'text-[15px] sm:text-[17px] leading-[32px]'
                : isHanziMode
                  ? 'text-[22px] sm:text-[25px] leading-[44px]'
                  : 'text-[21px] sm:text-[24px] leading-[42px]'
            }`}
            style={{
              fontVariantLigatures: 'none',
              transform: `translate3d(0, -${scrollY}px, 0)`,
            }}
          >
            {/* Smooth-gliding Glowing Caret */}
            {caret.visible && status !== 'finished' && (
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute left-0 top-0 z-20 w-[2.5px] rounded-full ${
                  status === 'idle' ? 'animate-caret-blink' : ''
                }`}
                style={{
                  height: `${Math.max(20, caret.height - 6)}px`,
                  transform: `translate3d(${caret.x}px, ${caret.y + 3}px, 0)`,
                  transition: 'transform 62ms cubic-bezier(0.22, 1, 0.36, 1)',
                  backgroundColor: accent.hex,
                  boxShadow: `0 0 12px ${accent.hex}, 0 0 4px #ffffff`,
                }}
              />
            )}

            {mode === 'code' ? (
              <div className="whitespace-pre">
                {codeLines.map((line, lineIdx) => (
                  <div key={lineIdx} className="min-h-[32px]">
                    {line.map(({ item, index }) => renderChar(item, index))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap items-baseline">
                {wordTokens.map((token) => (
                  <span key={token.startIndex} className="inline-flex whitespace-nowrap">
                    {token.items.map(({ item, index }) => renderChar(item, index))}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subtle Whisper Footer Bar */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-2.5 text-[11px] text-slate-500">
          <div className="flex items-center gap-2.5">
            {isHanziMode && composingText ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium"
                style={{
                  borderColor: accent.borderRgba,
                  backgroundColor: accent.softBgRgba,
                  color: accent.hex,
                }}
              >
                {composingText}
              </span>
            ) : (
              <AnimatePresence mode="wait">
                {tabArmed ? (
                  <motion.span
                    key="armed"
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    className="font-medium"
                    style={{ color: accent.hex }}
                  >
                    {t.prompt.pressEnterRestart}
                  </motion.span>
                ) : status === 'idle' ? (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {isHanziMode ? t.prompt.imeHint : t.prompt.startTyping}
                  </motion.span>
                ) : (
                  <motion.span
                    key="running"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: accent.hex }}
                    />
                    {t.prompt.liveTelemetry}
                  </motion.span>
                )}
              </AnimatePresence>
            )}

            {isPinyinMode && activePinyinEntry && (
              <span
                className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-medium"
                style={{
                  borderColor: accent.borderRgba,
                  backgroundColor: accent.softBgRgba,
                  color: accent.hex,
                }}
              >
                <span className="text-slate-400">{t.prompt.pinyinTarget}:</span>
                <span className="text-slate-100">{activePinyinEntry.hanzi}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
            <kbd className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-slate-300">
              Tab
            </kbd>
            <span>+</span>
            <kbd className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-slate-300">
              Enter
            </kbd>
            <span className="hidden sm:inline text-slate-500">{t.prompt.quickRestart}</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
