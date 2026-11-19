import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FileText, Sparkles, X } from 'lucide-react'
import { UI_STRINGS } from '../constants/i18n'
import { AccentTheme, UiLanguage } from '../types/typing'

interface CustomPassageModalProps {
  isOpen: boolean
  uiLang: UiLanguage
  initialText: string
  accent: AccentTheme
  onClose: () => void
  onApply: (text: string) => void
}

const SAMPLE_EN =
  'Focus is not about rushing ahead; it is the quiet art of noticing each word as it forms beneath your hands. Take a slow breath, let your wrists stay relaxed, and allow speed to grow naturally from accuracy.'

const SAMPLE_ZH =
  '真正的专注并不靠紧张的加速来维持，而是让双手保持轻盈与节奏。视线顺着句子自然向前延伸，不必反复担心误触，流畅的韵律自会在指尖悄然浮现。'

export const CustomPassageModal: React.FC<CustomPassageModalProps> = ({
  isOpen,
  uiLang,
  initialText,
  accent,
  onClose,
  onApply,
}) => {
  const t = UI_STRINGS[uiLang]
  const [draft, setDraft] = useState(initialText)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      setDraft(initialText)
      window.setTimeout(() => {
        textareaRef.current?.focus()
        textareaRef.current?.select()
      }, 40)
    }
  }, [initialText, isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && draft.trim()) {
        e.preventDefault()
        onApply(draft)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [draft, isOpen, onApply, onClose])

  const hasCjk = useMemo(() => /[\u4e00-\u9fff]/.test(draft), [draft])
  const trimmedLen = useMemo(() => draft.trim().length, [draft])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/[0.12] bg-slate-950/90 p-6 shadow-[0_28px_72px_-16px_rgba(0,0,0,0.92)] backdrop-blur-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-2xl border"
                  style={{
                    borderColor: accent.borderRgba,
                    backgroundColor: accent.softBgRgba,
                    color: accent.hex,
                  }}
                >
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-100">{t.customModal.title}</h2>
                  <p className="mt-0.5 text-xs text-slate-400">{t.customModal.subtitle}</p>
                </div>
              </div>

              <button
                type="button"
                aria-label={t.customModal.cancel}
                onClick={onClose}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-white/[0.06] hover:text-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              placeholder={t.customModal.placeholder}
              className="mt-4 w-full resize-none rounded-2xl border border-white/[0.1] bg-slate-900/75 p-4 font-mono text-sm leading-relaxed text-slate-100 placeholder:text-slate-500 focus:border-white/25 focus:outline-none"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px]"
                  style={{
                    borderColor: accent.borderRgba,
                    backgroundColor: accent.softBgRgba,
                    color: accent.hex,
                  }}
                >
                  <Sparkles className="h-3 w-3" />
                  {hasCjk ? t.customModal.detectedZh : t.customModal.detectedEn}
                </span>
                <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                  {trimmedLen} {t.customModal.charsUnit}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDraft(SAMPLE_ZH)}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-300 hover:bg-white/[0.08] transition-colors cursor-pointer"
                >
                  {t.customModal.fillSampleZh}
                </button>
                <button
                  type="button"
                  onClick={() => setDraft(SAMPLE_EN)}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] text-slate-300 hover:bg-white/[0.08] transition-colors cursor-pointer"
                >
                  {t.customModal.fillSampleEn}
                </button>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-white/[0.08] pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                {t.customModal.cancel}
              </button>
              <button
                type="button"
                disabled={trimmedLen === 0}
                onClick={() => onApply(draft)}
                className="rounded-xl border px-4 py-2 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer"
                style={{
                  borderColor: accent.borderRgba,
                  backgroundColor: accent.softBgRgba,
                  color: accent.hex,
                  boxShadow: trimmedLen > 0 ? `0 0 22px -6px ${accent.glowRgba}` : 'none',
                }}
              >
                {t.customModal.apply}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
