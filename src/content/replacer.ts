import type { PhraseRecord, Settings } from '../shared/types';

// Elements whose text we never modify
const SKIP_TAGS = new Set([
  'nav', 'footer', 'header', 'input', 'textarea', 'select',
  'code', 'pre', 'script', 'style', 'noscript',
]);

// Words currently highlighted as sana-word spans
const SANA_ATTR = 'data-sana-word';

let currentSettings: Settings | null = null;
let phraseLemmas: Map<string, PhraseRecord> = new Map(); // lemma.toLowerCase() → record
let observer: MutationObserver | null = null;
let observerPaused = false;

// ─── Public API ──────────────────────────────────────────────────────────────

export async function initReplacer(settings: Settings): Promise<void> {
  currentSettings = settings;
  await refreshPhraseBank();
  applyMode();
}

export async function updateReplacerSettings(settings: Settings): Promise<void> {
  const languageChanged = currentSettings?.language !== settings.language;
  currentSettings = settings;

  if (languageChanged) await refreshPhraseBank();
  applyMode();
}

// ─── Internal ────────────────────────────────────────────────────────────────

function applyMode(): void {
  if (!currentSettings) return;
  if (currentSettings.replacementEnabled && !isBlacklisted()) {
    processPage();
    startObserver();
  } else {
    stopObserver();
    removeReplacements();
  }
}

function isBlacklisted(): boolean {
  return Boolean(
    currentSettings?.blacklist.includes(window.location.hostname),
  );
}

function refreshPhraseBank(): Promise<void> {
  if (!currentSettings) return Promise.resolve();
  return new Promise(resolve => {
    chrome.runtime.sendMessage(
      { type: 'GET_PHRASE_BANK', language: currentSettings!.language },
      (resp: { success: boolean; data: PhraseRecord[] } | undefined) => {
        if (chrome.runtime.lastError || !resp?.success) { resolve(); return; }
        phraseLemmas = new Map(
          resp.data.filter(p => p.confidenceLevel < 4).map(p => [p.lemma.toLowerCase(), p]),
        );
        resolve();
      },
    );
  });
}

// Finnish/Estonian word characters including Scandinavian letters
const WORD_RE = /\b([A-Za-zÀ-ÖØ-öø-ÿ]{2,})\b/g;

function processPage(): void {
  if (!currentSettings) return;
  observerPaused = true;
  removeReplacements();

  const intensity = currentSettings.replacementIntensity / 100;
  const nodes = collectTextNodes(document.body);

  // Build candidate list: words present on page that match a phrase bank entry
  const seen = new Set<string>();
  for (const node of nodes) {
    const text = node.textContent ?? '';
    let m: RegExpExecArray | null;
    WORD_RE.lastIndex = 0;
    while ((m = WORD_RE.exec(text)) !== null) {
      const lc = m[1].toLowerCase();
      if (phraseLemmas.has(lc)) seen.add(lc);
    }
  }

  // Randomly select intensity-% of candidates
  const candidates = [...seen].sort(() => Math.random() - 0.5);
  const selected = new Set(candidates.slice(0, Math.ceil(candidates.length * intensity)));

  for (const node of nodes) {
    wrapWordsInNode(node, selected);
  }
  observerPaused = false;
}

function collectTextNodes(root: Node): Text[] {
  const result: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const el = node.parentElement;
      if (!el) return NodeFilter.FILTER_REJECT;
      if (SKIP_TAGS.has(el.tagName.toLowerCase())) return NodeFilter.FILTER_REJECT;
      if (el.closest(`[${SANA_ATTR}]`)) return NodeFilter.FILTER_REJECT;
      if (!(node.textContent?.trim())) return NodeFilter.FILTER_SKIP;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n: Node | null;
  while ((n = walker.nextNode())) result.push(n as Text);
  return result;
}

function wrapWordsInNode(node: Text, selected: Set<string>): void {
  const text = node.textContent ?? '';
  const parts: (string | HTMLSpanElement)[] = [];
  let last = 0;

  WORD_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = WORD_RE.exec(text)) !== null) {
    const word = m[1];
    const lc = word.toLowerCase();
    const record = selected.has(lc) ? phraseLemmas.get(lc) : undefined;
    if (!record) continue;

    parts.push(text.slice(last, m.index));

    const span = document.createElement('span');
    span.setAttribute(SANA_ATTR, record.lemma);
    span.setAttribute('data-sana-def', record.definition);
    span.setAttribute('title', `${record.lemma} — ${record.definition}`);
    span.textContent = word;
    span.style.cssText =
      'border-bottom:1.5px dashed #2563EB;cursor:pointer;position:relative;';
    parts.push(span);
    last = m.index + word.length;
  }

  if (parts.length === 0) return;
  parts.push(text.slice(last));

  const frag = document.createDocumentFragment();
  for (const part of parts) {
    frag.appendChild(
      typeof part === 'string' ? document.createTextNode(part) : part,
    );
  }
  node.replaceWith(frag);
}

function removeReplacements(): void {
  document.querySelectorAll(`[${SANA_ATTR}]`).forEach(span => {
    span.replaceWith(document.createTextNode(span.textContent ?? ''));
  });
}

function startObserver(): void {
  if (observer) return;
  observer = new MutationObserver(mutations => {
    if (observerPaused || !currentSettings?.replacementEnabled || isBlacklisted()) return;
    for (const mutation of mutations) {
      for (const added of mutation.addedNodes) {
        if (added.nodeType === Node.ELEMENT_NODE) {
          processSubtree(added as Element);
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function stopObserver(): void {
  observer?.disconnect();
  observer = null;
}

function processSubtree(el: Element): void {
  if (!currentSettings) return;
  const intensity = currentSettings.replacementIntensity / 100;
  const nodes = collectTextNodes(el);

  const seen = new Set<string>();
  for (const node of nodes) {
    const text = node.textContent ?? '';
    let m: RegExpExecArray | null;
    WORD_RE.lastIndex = 0;
    while ((m = WORD_RE.exec(text)) !== null) {
      const lc = m[1].toLowerCase();
      if (phraseLemmas.has(lc)) seen.add(lc);
    }
  }

  const candidates = [...seen].sort(() => Math.random() - 0.5);
  const selected = new Set(candidates.slice(0, Math.ceil(candidates.length * intensity)));
  for (const node of nodes) wrapWordsInNode(node, selected);
}
