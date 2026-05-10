import type { DictEntry, Language } from '../../shared/types';
import { getCached, setCached } from '../cache';
import { lookupWiktionary } from './wiktionary';
import { lookupKotus } from './kotus';
import { lookupSonaveeb } from './sonaveeb';

// Levenshtein distance for near-cognate detection
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

async function detectCognate(
  lemma: string,
  language: Language,
): Promise<DictEntry['cognate']> {
  const otherLang: Language = language === 'fi' ? 'et' : 'fi';

  // Check the cache first for the cognate candidate
  const cached = await getCached(lemma, otherLang);
  if (cached) {
    const dist = levenshtein(lemma.toLowerCase(), cached.lemma.toLowerCase());
    if (dist === 0) return { language: otherLang, word: cached.lemma, exact: true };
    if (dist <= 2 && lemma.length > 3) return { language: otherLang, word: cached.lemma, exact: false };
    return undefined;
  }

  // Lightweight check: query Wiktionary for the same word in the other language
  const otherEntry = await lookupWiktionary(lemma, otherLang);
  if (!otherEntry) return undefined;

  const dist = levenshtein(lemma.toLowerCase(), otherEntry.lemma.toLowerCase());
  if (dist === 0) return { language: otherLang, word: otherEntry.lemma, exact: true };
  if (dist <= 2 && lemma.length > 3) return { language: otherLang, word: otherEntry.lemma, exact: false };
  return undefined;
}

export async function lookupLemma(lemma: string, language: Language): Promise<DictEntry | null> {
  // 1. Check IndexedDB cache
  const cached = await getCached(lemma, language);
  if (cached) return cached;

  // 2. Try Wiktionary (works for both fi and et)
  let entry = await lookupWiktionary(lemma, language);

  // 3. Language-specific fallback
  if (!entry) {
    if (language === 'fi') {
      entry = await lookupKotus(lemma);
    } else {
      entry = await lookupSonaveeb(lemma);
    }
  }

  // 4. Still nothing — give up
  if (!entry) return null;

  // 5. Cognate detection (fire-and-forget, non-blocking for the caller)
  try {
    const cognate = await detectCognate(lemma, language);
    if (cognate) entry = { ...entry, cognate };
  } catch {
    // cognate detection is best-effort; never fail the main lookup
  }

  // 6. Persist to cache
  await setCached(entry);

  return entry;
}
