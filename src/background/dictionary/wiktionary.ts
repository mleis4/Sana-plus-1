import type { DictEntry, Language } from '../../shared/types';
import { WIKTIONARY_API_BASE } from '../../shared/constants';

// Language section headers as they appear in Wiktionary responses
const LANG_SECTION: Record<Language, string> = {
  fi: 'Finnish',
  et: 'Estonian',
};

type WiktionaryDefinition = {
  definition: string;
  parsedExamples?: Array<{ example: string }>;
  examples?: string[];
};

type WiktionarySection = {
  partOfSpeech: string;
  language: string;
  definitions: WiktionaryDefinition[];
};

type WiktionaryResponse = Record<string, WiktionarySection[]>;

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

export async function lookupWiktionary(lemma: string, language: Language): Promise<DictEntry | null> {
  const url = `${WIKTIONARY_API_BASE}/${encodeURIComponent(lemma)}`;
  let resp: Response;
  try {
    resp = await fetch(url);
  } catch {
    return null;
  }
  if (!resp.ok) return null;

  let data: WiktionaryResponse;
  try {
    data = await resp.json() as WiktionaryResponse;
  } catch {
    return null;
  }

  const langKey = LANG_SECTION[language];
  const sections = data[language] ?? [];
  const langSection = sections.find(s => s.language === langKey);
  if (!langSection) return null;

  const definitions: string[] = [];
  const examples: string[] = [];
  const inflectionTable: Record<string, string> = {};

  for (const def of langSection.definitions) {
    const clean = stripHtml(def.definition);
    if (clean) definitions.push(clean);

    const examplesFromDef = def.parsedExamples ?? [];
    for (const ex of examplesFromDef) {
      if (ex.example) examples.push(stripHtml(ex.example));
    }
    if (def.examples) {
      for (const ex of def.examples) {
        examples.push(stripHtml(ex));
      }
    }
  }

  if (definitions.length === 0) return null;

  return {
    lemma,
    language,
    partOfSpeech: langSection.partOfSpeech.toLowerCase(),
    definitions,
    examples: examples.slice(0, 3),
    inflectionTable: Object.keys(inflectionTable).length > 0 ? inflectionTable : undefined,
  };
}
