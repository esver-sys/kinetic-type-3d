# KINETIC — 3D Tactile Typing Studio

An interactive 3D mechanical typing practice web app focused on tactile physics, spatial lighting, procedural Web Audio synthesis, and bilingual (English & 中文) typing experiences.

**Live Demo:** [https://esver-sys.github.io/kinetic-type-3d/](https://esver-sys.github.io/kinetic-type-3d/)

---

## Features / 核心特性

- **3D Mechanical Keyboard (`React Three Fiber`)**
  - Perspective 60% mechanical keyboard rendered in the lower viewport with sculpted keycaps, shadows, subtle RGB underglow, and gentle mouse-move parallax tilt.
  - Real-time keypress synchronization: every physical keystroke depresses and springs back the matching 3D keycap while triggering localized backlight illumination.
  - High-speed combo streaks dynamically intensify the keyboard's ambient glow; typing errors trigger a red keycap flash and character shake.
- **Zero-Latency Procedural Sound Engine (`Web Audio API`)**
  - Purely synthesized mechanical switch acoustics with zero external audio files:
    - **Tactile Brown (茶轴)**
    - **Clicky Blue (青轴)**
    - **Thocky Linear (线性轴)**
    - **Mute (静音)**
  - Distinct muted error thud on mistyped characters.
- **Typing Modes & Bilingual Support (EN / 中文)**
  - **Time** (`15s` / `30s` / `60s`), **Words** (`10` / `25` / `50`), **Code Snippets**, and **Chinese (中文)** practice modes.
  - Bilingual interface switcher (`EN` / `中文`) and non-blocking Chinese IME composition positioning so candidate windows stay clear of the active prompt text.
  - Accent color customization (including Neon Cyan, Warm Amber, and additional presets) with frosted glass HUD panels.
- **Live HUD & 3D Tilt Summary Card**
  - Real-time speed (WPM / CPM), Accuracy %, and Combo counter.
  - Post-test 3D tilt summary modal displaying final speed, accuracy, consistency, and instant restart via `Tab + Enter`.

---

## Tech Stack / 技术栈

- **Framework:** React 19, TypeScript, Vite
- **3D Rendering:** Three.js, `@react-three/fiber`, `@react-three/drei`
- **Styling & Motion:** Tailwind CSS v4, Framer Motion, Lucide React
- **Typography:** JetBrains Mono Variable & Inter Variable (`@fontsource-variable`)
- **Audio:** Procedural Web Audio API synthesizer (`src/audio/soundEngine.ts`)

---

## Project Structure

```text
kinetic-type-3d/
├── .github/workflows/
│   └── deploy.yml                # Automated GitHub Pages build & deploy workflow
├── src/
│   ├── audio/
│   │   └── soundEngine.ts        # Procedural Web Audio API switch & error sound synthesizer
│   ├── components/
│   │   ├── ErrorBoundary.tsx     # Graceful WebGL / runtime fallback boundary
│   │   ├── Keyboard3DScene.tsx   # 3D keyboard rig, lighting, underglow & parallax scene
│   │   ├── KeycapGeometry.ts     # Procedural 3D keycap geometry builder
│   │   ├── LiveHud.tsx           # Real-time speed, accuracy & combo HUD
│   │   ├── SummaryModal.tsx      # Post-test 3D tilt summary card
│   │   ├── TopNavBar.tsx         # Mode, language, sound profile & theme controls
│   │   └── TypingPrompt.tsx      # Monospace prompt, smooth caret & CJK IME positioning
│   ├── constants/
│   │   ├── i18n.ts               # English & Chinese UI translations
│   │   ├── keyboardLayout.ts     # Physical key matrix & label definitions
│   │   ├── prompts.ts            # Word lists, code snippets & Chinese practice corpora
│   │   └── themes.ts             # Accent color palettes & glow presets
│   ├── hooks/
│   │   ├── useKeyPressSync.ts    # Physical keyboard state & 3D animation sync
│   │   └── useTypingEngine.ts    # Core typing state machine, metrics & IME handling
│   ├── types/
│   │   └── typing.ts             # Shared TypeScript interfaces
│   ├── App.tsx                   # Main layout & orchestrator
│   ├── index.css                 # Tailwind v4 setup & glassmorphism / shake utilities
│   └── main.tsx                  # React entry point
├── LICENSE                       # MIT License
├── package.json
├── tsconfig.json
└── vite.config.ts                # Supports dynamic VITE_BASE_PATH for GitHub Pages
```

---

## Local Development / 本地开发

### Prerequisites
- Node.js 20+ (Node.js 22 recommended)
- npm

### Setup & Run

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Type-check with TypeScript
npm run typecheck

# Production build
npm run build
```

---

## Deployment (GitHub Pages)

This repository includes [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which automatically builds and deploys the app to **GitHub Pages** on every push to `main`:

1. Configures GitHub Pages and builds `dist/` with `VITE_BASE_PATH=/<repo-name>/` so all static assets resolve properly under the repository subpath.
2. Uploads the `dist/` folder as a Pages artifact.
3. Deploys live via `actions/deploy-pages`.

To preview a subpath production build locally:

```powershell
$env:VITE_BASE_PATH="/kinetic-type-3d/"
npm run build
```

---

## License

Released under the [MIT License](LICENSE).
