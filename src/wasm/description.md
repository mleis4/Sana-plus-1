# src/wasm/

Pre-compiled WebAssembly binaries and their Emscripten JavaScript glue files,
committed to the repository.

These files are committed — not .gitignored — so that no WASM build toolchain
is required to develop or run the extension. Any developer (or CI pipeline) can
run `npm install && npm run dev` without installing Emscripten or a C++ compiler.

To rebuild from source (only needed when updating the underlying C++ libraries),
see `wasm-build/` in the project root.

## Subdirectories

| Directory | Purpose |
|---|---|
| `voikko/` | Finnish morphological analyzer — sourced from the `libvoikko-js` npm package output. |
| `vabamorf/` | Estonian morphological analyzer — custom-built from Filosoft/vabamorf via Emscripten. |
