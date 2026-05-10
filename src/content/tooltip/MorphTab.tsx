import React from 'react';
import type { DictEntry, Language, MorphAnalysis } from '../../shared/types';
import { MorphBreakdown } from '../../sidepanel/components/MorphBreakdown';

type Props = {
  analyses: MorphAnalysis[];
  entry: DictEntry | null;
  language: Language;
};

export function MorphTab({ analyses, entry, language }: Props) {
  const [primary, ...rest] = analyses;

  return (
    <div className="p-3 space-y-3">
      {primary ? (
        <MorphBreakdown analysis={primary} language={language} />
      ) : (
        <p className="text-xs text-gray-400">No morphological analysis available.</p>
      )}

      {rest.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-400 hover:text-gray-600">
            {rest.length} alternative{rest.length > 1 ? 's' : ''}
          </summary>
          <div className="mt-2 space-y-2 pl-2 border-l border-gray-200">
            {rest.map((a, i) => (
              <MorphBreakdown key={i} analysis={a} language={language} />
            ))}
          </div>
        </details>
      )}

      {entry?.inflectionTable && Object.keys(entry.inflectionTable).length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-gray-400">Common forms</p>
          <table className="w-full text-xs border-collapse">
            <tbody>
              {Object.entries(entry.inflectionTable)
                .slice(0, 6)
                .map(([form, value]) => (
                  <tr key={form} className="border-b border-gray-100">
                    <td className="py-0.5 pr-3 font-mono text-gray-400">{form}</td>
                    <td className="py-0.5 font-medium text-gray-800">{value}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
