import type { AnalyzeResult, Language } from '../shared/types';

type Callbacks = {
  onAnalyze: (data: AnalyzeResult, rect: DOMRect) => void;
  onClear: () => void;
};

// Tags whose content we never want to trigger analysis on
const IGNORED_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'SCRIPT', 'STYLE', 'NOSCRIPT']);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function initSelector(callbacks: Callbacks, getLanguage: () => Language): void {
  document.addEventListener('mouseup', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => handleSelection(callbacks, getLanguage()), 220);
  });
}

function handleSelection(callbacks: Callbacks, language: Language): void {
  const selection = window.getSelection();

  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    callbacks.onClear();
    return;
  }

  const text = selection.toString().trim();

  // Only handle single words or short phrases (≤ 3 whitespace-separated tokens)
  if (!text || text.includes('\n') || text.split(/\s+/).length > 3) {
    callbacks.onClear();
    return;
  }

  // Ignore selections anchored inside form elements
  const anchorParent = selection.anchorNode?.parentElement;
  if (anchorParent && IGNORED_TAGS.has(anchorParent.tagName)) {
    callbacks.onClear();
    return;
  }

  const rect = selection.getRangeAt(0).getBoundingClientRect();

  chrome.runtime.sendMessage(
    { type: 'ANALYZE', word: text, language },
    (response: { success: boolean; data: AnalyzeResult } | undefined) => {
      if (chrome.runtime.lastError) return;
      if (response?.success && response.data) {
        callbacks.onAnalyze(response.data, rect);
      }
    },
  );
}
