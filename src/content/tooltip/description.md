# src/content/tooltip/

React components that render the floating tooltip overlay when the user
highlights a Finnish or Estonian word on any web page.

The tooltip is positioned adjacent to the text selection using the Selection API
and `getBoundingClientRect()`, with viewport edge detection to prevent overflow.
It contains two tabs and a persistent action bar.

## Files

| File | Purpose |
|---|---|
| `Tooltip.tsx` | Root tooltip component. Manages visibility, screen positioning, and active tab state. Receives `DictEntry` and `MorphAnalysis[]` as props from `selector.ts` after the background service worker responds. Renders the word header, action bar (🔊 TTS button, ➕ add to phrase bank button), tab bar, and the active tab's content. Handles click-outside dismissal. |
| `TranslationTab.tsx` | The **Translation** tab (default). Displays the word's English definitions as a numbered list, a part-of-speech badge, and an example sentence if available from the dictionary API. |
| `MorphTab.tsx` | The **Morphology** tab. Shows the lemma (base form), a plain-language breakdown of the grammatical form (e.g. "Singular Illative — motion into or onto something"), and a compact mini-table of the 6 most common inflected forms sourced from Wiktionary. Helps learners understand *why* the word looks the way it does. Uses `MorphBreakdown.tsx` from the side panel components. |
| `CognateTag.tsx` | A small inline badge rendered in the tooltip header (not a tab) when the looked-up word has a known cognate in the other Finnic language. E.g. Finnish *vesi* ↔ Estonian *vesi* (exact ✓). Motivating for learners studying both languages. Renders nothing if no cognate is found. |

## Layout
```
┌──────────────────────────────┐
│  taloissa          🔊   ➕   │
│  [Translation] [Morphology]  │
├──────────────────────────────┤
│  Tab content rendered here   │
└──────────────────────────────┘
```
