import type { Message, MessageResponse, AnalyzeResult, Settings } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/constants';
import { analyze } from './lemmatizer/index';
import { lookupLemma } from './dictionary/index';
import {
  addPhrase,
  getPhrases,
  deletePhrase,
  resetConfidence,
  getNextForAssessment,
  submitAssessment,
  getStats,
} from './phraseBank';
import { getFrequencyTier } from './frequency';

type SendResponse = (response: MessageResponse<unknown>) => void;

function ok<T>(data: T): MessageResponse<T> {
  return { success: true, data };
}

function fail(error: unknown): MessageResponse<never> {
  return { success: false, error: String(error) };
}

async function getSettings(): Promise<Settings> {
  return new Promise(resolve => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, items => {
      resolve(items as Settings);
    });
  });
}

async function setSettings(partial: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const merged = { ...current, ...partial };
  return new Promise(resolve => {
    chrome.storage.sync.set(merged, () => resolve(merged));
  });
}

// Broadcast a message to all extension contexts (side panel, content scripts)
function broadcast(message: Message): void {
  chrome.runtime.sendMessage(message).catch(() => {
    // No listeners — that's fine; side panel may be closed
  });
}

export async function handleMessage(message: Message, sendResponse: SendResponse): Promise<void> {
  try {
    switch (message.type) {
      case 'ANALYZE': {
        const morphAnalyses = await analyze(message.word, message.language);
        const primaryLemma = morphAnalyses[0]?.lemma ?? message.word;
        const dictEntry = await lookupLemma(primaryLemma, message.language);
        const result: AnalyzeResult = { morphAnalyses, dictEntry };
        sendResponse(ok(result));
        break;
      }

      case 'LOOKUP': {
        const dictEntry = await lookupLemma(message.lemma, message.language);
        sendResponse(ok(dictEntry));
        break;
      }

      case 'ADD_TO_PHRASE_BANK': {
        const phrase = await addPhrase({
          lemma: message.lemma,
          language: message.language,
          definition: message.definition,
          partOfSpeech: message.partOfSpeech,
          frequencyTier: message.frequencyTier,
        });
        sendResponse(ok(phrase));
        broadcast({ type: 'STATS_UPDATED' });
        break;
      }

      case 'GET_PHRASE_BANK': {
        const phrases = await getPhrases(message.language);
        sendResponse(ok(phrases));
        break;
      }

      case 'DELETE_PHRASE': {
        await deletePhrase(message.id);
        sendResponse(ok(null));
        broadcast({ type: 'STATS_UPDATED' });
        break;
      }

      case 'RESET_CONFIDENCE': {
        await resetConfidence(message.id);
        sendResponse(ok(null));
        broadcast({ type: 'STATS_UPDATED' });
        break;
      }

      case 'SUBMIT_ASSESSMENT': {
        await submitAssessment(
          message.phraseId,
          message.userAnswer,
          message.expectedAnswer,
          message.score,
        );
        sendResponse(ok(null));
        broadcast({ type: 'STATS_UPDATED' });
        break;
      }

      case 'GET_NEXT_ASSESSMENT': {
        const next = await getNextForAssessment(message.language);
        sendResponse(ok(next));
        break;
      }

      case 'GET_STATS': {
        const stats = await getStats(message.language);
        sendResponse(ok(stats));
        break;
      }

      case 'GET_SETTINGS': {
        const settings = await getSettings();
        sendResponse(ok(settings));
        break;
      }

      case 'SET_SETTINGS': {
        const updated = await setSettings(message.settings);
        sendResponse(ok(updated));
        broadcast({ type: 'SETTINGS_CHANGED', settings: updated });
        break;
      }

      case 'GET_FREQUENCY_TIER': {
        const tier = await getFrequencyTier(message.lemma, message.language);
        sendResponse(ok(tier));
        break;
      }

      // These are outbound broadcast messages, not inbound requests
      case 'STATS_UPDATED':
      case 'SETTINGS_CHANGED':
        sendResponse(ok(null));
        break;

      default: {
        // TypeScript exhaustiveness: if the union is fully handled, `message`
        // has type `never` here and this line will not compile if a case is missing.
        const _exhaustive: never = message;
        sendResponse(fail(`Unknown message type: ${(_exhaustive as Message).type}`));
      }
    }
  } catch (err) {
    sendResponse(fail(err));
  }
}
