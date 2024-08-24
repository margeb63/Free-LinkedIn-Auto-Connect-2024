console.log("Addon loading!");

let stopRequested = false;
let totalSentCount = 0;

// Create the overlay element
function createOverlay() {
  const overlay = document.createElement("div");
  overlay.id = "linkedin-auto-connect-overlay";
  overlay.innerHTML = `
    <h1>Free LinkedIn Auto-Connect Tool 2024</h1>
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

  // Append the overlay to the body
  document.body.appendChild(overlay);

  // Make the overlay draggable
  makeOverlayDraggable(overlay);

  // Initialize the overlay functionality
  initializeOverlay();
}

function initializeOverlay() {
  // Initialize HTML elements
  const instructionsButton = document.getElementById("instructions-button");
  const instructionsContent = document.getElementById("instructions-content");
  const messageInput = document.getElementById("linkedin-message");
  const saveButton = document.getElementById("save-button");
  const countInput = document.getElementById("request-count");
  const logContainer = document.getElementById("linkedin-log");
  const startButton = document.getElementById("start-button");
  const stopButton = document.getElementById("stop-button");

  // Load saved message if exists
  const savedMessage = localStorage.getItem("linkedinMessage");
  if (savedMessage) {
    messageInput.value = savedMessage;
  }

  // Validate count input
  countInput.addEventListener("input", function () {
    if (parseInt(countInput.value) < 1 || isNaN(countInput.value)) {
      countInput.value = 1;
    }
  });

  // Toggle instructions
  instructionsButton.addEventListener("click", () => {
    if (instructionsContent.style.display === "none") {
      instructionsContent.style.display = "block";
      instructionsButton.innerHTML = "Instructions &#9650;";
    } else {
      instructionsContent.style.display = "none";
      instructionsButton.innerHTML = "Instructions &#9660;";
    }
  });

  // Save message
  saveButton.addEventListener("click", () => {
    localStorage.setItem("linkedinMessage", messageInput.value);
    logMessage("Message saved.");
  });

  // Start requests
  startButton.addEventListener("click", () => {
    stopRequested = false;
    totalSentCount = 0;
    let count = parseInt(countInput.value) || 10;
    sendConnectionRequests(count);
  });

  // Stop requests
  stopButton.addEventListener("click", () => {
    stopRequested = true;
    logMessage("Action canceled.");
  });
}

// Logging function
function logMessage(message) {
  const logContainer = document.getElementById("linkedin-log");
  const logEntry = document.createElement("div");
  logEntry.innerText = message;
  logContainer.appendChild(logEntry);
  logContainer.scrollTop = logContainer.scrollHeight;
}

// Function to get random delay
function getRandomDelay(min = 6000, max = 8000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to open and close a LinkedIn profile
async function openAndCloseProfile(url) {
  const newTab = window.open(url, "_blank");
  logMessage(`Opened profile url`);
  await delay(3000); // Wait for 3 seconds
  newTab.close();
  logMessage(`Closed profile url`);
}

// Function to open and close a LinkedIn profile
async function sendConnectionRequests(requestCount) {
  const messageTemplate = document.getElementById("linkedin-message").value;
  let totalSentCount = 0;
  let noResultsCount = 0;

  while (!stopRequested && totalSentCount < requestCount) {
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
      if (stopRequested || totalSentCount >= requestCount) {
        logMessage(`Action completed. Total requests sent: ${totalSentCount}`);
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

      // Open profile in new tab, wait, and close
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

      if (stopRequested) {
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

        if (stopRequested) {
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

        if (stopRequested) {
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
      const nextButton = document.querySelector(
        'button.artdeco-pagination__button--next[aria-label="Next"]'
      );

      if (nextButton && !nextButton.disabled) {
        logMessage(
          "All profiles on this page processed. Going to the next page."
        );
        nextButton.click();
        await delay(3000);
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
// Function to add drag-and-drop functionality
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
    if (stopRequested) break;
  }
}

// Create and display the overlay
createOverlay();
console.log("Overlay loaded and initialized");
