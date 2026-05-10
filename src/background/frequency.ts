import type { Language } from '../shared/types';

let fiFrequency: Record<string, number> | null = null;
let etFrequency: Record<string, number> | null = null;

async function loadFrequency(language: Language): Promise<Record<string, number>> {
  if (language === 'fi') {
    if (!fiFrequency) {
      const mod = await import('../../data/fi-frequency.json');
      fiFrequency = mod.default as Record<string, number>;
    }
    return fiFrequency;
  }
  if (!etFrequency) {
    const mod = await import('../../data/et-frequency.json');
    etFrequency = mod.default as Record<string, number>;
  }
  return etFrequency;
}

export async function getFrequencyTier(lemma: string, language: Language): Promise<number> {
  const freq = await loadFrequency(language);
  return freq[lemma.toLowerCase()] ?? 5;
}
