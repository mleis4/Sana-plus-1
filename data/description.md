# data/

Static data files bundled with the extension at build time by Vite.
Imported directly into the background service worker — NOT fetched at runtime.

## Files

| File | Purpose |
|---|---|
| `fi-frequency.json` | Finnish word frequency table. Maps approximately 10,000 Finnish lemmas to a frequency tier (1–5), where tier 1 = most common (top ~500 words, e.g. "olla", "se", "ja") and tier 5 = rare or advanced vocabulary. Derived from the Finnish Frequency Dictionary corpus maintained by Kotimaisten kielten tutkimuskeskus. Used by `src/background/frequency.ts` and the content script replacer to determine which words are appropriate for the user's current level and which to replace in i+1 mode. |
| `et-frequency.json` | Estonian word frequency table. Same schema as the Finnish file. Derived from the Estonian Reference Corpus (Eesti keele ühendkorpus), a 1.5-billion-word corpus of Estonian text. Tier 1 covers the most common ~500 Estonian lemmas. |

## JSON schema
Both files share the same flat structure:
```json
{
  "olla": 1,
  "talo": 2,
  "koira": 2,
  "hämähäkki": 4,
  "happamuus": 5
}
```
Key = lemma (base form), value = frequency tier 1–5.
Words absent from the file are treated as tier 5 (rare / unknown).

## File sizes
Each file is approximately 200–400 KB uncompressed, ~60–80 KB gzipped.
Vite bundles them as static JSON assets imported by the background service worker.
