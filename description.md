# sana-plus-one — Root

This is the root of the **SanaPlus** Chrome browser extension project.
"Sana" means "word" in both Finnish and Estonian.

## What this project is
A Chrome MV3 browser extension that helps users learn Finnish or Estonian through
immersive, in-page vocabulary replacement and instant morphological lookup — with no
LLM APIs. All morphology runs locally via WebAssembly (Voikko for Finnish, Vabamorf
for Estonian). Dictionary definitions are fetched from Wiktionary and language-specific
APIs at runtime.

## Root-level files

| File | Purpose |
|---|---|
| `package.json` | NPM dependencies and scripts (`dev`, `build`, `typecheck`) |
| `vite.config.ts` | Vite bundler config — uses `@crxjs/vite-plugin` to output a valid Chrome extension |
| `tailwind.config.ts` | Tailwind CSS configuration and theme tokens |
| `tsconfig.json` | TypeScript compiler options for the whole project |
| `manifest.json` | Chrome Extension Manifest V3 — declares permissions, content scripts, side panel, popup, and background service worker |
| `description.md` | This file |

## Top-level directories

| Directory | Purpose |
|---|---|
| `src/` | All TypeScript/React source code for the extension |
| `data/` | Bundled static frequency list JSON files for Finnish and Estonian |
| `wasm-build/` | Source and build script for compiling Vabamorf to WebAssembly (one-time, not bundled into extension) |
