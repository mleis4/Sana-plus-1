# src/sidepanel/components/

Reusable React components used across multiple side panel tabs and, in the case
of `MorphBreakdown.tsx`, also imported by the content script tooltip.

## Files

| File | Purpose |
|---|---|
| `WordCard.tsx` | Expanded detail view for a single phrase bank entry. Renders the lemma, all stored definitions, full morphological breakdown (via `MorphBreakdown`), a confidence history mini-chart (sparkline of the last 10 assessment scores), and a list of recent assessment attempts with their scores. Used in `PhraseBank.tsx` when the user clicks a word row. |
| `ConfidenceBar.tsx` | A visual 0–4 confidence level indicator rendered as a segmented horizontal bar with 5 segments. Color-coded from red (0 — never assessed) through orange, yellow, light green, to green (4 — well known). Accepts `level: 0 | 1 | 2 | 3 | 4` as a prop. Used in `WordCard.tsx` and each row of `PhraseBank.tsx`. |
| `MorphBreakdown.tsx` | Renders a human-readable morphological breakdown from a `MorphAnalysis` object. Maps raw Voikko/Vabamorf tag strings (e.g. `"sg ill"`, `"ps3 sg ps af"`) to full display strings with grammatical explanations (e.g. `"Singular Illative — used to express motion into or onto something"`). Contains the complete case and form label maps for both Finnish and Estonian. Imported by both `WordCard.tsx` (side panel) and `MorphTab.tsx` (tooltip). |
