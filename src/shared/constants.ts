import type { Language, Settings } from './types';

export const DB_NAME = 'sana-plus-one';
export const DB_VERSION = 1;

export const STORE_DICT_CACHE = 'dict-cache';
export const STORE_PHRASE_BANK = 'phrase-bank';
export const STORE_ASSESSMENT = 'assessments';

export const DEFAULT_CONFIDENCE = 0 as const;

export const SRS_INTERVALS_HOURS: Record<0 | 1 | 2 | 3 | 4, number> = {
  0: 0,
  1: 4,
  2: 24,
  3: 72,
  4: 168,
};

export const DICT_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const WIKTIONARY_API_BASE = 'https://en.wiktionary.org/api/rest_v1/page/definition';
export const KOTUS_API_BASE = 'https://api.kotus.fi/sanasto';
export const SONAVEEB_API_BASE = 'https://sonaveeb.ee/search/unif/dlall/dsall';

export const SUPPORTED_LANGUAGES: Language[] = ['fi', 'et'];

export const REPLACEMENT_INTENSITY_MIN = 10;
export const REPLACEMENT_INTENSITY_MAX = 30;

export const DEFAULT_SETTINGS: Settings = {
  language: 'fi',
  replacementIntensity: 20,
  blacklist: [],
  ttsVoice: '',
  replacementEnabled: false,
};
