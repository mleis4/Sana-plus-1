import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { AnalyzeResult, Language, Settings } from '../../shared/types';
import { TranslationTab } from './TranslationTab';
import { MorphTab } from './MorphTab';
import { CognateTag } from './CognateTag';

export type TooltipState = {
  visible: boolean;
  data: AnalyzeResult | null;
  anchorRect: DOMRect | null;
};

type Props = {
  state: TooltipState;
  language: Language;
  settings: Settings;
  onClose: () => void;
};

type Tab = 'translation' | 'morphology';

const TOOLTIP_W = 288;
const TOOLTIP_H = 260;
const MARGIN = 8;

export function Tooltip({ state, language, settings, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('translation');
  const [addedToBank, setAddedToBank] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Reset per word shown
  useEffect(() => {
    if (state.visible) {
      setActiveTab('translation');
      setAddedToBank(false);
    }
  }, [state.data]);

  // Click-outside dismissal
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!state.visible) return;
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [state.visible, handleMouseDown]);

  if (!state.visible || !state.data || !state.anchorRect) return null;

  const { data, anchorRect } = state;
  const entry = data.dictEntry;
  const analyses = data.morphAnalyses;
  const word = analyses[0]?.lemma ?? '';

  // Position below selection, flip up if near viewport bottom
  let top = anchorRect.bottom + window.scrollY + MARGIN;
  let left = anchorRect.left + window.scrollX;
  if (anchorRect.bottom + TOOLTIP_H + MARGIN > window.innerHeight) {
    top = anchorRect.top + window.scrollY - TOOLTIP_H - MARGIN;
  }
  left = Math.max(MARGIN, Math.min(left, window.innerWidth - TOOLTIP_W - MARGIN));

  function speak() {
    if (!word) return;
    const utter = new SpeechSynthesisUtterance(word);
    utter.lang = language === 'fi' ? 'fi-FI' : 'et-EE';
    if (settings.ttsVoice) {
      const voice = speechSynthesis.getVoices().find(v => v.voiceURI === settings.ttsVoice);
      if (voice) utter.voice = voice;
    }
    speechSynthesis.speak(utter);
  }

  function addToBank() {
    if (!entry || addedToBank) return;
    chrome.runtime.sendMessage(
      { type: 'GET_FREQUENCY_TIER', lemma: entry.lemma, language },
      tierResp => {
        const tier: number = tierResp?.success ? tierResp.data : 5;
        chrome.runtime.sendMessage({
          type: 'ADD_TO_PHRASE_BANK',
          lemma: entry.lemma,
          language,
          definition: entry.definitions[0] ?? '',
          partOfSpeech: entry.partOfSpeech,
          frequencyTier: tier,
        });
      },
    );
    setAddedToBank(true);
  }

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top,
        left,
        width: TOOLTIP_W,
        zIndex: 2147483647,
      }}
      className="rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden text-gray-900"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 border-b">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold text-sm truncate">{analyses[0]?.lemma ?? '…'}</span>
          {entry?.cognate && <CognateTag cognate={entry.cognate} />}
        </div>
        <div className="flex items-center shrink-0">
          <button
            onClick={speak}
            title="Pronounce"
            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
          >
            🔊
          </button>
          <button
            onClick={addToBank}
            disabled={!entry}
            title={addedToBank ? 'Added to phrase bank' : 'Add to phrase bank'}
            className={`rounded p-1 text-sm transition-colors disabled:opacity-30 ${
              addedToBank
                ? 'text-green-500'
                : 'text-gray-400 hover:bg-gray-200 hover:text-gray-700'
            }`}
          >
            {addedToBank ? '✓' : '＋'}
          </button>
          <button
            onClick={onClose}
            title="Close"
            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b text-xs">
        {(['translation', 'morphology'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 capitalize transition-colors ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600 -mb-px font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="max-h-48 overflow-y-auto">
        {activeTab === 'translation' ? (
          entry ? (
            <TranslationTab entry={entry} />
          ) : (
            <p className="p-3 text-xs text-gray-400 text-center">Definition not found.</p>
          )
        ) : (
          <MorphTab analyses={analyses} entry={entry} language={language} />
        )}
      </div>
    </div>
  );
}
