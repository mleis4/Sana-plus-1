import { getDb } from './db';
import type { DictEntry, Language } from '../shared/types';
import { STORE_DICT_CACHE, DICT_CACHE_TTL_MS } from '../shared/constants';

function cacheKey(lemma: string, language: Language): string {
  return `${language}:${lemma.toLowerCase()}`;
}

export async function getCached(lemma: string, language: Language): Promise<DictEntry | null> {
  const db = await getDb();
  const entry = await db.get(STORE_DICT_CACHE, cacheKey(lemma, language)) as DictEntry | undefined;
  if (!entry) return null;
  if (!entry.cachedAt || Date.now() - entry.cachedAt > DICT_CACHE_TTL_MS) {
    await db.delete(STORE_DICT_CACHE, cacheKey(lemma, language));
    return null;
  }
  return entry;
}

export async function setCached(entry: DictEntry): Promise<void> {
  const db = await getDb();
  await db.put(STORE_DICT_CACHE, { ...entry, cachedAt: Date.now() }, cacheKey(entry.lemma, entry.language));
}
