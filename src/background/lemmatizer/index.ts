import type { MorphAnalysis, Language } from '../../shared/types';
import { analyzeWithVoikko } from './voikko';
import { analyzeWithVabamorf } from './vabamorf';

export async function analyze(word: string, language: Language): Promise<MorphAnalysis[]> {
  if (language === 'fi') {
    return analyzeWithVoikko(word);
  }
  return analyzeWithVabamorf(word);
}
