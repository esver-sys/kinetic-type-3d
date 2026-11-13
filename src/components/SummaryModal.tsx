import React, { useMemo, useRef } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from 'framer-motion'
import { Activity, Flame, RotateCcw, Sparkles, Target } from 'lucide-react'
import { soundEngine } from '../audio/soundEngine'
import { UI_STRINGS } from '../constants/i18n'
import { AccentTheme, TestSummary, UiLanguage } from '../types/typing'

interface SummaryModalProps {
  uiLang: UiLanguage
  summary: TestSummary | null
  accent: AccentTheme
  tabArmed: boolean
  onRestart: () => void
}

export const SummaryModal: React.FC<SummaryModalProps> = ({
  uiLang,
  summary,
  accent,
  tabArmed,
  onRestart,
}) => {
  const t = UI_STRINGS[uiLang]
  const cardRef = useRef<HTMLDivElement>(null)

  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const glareX = useMotionValue(50)
  const glareY = useMotionValue(30)

  const rotateX = useSpring(rawX, { stiffness: 260, damping: 24 })
  const rotateY = useSpring(rawY, { stiffness: 260, damping: 24 })
  const smoothGlareX = useSpring(glareX, { stiffness: 220, damping: 26 })
  const smoothGlareY = useSpring(glareY, { stiffness: 220, damping: 26 })

  const glareBg = useMotionTemplate`radial-gradient(420px circle at ${smoothGlareX}% ${smoothGlareY}%, rgba(255,255,255,0.12), transparent 65%)`

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    rawY.set((px - 0.5) * 16)
    rawX.set((0.5 - py) * 14)
    glareX.set(px * 100)
    glareY.set(py * 100)
  }

  const handleMouseLeave = () => {
    rawX.set(0)
    rawY.set(0)
    glareX.set(50)
    glareY.set(30)
  }

  const sparkline = useMemo(() => {
    if (!summary || summary.samples.length === 0) return null
    const rawPts =
      summary.samples.length === 1
        ? [summary.samples[0], summary.samples[0]]
        : summary.samples
    const smoothedWpm = rawPts.map((_, idx) => {
      const start = Math.max(0, idx - 1)
      const end = Math.min(rawPts.length - 1, idx + 1)
      let sum = 0
      for (let j = start; j <= end; j++) {
        sum += rawPts[j].wpm
      }
      return sum / (end - start + 1)
    })

    const maxWpm = Math.max(30, ...smoothedWpm)
    const width = 360
    const height = 64
    const padY = 8

    const coords = smoothedWpm.map((val, idx) => {
      const x = (idx / Math.max(1, smoothedWpm.length - 1)) * width
      const y = height - padY - (val / maxWpm) * (height - padY * 2)
      return { x, y }
    })

    let linePath = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`
    if (coords.length === 2) {
      linePath += ` L ${coords[1].x.toFixed(1)} ${coords[1].y.toFixed(1)}`
    } else {
      for (let i = 1; i < coords.length - 1; i++) {
        const midX = (coords[i].x + coords[i + 1].x) / 2
        const midY = (coords[i].y + coords[i + 1].y) / 2
        linePath += ` Q ${coords[i].x.toFixed(1)} ${coords[i].y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`
      }
      const last = coords[coords.length - 1]
      linePath += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`
    }

    const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`

    return { linePath, areaPath, width, height }
  }, [summary])

  return (
    <AnimatePresence>
      {summary && (
        <motion.div
          key="summary-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md"
          style={{ perspective: 1200 }}
        >
          <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, scale: 0.9, y: 24, rotateX: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            style={{
              rotateX,
              rotateY,
              transformStyle: 'preserve-3d',
              borderColor: accent.borderRgba,
              boxShadow: `0 32px 80px -16px rgba(0,0,0,0.85), 0 0 60px -18px ${accent.glowRgba}`,
            }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border bg-slate-900/80 p-6 sm:p-8 backdrop-blur-2xl"
          >
            {/* Dynamic Interactive Specular Sheen */}
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-10"
              style={{ background: glareBg }}
            />

            {/* Top Specular Edge */}
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            <div className="relative z-20" style={{ transform: 'translateZ(20px)' }}>
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" style={{ color: accent.hex }} />
                  <span className="text-xs font-semibold tracking-[0.2em] text-slate-300 uppercase">
                    {t.summary.sessionComplete}
                  </span>
                </div>
                <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 font-mono text-[11px] text-slate-300">
                  {summary.modeLabel} · {summary.elapsedSeconds}s
                </span>
              </div>

              {/* Hero WPM/CPM + Secondary Metrics Grid */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="col-span-3 sm:col-span-1 flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                  <span className="text-[11px] font-medium tracking-widest text-slate-400 uppercase">
                    {summary.speedUnit === 'CPM' ? t.summary.netCpm : t.summary.netWpm}
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span
                      className="font-mono text-4xl font-bold tabular-nums tracking-tight"
                      style={{
                        color: accent.hex,
                        textShadow: `0 0 24px ${accent.glowRgba}`,
                      }}
                    >
                      {summary.wpm}
                    </span>
                  </div>
                  <span className="mt-1 font-mono text-[11px] text-slate-500">
                    {t.summary.raw} {summary.rawWpm}
                  </span>
                </div>

                <div className="col-span-3 sm:col-span-2 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-widest text-slate-400 uppercase">
                      <Target className="h-3.5 w-3.5 text-slate-500" />
                      {t.summary.accuracy}
                    </div>
                    <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-100">
                      {summary.accuracy}
                      <span className="text-sm text-slate-500">%</span>
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-slate-500">
                      {summary.correctChars} {t.summary.ok} / {summary.incorrectChars} {t.summary.err}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-widest text-slate-400 uppercase">
                      <Activity className="h-3.5 w-3.5 text-slate-500" />
                      {t.summary.consistency}
                    </div>
                    <div className="mt-2 font-mono text-2xl font-semibold tabular-nums text-slate-100">
                      {summary.consistency}
                      <span className="text-sm text-slate-500">%</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 font-mono text-[11px] text-slate-400">
                      <Flame className="h-3 w-3" style={{ color: accent.hex }} />
                      {t.summary.peak} {summary.maxCombo}x
                    </div>
                  </div>
                </div>
              </div>

              {/* Velocity Sparkline */}
              {sparkline && (
                <div className="mt-4 rounded-2xl border border-white/[0.06] bg-slate-950/50 px-4 pt-3 pb-2">
                  <div className="mb-1 flex items-center justify-between text-[10px] font-medium tracking-widest text-slate-500 uppercase">
                    <span>{t.summary.velocityCurve}</span>
                    <span className="font-mono">
                      {summary.totalKeystrokes} {t.summary.keystrokes}
                    </span>
                  </div>
                  <svg
                    viewBox={`0 0 ${sparkline.width} ${sparkline.height}`}
                    className="h-14 w-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={accent.hex} stopOpacity="0.35" />
                        <stop offset="100%" stopColor={accent.hex} stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d={sparkline.areaPath} fill="url(#sparkFill)" />
                    <path
                      d={sparkline.linePath}
                      fill="none"
                      stroke={accent.hex}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}

              {/* Actions & Tab + Enter Quick Restart */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
                  <kbd
                    className="rounded-lg border px-2 py-1 text-[11px] transition-colors"
                    style={{
                      borderColor: tabArmed ? accent.borderRgba : 'rgba(255,255,255,0.12)',
                      backgroundColor: tabArmed ? accent.softBgRgba : 'rgba(255,255,255,0.04)',
                      color: tabArmed ? accent.hex : '#e2e8f0',
                    }}
                  >
                    Tab
                  </kbd>
                  <span>+</span>
                  <kbd className="rounded-lg border border-white/12 bg-white/[0.04] px-2 py-1 text-[11px] text-slate-200">
                    Enter
                  </kbd>
                  <span className="ml-1 text-[11px] text-slate-500">
                    {tabArmed ? t.summary.pressEnterNow : t.summary.quickRestart}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.blur()
                    soundEngine.unlock()
                    onRestart()
                  }}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-950 transition-transform active:scale-95 cursor-pointer"
                  style={{
                    backgroundColor: accent.hex,
                    boxShadow: `0 0 24px -4px ${accent.hex}`,
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  {t.summary.runAgain}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
