# src/sidepanel/tabs/

The four main content views displayed in the side panel, one per navigation tab.

## Files

| File | Purpose |
|---|---|
| `Dashboard.tsx` | **📊 Dashboard.** Shows learning statistics: words seen today / this week / all-time, current learning streak, a confidence level distribution bar chart (how many words at each of the 0–4 confidence levels), and a breakdown of which grammatical cases and verb forms the user is getting wrong most often — derived from `AssessmentResult` history in the phrase bank. Refreshes whenever the background sends a `STATS_UPDATED` message. |
| `PhraseBank.tsx` | **📖 Phrase Bank.** A searchable, sortable table of every word in the user's bank. Each row shows the target-language word, its English translation, confidence level (rendered as a `ConfidenceBar`), frequency tier, and last-seen date. Clicking a row expands a `WordCard` with full detail. Words can be manually deleted or have their confidence level reset. |
| `Assessment.tsx` | **✍️ Assessment.** Active practice mode. Presents a word from the phrase bank (prioritising low-confidence words due for review based on SRS intervals) and asks the user to type the English translation. Scores the attempt: exact lemma match = full points, correct lemma but wrong inflection = partial, wrong lemma = zero. Shows the expected answer and morphological form on reveal. Feeds results back to `phraseBank.ts` to update confidence levels. |
| `Settings.tsx` | **⚙️ Settings.** Language selector (Finnish / Estonian), i+1 replacement intensity slider (10–30% of page words), page blacklist manager (add/remove domains where replacement is disabled), and TTS voice selector (lists `fi-FI` and `et-EE` voices available via the Web Speech API on the user's system). All settings are persisted to `chrome.storage.sync`. |
