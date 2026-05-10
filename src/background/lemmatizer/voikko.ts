import type { MorphAnalysis } from '../../shared/types';
import { getMorphLabel } from '../../shared/morphLabels';

// Voikko Finnish word class codes → normalized part-of-speech strings
const POS_MAP: Record<string, string> = {
  nimisana: 'noun',
  teonsana: 'verb',
  adjektiivi: 'adjective',
  asemosana: 'pronoun',
  lukusana: 'numeral',
  seikkasana: 'adverb',
  sidesana: 'conjunction',
  suhdesana: 'adposition',
  huudahdussana: 'interjection',
  etuliite: 'prefix',
  lyhenne: 'abbreviation',
};

// Voikko Finnish case name (SIJAMUOTO) → compact tag abbreviation
const CASE_MAP: Record<string, string> = {
  nimitapaus: 'nom',
  omistustapaus: 'gen',
  osastapaus: 'par',
  olento: 'ess',
  tulento: 'tra',
  sisaolento: 'ine',
  sisatulento: 'ill',
  sisaeronto: 'ela',
  ulkoolento: 'ade',
  ulkotulento: 'all',
  ulkoeronto: 'abl',
  vajanto: 'abe',
  seuranto: 'com',
  keinonto: 'ins',
  kohdanto: 'acc',
};

// Voikko number (NUMBER) → compact tag
const NUMBER_MAP: Record<string, string> = {
  'yksikkö': 'sg',
  'monikko': 'pl',
};

// Voikko mood (MOOD) → compact tag used to build verb form strings
const MOOD_MAP: Record<string, string> = {
  'A-infinitiivi': 'inf a',
  'E-infinitiivi': 'inf e',
  'MA-infinitiivi': 'inf ma',
  'indicative': 'ps',
  'conditional': 'ps cond',
  'imperative': 'ps impr',
  'potential': 'ps potn',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let voikkoInstance: any = null;

async function getVoikko() {
  if (voikkoInstance) return voikkoInstance;
  // libvoikko-js ships its own WASM binary — import triggers WASM load
  const { default: Libvoikko } = await import('libvoikko');
  voikkoInstance = await Libvoikko.init('fi');
  return voikkoInstance;
}

function buildForm(raw: Record<string, string>): string {
  const mood = raw['MOOD'];
  const sijamuoto = raw['SIJAMUOTO'];
  const numberRaw = raw['NUMBER'];
  const num = numberRaw ? (NUMBER_MAP[numberRaw] ?? 'sg') : 'sg';

  // Infinitive forms
  if (mood === 'A-infinitiivi') return 'inf a';
  if (mood === 'E-infinitiivi') return 'inf e';
  if (mood === 'MA-infinitiivi') return 'inf ma';

  // Nominal case forms
  if (sijamuoto) {
    const caseTag = CASE_MAP[sijamuoto] ?? sijamuoto;
    return `${num} ${caseTag}`;
  }

  // Finite verb forms
  if (mood && mood !== 'indicative') {
    const moodTag = MOOD_MAP[mood] ?? mood;
    const voice = raw['VOICE'];
    const neg = raw['NEGATIVE'];
    if (voice === 'passive') {
      return `pp ${moodTag.split(' ').pop() ?? moodTag}`;
    }
    return `${moodTag} ${neg === 'yes' ? 'neg' : 'af'}`;
  }

  // Indicative finite verbs
  if (mood === 'indicative' || raw['TENSE']) {
    const person = raw['PERSON'];
    const voice = raw['VOICE'];
    const tense = raw['TENSE'];
    const neg = raw['NEGATIVE'];
    const tenseTag = tense === 'past_simple' ? 'past' : 'pres';

    if (voice === 'passive') return `pp ${tenseTag}`;

    if (person) {
      return `ps${person} ${num} ${neg === 'yes' ? 'neg' : 'af'}`;
    }
    return `ps ${tenseTag} ${neg === 'yes' ? 'neg' : 'af'}`;
  }

  // Participles
  const participle = raw['PARTICIPLE'];
  if (participle) {
    const voice = raw['VOICE'];
    const pfx = voice === 'passive' ? 'pcp1 pp' : 'pcp1 af';
    if (participle === 'present_active') return 'pcp1 af';
    if (participle === 'past_active') return 'pcp2 af';
    if (participle === 'present_passive') return 'pcp1 pp';
    if (participle === 'past_passive') return 'pcp2 pp';
    if (participle === 'agent') return 'pcp agent';
    if (participle === 'negation') return 'pcp neg';
    return pfx;
  }

  return '';
}

export async function analyzeWithVoikko(word: string): Promise<MorphAnalysis[]> {
  const voikko = await getVoikko();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: Array<Record<string, string>> = voikko.analyze(word);
  if (!results || results.length === 0) return [];

  return results.map(r => {
    const lemma = r['BASEFORM'] ?? word;
    const partOfSpeech = POS_MAP[r['CLASS'] ?? ''] ?? r['CLASS'] ?? '';
    const form = buildForm(r);
    return {
      lemma,
      partOfSpeech,
      form,
      displayForm: getMorphLabel(form, 'fi'),
    };
  });
}
