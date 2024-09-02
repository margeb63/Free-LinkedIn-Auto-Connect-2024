// Verwende das `window`-Objekt, um globale Variablen zu speichern
if (typeof window.overlayVisible === "undefined") {
  console.log("Addon loading!");

  window.overlayVisible = false;
  window.stopRequested = false;
  window.totalSentCount = 0;
  window.overlay = document.getElementById("linkedin-auto-connect-overlay");

  // Funktion zum Ein-/Ausblenden des Overlays
  function toggleOverlay() {
    if (!window.overlayVisible) {
      if (!window.overlay) {
        createOverlay();
      } else {
        window.overlay.style.display = "block";
      }
      window.overlayVisible = true;
    } else {
      window.overlay.style.display = "none";
      window.overlayVisible = false;
    }
  }

  // Überprüfen, ob das Overlay sichtbar ist
  if (window.overlay && window.overlay.style.display !== "none") {
    window.overlayVisible = true;
  }

  // Funktion zum Erstellen des Overlays
  function createOverlay() {
    window.overlay = document.createElement("div");
    window.overlay.id = "linkedin-auto-connect-overlay";
    window.overlay.innerHTML = `
      <div id="overlay-header" style="display: flex; justify-content: space-between; align-items: center; padding: 5px;">
        <h1 style="margin: 0;">LinkedIn Auto-Connect Tool 2024</h1>
        <button id="close-overlay-button" style="background: none; border: none; font-size: 18px; cursor: pointer;">&#10006;</button>
      </div>
      <hr />
      <div id="instructions-container">
        <button id="instructions-button">Instructions &#9660;</button>
        <div id="instructions-content" style="display:none;">
          - Set LinkedIn to English<br />
          - Go to <a href="https://www.linkedin.com/search/results/people/">LinkedIn search page</a><br />
          - Enter search phrase<br />
          - Click on "People"<br />
          - Set search filters<br />
          - Set connect message (with variable)<br />
          - Set number of requests<br />
          - Click "Start"<br />
          - Do not send more than 50 requests/day
        </div>
      </div>
      <hr />
      <label for="linkedin-message">Connect Message: (use {Firstname} variable)</label>
      <textarea id="linkedin-message" rows="3">Hi {Firstname}, I would love to add you to my network!</textarea>
      <button id="save-button">Save</button>
      <label for="request-count">Number of requests:</label>
      <input id="request-count" type="number" value="10" min="1" />
      <div id="linkedin-log"></div>
      <button id="start-button">Start</button>
      <button id="stop-button">Stop</button>
      <div id="footer">
        If you find this tool helpful,<br />
        <a href="https://www.paypal.com/donate/?cmd=_donations&business=hello@linksmithy.com&currency_code=EUR&source=url" target="_blank">please consider a small donation</a>.
      </div>
    `;

    // Füge das Overlay dem Dokument hinzu
    document.body.appendChild(window.overlay);

    // Mache das Overlay verschiebbar
    makeOverlayDraggable(window.overlay);

    // Initialisiere die Overlay-Funktionalität
    initializeOverlay();
  }

  // Funktion zum Initialisieren des Overlays
  function initializeOverlay() {
    // Initialisiere HTML-Elemente
    const instructionsButton = document.getElementById("instructions-button");
    const instructionsContent = document.getElementById("instructions-content");
    const messageInput = document.getElementById("linkedin-message");
    const saveButton = document.getElementById("save-button");
    const countInput = document.getElementById("request-count");
    const logContainer = document.getElementById("linkedin-log");
    const startButton = document.getElementById("start-button");
    const stopButton = document.getElementById("stop-button");
    const closeOverlayButton = document.getElementById("close-overlay-button");

    // Lade gespeicherte Nachricht, falls vorhanden
    const savedMessage = localStorage.getItem("linkedinMessage");
    if (savedMessage) {
      messageInput.value = savedMessage;
    }

    // Validierung der Eingabeanzahl
    countInput.addEventListener("input", function () {
      if (parseInt(countInput.value) < 1 || isNaN(countInput.value)) {
        countInput.value = 1;
      }
    });

    // Toggle-Anweisungen
    instructionsButton.addEventListener("click", () => {
      if (instructionsContent.style.display === "none") {
        instructionsContent.style.display = "block";
        instructionsButton.innerHTML = "Instructions &#9650;";
      } else {
        instructionsContent.style.display = "none";
        instructionsButton.innerHTML = "Instructions &#9660;";
      }
    });

    // Nachricht speichern
    saveButton.addEventListener("click", () => {
      localStorage.setItem("linkedinMessage", messageInput.value);
      logMessage("Message saved.");
    });

    // Anfragen starten
    startButton.addEventListener("click", () => {
      window.stopRequested = false;
      window.totalSentCount = 0;
      let count = parseInt(countInput.value) || 10;
      sendConnectionRequests(count);
    });

    // Anfragen stoppen
    stopButton.addEventListener("click", () => {
      window.stopRequested = true;
      logMessage("Action canceled.");
    });

    // Overlay schließen
    closeOverlayButton.addEventListener("click", () => {
      window.overlay.style.display = "none";
      window.overlayVisible = false;
    });
  }

  // Logging-Funktion
  function logMessage(message) {
    const logContainer = document.getElementById("linkedin-log");
    const logEntry = document.createElement("div");
    logEntry.innerText = message;
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  // Funktion für zufällige Verzögerung
  function getRandomDelay(min = 6000, max = 8000) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Funktion zum Öffnen und Schließen eines LinkedIn-Profils
  async function openAndCloseProfile(url) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: "openAndCloseProfile", url: url },
        (response) => {
          if (chrome.runtime.lastError) {
            logMessage(`Error: ${chrome.runtime.lastError.message}`);
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response && response.success) {
            logMessage(`Profile opened and closed in the background`);
            resolve();
          } else {
            logMessage(
              `Failed to open and close profile: ${
                response.error || "Unknown error"
              }`
            );
            reject(new Error(response.error || "Unknown error"));
          }
        }
      );
    });
  }

  // Funktion zum Senden von Kontaktanfragen
  async function sendConnectionRequests(requestCount) {
    const messageTemplate = document.getElementById("linkedin-message").value;
    let totalSentCount = 0;
    let noResultsCount = 0;

    while (!window.stopRequested && totalSentCount < requestCount) {
      const profileContainers = document.querySelectorAll(
        "li.reusable-search__result-container"
      );

      if (profileContainers.length === 0) {
        noResultsCount++;
        if (noResultsCount >= 3) {
          logMessage("No more results found after 3 attempts. Ending search.");
          break;
        }
      } else {
        noResultsCount = 0;
      }

      let processedOnThisPage = 0;
      let sentOnThisPage = 0;

      for (let container of profileContainers) {
        if (window.stopRequested || totalSentCount >= requestCount) {
          logMessage(
            `Action completed. Total requests sent: ${totalSentCount}`
          );
          return;
        }

        processedOnThisPage++;

        const nameElement = container.querySelector(
          '.entity-result__title-text a span[dir="ltr"] > span[aria-hidden="true"]'
        );

        const firstName = nameElement
          ? nameElement.innerText.split(" ")[0]
          : "Colleague";

        const profileLink = container.querySelector("a.app-aware-link")?.href;

        const connectButton = container.querySelector(
          'button.artdeco-button[aria-label^="Invite"][aria-label$="to connect"]'
        );

        if (!connectButton) {
          logMessage(`No connect button found for ${firstName}. Skipping.`);
          continue;
        }

        // Open profile in new tab, wait, and close only if connect button is present
        if (profileLink) {
          await openAndCloseProfile(profileLink);
        }

        const personalizedMessage = messageTemplate.replace(
          "{Firstname}",
          firstName
        );

        logMessage(`Click on "Connect" button for ${firstName}.`);
        connectButton.click();

        await randomDelay();

        if (window.stopRequested) {
          logMessage("Action canceled.");
          return;
        }

        const addNoteButton = document.querySelector(
          'button[aria-label="Add a note"]'
        );
        if (addNoteButton) {
          logMessage('Click on "Add a note" button.');
          addNoteButton.click();

          await randomDelay();

          if (window.stopRequested) {
            logMessage("Action canceled.");
            return;
          }

          logMessage(`Preparing message for ${firstName}.`);
          const messageBox = document.querySelector('textarea[name="message"]');
          if (messageBox) {
            messageBox.value = personalizedMessage;
            messageBox.focus();
            messageBox.dispatchEvent(new Event("input", { bubbles: true }));
            logMessage(`Message inserted for ${firstName}.`);
          }

          await randomDelay();

          if (window.stopRequested) {
            logMessage("Action canceled.");
            return;
          }

          logMessage(`Click on "Send" button for ${firstName}.`);
          const sendButton = document.querySelector(
            'button[aria-label="Send invitation"]'
          );
          if (sendButton) {
            sendButton.click();
            logMessage(`Contact request sent to ${firstName}.`);
            sentOnThisPage++;
            totalSentCount++;
            logMessage(`Request ${totalSentCount} of ${requestCount} sent.`);
          }
        }

        await randomDelay();
      }

      logMessage(`Processed ${processedOnThisPage} profiles on this page.`);
      logMessage(`Sent ${sentOnThisPage} requests on this page.`);

      // Check if we've processed all profiles on the current page
      if (processedOnThisPage === profileContainers.length) {
        console.log("No more Connect-Buttons.");
        logMessage("No more Connect-Buttons.");

        await scrollToBottom();
        await randomDelay();

        const nextButton = document.querySelector(
          'button.artdeco-pagination__button--next[aria-label="Next"]'
        );

        if (nextButton && !nextButton.disabled) {
          logMessage(
            "All profiles on this page processed. Going to the next page."
          );
          nextButton.click();
          await delay(5000);
        } else {
          logMessage("All profiles processed and no more pages available.");
          break;
        }
      } else {
        logMessage(
          "Not all profiles on this page were processed. Continuing on the same page."
        );
      }
    }

    logMessage(`Action completed. Total requests sent: ${totalSentCount}`);
  }

  // Funktion zum automatischen Scrollen zum Ende der Seite
  async function scrollToBottom() {
    return new Promise((resolve) => {
      let distance = 100;
      let totalHeight = document.body.scrollHeight;
      let scrollInterval = setInterval(() => {
        window.scrollBy(0, distance);
        if (window.scrollY + window.innerHeight >= totalHeight) {
          clearInterval(scrollInterval);
          resolve();
        }
      }, 100);
    });
  }

  // Funktion zum Hinzufügen von Drag-and-Drop-Funktionalität
  function makeOverlayDraggable(overlay) {
    let isDragging = false;
    let offsetX, offsetY;

    overlay.addEventListener("mousedown", (e) => {
      isDragging = true;
      offsetX = e.clientX - parseInt(window.getComputedStyle(overlay).left);
      offsetY = e.clientY - parseInt(window.getComputedStyle(overlay).top);
      overlay.style.cursor = "grabbing";
    });

    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        overlay.style.left = `${e.clientX - offsetX}px`;
        overlay.style.top = `${e.clientY - offsetY}px`;
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
      overlay.style.cursor = "move";
    });
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function randomDelay() {
    const delayTime = getRandomDelay();
    for (let i = delayTime / 1000; i > 0; i--) {
      logMessage(`Delay: ${Math.floor(i)} Seconds`);
      await delay(1000);
      if (window.stopRequested) break;
    }
  }

  console.log("Overlay loaded and initialized");
}

toggleOverlay();
