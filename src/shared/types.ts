export type Language = 'fi' | 'et';

export type MorphAnalysis = {
  lemma: string;
  partOfSpeech: string;
  form: string;
  displayForm: string;
};

export type DictEntry = {
  lemma: string;
  language: Language;
  partOfSpeech: string;
  definitions: string[];
  examples: string[];
  cognate?: {
    language: Language;
    word: string;
    exact: boolean;
  };
  inflectionTable?: Record<string, string>;
  cachedAt?: number;
};

export type AssessmentResult = {
  id: string;
  phraseId: string;
  score: 0 | 0.5 | 1;
  attemptedAt: number;
  userAnswer: string;
  expectedAnswer: string;
};

export type PhraseRecord = {
  id: string;
  lemma: string;
  language: Language;
  definition: string;
  partOfSpeech: string;
  frequencyTier: number;
  confidenceLevel: 0 | 1 | 2 | 3 | 4;
  assessmentHistory: AssessmentResult[];
  addedAt: number;
  lastSeenAt: number;
  nextReviewAt: number;
};

export type Settings = {
  language: Language;
  replacementIntensity: number;
  blacklist: string[];
  ttsVoice: string;
  replacementEnabled: boolean;
};

export type PhraseBankStats = {
  wordsSeen: { today: number; week: number; total: number };
  streak: number;
  confidenceDistribution: Record<number, number>;
  totalWords: number;
};

// Discriminated union of all inter-context messages
export type Message =
  | { type: 'ANALYZE'; word: string; language: Language }
  | { type: 'LOOKUP'; lemma: string; language: Language }
  | { type: 'ADD_TO_PHRASE_BANK'; lemma: string; language: Language; definition: string; partOfSpeech: string; frequencyTier: number }
  | { type: 'GET_PHRASE_BANK'; language: Language }
  | { type: 'DELETE_PHRASE'; id: string }
  | { type: 'RESET_CONFIDENCE'; id: string }
  | { type: 'SUBMIT_ASSESSMENT'; phraseId: string; userAnswer: string; expectedAnswer: string; score: 0 | 0.5 | 1 }
  | { type: 'GET_NEXT_ASSESSMENT'; language: Language }
  | { type: 'GET_STATS'; language: Language }
  | { type: 'GET_SETTINGS' }
  | { type: 'SET_SETTINGS'; settings: Partial<Settings> }
  | { type: 'GET_FREQUENCY_TIER'; lemma: string; language: Language }
  | { type: 'STATS_UPDATED' }
  | { type: 'SETTINGS_CHANGED'; settings: Settings };

export type AnalyzeResult = {
  morphAnalyses: MorphAnalysis[];
  dictEntry: DictEntry | null;
};

export type MessageResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
