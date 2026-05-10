# src/background/

The Chrome Extension Service Worker. This is the persistent background process
that all other parts of the extension communicate with via `chrome.runtime.sendMessage`.

Because content scripts and the side panel cannot directly call WASM or make
unrestricted cross-origin API requests, all heavy logic lives here.

## Files

| File | Purpose |
|---|---|
| `worker.ts` | Entry point for the service worker. Registers the message listener and routes incoming messages to the correct handler (lemmatizer, dictionary, phrase bank, etc.). |
| `cache.ts` | IndexedDB interface for the **dictionary cache**. Stores `lemma+language → DictEntry` mappings so the same word is never fetched from the API twice. Uses the `idb` library for typed access. Entries expire after 7 days. |
| `phraseBank.ts` | IndexedDB interface for the **phrase bank** — the user's personal vocabulary store. Handles CRUD for `PhraseRecord` objects, computes SRS (spaced repetition) confidence levels, and returns aggregated stats for the dashboard. |
| `frequency.ts` | Loads the bundled frequency JSON files (`data/fi-frequency.json`, `data/et-frequency.json`) and exposes a `getFrequencyTier(lemma, language)` function returning 1–5. Used by the replacer to decide which words are appropriate for the user's current level. |
| `messaging.ts` | Typed message routing layer. Defines the full set of message types and dispatches each to its handler. Keeps `worker.ts` clean and ensures TypeScript catches any unhandled message type at compile time. |

## Subdirectories

| Directory | Purpose |
|---|---|
| `lemmatizer/` | WASM wrappers for Finnish (Voikko) and Estonian (Vabamorf) morphological analyzers. |
| `dictionary/` | API clients for Wiktionary and language-specific dictionary sources. |
