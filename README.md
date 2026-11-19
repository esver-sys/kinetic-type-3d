# KINETIC — Sci-Fi Holographic 3D Typing Studio

An interactive sci-fi 3D typing practice studio built around tactile keystroke physics and spatial feedback — featuring 61 suspended translucent crystal sensor wafers, damped spring travel, next-key holographic targeting, concentric keystroke shockwaves, bilingual (`EN` / `中文`) practice modes, and a pure-code Web Audio polyphonic synth companion.

**Live Demo:** [https://esver-sys.github.io/kinetic-type-3d/](https://esver-sys.github.io/kinetic-type-3d/)

---

## Features / 核心特性

- **Sci-Fi Holographic Crystal Input Matrix (`React Three Fiber` + `Three.js`)**
  - **61 Floating Optical Crystal Wafers:** Translucent sapphire-glass input plates hovering over laser-etched optical emitter sockets on an open carbon-titanium deck — zero traditional plastic keycaps or mechanical switches.
  - **Zero-Latency Tactile Spring Physics:** Every physical `keydown` / `keyup` compresses and rebounds the matching 3D crystal wafer via real damped spring physics, radiating concentric plasma waves outward across neighboring wafers from the exact struck coordinate.
  - **Next-Key Holographic Guidance:** Gently highlights the upcoming expected character crystal (including `Shift` when required) in ASCII / Pinyin / Code modes.
  - **Error & Combo Telemetry:** Mistyped keys flash sharp crimson (`#ff2446`) with subtle glitch shake and reset combo; higher WPM & combo streaks ignite twin stabilizer wing bars and accelerate background star-warp speed.
- **Typing-First Minimalist UI & Bilingual Modes (`EN` / `中文`)**
  - **Modes:** `Prose / 明文` (`散文` · `古诗` · `名篇` · `英文` · `自定义导入`), `Time` (`15s` / `30s` / `60s`), `Words` (`10` / `25` / `50`), `Code` (`TypeScript` / `Rust` / `Python` / `CSS`), and `中文` (`短文` / `词组` / `拼音`).
  - **Custom Plain Text Import:** Paste any Chinese or English article, notes, or lyrics; CJK presence is auto-detected to engage IME + CPM or direct WPM mode seamlessly.
  - **Chinese IME Support:** Clean bottom-anchored hidden composition input keeps OS candidate bars cleanly below the prompt box without obscuring target text.
  - **Live HUD & 3D Summary Card:** Real-time WPM/CPM, accuracy %, combo streak, 5 customizable accent themes, and post-test 3D tilt summary card (`Tab + Enter` quick restart).
- **Pure-Code Web Audio Synth Companion (`Web Audio API`)**
  - **Unobtrusive Bottom-Right Synth Pill:** Lightweight corner control pill keeps the typing arena and 3D matrix unobstructed, with click-to-expand drawer for 4 procedural tracks (`星际漫游 Starlight Horizon`, `轨道夜曲 Orbital Nocturne`, `量子脉冲 Quantum Drive`, `星云诗篇 Nebula Elegy`), volume control, 4-stem mixer toggles (`鼓组` / `低音` / `和弦` / `旋律`), harmonic keystroke chimes toggle, and mute.

---

## Tech Stack / 技术栈

- **Framework:** React 19, TypeScript, Vite
- **3D Rendering:** Three.js, `@react-three/fiber`, `@react-three/drei`
- **Styling & Motion:** Tailwind CSS v4, Framer Motion, Lucide React
- **Typography:** JetBrains Mono Variable & Inter Variable (`@fontsource-variable`)
- **Audio Synthesis:** Pure Web Audio API polyphonic sequencer, stereo Convolver reverb, ping-pong delay, stem buses & FFT `AnalyserNode`

---

## Project Structure

```text
kinetic-type-3d/
├── .github/workflows/
│   └── deploy.yml                # Automated GitHub Pages build & deploy workflow
├── src/
│   ├── audio/
│   │   ├── musicTracks.ts        # 4 multi-bar open-voicing procedural songs & harmonic scales
│   │   └── soundEngine.ts        # Web Audio synthesizer, per-session FX buses, stems & analyser
│   ├── components/
│   │   ├── AudioConsoleDock.tsx  # Compact bottom-right synth pill & expandable track/stem drawer
│   │   ├── CustomPassageModal.tsx # Custom plain-text paste & auto CJK/EN detection dialog
│   │   ├── ErrorBoundary.tsx     # Graceful WebGL / runtime fallback boundary
│   │   ├── LiveHud.tsx           # Real-time speed, accuracy & combo HUD
│   │   ├── SciFi3DScene.tsx      # 61-wafer holographic crystal matrix, stabilizer wings & starfield
│   │   ├── SummaryModal.tsx      # Post-test 3D tilt summary card
│   │   ├── TopNavBar.tsx         # Single-row mode, language & accent color controls
│   │   └── TypingPrompt.tsx      # Monospace prompt, smooth caret & CJK IME positioning
│   ├── constants/
│   │   ├── holoMatrixLayout.ts   # 61-key staggered 3D wafer geometry & next-key code resolver
│   │   ├── i18n.ts               # English & Chinese UI translations
│   │   ├── prompts.ts            # Word lists, code snippets, prose, poetry & classic passages
│   │   └── themes.ts             # Accent color palettes & glow presets
│   ├── hooks/
│   │   ├── useTelemetryPulse.ts  # Pooled shockwaves, live key states & target-key ref bridge
│   │   └── useTypingEngine.ts    # Core typing state machine, metrics & IME handling
│   ├── types/
│   │   └── typing.ts             # Shared TypeScript interfaces
│   ├── App.tsx                   # Main layout & orchestrator
│   ├── index.css                 # Tailwind v4 setup & EQ / caret / shake animations
│   └── main.tsx                  # React entry point
├── LICENSE                       # MIT License
├── package.json
├── tsconfig.json
└── vite.config.ts                # Supports dynamic VITE_BASE_PATH for GitHub Pages
```

---

## Local Development / 本地开发

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

---

## License

Released under the [MIT License](LICENSE).
