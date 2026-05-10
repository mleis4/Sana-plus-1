# src/shared/

Code shared across all four extension contexts: background service worker,
content script, side panel, and popup. Must not contain any browser-context-specific
APIs — no `chrome.tabs`, no `document`, no `window`. Those belong in the
context that needs them.

## Files

| File | Purpose |
|---|---|
| `types.ts` | **The single source of truth for all TypeScript types.** Defines `Language`, `MorphAnalysis`, `DictEntry`, `PhraseRecord`, `AssessmentResult`, and the full discriminated union of `Message` types used for communication between the background service worker and the content script / side panel. If a type is used in more than one context, it lives here. |
| `constants.ts` | All shared constant values: IndexedDB database name and version number, object store names, default confidence level for new words, SRS (spaced repetition) review interval durations per confidence level (in hours), dictionary cache TTL (7 days), API base URLs for Wiktionary / Kotus / Sõnaveeb, supported language codes, and replacement intensity min/max bounds. |
| `morphLabels.ts` | Human-readable label maps for morphological tag strings. Maps the raw output of Voikko and Vabamorf (e.g. `"sg ill"`, `"pl gen"`, `"ps3 sg ps af"`) to display strings with grammatical explanations. Covers all 15 Finnish grammatical cases, Estonian cases, and verb forms (person, number, tense, mood, voice) for both languages. Used by `MorphBreakdown.tsx` and `MorphTab.tsx`. |
