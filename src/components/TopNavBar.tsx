import React from 'react'
import { motion } from 'framer-motion'
import {
  Clock,
  Code2,
  Hash,
  Languages,
  RotateCcw,
  Shuffle,
} from 'lucide-react'
import { soundEngine } from '../audio/soundEngine'
import { UI_STRINGS } from '../constants/i18n'
import { CODE_LANGUAGES } from '../constants/prompts'
import { ACCENT_LIST } from '../constants/themes'
import {
  AccentId,
  AccentTheme,
  ChineseSubMode,
  CodeLanguage,
  PracticeMode,
  TimeOption,
  UiLanguage,
  WordsOption,
} from '../types/typing'

interface TopNavBarProps {
  uiLang: UiLanguage
  mode: PracticeMode
  timeOption: TimeOption
  wordsOption: WordsOption
  codeLanguage: CodeLanguage
  chineseSubMode: ChineseSubMode
  accent: AccentTheme
  onToggleUiLang: (lang: UiLanguage) => void
  onSelectMode: (mode: PracticeMode) => void
  onSelectTime: (t: TimeOption) => void
  onSelectWords: (w: WordsOption) => void
  onSelectCodeLang: (lang: CodeLanguage) => void
  onSelectChineseSubMode: (sub: ChineseSubMode) => void
  onShufflePrompt: () => void
  onSelectAccent: (id: AccentId) => void
  onRestart: () => void
}

const SPRING_TRANSITION = {
  type: 'spring' as const,
  stiffness: 460,
  damping: 32,
  mass: 0.8,
}

const TIME_OPTIONS: TimeOption[] = [15, 30, 60]
const WORDS_OPTIONS: WordsOption[] = [10, 25, 50]
const CHINESE_SUB_MODES: ChineseSubMode[] = ['phrases', 'prose', 'pinyin']

export const TopNavBar: React.FC<TopNavBarProps> = ({
  uiLang,
  mode,
  timeOption,
  wordsOption,
  codeLanguage,
  chineseSubMode,
  accent,
  onToggleUiLang,
  onSelectMode,
  onSelectTime,
  onSelectWords,
  onSelectCodeLang,
  onSelectChineseSubMode,
  onShufflePrompt,
  onSelectAccent,
  onRestart,
}) => {
  const t = UI_STRINGS[uiLang]

  const blurAfterClick = (fn: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur()
    soundEngine.unlockFromGesture()
    fn()
  }

  return (
    <header className="relative z-20 w-full px-3 pt-3 sm:px-5 sm:pt-4 pointer-events-none">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 pointer-events-auto">
        {/* Left: Brand Identity + UI Language Toggle */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-slate-950/60 px-3 py-1.5 backdrop-blur-xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.75)]">
            <span
              className="relative flex h-2.5 w-2.5 items-center justify-center rounded-full"
              style={{
                backgroundColor: accent.hex,
                boxShadow: `0 0 12px ${accent.hex}`,
              }}
            >
              <span
                className="absolute inset-0 rounded-full animate-ping opacity-45"
                style={{ backgroundColor: accent.hex }}
              />
            </span>
            <span className="font-mono text-xs font-semibold tracking-[0.2em] text-slate-100">
              KINETIC
            </span>
            <span className="hidden lg:inline font-mono text-[9px] tracking-[0.18em] text-slate-500">
              {t.brand.subtitle}
            </span>
          </div>

          <div
            role="group"
            aria-label="Interface language"
            className="flex items-center gap-0.5 rounded-2xl border border-white/[0.08] bg-slate-950/60 p-1 backdrop-blur-xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.7)]"
          >
            {(['en', 'zh'] as const).map((lang) => {
              const active = uiLang === lang
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={blurAfterClick(() => onToggleUiLang(lang))}
                  className={`relative rounded-xl px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                    active ? 'text-slate-100' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="active-uilang-pill"
                      transition={SPRING_TRANSITION}
                      className="absolute inset-0 rounded-xl bg-white/[0.09] border border-white/10"
                    />
                  )}
                  <span className="relative z-10">{lang === 'en' ? 'EN' : '中文'}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Center: Practice Mode & Sub-Option Glass Pill */}
        <nav
          aria-label="Practice mode configuration"
          className="flex flex-wrap items-center gap-0.5 rounded-2xl border border-white/[0.08] bg-slate-950/60 p-1 backdrop-blur-xl shadow-[0_12px_36px_-10px_rgba(0,0,0,0.75)]"
        >
          <div className="flex items-center gap-0.5">
            {(
              [
                { id: 'time', label: t.modes.time, Icon: Clock },
                { id: 'words', label: t.modes.words, Icon: Hash },
                { id: 'code', label: t.modes.code, Icon: Code2 },
                { id: 'chinese', label: t.modes.chinese, Icon: Languages },
              ] as const
            ).map(({ id, label, Icon }) => {
              const active = mode === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={blurAfterClick(() => onSelectMode(id))}
                  className={`relative flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    active ? 'text-slate-100' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="active-mode-pill"
                      transition={SPRING_TRANSITION}
                      className="absolute inset-0 rounded-xl border"
                      style={{
                        backgroundColor: accent.softBgRgba,
                        borderColor: accent.borderRgba,
                      }}
                    />
                  )}
                  <Icon
                    className="relative z-10 h-3.5 w-3.5 transition-colors"
                    style={active ? { color: accent.hex } : undefined}
                  />
                  <span className="relative z-10">{label}</span>
                </button>
              )
            })}
          </div>

          <div className="mx-1 h-4 w-px bg-white/10" />

          {/* Contextual Sub-Options */}
          <div className="flex items-center gap-0.5">
            {mode === 'time' &&
              TIME_OPTIONS.map((sec) => {
                const active = timeOption === sec
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={blurAfterClick(() => onSelectTime(sec))}
                    className={`relative rounded-xl px-2 py-1.5 font-mono text-xs transition-colors cursor-pointer ${
                      active ? 'text-slate-100' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="active-sub-pill"
                        transition={SPRING_TRANSITION}
                        className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/10"
                      />
                    )}
                    <span className="relative z-10">{sec}s</span>
                  </button>
                )
              })}

            {mode === 'words' &&
              WORDS_OPTIONS.map((w) => {
                const active = wordsOption === w
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={blurAfterClick(() => onSelectWords(w))}
                    className={`relative rounded-xl px-2 py-1.5 font-mono text-xs transition-colors cursor-pointer ${
                      active ? 'text-slate-100' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="active-sub-pill"
                        transition={SPRING_TRANSITION}
                        className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/10"
                      />
                    )}
                    <span className="relative z-10">{w}</span>
                  </button>
                )
              })}

            {mode === 'code' && (
              <>
                {CODE_LANGUAGES.map((lang) => {
                  const active = codeLanguage === lang.id
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={blurAfterClick(() => onSelectCodeLang(lang.id))}
                      className={`relative rounded-xl px-2 py-1.5 font-mono text-xs transition-colors cursor-pointer ${
                        active ? 'text-slate-100' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="active-sub-pill"
                          transition={SPRING_TRANSITION}
                          className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/10"
                        />
                      )}
                      <span className="relative z-10">{lang.label}</span>
                    </button>
                  )
                })}
                <button
                  type="button"
                  title={t.prompt.nextSnippet}
                  onClick={blurAfterClick(onShufflePrompt)}
                  className="ml-0.5 rounded-xl p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-slate-100 transition-colors cursor-pointer"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                </button>
              </>
            )}

            {mode === 'chinese' && (
              <>
                {CHINESE_SUB_MODES.map((sub) => {
                  const active = chineseSubMode === sub
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={blurAfterClick(() => onSelectChineseSubMode(sub))}
                      className={`relative rounded-xl px-2 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                        active ? 'text-slate-100' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="active-sub-pill"
                          transition={SPRING_TRANSITION}
                          className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/10"
                        />
                      )}
                      <span className="relative z-10">{t.chineseSubModes[sub]}</span>
                    </button>
                  )
                })}
                <button
                  type="button"
                  title={t.prompt.nextSnippet}
                  onClick={blurAfterClick(onShufflePrompt)}
                  className="ml-0.5 rounded-xl p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-slate-100 transition-colors cursor-pointer"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>

          <div className="mx-1 h-4 w-px bg-white/10" />

          <button
            type="button"
            title={t.prompt.restartTooltip}
            onClick={blurAfterClick(onRestart)}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-slate-100 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </nav>

        {/* Right: Accent Color Swatches */}
        <div
          role="group"
          aria-label="Accent color theme"
          className="flex items-center gap-1.5 rounded-2xl border border-white/[0.08] bg-slate-950/60 px-2.5 py-2 backdrop-blur-xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.7)]"
        >
          {ACCENT_LIST.map((theme) => {
            const active = theme.id === accent.id
            const label = t.accents[theme.id]
            return (
              <button
                key={theme.id}
                type="button"
                title={label}
                aria-label={label}
                onClick={blurAfterClick(() => onSelectAccent(theme.id))}
                className="relative flex h-4 w-4 items-center justify-center rounded-full cursor-pointer transition-transform hover:scale-110"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full transition-transform"
                  style={{
                    backgroundColor: theme.hex,
                    boxShadow: active ? `0 0 10px ${theme.hex}` : 'none',
                  }}
                />
                {active && (
                  <motion.span
                    layoutId="active-accent-ring"
                    transition={SPRING_TRANSITION}
                    className="absolute inset-0 rounded-full border"
                    style={{ borderColor: theme.hex }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </header>
  )
}
