import React, { useEffect, useState } from 'react';
import type { Language, Message, Settings } from '../../shared/types';
import {
  DEFAULT_SETTINGS,
  REPLACEMENT_INTENSITY_MAX,
  REPLACEMENT_INTENSITY_MIN,
} from '../../shared/constants';

function sendMsg<T>(msg: object): Promise<T> {
  return new Promise(resolve =>
    chrome.runtime.sendMessage(msg, r => resolve(r?.success ? r.data : null)),
  );
}

export function SettingsTab() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [blacklistInput, setBlacklistInput] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    sendMsg<Settings>({ type: 'GET_SETTINGS' }).then(s => { if (s) setSettings(s); });

    function loadVoices() {
      const all = speechSynthesis.getVoices();
      setVoices(all.filter(v => v.lang.startsWith('fi') || v.lang.startsWith('et')));
    }
    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, []);

  useEffect(() => {
    const listener = (msg: Message) => {
      if (msg.type === 'SETTINGS_CHANGED') setSettings(msg.settings);
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  async function update(partial: Partial<Settings>) {
    const updated = await sendMsg<Settings>({ type: 'SET_SETTINGS', settings: partial });
    if (updated) setSettings(updated);
  }

  function addToBlacklist() {
    const raw = blacklistInput.trim();
    if (!raw) return;
    // Normalise: strip protocol and path
    const host = raw.replace(/^https?:\/\//, '').split('/')[0];
    if (!host || settings.blacklist.includes(host)) return;
    update({ blacklist: [...settings.blacklist, host] });
    setBlacklistInput('');
  }

  return (
    <div className="p-4 space-y-6 overflow-y-auto">
      {/* Language */}
      <section>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Language
        </label>
        <div className="flex gap-2">
          {([['fi', '🇫🇮 Finnish'], ['et', '🇪🇪 Estonian']] as [Language, string][]).map(
            ([code, label]) => (
              <button
                key={code}
                onClick={() => update({ language: code })}
                className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                  settings.language === code
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ),
          )}
        </div>
      </section>

      {/* Replacement intensity */}
      <section>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Replacement intensity — {settings.replacementIntensity}%
        </label>
        <input
          type="range"
          min={REPLACEMENT_INTENSITY_MIN}
          max={REPLACEMENT_INTENSITY_MAX}
          value={settings.replacementIntensity}
          onChange={e => update({ replacementIntensity: Number(e.target.value) })}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
          <span>{REPLACEMENT_INTENSITY_MIN}%</span>
          <span>{REPLACEMENT_INTENSITY_MAX}%</span>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Percentage of known words to wrap on each page.
        </p>
      </section>

      {/* TTS voice */}
      <section>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          TTS Voice
        </label>
        {voices.length === 0 ? (
          <p className="text-xs text-gray-400">
            No Finnish or Estonian voices found on this system.
          </p>
        ) : (
          <select
            value={settings.ttsVoice}
            onChange={e => update({ ttsVoice: e.target.value })}
            className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm bg-white"
          >
            <option value="">System default</option>
            {voices.map(v => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        )}
      </section>

      {/* Blacklist */}
      <section>
        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Page blacklist
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="example.com"
            value={blacklistInput}
            onChange={e => setBlacklistInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addToBlacklist()}
            className="flex-1 rounded border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
          />
          <button
            onClick={addToBlacklist}
            className="rounded border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
          >
            Add
          </button>
        </div>
        {settings.blacklist.length === 0 ? (
          <p className="text-xs text-gray-400">No pages blacklisted.</p>
        ) : (
          <ul className="space-y-1">
            {settings.blacklist.map(host => (
              <li
                key={host}
                className="flex items-center justify-between rounded bg-gray-50 px-2.5 py-1.5"
              >
                <span className="text-xs font-mono text-gray-700">{host}</span>
                <button
                  onClick={() => update({ blacklist: settings.blacklist.filter(h => h !== host) })}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
