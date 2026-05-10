# src/wasm/voikko/

Finnish morphological analyzer WebAssembly build.

Sourced from the `libvoikko-js` npm package — an officially maintained
JavaScript/WASM port of libvoikko, the library that powers the Finnish spell
checker and morphological analyzer used in LibreOffice, Firefox, and many other
tools. No custom C++ compilation required for this language.

## Files

| File | Purpose |
|---|---|
| `libvoikko.js` | Emscripten-generated JavaScript glue code. Loads the WASM module, initialises the Emscripten virtual filesystem with the Finnish dictionary files, and exports the Voikko API surface used by `src/background/lemmatizer/voikko.ts`. |
| `libvoikko.wasm` | The compiled Finnish morphological analyzer binary. Contains the analyzer logic but not the lexicon data (lexicon is in the `voikko/` subdirectory below). |
| `voikko/` | Finnish morphological dictionary files. Voikko requires these at a specific virtual filesystem path (`/usr/lib/voikko/`) to function. Emscripten's `--preload-file` bundles them into the `.data` file at build time. Covers standard Finnish including inflected forms, compound words, and proper nouns. |

## Notes
- Do not edit these files manually — they are build artifacts.
- To update: upgrade the `libvoikko` npm package version and copy the new WASM
  output files here.
- The Finnish lexicon (5-fi) is maintained by the Voikko project and covers
  modern standard Finnish (suomen yleiskieli).
