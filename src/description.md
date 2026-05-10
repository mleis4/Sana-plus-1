# src/

All application source code. Vite + @crxjs/vite-plugin compiles this directory
into the final extension `dist/` folder.

## Subdirectories

| Directory | Purpose |
|---|---|
| `background/` | Chrome Service Worker — the brain of the extension. Handles lemmatization, dictionary lookups, phrase bank, and message routing. Runs persistently in the background. |
| `content/` | Content script injected into every web page. Listens for text selections, renders the floating tooltip, and performs word replacement in i+1 mode. |
| `sidepanel/` | The Chrome Side Panel UI — a persistent panel the user opens alongside any page. Contains the learning dashboard, phrase bank browser, assessment mode, and settings. |
| `popup/` | The small popup that appears when the user clicks the extension icon. Minimal — just an active/paused toggle and a button to open the side panel. |
| `shared/` | Types, constants, and utility modules shared across background, content, sidepanel, and popup. No browser-API-specific code — must be importable from any context. |
| `wasm/` | Compiled WebAssembly binaries and Emscripten JS glue files, committed to the repo. Loaded by the background service worker at runtime. |
