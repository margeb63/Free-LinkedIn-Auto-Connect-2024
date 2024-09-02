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

chrome.action.onClicked.addListener((tab) => {
  // Überprüfe, ob die aktuelle Seite LinkedIn ist
  if (tab.url.includes("linkedin.com")) {
    // Injektion des Skripts, um das Overlay zu toggeln
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["overlay.js"], // Lädt das gesamte Skript erneut
    });
  } else {
    // Zeige eine Warnung an, wenn der Benutzer nicht auf LinkedIn ist
    alert("Please navigate to LinkedIn to use this extension.");
  }
});
