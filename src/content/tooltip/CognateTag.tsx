import React from 'react';
import type { DictEntry } from '../../shared/types';

type Props = {
  cognate: DictEntry['cognate'];
};

export function CognateTag({ cognate }: Props) {
  if (!cognate) return null;
  const flag = cognate.language === 'fi' ? '🇫🇮' : '🇪🇪';
  const label = cognate.language === 'fi' ? 'Finnish' : 'Estonian';
  return (
    <span
      title={`Cognate in ${label}: ${cognate.word} (${cognate.exact ? 'exact match' : 'near match'})`}
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium leading-none ${
        cognate.exact
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-amber-100 text-amber-700'
      }`}
    >
      {flag} {cognate.word} {cognate.exact ? '✓' : '~'}
    </span>
  );
}
