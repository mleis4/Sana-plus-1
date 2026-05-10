# src/popup/

The small popup window shown when the user clicks the SanaPlus extension icon
in Chrome's toolbar.

Intentionally minimal — all substantive UI belongs in the side panel. The popup's
sole jobs are a quick active/paused toggle and navigation to the side panel.

## Files

| File | Purpose |
|---|---|
| `main.tsx` | Popup HTML entry point. Mounts the React application root. |
| `App.tsx` | Root popup component. Renders four elements: (1) a language indicator badge showing the active language (Finnish 🇫🇮 / Estonian 🇪🇪), (2) an on/off toggle for i+1 replacement mode on the current tab, (3) an "Open Learning Panel" button that calls `chrome.sidePanel.open({ tabId })` to open the side panel, and (4) a "Disable on this page" toggle that immediately adds the current hostname to the blacklist in `chrome.storage.sync`. |

## Design rationale
Chrome popups close the moment the user clicks outside them — any stateful or
complex UI placed here would be frustrating. The side panel persists across page
navigations and is the correct home for the dashboard, phrase bank, and settings.
The popup is intentionally a fast-access remote control, nothing more.
