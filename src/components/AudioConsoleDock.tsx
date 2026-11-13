import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronUp,
  Disc3,
  Pause,
  Play,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { MUSIC_TRACKS, TRACK_LIST } from '../audio/musicTracks'
import { AudioUiSnapshot, soundEngine } from '../audio/soundEngine'
import { UI_STRINGS } from '../constants/i18n'
import { AccentTheme, MusicTrackId, SynthStemId, UiLanguage } from '../types/typing'

interface AudioConsoleDockProps {
  uiLang: UiLanguage
  audioState: AudioUiSnapshot
  accent: AccentTheme
  onSelectTrack: (trackId: MusicTrackId) => void
  onTogglePlay: () => void
  onVolumeChange: (val: number) => void
  onToggleStem: (stem: SynthStemId) => void
  onToggleChimes: () => void
  onToggleMute: () => void
}

const STEM_IDS: SynthStemId[] = ['drums', 'bass', 'pad', 'lead']

export const AudioConsoleDock: React.FC<AudioConsoleDockProps> = ({
  uiLang,
  audioState,
  accent,
  onSelectTrack,
  onTogglePlay,
  onVolumeChange,
  onToggleStem,
  onToggleChimes,
  onToggleMute,
}) => {
  const t = UI_STRINGS[uiLang]
  const [drawerOpen, setDrawerOpen] = useState(false)
  const trackMeta = MUSIC_TRACKS[audioState.trackId]

  const blurAfterClick = (fn: () => void) => (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur()
    soundEngine.unlockFromGesture()
    fn()
  }

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-5 z-20 flex flex-col items-end pointer-events-none">
      {/* Compact Expandable Track / Volume / Stems Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            className="mb-2 w-72 rounded-2xl border border-white/[0.1] bg-slate-950/90 p-3 backdrop-blur-2xl shadow-[0_18px_48px_-12px_rgba(0,0,0,0.9)] pointer-events-auto"
          >
            {/* 4 Tracks */}
            <div className="grid grid-cols-2 gap-1">
              {TRACK_LIST.map((trackId) => {
                const active = audioState.trackId === trackId
                const meta = MUSIC_TRACKS[trackId]
                return (
                  <button
                    key={trackId}
                    type="button"
                    title={t.tracks[trackId].full}
                    onClick={blurAfterClick(() => onSelectTrack(trackId))}
                    className={`flex items-center justify-between rounded-xl border px-2.5 py-1.5 text-left text-[11px] font-medium transition-colors cursor-pointer ${
                      active
                        ? 'text-slate-100'
                        : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                    }`}
                    style={
                      active
                        ? {
                            borderColor: accent.borderRgba,
                            backgroundColor: accent.softBgRgba,
                            color: accent.hex,
                          }
                        : undefined
                    }
                  >
                    <span className="truncate">{t.tracks[trackId].short}</span>
                    <span className="ml-1 font-mono text-[9px] text-slate-500">{meta.bpm}</span>
                  </button>
                )
              })}
            </div>

            {/* Volume + Stems */}
            <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/[0.07] pt-2.5">
              <span className="text-[10px] font-medium text-slate-400">{t.audio.volume}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={audioState.isMuted ? 0 : Math.round(audioState.musicVolume * 100)}
                aria-label={t.audio.volume}
                onChange={(e) => {
                  soundEngine.unlockFromGesture()
                  const nextVol = Number(e.target.value) / 100
                  if (audioState.isMuted && nextVol > 0) {
                    soundEngine.toggleMute()
                  }
                  onVolumeChange(nextVol)
                }}
                onPointerUp={(e) => e.currentTarget.blur()}
                onKeyUp={(e) => e.currentTarget.blur()}
                className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/15"
                style={{ accentColor: accent.hex }}
              />
              <span className="w-7 text-right font-mono text-[10px] tabular-nums text-slate-400">
                {audioState.isMuted ? 0 : Math.round(audioState.musicVolume * 100)}%
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between gap-1 border-t border-white/[0.07] pt-2">
              <span className="text-[10px] text-slate-500">{t.audio.stemsTooltip}</span>
              <div className="flex items-center gap-1">
                {STEM_IDS.map((stem) => {
                  const active = audioState.stems[stem]
                  return (
                    <button
                      key={stem}
                      type="button"
                      onClick={blurAfterClick(() => onToggleStem(stem))}
                      className={`rounded-lg border px-1.5 py-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
                        active
                          ? 'text-slate-100'
                          : 'border-white/[0.06] bg-white/[0.02] text-slate-500 hover:text-slate-300'
                      }`}
                      style={
                        active
                          ? {
                              borderColor: accent.borderRgba,
                              backgroundColor: accent.softBgRgba,
                              color: accent.hex,
                            }
                          : undefined
                      }
                    >
                      {t.stems[stem]}
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slim Bottom-Right Ambient Synth Pill (keeps center screen 100% open for typing & 3D matrix) */}
      <div
        role="region"
        aria-label="Ambient synth music controls"
        className="flex items-center gap-1 rounded-2xl border border-white/[0.09] bg-slate-950/65 px-2 py-1 backdrop-blur-xl shadow-[0_12px_36px_-10px_rgba(0,0,0,0.8)] pointer-events-auto"
      >
        <button
          type="button"
          title={audioState.isPlaying ? t.audio.pause : t.audio.play}
          onClick={blurAfterClick(onTogglePlay)}
          className="flex items-center gap-1.5 rounded-xl px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer hover:bg-white/[0.07]"
          style={
            audioState.isPlaying && !audioState.isMuted
              ? { color: accent.hex, backgroundColor: accent.softBgRgba }
              : { color: '#94a3b8' }
          }
        >
          {audioState.isPlaying ? (
            <Pause className="h-3.5 w-3.5 fill-current" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current" />
          )}
          {audioState.isPlaying && !audioState.isMuted ? (
            <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
              <span
                className="w-[2px] rounded-full animate-eq-bar-1"
                style={{ backgroundColor: accent.hex }}
              />
              <span
                className="w-[2px] rounded-full animate-eq-bar-2"
                style={{ backgroundColor: accent.hex }}
              />
              <span
                className="w-[2px] rounded-full animate-eq-bar-3"
                style={{ backgroundColor: accent.hex }}
              />
            </span>
          ) : (
            !audioState.audioReady && (
              <span className="text-[11px] text-slate-300">{t.audio.launchPrompt}</span>
            )
          )}
        </button>

        {/* Track Selector / Compact Drawer Toggle */}
        <button
          type="button"
          title={trackMeta.bpm ? t.tracks[audioState.trackId].full : ''}
          onClick={blurAfterClick(() => setDrawerOpen((o) => !o))}
          className="flex items-center gap-1.5 rounded-xl px-2 py-1 text-[11px] font-medium text-slate-300 transition-colors hover:bg-white/[0.07] cursor-pointer"
        >
          <Disc3
            className={`h-3.5 w-3.5 ${
              audioState.isPlaying && !audioState.isMuted ? 'animate-spin' : ''
            }`}
            style={{
              animationDuration: '4.2s',
              color: accent.hex,
            }}
          />
          <span>{t.tracks[audioState.trackId].short}</span>
          <ChevronUp
            className={`h-3 w-3 text-slate-500 transition-transform duration-150 ${
              drawerOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        <div className="h-3.5 w-px bg-white/10" />

        {/* Holo Key Chimes Toggle */}
        <button
          type="button"
          title={audioState.keyChimesEnabled ? t.audio.chimesOn : t.audio.chimesOff}
          aria-label={audioState.keyChimesEnabled ? t.audio.chimesOn : t.audio.chimesOff}
          onClick={blurAfterClick(onToggleChimes)}
          className="rounded-xl p-1.5 transition-colors cursor-pointer hover:bg-white/[0.07]"
          style={{
            color:
              audioState.keyChimesEnabled && !audioState.isMuted ? accent.hex : '#64748b',
          }}
        >
          <Sparkles className="h-3.5 w-3.5" />
        </button>

        {/* Master Mute */}
        <button
          type="button"
          title={audioState.isMuted ? t.audio.unmute : t.audio.mute}
          aria-label={audioState.isMuted ? t.audio.unmute : t.audio.mute}
          onClick={blurAfterClick(onToggleMute)}
          className="rounded-xl p-1.5 text-slate-400 hover:bg-white/[0.07] hover:text-slate-100 transition-colors cursor-pointer"
        >
          {audioState.isMuted || audioState.musicVolume === 0 ? (
            <VolumeX className="h-3.5 w-3.5 text-rose-400" />
          ) : (
            <Volume2 className="h-3.5 w-3.5" style={{ color: accent.hex }} />
          )}
        </button>
      </div>
    </div>
  )
}
