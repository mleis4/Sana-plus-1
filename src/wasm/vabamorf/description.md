# src/wasm/vabamorf/

Estonian morphological analyzer WebAssembly build.

Compiled from source from https://github.com/Filosoft/vabamorf using Emscripten,
with a thin C++ wrapper (`wasm-build/vabamorf_wasm.cpp`) that exposes a single
`analyze(word)` → JSON function to JavaScript. The build process is documented
and scripted in `wasm-build/build.sh` at the project root.

## Files

| File | Purpose |
|---|---|
| `vabamorf.js` | Emscripten-generated JavaScript glue code. Responsible for loading the `.wasm` binary, mounting the preloaded lexicon file into the virtual filesystem, and exporting the `analyze` function. Imported by `src/background/lemmatizer/vabamorf.ts`. |
| `vabamorf.wasm` | The compiled Estonian morphological analyzer binary. Contains the `etana` analysis logic compiled from Vabamorf's `lib/etana/*.cpp` and `lib/fsc/*.cpp` source files, plus the custom wrapper from `wasm-build/vabamorf_wasm.cpp`. |
| `vabamorf.data` | Emscripten preloaded filesystem image. Contains `et.dct` — the binary Estonian morphological lexicon — packed for memory-mapping into the WASM module's virtual filesystem at startup. This is what allows the analyzer to recognize and analyze Estonian word forms. Without it, the analyzer cannot function. |

## Notes
- Do not edit these files manually — they are build artifacts.
- To rebuild: follow the instructions in `wasm-build/build.sh`.
- `et.dct` is the pre-built analyzer lexicon from `vabamorf/dct/binary/et.dct`
  in the upstream repository. It does NOT need to be recompiled unless the
  Estonian lexicon source files themselves are changed.
- The build uses `-sNO_PTHREADS` to strip thread support. This avoids
  `SharedArrayBuffer` Cross-Origin Isolation requirements, which cannot be
  guaranteed on arbitrary pages in a Chrome extension context.
- The build uses `-sEXPORT_ES6=1 -sMODULARIZE=1` so the module can be
  imported cleanly as an ES module in the service worker.
