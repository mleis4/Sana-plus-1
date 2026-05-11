# Sana+1

> *"Sana"* means **word** in both Finnish and Estonian.

A Chrome browser extension for immersive Finnish and Estonian vocabulary acquisition — no LLM APIs, no subscriptions, no accounts. Everything runs locally.

---

## What it does

Sana+1 works by quietly modifying the web pages you already read. As you browse, it replaces a small percentage of English words with Finnish or Estonian equivalents. Click any replaced word to see its definition, pronunciation, and full morphological breakdown. Words you look up get saved to your personal phrase bank, and the extension tracks your confidence over time using a spaced-repetition system.

The name is a nod to Krashen's **i+1 hypothesis** — the idea that you acquire language most efficiently when input is just slightly above your current level.

---

## Features

- **In-page word replacement** — replaces words on any site you visit, at a density you control with a slider
- **Floating tooltip** — click any target-language word for its definition, audio pronunciation (Web Speech API), and morphological analysis
- **Morphological breakdown** — full case/form analysis for Finnish (Voikko) and Estonian (Vabamorf), displayed in plain English
- **Cognate detection** — Finnish–Estonian cognates are flagged in the tooltip so you can learn both languages in parallel
- **Phrase bank** — IndexedDB-backed personal word list, sortable by confidence level, frequency tier, or date added
- **Assessment mode** — type-the-translation drills drawn from sentences you've actually encountered while browsing
- **No LLM / no API keys** — all morphology is WebAssembly running locally; definitions come from Wiktionary's public REST API

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React + TypeScript |
| Bundler | Vite + `@crxjs/vite-plugin` |
| Styling | Tailwind CSS |
| Finnish morphology | `libvoikko` (WASM, ships pre-built via npm) |
| Estonian morphology | Vabamorf (custom WASM build, committed to repo) |
| Storage | IndexedDB via `idb` |
| Dictionary | Wiktionary REST API |
| TTS | Web Speech API (`fi-FI` / `et-EE` voices) |
| Testing | Vitest |
| Extension target | Chrome MV3 |

---

## Project structure

```
sana-plus-1/
├── manifest.json              # Chrome Extension Manifest V3
├── vite.config.ts             # Vite + crxjs config
├── tailwind.config.ts
├── tsconfig.json
│
├── data/
│   ├── fi-frequency.json      # Finnish lemma → frequency tier (1–5)
│   └── et-frequency.json      # Estonian lemma → frequency tier (1–5)
│
├── src/
│   ├── background/            # Service worker — lemmatizer, dictionary, phrase bank, message router
│   │   ├── worker.ts
│   │   ├── lemmatizer/        # voikko.ts + vabamorf.ts + index.ts
│   │   ├── dictionary.ts      # Wiktionary API client
│   │   ├── cache.ts           # IndexedDB dictionary cache
│   │   └── phraseBank.ts      # IndexedDB phrase bank + SRS logic
│   │
│   ├── content/               # Content script injected into every page
│   │   ├── index.tsx          # Entry point, shadow DOM mount
│   │   ├── selector.ts        # Text selection → background message
│   │   ├── replacer.ts        # i+1 word replacement engine
│   │   └── tooltip/           # Floating tooltip React components
│   │
│   ├── sidepanel/             # Persistent Chrome side panel UI
│   │   ├── App.tsx
│   │   └── tabs/              # Dashboard, PhraseBank, Assessment, Settings
│   │
│   ├── popup/                 # Toolbar icon popup (minimal)
│   │   └── App.tsx
│   │
│   ├── shared/                # Types + utilities shared across all contexts
│   │   └── types.ts
│   │
│   └── wasm/                  # Compiled WASM binaries (committed to repo)
│       ├── voikko/
│       └── vabamorf/          # vabamorf.js + vabamorf.wasm + vabamorf.data
│
└── wasm-build/                # One-time Vabamorf → WASM build tooling (not bundled)
    ├── vabamorf_wasm.cpp
    └── build.sh
```

---

## Getting started

### Prerequisites

- Node.js 18+
- Chrome (or any Chromium browser)

### Install and build

```bash
git clone https://github.com/your-username/sana-plus-1.git
cd sana-plus-1
npm install
npm run build
```

The extension is output to `dist/`.

### Load into Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `dist/` folder

### Development mode (with HMR)

```bash
npm run dev
```

Load the `dist/` folder in Chrome as above — crxjs handles hot module replacement in the extension context.

---

## Rebuilding the Estonian WASM (optional)

The compiled Vabamorf WASM artifacts are committed to `src/wasm/vabamorf/` — you don't need to rebuild them unless you're updating the Estonian lexicon.

If you do need to rebuild:

```bash
# 1. Install Emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk && ./emsdk install latest && ./emsdk activate latest
source ./emsdk_env.sh
cd ..

# 2. Clone Vabamorf
git clone https://github.com/Filosoft/vabamorf.git

# 3. Run the build script
bash wasm-build/build.sh
```

The outputs are copied automatically into `src/wasm/vabamorf/`.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run typecheck` | Run TypeScript compiler without emitting |
| `npm run test` | Run Vitest unit tests |
| `npm run test:ui` | Open Vitest browser UI |

---

## How word replacement works

1. The content script walks visible text nodes on the page, skipping inputs, code blocks, nav, and footer elements.
2. Each word is lemmatized (via the background service worker) and looked up in the frequency table.
3. Words within your configured frequency tier range that aren't already in your phrase bank at high confidence are candidates for replacement.
4. Candidates are replaced with a styled `<span>` showing the target-language word. Hovering or clicking reveals the original English and opens the tooltip.
5. A DOM mutation observer re-runs replacement on dynamically loaded content (infinite scroll, SPAs).

---

## Frequency tiers

Both `fi-frequency.json` and `et-frequency.json` map lemmas to tiers 1–5:

| Tier | Approximate size | Examples (Finnish) |
|---|---|---|
| 1 | Top ~500 | olla, se, ja, ei, minä |
| 2 | ~500–2 000 | talo, koira, syödä |
| 3 | ~2 000–5 000 | kirjasto, paistaa |
| 4 | ~5 000–10 000 | happamuus, hämähäkki |
| 5 | Rare / advanced | — |

The replacement slider lets you cap the maximum tier replaced. Start at tier 2–3 for a comfortable experience.

---

## Privacy

Sana+1 sends no data to any server except public Wiktionary API requests for word definitions. All morphological analysis, phrase bank data, and assessment history stay in your browser's local IndexedDB. There are no accounts and no telemetry.

---

## License

MIT