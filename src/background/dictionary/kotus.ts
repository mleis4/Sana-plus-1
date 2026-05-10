import type { DictEntry } from '../../shared/types';
import { KOTUS_API_BASE } from '../../shared/constants';

// Kotus (Institute for the Languages of Finland) REST API
// Endpoint: GET /sanasto/{word}
// Returns word entries with Finnish definitions and metadata.
// Used as a Finnish-specific fallback when Wiktionary returns no result.

type KotusEntry = {
  id?: string;
  word?: string;
  definitions?: Array<{ definition?: string; examples?: string[] }>;
  partOfSpeech?: string;
};

export async function lookupKotus(lemma: string): Promise<DictEntry | null> {
  const url = `${KOTUS_API_BASE}/${encodeURIComponent(lemma)}`;
  let resp: Response;
  try {
    resp = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
  } catch {
    return null;
  }
  if (!resp.ok) return null;

  let data: KotusEntry | KotusEntry[];
  try {
    data = await resp.json() as KotusEntry | KotusEntry[];
  } catch {
    return null;
  }

  const entries = Array.isArray(data) ? data : [data];
  if (entries.length === 0) return null;

  const entry = entries[0];
  const definitions: string[] = [];
  const examples: string[] = [];

  for (const def of entry.definitions ?? []) {
    if (def.definition) definitions.push(def.definition);
    for (const ex of def.examples ?? []) {
      examples.push(ex);
    }
  }

  if (definitions.length === 0) return null;

  return {
    lemma,
    language: 'fi',
    partOfSpeech: entry.partOfSpeech?.toLowerCase() ?? 'unknown',
    definitions,
    examples: examples.slice(0, 3),
  };
}
