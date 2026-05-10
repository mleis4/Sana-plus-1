import React, { useEffect, useState } from 'react';
import type { Language, Message, Settings } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/constants';
import { Dashboard } from './tabs/Dashboard';
import { PhraseBank } from './tabs/PhraseBank';
import { Assessment } from './tabs/Assessment';
import { SettingsTab } from './tabs/Settings';

type Tab = 'dashboard' | 'phrasebank' | 'assessment' | 'settings';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'phrasebank', icon: '📖', label: 'Phrases' },
  { id: 'assessment', icon: '✍️', label: 'Practice' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

function sendMsg<T>(msg: object): Promise<T> {
  return new Promise(resolve =>
    chrome.runtime.sendMessage(msg, r => resolve(r?.success ? r.data : null)),
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    sendMsg<Settings>({ type: 'GET_SETTINGS' }).then(s => { if (s) setSettings(s); });
    const listener = (msg: Message) => {
      if (msg.type === 'SETTINGS_CHANGED') setSettings(msg.settings);
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const language: Language = settings.language;
  const flagEmoji = language === 'fi' ? '🇫🇮' : '🇪🇪';
  const langLabel = language === 'fi' ? 'Finnish' : 'Estonian';

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 select-none">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b shrink-0">
        <span className="font-bold text-base tracking-tight">SanaPlus</span>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium">
          {flagEmoji} {langLabel}
        </span>
      </header>

      {/* Tab content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'dashboard' && <Dashboard language={language} />}
        {activeTab === 'phrasebank' && <PhraseBank language={language} />}
        {activeTab === 'assessment' && <Assessment language={language} />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      {/* Bottom nav */}
      <nav className="border-t shrink-0 bg-white">
        <div className="flex">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-t-2 border-blue-600 -mt-px'
                  : 'text-gray-400 hover:text-gray-600 border-t-2 border-transparent'
              }`}
            >
              <span className="text-base leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
