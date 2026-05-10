import type { MorphAnalysis } from '../../shared/types';
import { getMorphLabel } from '../../shared/morphLabels';

// Raw analysis object returned by the Vabamorf C++ analyzer (via Emscripten WASM)
type VabamorfRawAnalysis = {
  root: string;
  ending: string;
  clitic: string;
  partofspeech: string;
  form: string;
};

type VabamorfRawResult = {
  word: string;
  analysis: VabamorfRawAnalysis[];
};

// Vabamorf part-of-speech codes → human-readable strings
const POS_MAP: Record<string, string> = {
  S: 'noun',
  V: 'verb',
  A: 'adjective',
  D: 'adverb',
  P: 'pronoun',
  N: 'numeral',
  K: 'adposition',
  J: 'conjunction',
  G: 'adjective',  // indeclinable adjective
  H: 'proper noun',
  X: 'particle',
  Y: 'abbreviation',
  Z: 'punctuation',
  I: 'interjection',
  B: 'adverb',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wasmModule: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let analyzeWrapper: ((word: string) => string) | null = null;

async function getWasm() {
  if (wasmModule) return wasmModule;

  // Dynamically import the Emscripten glue — the .data and .wasm are loaded
  // automatically relative to vabamorf.js via Emscripten's locateFile mechanism.
  const { default: VabamorfModule } = await import('../../wasm/vabamorf/vabamorf.js');
  wasmModule = await VabamorfModule();
  analyzeWrapper = wasmModule.cwrap('analyze', 'string', ['string']) as (word: string) => string;
  return wasmModule;
}

export async function analyzeWithVabamorf(word: string): Promise<MorphAnalysis[]> {
  await getWasm();
  if (!analyzeWrapper) return [];

  let jsonStr: string;
  try {
    jsonStr = analyzeWrapper(word);
  } catch {
    return [];
  }

  let parsed: VabamorfRawResult[];
  try {
    parsed = JSON.parse(jsonStr) as VabamorfRawResult[];
  } catch {
    return [];
  }

  const results: MorphAnalysis[] = [];
  for (const entry of parsed) {
    for (const analysis of entry.analysis) {
      const lemma = analysis.root + (analysis.ending ? '' : '');  // root is already the lemma form
      const form = analysis.form;
      results.push({
        lemma: analysis.root,
        partOfSpeech: POS_MAP[analysis.partofspeech] ?? analysis.partofspeech,
        form,
        displayForm: getMorphLabel(form, 'et'),
      });
    }
  }
  return results;
}
