import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import type { AnalyzeResult, Language, Message, Settings } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/constants';
import { Tooltip, type TooltipState } from './tooltip/Tooltip';
import { initSelector } from './selector';
import { initReplacer, updateReplacerSettings } from './replacer';
// Tailwind compiled CSS — injected into the shadow root to avoid leaking into the host page
import tooltipCSS from './tooltip/styles.css?inline';

// ─── Shadow DOM setup ─────────────────────────────────────────────────────────

const host = document.createElement('div');
host.id = 'sana-plus-one-root';
// Prevent host-page styles from bleeding in
host.style.cssText = 'all:unset;position:absolute;top:0;left:0;';
document.body.appendChild(host);

const shadow = host.attachShadow({ mode: 'closed' });

const styleEl = document.createElement('style');
styleEl.textContent = tooltipCSS;
shadow.appendChild(styleEl);

const mountPoint = document.createElement('div');
shadow.appendChild(mountPoint);

// ─── React tree inside the shadow DOM ────────────────────────────────────────

function ContentScriptApp() {
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    visible: false,
    data: null,
    anchorRect: null,
  });
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const getLanguage = useCallback((): Language => settings.language, [settings.language]);

  const showTooltip = useCallback(
    (data: AnalyzeResult, anchorRect: DOMRect) =>
      setTooltipState({ visible: true, data, anchorRect }),
    [],
  );

  const hideTooltip = useCallback(
    () => setTooltipState({ visible: false, data: null, anchorRect: null }),
    [],
  );

  // Fetch settings on mount, then set up selector, replacer, and message listener
  useEffect(() => {
    chrome.runtime.sendMessage(
      { type: 'GET_SETTINGS' },
      (resp: { success: boolean; data: Settings } | undefined) => {
        const s = resp?.success ? resp.data : DEFAULT_SETTINGS;
        setSettings(s);
        initSelector({ onAnalyze: showTooltip, onClear: hideTooltip }, getLanguage);
        initReplacer(s);
      },
    );

    const listener = (msg: Message) => {
      if (msg.type === 'SETTINGS_CHANGED') {
        setSettings(msg.settings);
        updateReplacerSettings(msg.settings);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Tooltip
      state={tooltipState}
      language={settings.language}
      settings={settings}
      onClose={hideTooltip}
    />
  );
}

createRoot(mountPoint).render(<ContentScriptApp />);
