# wasm-build/

Source files and build script for compiling the Vabamorf Estonian morphological
analyzer to WebAssembly using Emscripten.

**This directory is NOT bundled into the extension.** It exists purely as a
developer tool — used once at project setup (or when updating Vabamorf) to
regenerate the WASM artifacts committed to `src/wasm/vabamorf/`.

## Files

| File | Purpose |
|---|---|
| `vabamorf_wasm.cpp` | The thin C++ wrapper file we author. Bridges Vabamorf's internal C++ API to a single WASM-exported function: `std::string analyze(std::string word)`. This function initializes the Vabamorf analyzer (loading `et.dct` from the Emscripten virtual filesystem), runs analysis on the input word, and returns a JSON string of `MorphAnalysis` results. This is the only C++ file we write — all other Vabamorf sources compile as-is from the cloned upstream repository. |
| `build.sh` | Shell script that orchestrates the full Emscripten compilation. Steps: (1) clone `https://github.com/Filosoft/vabamorf.git` if not already present, (2) apply the wide-string-literal patch to `lib/proof/suggestor.cpp` (a known upstream issue), (3) run `emcc` with the correct flags: `-sEXPORT_ES6=1 -sMODULARIZE=1 -sEXPORTED_FUNCTIONS=["_analyze"] --preload-file et.dct -sNO_PTHREADS -O2 -lidbfs.js`, (4) copy the output `vabamorf.js`, `vabamorf.wasm`, and `vabamorf.data` to `../src/wasm/vabamorf/`. |

## Prerequisites to run build.sh
1. Emscripten SDK installed and activated:
   ```bash
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk && ./emsdk install latest && ./emsdk activate latest
   source ./emsdk_env.sh
   ```
2. `g++` and `make` available on PATH
3. `libjsoncpp-dev` installed:
   ```bash
   # Ubuntu / Debian
   sudo apt-get install -y libjsoncpp-dev
   ```

## When to re-run build.sh
- When the upstream `Filosoft/vabamorf` repository updates its lexicon or analyzer
- If a bug is discovered in `vabamorf_wasm.cpp`
- Never otherwise — the committed artifacts in `src/wasm/vabamorf/` are stable

## Output
After `build.sh` completes successfully, three files are written to `src/wasm/vabamorf/`.
All three must be committed to the repository together:
- `vabamorf.js`
- `vabamorf.wasm`
- `vabamorf.data`
