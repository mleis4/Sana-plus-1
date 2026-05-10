import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Language, PhraseRecord } from '../../shared/types';

type Props = { language: Language };
type Phase = 'loading' | 'answering' | 'revealing' | 'empty';

function sendMsg<T>(msg: object): Promise<T> {
  return new Promise(resolve =>
    chrome.runtime.sendMessage(msg, r => resolve(r?.success ? r.data : null)),
  );
}

function scoreAnswer(userAnswer: string, expected: string): 0 | 0.5 | 1 {
  const a = userAnswer.trim().toLowerCase();
  const e = expected.trim().toLowerCase();
  if (a === e) return 1;
  // Partial credit: at least one content word from the expected answer matches
  const aWords = new Set(a.split(/\W+/).filter(w => w.length > 2));
  const eWords = e.split(/\W+/).filter(w => w.length > 2);
  const hasWordMatch = eWords.some(w => aWords.has(w));
  return hasWordMatch ? 0.5 : 0;
}

const SCORE_STYLES: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', label: 'Correct ✓' },
  0.5: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', label: 'Close — partial credit' },
  0: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: 'Incorrect ✗' },
};

export function Assessment({ language }: Props) {
  const [phrase, setPhrase] = useState<PhraseRecord | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState<0 | 0.5 | 1>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadNext = useCallback(async () => {
    setPhase('loading');
    setAnswer('');
    const next = await sendMsg<PhraseRecord | null>({ type: 'GET_NEXT_ASSESSMENT', language });
    setPhrase(next);
    setPhase(next ? 'answering' : 'empty');
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [language]);

  useEffect(() => { loadNext(); }, [loadNext]);

  function handleReveal() {
    if (!phrase) return;
    setScore(scoreAnswer(answer, phrase.definition));
    setPhase('revealing');
  }

  async function handleNext() {
    if (!phrase) return;
    await sendMsg({
      type: 'SUBMIT_ASSESSMENT',
      phraseId: phrase.id,
      userAnswer: answer,
      expectedAnswer: phrase.definition,
      score,
    });
    loadNext();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      if (phase === 'answering' && answer.trim()) handleReveal();
      else if (phase === 'revealing') handleNext();
    }
  }

  if (phase === 'loading') {
    return <div className="flex items-center justify-center h-full text-sm text-gray-400">Loading…</div>;
  }

  if (phase === 'empty') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
        <span className="text-5xl">🎉</span>
        <p className="font-semibold">All caught up!</p>
        <p className="text-sm text-gray-500">No words are due for review right now.</p>
        <button
          onClick={loadNext}
          className="mt-1 rounded-md border px-4 py-1.5 text-sm hover:bg-gray-50 transition-colors"
        >
          Check again
        </button>
      </div>
    );
  }

  const style = SCORE_STYLES[score];

  return (
    <div className="p-5 space-y-5">
      {/* Word prompt */}
      <div className="text-center space-y-1">
        <p className="text-xs text-gray-400 uppercase tracking-wide">What does this mean?</p>
        <p className="text-3xl font-bold">{phrase?.lemma}</p>
        <p className="text-xs text-gray-400">
          {phrase?.partOfSpeech} · tier {phrase?.frequencyTier}
        </p>
      </div>

      {/* Answer input */}
      <input
        ref={inputRef}
        type="text"
        value={answer}
        onChange={e => setAnswer(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type the English meaning…"
        disabled={phase === 'revealing'}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400"
      />

      {phase === 'answering' && (
        <button
          onClick={handleReveal}
          disabled={!answer.trim()}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          Reveal
        </button>
      )}

      {phase === 'revealing' && (
        <div className="space-y-3">
          <div className={`rounded-lg border p-3 space-y-2 ${style.bg}`}>
            <p className={`text-sm font-semibold ${style.text}`}>{style.label}</p>
            <p className="text-xs text-gray-600">
              Expected:{' '}
              <span className="font-medium text-gray-800">{phrase?.definition}</span>
            </p>
            {answer.trim().toLowerCase() !== phrase?.definition.trim().toLowerCase() && (
              <p className="text-xs text-gray-500">
                Your answer:{' '}
                <span className="font-medium text-gray-700">{answer || '(blank)'}</span>
              </p>
            )}
          </div>

          <button
            onClick={handleNext}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      <p className="text-center text-xs text-gray-400">Press Enter to advance</p>
    </div>
  );
}
