# src/background/dictionary/

Dictionary API clients. Given a lemma and language, fetches English definitions,
part of speech, example sentences, and optionally cognate information.

All lookups go through `index.ts`, which tries sources in priority order and
falls back gracefully if a source is unavailable or returns no result.

## Files

| File | Purpose |
|---|---|
| `index.ts` | Orchestrator. Checks `cache.ts` first — if a cached entry exists, returns it immediately. Otherwise tries Wiktionary, then the language-specific fallback API. Writes successful results to cache before returning. Also runs a cognate check after a successful lookup and attaches any finding to the `DictEntry`. Exports `lookupLemma(lemma, language): Promise<DictEntry \| null>`. |
| `wiktionary.ts` | Primary source for both Finnish and Estonian. Uses the Wiktionary REST API (`https://en.wiktionary.org/api/rest_v1/page/definition/{word}`). Parses the response to extract English definitions, part of speech, and example sentences. Also attempts to parse inflection table data from wikitext for use in the MorphTab. |
| `kotus.ts` | Finnish secondary source. Queries the Institute for the Languages of Finland (Kotus) API as a fallback when Wiktionary has no result for a Finnish lemma. Useful for very common or very domain-specific Finnish words. |
| `sonaveeb.ts` | Estonian secondary source. Queries the Sõnaveeb (sonaveeb.ee) word database — the official Estonian dictionary maintained by EKI (Eesti Keele Instituut). Uses the undocumented but stable JSON endpoints available from the public web interface. |

## Request strategy
1. Check IndexedDB cache → return immediately if found
2. Wiktionary (works for both languages)
3. If no result: Kotus (Finnish) or Sõnaveeb (Estonian)
4. If still no result: return `null` (UI shows "definition not found")
5. On success: write to cache with 7-day TTL

## Cognate detection
`index.ts` runs a lightweight cognate check after a successful lookup:
for Finnish words it queries Estonian for a phonologically similar form, and
vice versa. Exact or near-exact matches are flagged in the returned `DictEntry`
and displayed by the `CognateTag` component in the tooltip.
