import React from 'react';
import type { MorphAnalysis, Language } from '../../shared/types';
import { getMorphLabel } from '../../shared/morphLabels';

type Props = {
  analysis: MorphAnalysis;
  language: Language;
};

const POS_COLORS: Record<string, string> = {
  noun: 'bg-blue-100 text-blue-700',
  verb: 'bg-purple-100 text-purple-700',
  adjective: 'bg-green-100 text-green-700',
  adverb: 'bg-yellow-100 text-yellow-700',
  pronoun: 'bg-pink-100 text-pink-700',
  numeral: 'bg-orange-100 text-orange-700',
};

export function MorphBreakdown({ analysis, language }: Props) {
  const posColor = POS_COLORS[analysis.partOfSpeech] ?? 'bg-gray-100 text-gray-600';
  // getMorphLabel provides full explanatory text; fall back to displayForm stored during analysis
  const label = getMorphLabel(analysis.form, language);

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-sm font-semibold">{analysis.lemma}</span>
        {analysis.partOfSpeech && (
          <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${posColor}`}>
            {analysis.partOfSpeech}
          </span>
        )}
      </div>
      {analysis.form && (
        <p className="text-xs text-gray-600 leading-snug">
          <span className="font-mono text-gray-400">{analysis.form}</span>
          {label !== analysis.form && (
            <span className="ml-1 text-gray-600">— {label}</span>
          )}
        </p>
      )}
    </div>
  );
}
