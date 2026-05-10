import React, { useEffect, useState } from 'react';
import type { Language, Settings } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/constants';

function sendMsg<T>(msg: object): Promise<T> {
  return new Promise(resolve =>
    chrome.runtime.sendMessage(msg, r => resolve(r?.success ? r.data : null)),
  );
}

export default function App() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hostname, setHostname] = useState('');

  useEffect(() => {
    sendMsg<Settings>({ type: 'GET_SETTINGS' }).then(s => { if (s) setSettings(s); });
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const url = tabs[0]?.url;
      if (url) {
        try { setHostname(new URL(url).hostname); } catch { /* ignore */ }
      }
    });
  }, []);

  async function update(partial: Partial<Settings>) {
    const updated = await sendMsg<Settings>({ type: 'SET_SETTINGS', settings: partial });
    if (updated) setSettings(updated);
  }

  async function openSidePanel() {
    const tabs = await new Promise<chrome.tabs.Tab[]>(resolve =>
      chrome.tabs.query({ active: true, currentWindow: true }, resolve),
    );
    const tabId = tabs[0]?.id;
    if (tabId) {
      await chrome.sidePanel.open({ tabId });
      window.close();
    }
  }

  const language: Language = settings.language;
  const isBlacklisted = Boolean(hostname && settings.blacklist.includes(hostname));

  return (
    <div className="w-64 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-bold text-base">SanaPlus</span>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium">
          {language === 'fi' ? '🇫🇮 Finnish' : '🇪🇪 Estonian'}
        </span>
      </div>

      {/* i+1 replacement toggle */}
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-xs font-semibold">i+1 Mode</p>
          <p className="text-xs text-gray-400 leading-tight">Wrap words on page</p>
        </div>
        <button
          onClick={() => update({ replacementEnabled: !settings.replacementEnabled })}
          aria-label="Toggle i+1 mode"
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
            settings.replacementEnabled ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform mt-0.5 ${
              settings.replacementEnabled ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Open side panel */}
      <button
        onClick={openSidePanel}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
      >
        Open Learning Panel
      </button>

      {/* Disable on this page */}
      {hostname && (
        <button
          onClick={() =>
            update({
              blacklist: isBlacklisted
                ? settings.blacklist.filter(h => h !== hostname)
                : [...settings.blacklist, hostname],
            })
          }
          className={`w-full rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            isBlacklisted
              ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {isBlacklisted ? '✓ Re-enable on this page' : 'Disable on this page'}
        </button>
      )}
    </div>
  );
}
