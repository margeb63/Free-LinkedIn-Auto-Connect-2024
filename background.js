chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openAndCloseProfile") {
    chrome.tabs.create({ url: request.url, active: false }, (tab) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
        sendResponse({
          success: false,
          error: chrome.runtime.lastError.message,
        });
        return;
      }

      setTimeout(() => {
        chrome.tabs.remove(tab.id, () => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            sendResponse({
              success: false,
              error: chrome.runtime.lastError.message,
            });
          } else {
            sendResponse({ success: true });
          }
        });
      }, 3000); // Wartezeit von 3 Sekunden
    });

    return true; // Um die asynchrone sendResponse zu ermöglichen
  }
});
