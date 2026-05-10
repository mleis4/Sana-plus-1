import React, { useEffect, useState, useCallback } from 'react';
import type { PhraseBankStats, Language, Message } from '../../shared/types';

type Props = { language: Language };

function sendMsg<T>(msg: object): Promise<T> {
  return new Promise(resolve =>
    chrome.runtime.sendMessage(msg, r => resolve(r?.success ? r.data : null)),
  );
}

const CONFIDENCE_LABELS = ['None', 'Beginner', 'Familiar', 'Good', 'Mastered'];
const CONFIDENCE_COLORS = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-lime-400', 'bg-green-500'];

export function Dashboard({ language }: Props) {
  const [stats, setStats] = useState<PhraseBankStats | null>(null);

  const fetchStats = useCallback(async () => {
    const data = await sendMsg<PhraseBankStats>({ type: 'GET_STATS', language });
    setStats(data);
  }, [language]);

  useEffect(() => {
    fetchStats();
    const listener = (msg: Message) => {
      if (msg.type === 'STATS_UPDATED') fetchStats();
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [fetchStats]);

  if (!stats) {
    return <div className="flex items-center justify-center h-full text-sm text-gray-400">Loading…</div>;
  }

  const dist = stats.confidenceDistribution;
  const maxDist = Math.max(1, ...Object.values(dist));

  return (
    <div className="p-4 space-y-6 overflow-y-auto">
      {/* Streak + today */}
      <div className="flex items-stretch gap-3">
        <div className="flex items-center gap-3 flex-1 rounded-xl border bg-orange-50 border-orange-100 p-3">
          <span className="text-3xl">🔥</span>
          <div>
            <p className="text-2xl font-bold text-orange-600">{stats.streak}</p>
            <p className="text-xs text-orange-400">day streak</p>
          </div>
        </div>
        <div className="flex-1 rounded-xl border p-3 text-center">
          <p className="text-2xl font-bold">{stats.wordsSeen.today}</p>
          <p className="text-xs text-gray-400">reviewed today</p>
        </div>
      </div>

      {/* Words seen grid */}
      <div className="grid grid-cols-3 gap-2">
        {([
          ['This week', stats.wordsSeen.week],
          ['All time', stats.wordsSeen.total],
          ['In bank', stats.totalWords],
        ] as [string, number][]).map(([label, value]) => (
          <div key={label} className="rounded-lg border p-2.5 text-center">
            <p className="text-lg font-bold">{value}</p>
            <p className="text-xs text-gray-400 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Confidence distribution */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Confidence distribution
        </h3>
        <div className="space-y-1.5">
          {[0, 1, 2, 3, 4].map(level => (
            <div key={level} className="flex items-center gap-2">
              <span className="w-14 text-right text-xs text-gray-500">{CONFIDENCE_LABELS[level]}</span>
              <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${CONFIDENCE_COLORS[level]}`}
                  style={{ width: `${((dist[level] ?? 0) / maxDist) * 100}%` }}
                />
              </div>
              <span className="w-5 text-right text-xs text-gray-400">{dist[level] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
