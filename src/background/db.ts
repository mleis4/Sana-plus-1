import { openDB, IDBPDatabase } from 'idb';
import {
  DB_NAME,
  DB_VERSION,
  STORE_DICT_CACHE,
  STORE_PHRASE_BANK,
  STORE_ASSESSMENT,
} from '../shared/constants';

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_DICT_CACHE)) {
          db.createObjectStore(STORE_DICT_CACHE);
        }
        if (!db.objectStoreNames.contains(STORE_PHRASE_BANK)) {
          const phraseStore = db.createObjectStore(STORE_PHRASE_BANK, { keyPath: 'id' });
          phraseStore.createIndex('language', 'language');
          phraseStore.createIndex('nextReviewAt', 'nextReviewAt');
        }
        if (!db.objectStoreNames.contains(STORE_ASSESSMENT)) {
          const assessmentStore = db.createObjectStore(STORE_ASSESSMENT, { keyPath: 'id' });
          assessmentStore.createIndex('phraseId', 'phraseId');
        }
      },
    });
  }
  return dbPromise;
}
