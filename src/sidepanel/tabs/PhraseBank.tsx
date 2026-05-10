import React, { useCallback, useEffect, useState } from 'react';
import type { Language, Message, PhraseRecord } from '../../shared/types';
import { ConfidenceBar } from '../components/ConfidenceBar';
import { WordCard } from '../components/WordCard';

type Props = { language: Language };
type SortKey = 'lemma' | 'confidenceLevel' | 'frequencyTier' | 'lastSeenAt';

function sendMsg<T>(msg: object): Promise<T> {
  return new Promise(resolve =>
    chrome.runtime.sendMessage(msg, r => resolve(r?.success ? r.data : null)),
  );
}

function SortButton({
  label,
  sortKey,
  active,
  asc,
  onClick,
}: {
  label: string;
  sortKey: SortKey;
  active: boolean;
  asc: boolean;
  onClick: (k: SortKey) => void;
}) {
  return (
    <button
      className="flex items-center gap-0.5 text-xs font-medium text-gray-500 hover:text-gray-800"
      onClick={() => onClick(sortKey)}
    >
      {label}
      {active && <span className="text-[10px]">{asc ? '↑' : '↓'}</span>}
    </button>
  );
}

export function PhraseBank({ language }: Props) {
  const [phrases, setPhrases] = useState<PhraseRecord[]>([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('lastSeenAt');
  const [sortAsc, setSortAsc] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchPhrases = useCallback(async () => {
    const data = await sendMsg<PhraseRecord[]>({ type: 'GET_PHRASE_BANK', language });
    setPhrases(data ?? []);
  }, [language]);

  useEffect(() => {
    fetchPhrases();
    const listener = (msg: Message) => {
      if (msg.type === 'STATS_UPDATED') fetchPhrases();
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [fetchPhrases]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(a => !a);
    } else {
      setSortKey(key);
      setSortAsc(key === 'lemma');
    }
  }

  async function handleDelete(id: string) {
    await sendMsg({ type: 'DELETE_PHRASE', id });
    setExpanded(null);
    await fetchPhrases();
  }

  async function handleResetConfidence(id: string) {
    await sendMsg({ type: 'RESET_CONFIDENCE', id });
    await fetchPhrases();
  }

  const filtered = phrases
    .filter(
      p =>
        p.lemma.toLowerCase().includes(search.toLowerCase()) ||
        p.definition.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const cmp =
        typeof aVal === 'string'
          ? aVal.localeCompare(bVal as string)
          : (aVal as number) - (bVal as number);
      return sortAsc ? cmp : -cmp;
    });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search */}
      <div className="p-2 border-b shrink-0">
        <input
          type="search"
          placeholder="Search words or definitions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-400 text-center px-4">
          {phrases.length === 0
            ? 'No words yet. Highlight any Finnish or Estonian word on a page to add it.'
            : 'No matches.'}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Column header */}
          <div className="sticky top-0 z-10 bg-gray-50 border-b grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-1.5">
            <SortButton label="Word" sortKey="lemma" active={sortKey === 'lemma'} asc={sortAsc} onClick={handleSort} />
            <SortButton label="Level" sortKey="confidenceLevel" active={sortKey === 'confidenceLevel'} asc={sortAsc} onClick={handleSort} />
            <SortButton label="Tier" sortKey="frequencyTier" active={sortKey === 'frequencyTier'} asc={sortAsc} onClick={handleSort} />
            <SortButton label="Seen" sortKey="lastSeenAt" active={sortKey === 'lastSeenAt'} asc={sortAsc} onClick={handleSort} />
          </div>

          {filtered.map(phrase => (
            <div key={phrase.id}>
              <button
                className="w-full grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 text-left border-b hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === phrase.id ? null : phrase.id)}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{phrase.lemma}</p>
                  <p className="text-xs text-gray-500 truncate">{phrase.definition}</p>
                </div>
                <div className="self-center">
                  <ConfidenceBar level={phrase.confidenceLevel} />
                </div>
                <span className="self-center text-xs text-gray-400">{phrase.frequencyTier}</span>
                <span className="self-center text-xs text-gray-400">
                  {new Date(phrase.lastSeenAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </button>

              {expanded === phrase.id && (
                <div className="px-3 py-2 bg-gray-50 border-b">
                  <WordCard
                    phrase={phrase}
                    onDelete={handleDelete}
                    onResetConfidence={handleResetConfidence}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="shrink-0 px-3 py-1.5 border-t text-xs text-gray-400">
        {filtered.length} of {phrases.length} words
      </div>
    </div>
  );
}
