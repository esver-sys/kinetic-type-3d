import React from 'react'
import { motion } from 'framer-motion'
import { Flame, Gauge, Target, Timer } from 'lucide-react'
import { UI_STRINGS } from '../constants/i18n'
import {
  AccentTheme,
  ChineseProsePassage,
  ChineseSubMode,
  CodeSnippet,
  EnglishPassage,
  PassageSubMode,
  PracticeMode,
  UiLanguage,
} from '../types/typing'
import { TestStatus } from '../hooks/useTypingEngine'

interface LiveHudProps {
  uiLang: UiLanguage
  mode: PracticeMode
  passageSubMode: PassageSubMode
  chineseSubMode: ChineseSubMode
  status: TestStatus
  wpm: number
  speedUnit: 'WPM' | 'CPM'
  accuracy: number
  combo: number
  timeLeft: number
  timeTotal: number
  wordsDone: number
  wordsTotal: number
  codeProgress: number
  activeEnglishPassage: EnglishPassage
  activeSnippet: CodeSnippet
  activeProse: ChineseProsePassage
  accent: AccentTheme
}

export const LiveHud: React.FC<LiveHudProps> = ({
  uiLang,
  mode,
  passageSubMode,
  chineseSubMode,
  status,
  wpm,
  speedUnit,
  accuracy,
  combo,
  timeLeft,
  timeTotal,
  wordsDone,
  wordsTotal,
  codeProgress,
  activeEnglishPassage,
  activeSnippet,
  activeProse,
  accent,
}) => {
  const t = UI_STRINGS[uiLang]
  const isHotCombo = combo >= 20
  const progressPct =
    mode === 'time'
      ? Math.max(0, Math.min(100, ((timeTotal - timeLeft) / Math.max(1, timeTotal)) * 100))
      : mode === 'words'
        ? Math.max(0, Math.min(100, (wordsDone / Math.max(1, wordsTotal)) * 100))
        : codeProgress

  const speedLabel = speedUnit === 'CPM' ? t.hud.cpm : t.hud.wpm

  return (
    <div className="mx-auto mb-3 flex w-full max-w-4xl flex-col gap-2 px-4 pointer-events-none select-none">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        {/* Left Metric Cluster: WPM/CPM, Accuracy, Combo */}
        <div className="flex items-center gap-5 sm:gap-7">
          <div className="flex items-baseline gap-2">
            <Gauge className="h-3.5 w-3.5 self-center text-slate-500" />
            <span
              className="font-mono text-2xl font-semibold tabular-nums tracking-tight transition-colors duration-200"
              style={{ color: status === 'running' && wpm > 0 ? accent.hex : '#e2e8f0' }}
            >
              {wpm}
            </span>
            <span className="text-[11px] font-medium tracking-widest text-slate-500 uppercase">
              {speedLabel}
            </span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-baseline gap-2">
            <Target className="h-3.5 w-3.5 self-center text-slate-500" />
            <span className="font-mono text-xl font-medium tabular-nums text-slate-200">
              {accuracy}
              <span className="text-sm text-slate-500">%</span>
            </span>
            <span className="text-[11px] font-medium tracking-widest text-slate-500 uppercase">
              {t.hud.acc}
            </span>
          </div>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-baseline gap-2">
            <Flame
              className="h-3.5 w-3.5 self-center transition-colors duration-200"
              style={{ color: isHotCombo ? accent.hex : '#64748b' }}
            />
            <motion.span
              key={combo}
              initial={combo > 0 ? { scale: 1.18 } : false}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 520, damping: 24 }}
              className="font-mono text-xl font-medium tabular-nums transition-colors"
              style={{
                color: isHotCombo ? accent.hex : combo > 0 ? '#f1f5f9' : '#64748b',
                textShadow: isHotCombo ? `0 0 14px ${accent.glowRgba}` : 'none',
              }}
            >
              {combo}x
            </motion.span>
            <span className="text-[11px] font-medium tracking-widest text-slate-500 uppercase">
              {t.hud.combo}
            </span>
          </div>
        </div>

        {/* Right Progress Indicator */}
        <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-slate-950/45 px-3 py-1 backdrop-blur-md">
          <Timer className="h-3.5 w-3.5" style={{ color: accent.hex }} />
          {mode === 'passage' && (
            <span className="font-mono text-xs font-medium text-slate-300">
              {passageSubMode === 'en'
                ? activeEnglishPassage.title
                : passageSubMode === 'custom'
                  ? t.passageSubModes.custom
                  : activeProse.title}{' '}
              <span className="text-slate-500 tabular-nums">· {codeProgress}%</span>
            </span>
          )}
          {mode === 'time' && (
            <span className="font-mono text-sm font-medium tabular-nums text-slate-200">
              {timeLeft}s
            </span>
          )}
          {mode === 'words' && (
            <span className="font-mono text-sm font-medium tabular-nums text-slate-200">
              {wordsDone}
              <span className="text-slate-500">/{wordsTotal}</span>
            </span>
          )}
          {mode === 'code' && (
            <span className="font-mono text-xs font-medium text-slate-300">
              {activeSnippet.title}{' '}
              <span className="text-slate-500 tabular-nums">· {codeProgress}%</span>
            </span>
          )}
          {mode === 'chinese' && (
            <span className="font-mono text-xs font-medium text-slate-300">
              {chineseSubMode === 'prose'
                ? activeProse.title
                : t.chineseSubModes[chineseSubMode]}{' '}
              <span className="text-slate-500 tabular-nums">· {codeProgress}%</span>
            </span>
          )}
        </div>
      </div>

      {/* Ultra-thin Accent Progress Hairline */}
      <div className="h-[2px] w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-all duration-150 ease-out"
          style={{
            width: `${progressPct}%`,
            backgroundColor: accent.hex,
            boxShadow: `0 0 10px ${accent.hex}`,
          }}
        />
      </div>
    </div>
  )
}
