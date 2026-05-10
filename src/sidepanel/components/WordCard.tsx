import React from 'react';
import type { PhraseRecord } from '../../shared/types';
import { ConfidenceBar } from './ConfidenceBar';

type Props = {
  phrase: PhraseRecord;
  onDelete: (id: string) => void;
  onResetConfidence: (id: string) => void;
};

const SCORE_COLORS: Record<number, string> = {
  1: 'bg-green-400',
  0.5: 'bg-yellow-400',
  0: 'bg-red-400',
};

export function WordCard({ phrase, onDelete, onResetConfidence }: Props) {
  const history = phrase.assessmentHistory.slice(-10);

  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base font-semibold">{phrase.lemma}</h3>
          <p className="text-sm text-gray-600 leading-snug">{phrase.definition}</p>
        </div>
        <ConfidenceBar level={phrase.confidenceLevel} />
      </div>

      {/* Metadata row */}
      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span className="capitalize">{phrase.partOfSpeech}</span>
        <span>Tier {phrase.frequencyTier}</span>
        <span>Added {new Date(phrase.addedAt).toLocaleDateString()}</span>
        <span>Last seen {new Date(phrase.lastSeenAt).toLocaleDateString()}</span>
      </div>

      {/* Assessment sparkline */}
      {history.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 shrink-0">History</span>
          <div className="flex gap-0.5">
            {history.map((r, i) => (
              <div
                key={i}
                title={`Score: ${r.score} — ${new Date(r.attemptedAt).toLocaleDateString()}`}
                className={`h-3 w-3 rounded-sm ${SCORE_COLORS[r.score] ?? 'bg-gray-300'}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onResetConfidence(phrase.id)}
          className="rounded px-2.5 py-1 text-xs border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          Reset confidence
        </button>
        <button
          onClick={() => onDelete(phrase.id)}
          className="rounded px-2.5 py-1 text-xs border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
