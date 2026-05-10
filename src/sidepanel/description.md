# src/sidepanel/

The Chrome Side Panel — a persistent UI panel that opens alongside the browser
window via the Chrome Side Panel API (`chrome.sidePanel`), declared in `manifest.json`.
This is the primary learning interface.

Users open it by clicking the extension icon or from the popup button. It stays
open while they browse, updating in real time as words are looked up.

## Files

| File | Purpose |
|---|---|
| `main.tsx` | Side panel HTML entry point. Mounts the React application root into the side panel's document. |
| `App.tsx` | Root React component. Renders the language badge header, the four-tab navigation bar, and the active tab content. Manages global state (active language, active tab, user stats) via React context. Subscribes to phrase bank update messages from the background service worker so the dashboard refreshes automatically. |

## Subdirectories

| Directory | Purpose |
|---|---|
| `tabs/` | One React component per tab in the side panel navigation. |
| `components/` | Reusable UI components shared across multiple tabs. |
