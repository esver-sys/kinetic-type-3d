import React, { useMemo, useRef, useState } from 'react'
import { ACCENT_THEMES } from './constants/themes'
import { useKeyPressSync } from './hooks/useKeyPressSync'
import { useTypingEngine } from './hooks/useTypingEngine'
import { AccentId, SoundProfile, UiLanguage } from './types/typing'
import { TopNavBar } from './components/TopNavBar'
import { LiveHud } from './components/LiveHud'
import { TypingPrompt } from './components/TypingPrompt'
import { Keyboard3DScene } from './components/Keyboard3DScene'
import { SummaryModal } from './components/SummaryModal'
import { WebGLErrorBoundary } from './components/ErrorBoundary'

export const App: React.FC = () => {
  const [uiLang, setUiLang] = useState<UiLanguage>('en')
  const [accentId, setAccentId] = useState<AccentId>('cyan')
  const [soundProfile, setSoundProfile] = useState<SoundProfile>('tactile-brown')

  const accent = ACCENT_THEMES[accentId]
  const streakIntensityRef = useRef(0)

  const { keyStatesRef, spotlightRef, pressKey, releaseKey, releaseAll } = useKeyPressSync()

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
    soundProfile,
    pressKey,
    releaseKey,
    releaseAll,
    streakIntensityRef,
  })

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
    <div className="relative flex h-dvh w-screen flex-col overflow-hidden bg-[#07090d] text-slate-100">
      {/* Soft Ambient Studio Lighting Layers */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-700"
        style={{
          background: `
            radial-gradient(65% 45% at 50% 18%, ${accent.softBgRgba}, transparent 72%),
            radial-gradient(70% 42% at 50% 82%, ${accent.softBgRgba}, transparent 75%),
            radial-gradient(120% 90% at 50% 50%, transparent 45%, rgba(2, 4, 8, 0.85) 100%)
          `,
        }}
      />

      {/* Faint Architectural Micro-Grid Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 70% at 50% 45%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 45%, black, transparent)',
        }}
      />

      {/* Full-Viewport 3D Mechanical Keyboard Stage (framed cleanly in lower half) */}
      <WebGLErrorBoundary>
        <Keyboard3DScene
          accent={accent}
          soundProfile={soundProfile}
          keyStatesRef={keyStatesRef}
          spotlightRef={spotlightRef}
          streakIntensityRef={streakIntensityRef}
          pressKey={pressKey}
          releaseKey={releaseKey}
        />
      </WebGLErrorBoundary>

      {/* Top Glassmorphic Control Bar */}
      <TopNavBar
        uiLang={uiLang}
        mode={mode}
        timeOption={timeOption}
        wordsOption={wordsOption}
        codeLanguage={codeLanguage}
        chineseSubMode={chineseSubMode}
        soundProfile={soundProfile}
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
        onSelectSound={setSoundProfile}
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
