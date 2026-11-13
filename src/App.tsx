import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { soundEngine } from './audio/soundEngine'
import { ACCENT_THEMES } from './constants/themes'
import { useTelemetryPulse } from './hooks/useTelemetryPulse'
import { useTypingEngine } from './hooks/useTypingEngine'
import { AccentId, UiLanguage } from './types/typing'
import { TopNavBar } from './components/TopNavBar'
import { LiveHud } from './components/LiveHud'
import { TypingPrompt } from './components/TypingPrompt'
import { SciFi3DScene } from './components/SciFi3DScene'
import { AudioConsoleDock } from './components/AudioConsoleDock'
import { SummaryModal } from './components/SummaryModal'
import { WebGLErrorBoundary } from './components/ErrorBoundary'

export const App: React.FC = () => {
  const [uiLang, setUiLang] = useState<UiLanguage>('zh')
  const [accentId, setAccentId] = useState<AccentId>('cyan')

  const audioState = useSyncExternalStore(
    soundEngine.subscribe,
    soundEngine.getSnapshot,
    soundEngine.getSnapshot,
  )

  const accent = ACCENT_THEMES[accentId]
  const streakIntensityRef = useRef(0)

  const { telemetryRef, triggerPulse, setKeyDown, releaseAllKeys, setExpectedCodes } =
    useTelemetryPulse()

  // Unlock procedural Web Audio playback smoothly on first pointer interaction anywhere
  useEffect(() => {
    const handleFirstPointer = () => {
      soundEngine.unlockFromGesture()
    }
    window.addEventListener('pointerdown', handleFirstPointer, { passive: true })
    return () => window.removeEventListener('pointerdown', handleFirstPointer)
  }, [])

  const {
    mode,
    timeOption,
    wordsOption,
    codeLanguage,
    chineseSubMode,
    activeSnippet,
    activeProse,
    pinyinHanziMap,
    chars,
    cursor,
    status,
    wpm,
    speedUnit,
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
  } = useTypingEngine({
    triggerPulse,
    setKeyDown,
    releaseAllKeys,
    setExpectedCodes,
    streakIntensityRef,
  })

  const handleCoreClick = useCallback(
    (code?: string) => {
      soundEngine.unlockFromGesture()
      triggerPulse(code ?? 'MatrixDeck', false, code ? 1.1 : 1.25)
      if (!code) {
        soundEngine.playHoloBurst()
      }
      focusImeIfNeeded()
    },
    [focusImeIfNeeded, triggerPulse],
  )

  const wordsDone = useMemo(() => {
    if (mode !== 'words') return 0
    if (cursor >= chars.length) return wordsOption
    let spaces = 0
    for (let i = 0; i < cursor && i < chars.length; i++) {
      if (chars[i].char === ' ') spaces++
    }
    return Math.min(wordsOption, spaces)
  }, [chars, cursor, mode, wordsOption])

  const codeProgress = useMemo(() => {
    if ((mode !== 'code' && mode !== 'chinese') || chars.length === 0) return 0
    return Math.min(100, Math.round((cursor / chars.length) * 100))
  }, [chars.length, cursor, mode])

  return (
    <div className="relative flex h-dvh w-screen flex-col overflow-hidden bg-[#05070c] text-slate-100">
      {/* Deep Space Ambient & Radial Holographic Lighting */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-700"
        style={{
          background: `
            radial-gradient(65% 45% at 50% 16%, ${accent.softBgRgba}, transparent 72%),
            radial-gradient(75% 46% at 50% 84%, ${accent.softBgRgba}, transparent 76%),
            radial-gradient(120% 90% at 50% 50%, transparent 42%, rgba(2, 4, 10, 0.88) 100%)
          `,
        }}
      />

      {/* Faint Sci-Fi Coordinates Micro-Grid Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 45%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 45%, black, transparent)',
        }}
      />

      {/* Full-Viewport Sci-Fi 3D Quantum Core & Live Audio Spectrum Stage */}
      <WebGLErrorBoundary>
        <SciFi3DScene
          accent={accent}
          telemetryRef={telemetryRef}
          streakIntensityRef={streakIntensityRef}
          onCoreClick={handleCoreClick}
        />
      </WebGLErrorBoundary>

      {/* Clean Single-Row Top Glassmorphic Control Bar */}
      <TopNavBar
        uiLang={uiLang}
        mode={mode}
        timeOption={timeOption}
        wordsOption={wordsOption}
        codeLanguage={codeLanguage}
        chineseSubMode={chineseSubMode}
        accent={accent}
        onToggleUiLang={setUiLang}
        onSelectMode={(nextMode) => resetTest({ mode: nextMode })}
        onSelectTime={(t) => resetTest({ mode: 'time', timeOption: t })}
        onSelectWords={(w) => resetTest({ mode: 'words', wordsOption: w })}
        onSelectCodeLang={(lang) => resetTest({ mode: 'code', codeLanguage: lang })}
        onSelectChineseSubMode={(sub) =>
          resetTest({ mode: 'chinese', chineseSubMode: sub })
        }
        onShufflePrompt={() =>
          mode === 'code'
            ? resetTest({ mode: 'code', cycleSnippet: true })
            : resetTest({ mode: 'chinese', cycleChinese: true })
        }
        onSelectAccent={setAccentId}
        onRestart={() => resetTest()}
      />

      {/* Upper-Half Floating Typing Prompt & Live Minimal HUD */}
      <main className="relative z-10 mt-3 sm:mt-5 flex flex-col items-center pointer-events-none">
        <LiveHud
          uiLang={uiLang}
          mode={mode}
          chineseSubMode={chineseSubMode}
          status={status}
          wpm={wpm}
          speedUnit={speedUnit}
          accuracy={accuracy}
          combo={combo}
          timeLeft={timeLeft}
          timeTotal={timeOption}
          wordsDone={wordsDone}
          wordsTotal={wordsOption}
          codeProgress={codeProgress}
          activeSnippet={activeSnippet}
          activeProse={activeProse}
          accent={accent}
        />

        <TypingPrompt
          uiLang={uiLang}
          mode={mode}
          chineseSubMode={chineseSubMode}
          status={status}
          chars={chars}
          cursor={cursor}
          combo={combo}
          tabArmed={tabArmed}
          audioReady={audioState.audioReady}
          sessionId={sessionId}
          pinyinHanziMap={pinyinHanziMap}
          composingText={composingText}
          imeInputRef={imeInputRef}
          onFocusIme={focusImeIfNeeded}
          onImeCompositionStart={onImeCompositionStart}
          onImeCompositionUpdate={onImeCompositionUpdate}
          onImeCompositionEnd={onImeCompositionEnd}
          onImeChange={onImeChange}
          accent={accent}
        />
      </main>

      {/* Docked Bottom Sci-Fi Synth Music Console */}
      <AudioConsoleDock
        uiLang={uiLang}
        audioState={audioState}
        accent={accent}
        onSelectTrack={(trackId) => soundEngine.selectTrack(trackId)}
        onTogglePlay={() => soundEngine.togglePlay()}
        onVolumeChange={(vol) => soundEngine.setMusicVolume(vol)}
        onToggleStem={(stem) => soundEngine.toggleStem(stem)}
        onToggleChimes={() => soundEngine.toggleKeyChimes()}
        onToggleMute={() => soundEngine.toggleMute()}
      />

      {/* Post-Test 3D Tilt Summary Modal */}
      <SummaryModal
        uiLang={uiLang}
        summary={summary}
        accent={accent}
        tabArmed={tabArmed}
        onRestart={() => resetTest()}
      />
    </div>
  )
}

export default App
