# src/background/lemmatizer/

Morphological analysis layer. Given a surface word form (e.g. "taloissa"),
returns its lemma (base form) and grammatical tags (e.g. noun, inessive, plural).

This is the core capability that makes the extension viable for Finnish and Estonian —
both are agglutinative languages where a single word can have dozens of inflected forms.
Without lemmatization, dictionary lookups would fail for most words encountered in real text.

## Files

| File | Purpose |
|---|---|
| `index.ts` | Unified public interface. Exports a single `analyze(word: string, language: Language): Promise<MorphAnalysis[]>` function that delegates to the correct language module. All callers use only this file — they never import `voikko.ts` or `vabamorf.ts` directly. |
| `voikko.ts` | Finnish morphology wrapper. Loads the `libvoikko-js` npm package (which ships its own WASM binary and Finnish dictionary). Initializes the analyzer once on first call and caches the instance. Maps Voikko's output format to the shared `MorphAnalysis` type defined in `src/shared/types.ts`. |
| `vabamorf.ts` | Estonian morphology wrapper. Loads the custom-built `vabamorf.wasm` + `vabamorf.js` + `vabamorf.data` from `src/wasm/vabamorf/`. Initializes the Emscripten module, calls the exported C++ `analyze()` function with the input word, and parses the returned JSON string into `MorphAnalysis[]`. |

## Key type (from src/shared/types.ts)

```typescript
type MorphAnalysis = {
  lemma: string;        // base form, e.g. "talo"
  partOfSpeech: string; // "S" = noun, "V" = verb, "A" = adjective, etc.
  form: string;         // raw tag string, e.g. "sg ill"
  displayForm: string;  // human-readable, e.g. "singular illative"
};
```

## Notes
- Both analyzers initialize lazily on first use, not at service worker startup.
- Voikko may return multiple analyses for ambiguous words — all are returned;
  the UI shows the most likely one first (highest frequency form).
- The thread-stripping (`-sNO_PTHREADS`) in the Vabamorf build means analysis
  is synchronous inside the WASM module, which is fine for single-word lookups.
