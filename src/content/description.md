# src/content/

The content script — injected into every web page the user visits as declared
in `manifest.json`. Runs in the page's JavaScript context but in an isolated world.

Responsible for two things:
1. **Passive listening** — detecting when the user highlights text and triggering
   the tooltip with translation and morphology info.
2. **Active replacement** — when i+1 mode is enabled, scanning the page's text
   nodes and replacing selected words with Finnish/Estonian equivalents.

## Files

| File | Purpose |
|---|---|
| `index.tsx` | Entry point. Initializes the content script, mounts the tooltip React tree into a shadow DOM element (to avoid CSS conflicts with host pages), and starts the selector and replacer modules. Also listens for language/mode change messages from the background service worker. |
| `selector.ts` | Listens for `mouseup` and `selectionchange` events. When the user highlights text, extracts the selected string, sends an `ANALYZE` message to the background service worker, and tells the tooltip where to appear (using `Selection.getRangeAt(0).getBoundingClientRect()`). Handles debouncing and ignores selections inside `<input>`, `<textarea>`, and `<select>` elements. |
| `replacer.ts` | The i+1 word replacement engine. When active mode is enabled, walks all visible text nodes on the page (skipping `<nav>`, `<footer>`, `<input>`, `<code>`, `<script>`, and `<style>` elements). For each word, checks its frequency tier and phrase bank confidence. Replaces eligible words with a `<span data-sana-word>` that displays the target-language word and reveals the English on hover or click. Uses a `MutationObserver` to handle dynamically loaded content (e.g. infinite scroll, SPAs). |

## Subdirectory

| Directory | Purpose |
|---|---|
| `tooltip/` | React components for the floating translation overlay shown on word highlight. |

## Shadow DOM
The tooltip is mounted inside a shadow DOM root attached to a `<div id="sana-plus-one-root">`
injected at the bottom of `<body>`. This ensures the extension's Tailwind CSS never leaks
into or conflicts with host page styles. The shadow root is attached in `closed` mode so
page scripts cannot access extension internals.
