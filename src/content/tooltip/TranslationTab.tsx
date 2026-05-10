import React from 'react';
import type { DictEntry } from '../../shared/types';

type Props = { entry: DictEntry };

const POS_COLORS: Record<string, string> = {
  noun: 'bg-blue-100 text-blue-700',
  verb: 'bg-purple-100 text-purple-700',
  adjective: 'bg-green-100 text-green-700',
  adverb: 'bg-yellow-100 text-yellow-700',
  pronoun: 'bg-pink-100 text-pink-700',
};

export function TranslationTab({ entry }: Props) {
  const posColor = POS_COLORS[entry.partOfSpeech] ?? 'bg-gray-100 text-gray-600';

  return (
    <div className="p-3 space-y-2">
      <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${posColor}`}>
        {entry.partOfSpeech}
      </span>

      <ol className="list-decimal list-inside space-y-1">
        {entry.definitions.map((def, i) => (
          <li key={i} className="text-sm text-gray-800 leading-snug">
            {def}
          </li>
        ))}
      </ol>

      {entry.examples[0] && (
        <p className="border-l-2 border-gray-200 pl-2 text-xs text-gray-500 italic">
          {entry.examples[0]}
        </p>
      )}
    </div>
  );
}
