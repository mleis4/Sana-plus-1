import type { Message } from '../shared/types';
import { handleMessage } from './messaging';

// Open the side panel when the user clicks the extension action icon
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {
  // API may not be available in all Chrome versions
});

chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse) => {
    // Return true immediately to keep the sendResponse channel open for async handlers
    handleMessage(message, sendResponse);
    return true;
  },
);
