import React from 'react';

type Props = {
  level: 0 | 1 | 2 | 3 | 4;
};

const SEGMENT_COLORS = [
  'bg-red-500',
  'bg-orange-400',
  'bg-yellow-400',
  'bg-lime-400',
  'bg-green-500',
];

const LABELS = ['Never assessed', 'Beginner', 'Familiar', 'Good', 'Well known'];

export function ConfidenceBar({ level }: Props) {
  return (
    <div className="flex items-center gap-0.5" title={LABELS[level]}>
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={`h-2 w-3.5 rounded-sm ${i <= level ? SEGMENT_COLORS[level] : 'bg-gray-200'}`}
        />
      ))}
    </div>
  );
}
