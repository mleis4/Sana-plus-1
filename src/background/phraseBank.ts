import { getDb } from './db';
import type { PhraseRecord, AssessmentResult, Language, PhraseBankStats } from '../shared/types';
import {
  STORE_PHRASE_BANK,
  STORE_ASSESSMENT,
  DEFAULT_CONFIDENCE,
  SRS_INTERVALS_HOURS,
} from '../shared/constants';

type NewPhraseInput = Pick<PhraseRecord, 'lemma' | 'language' | 'definition' | 'partOfSpeech' | 'frequencyTier'>;

export async function addPhrase(input: NewPhraseInput): Promise<PhraseRecord> {
  const db = await getDb();
  const now = Date.now();
  const phrase: PhraseRecord = {
    ...input,
    id: `${input.language}-${input.lemma}-${now}`,
    confidenceLevel: DEFAULT_CONFIDENCE,
    assessmentHistory: [],
    addedAt: now,
    lastSeenAt: now,
    nextReviewAt: now,
  };
  await db.put(STORE_PHRASE_BANK, phrase);
  return phrase;
}

export async function getPhrases(language: Language): Promise<PhraseRecord[]> {
  const db = await getDb();
  return db.getAllFromIndex(STORE_PHRASE_BANK, 'language', language) as Promise<PhraseRecord[]>;
}

export async function deletePhrase(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_PHRASE_BANK, id);
}

export async function resetConfidence(id: string): Promise<void> {
  const db = await getDb();
  const record = await db.get(STORE_PHRASE_BANK, id) as PhraseRecord | undefined;
  if (!record) return;
  await db.put(STORE_PHRASE_BANK, {
    ...record,
    confidenceLevel: DEFAULT_CONFIDENCE,
    nextReviewAt: Date.now(),
    assessmentHistory: [],
  });
}

export async function getNextForAssessment(language: Language): Promise<PhraseRecord | null> {
  const db = await getDb();
  const now = Date.now();
  const all = await db.getAllFromIndex(STORE_PHRASE_BANK, 'language', language) as PhraseRecord[];
  const due = all
    .filter(p => p.nextReviewAt <= now)
    .sort((a, b) => a.confidenceLevel - b.confidenceLevel || a.nextReviewAt - b.nextReviewAt);
  return due[0] ?? null;
}

export async function submitAssessment(
  phraseId: string,
  userAnswer: string,
  expectedAnswer: string,
  score: 0 | 0.5 | 1,
): Promise<void> {
  const db = await getDb();
  const record = await db.get(STORE_PHRASE_BANK, phraseId) as PhraseRecord | undefined;
  if (!record) return;

  const result: AssessmentResult = {
    id: `${phraseId}-${Date.now()}`,
    phraseId,
    score,
    attemptedAt: Date.now(),
    userAnswer,
    expectedAnswer,
  };

  const delta = score >= 0.5 ? 1 : -1;
  const newConfidence = Math.min(4, Math.max(0, record.confidenceLevel + delta)) as 0 | 1 | 2 | 3 | 4;
  const intervalMs = SRS_INTERVALS_HOURS[newConfidence] * 60 * 60 * 1000;

  await db.put(STORE_PHRASE_BANK, {
    ...record,
    confidenceLevel: newConfidence,
    lastSeenAt: Date.now(),
    nextReviewAt: Date.now() + intervalMs,
    assessmentHistory: [...record.assessmentHistory, result],
  });
  await db.put(STORE_ASSESSMENT, result);
}

export async function getStats(language: Language): Promise<PhraseBankStats> {
  const db = await getDb();
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const all = await db.getAllFromIndex(STORE_PHRASE_BANK, 'language', language) as PhraseRecord[];
  const assessments = await db.getAll(STORE_ASSESSMENT) as AssessmentResult[];

  const confidenceDistribution: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const p of all) confidenceDistribution[p.confidenceLevel]++;

  let streak = 0;
  const checkDate = new Date();
  checkDate.setHours(0, 0, 0, 0);
  while (true) {
    const dayStart = checkDate.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const hasActivity = assessments.some(a => a.attemptedAt >= dayStart && a.attemptedAt < dayEnd);
    if (!hasActivity) break;
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return {
    wordsSeen: {
      today: assessments.filter(a => a.attemptedAt >= todayStart).length,
      week: assessments.filter(a => a.attemptedAt >= weekStart).length,
      total: assessments.length,
    },
    streak,
    confidenceDistribution,
    totalWords: all.length,
  };
}
