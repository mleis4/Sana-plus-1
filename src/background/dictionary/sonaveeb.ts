import type { DictEntry } from '../../shared/types';
import { SONAVEEB_API_BASE } from '../../shared/constants';

// Sõnaveeb (sonaveeb.ee) — official Estonian dictionary maintained by EKI.
// Uses the undocumented but stable JSON API exposed by the public web interface.
// Endpoint pattern: GET /search/unif/dlall/dsall/{word}/1
// Returns a JSON array of word entries with definitions.

type SonaveebMeaning = {
  definition?: string;
  examples?: Array<{ example?: string }>;
  partOfSpeech?: string;
};

type SonaveebWordData = {
  wordForms?: Array<{ value?: string }>;
  meanings?: SonaveebMeaning[];
  partOfSpeech?: string;
};

type SonaveebSearchResult = {
  wordData?: SonaveebWordData;
  estonianWord?: string;
};

type SonaveebResponse = {
  searchResults?: SonaveebSearchResult[];
};

export async function lookupSonaveeb(lemma: string): Promise<DictEntry | null> {
  const url = `${SONAVEEB_API_BASE}/${encodeURIComponent(lemma)}/1`;
  let resp: Response;
  try {
    resp = await fetch(url, {
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    });
  } catch {
    return null;
  }
  if (!resp.ok) return null;

  let data: SonaveebResponse;
  try {
    data = await resp.json() as SonaveebResponse;
  } catch {
    return null;
  }

  const results = data.searchResults ?? [];
  if (results.length === 0) return null;

  const first = results[0];
  const wordData = first.wordData;
  if (!wordData) return null;

  const definitions: string[] = [];
  const examples: string[] = [];
  let partOfSpeech = wordData.partOfSpeech?.toLowerCase() ?? 'unknown';

  for (const meaning of wordData.meanings ?? []) {
    if (meaning.definition) definitions.push(meaning.definition);
    if (meaning.partOfSpeech) partOfSpeech = meaning.partOfSpeech.toLowerCase();
    for (const ex of meaning.examples ?? []) {
      if (ex.example) examples.push(ex.example);
    }
  }

  if (definitions.length === 0) return null;

  return {
    lemma,
    language: 'et',
    partOfSpeech,
    definitions,
    examples: examples.slice(0, 3),
  };
}
