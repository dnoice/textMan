// js/main.js (v1.2 - Refactored jQuery Implementation)

$(document).ready(function () {
  // --- Cache jQuery Selections ---
  // Cache frequently used elements to avoid repeated DOM lookups
  const $notepad = $("#notepad");
  const $toastContainer = $("#toast-container");
  const $undoButton = $("#undoButton");
  const $redoButton = $("#redoButton");

  // Stat Elements
  const $wordCountEl = $("#wordCount");
  const $charCountEl = $("#charCount");
  const $sentenceCountEl = $("#sentenceCount");
  const $paragraphCountEl = $("#paragraphCount");
  const $avgWordLengthEl = $("#avgWordLength");
  const $readingTimeEl = $("#readingTime");

  // Input Fields (cache if used repeatedly, otherwise select inside handler)
  const $prefixInput = $("#prefixInput");
  const $suffixInput = $("#suffixInput");
  const $searchInput = $("#searchInput");
  const $replaceInput = $("#replaceInput");
  const $keepLinesInput = $("#keepLinesInput");
  const $removeLinesInput = $("#removeLinesInput");

  // --- State Management ---
  const logs = []; // For logging actions and errors
  let undoStack = [$notepad.val()]; // Initialize with current (potentially empty) state
  let redoStack = [];
  const MAX_UNDO_STACK_SIZE = 100; // Limit memory usage

  // --- Logging Function ---
  function log(type, message, data = {}) {
    const timestamp = new Date().toISOString();
    // Basic input sanitization for logging data to prevent injection issues if logs were displayed directly
    const sanitizedData = JSON.parse(JSON.stringify(data));
    logs.push({ timestamp, type, message, data: sanitizedData });
    // Optional: Output logs to console for debugging during development
    // if (type === 'ERROR') console.error(`[${type}] ${timestamp}: ${message}`, data);
    // else if (type === 'WARN') console.warn(`[${type}] ${timestamp}: ${message}`, data);
    // else console.log(`[${type}] ${timestamp}: ${message}`, data);
  }

  // --- Toast Notification Function ---
  // Enhanced to support types (requires corresponding CSS)
  function showToast(message, type = "info", duration = 3000) {
    // Basic sanitization for display
    const cleanMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    // Create toast element with type class (e.g., .toast.success, .toast.error)
    const $toast = $(
      `<div class="toast ${type}"><i class="fas ${
        type === "success"
          ? "fa-check-circle"
          : type === "error"
          ? "fa-times-circle"
          : "fa-info-circle"
      }"></i> ${cleanMessage}</div>`
    );
    $toastContainer.append($toast);

    // Animate in (using jQuery's fadeIn/css or adding a class)
    $toast.css({ opacity: 0, transform: "translateX(100%)" }).animate(
      {
        opacity: 1,
        transform: "translateX(0)",
      },
      500 // Animation duration
    );

    // Automatically remove after duration
    setTimeout(function () {
      $toast.animate(
        {
          opacity: 0,
          transform: "translateX(100%)",
        },
        500, // Animation duration
        function () {
          $(this).remove();
        }
      );
    }, duration);
  }

  // --- Error Handling Wrapper ---
  // Wraps event handlers to catch errors, log them, and show a user notification
  function safeExecute(fn, actionName = "Unknown action") {
    return function (...args) {
      try {
        // Log the start of the action
        log("ACTION_START", `Executing: ${actionName}`);
        const result = fn.apply(this, args);
        log("ACTION_SUCCESS", `Successfully executed: ${actionName}`);
        return result;
      } catch (error) {
        log("ERROR", `Error during: ${actionName}`, {
          errorMessage: error.message,
          stack: error.stack,
          args: args, // Log arguments passed to the function
        });
        showToast(`Error performing ${actionName}: ${error.message}`, "error");
        // Optionally re-throw if needed elsewhere, but generally better to handle here
        // throw error;
      }
    };
  }

  // --- Core Text Manipulation Helpers ---
  const getLines = (text) => text.split(/\r?\n/); // Handle Windows/Unix line endings
  const setLines = (lines) => lines.join("\n"); // Use consistent Unix line ending

  // --- Undo/Redo Functionality ---
  function updateUndoRedoButtons() {
    // Enable undo if more than one state exists (initial state + changes)
    $undoButton.prop("disabled", undoStack.length <= 1);
    $redoButton.prop("disabled", redoStack.length === 0);
  }

  // Saves the current state of the notepad for undo/redo
  function saveState(sourceAction = "Unknown") {
    const currentState = $notepad.val();
    // Avoid saving identical consecutive states or excessive states
    if (
      undoStack.length === 0 ||
      undoStack[undoStack.length - 1] !== currentState
    ) {
      undoStack.push(currentState);
      redoStack = []; // Clear redo stack on new action

      // Limit the size of the undo stack
      if (undoStack.length > MAX_UNDO_STACK_SIZE) {
        undoStack.shift(); // Remove the oldest state
      }

      updateUndoRedoButtons();
      log("STATE_SAVE", `State saved after action: ${sourceAction}`);
    }
  }

  // Undo Action
  $undoButton.click(
    safeExecute(function () {
      if (undoStack.length > 1) {
        // More than just the initial state
        redoStack.push(undoStack.pop()); // Move current state to redo
        const previousState = undoStack[undoStack.length - 1];
        $notepad.val(previousState); // Load previous state
        updateUndoRedoButtons();
        updateStatsDisplay(); // Update stats after undo
        log("ACTION", "Performed undo action");
        showToast("Undo successful", "success");
      } else {
        log("INFO", "Undo stack empty or at initial state");
        showToast("Nothing more to undo", "info");
      }
    }, "Undo")
  );

  // Redo Action
  $redoButton.click(
    safeExecute(function () {
      if (redoStack.length > 0) {
        const nextState = redoStack.pop(); // Get state from redo
        undoStack.push(nextState); // Add it back to undo
        $notepad.val(nextState); // Load state
        updateUndoRedoButtons();
        updateStatsDisplay(); // Update stats after redo
        log("ACTION", "Performed redo action");
        showToast("Redo successful", "success");
      } else {
        log("INFO", "Redo stack empty");
        showToast("Nothing more to redo", "info");
      }
    }, "Redo")
  );

  // --- Statistics Update Function ---
  function updateStatsDisplay() {
    const text = $notepad.val();
    try {
      const chars = text.length;
      $charCountEl.text(`Characters: ${chars}`);

      const words = text.match(/\b\w+\b/g) || [];
      $wordCountEl.text(`Words: ${words.length}`);

      // Improved sentence detection (handles more cases like Mr. Mrs. etc.)
      const sentences =
        text
          .match(/[^.!?…]+(?:[.!?…](?![a-zA-Z0-9])\s*|$)/g)
          ?.map((s) => s.trim())
          .filter(Boolean) || [];
      $sentenceCountEl.text(`Sentences: ${sentences.length}`);

      const paragraphs = text.split(/\n\s*\n+/).filter((p) => p.trim() !== "");
      $paragraphCountEl.text(`Paragraphs: ${paragraphs.length}`);

      const totalWordLength = words.reduce((sum, word) => sum + word.length, 0);
      const avgLength =
        words.length > 0 ? (totalWordLength / words.length).toFixed(2) : 0;
      $avgWordLengthEl.text(`Avg Word Length: ${avgLength}`);

      const readingTime = Math.ceil(words.length / 200); // Approx 200 WPM
      $readingTimeEl.text(`Reading Time: ${readingTime} min`);
    } catch (error) {
      log("ERROR", "Failed to update statistics", { error });
      // Display error state in UI
      $wordCountEl.text("Words: Error");
      $charCountEl.text("Characters: Error");
      $sentenceCountEl.text("Sentences: Error");
      $paragraphCountEl.text("Paragraphs: Error");
      $avgWordLengthEl.text("Avg Word Length: Error");
      $readingTimeEl.text("Reading Time: Error");
    }
  }

  // --- Notepad Input Listener ---
  // Update stats and save state on input
  $notepad.on(
    "input",
    safeExecute(function () {
      updateStatsDisplay();
      saveState("User Typing"); // Save state on typing
    }, "Notepad Input")
  );

  // --- Clipboard Operations (Using Modern Async API) ---
  $("#copyButton").click(
    safeExecute(async function () {
      const textToCopy = $notepad.val();
      if (!textToCopy) {
        showToast("Nothing to copy!", "warn");
        log("WARN", "Copy attempt on empty notepad");
        return;
      }
      try {
        await navigator.clipboard.writeText(textToCopy);
        log("INFO", "Copied text to clipboard using modern API");
        showToast("Text copied!", "success");
      } catch (error) {
        log("ERROR", "Modern clipboard write failed", { error });
        // Fallback using deprecated execCommand (less reliable)
        try {
          $notepad.select(); // Select text in textarea
          document.execCommand("copy"); // Attempt copy
          window.getSelection().removeAllRanges(); // Deselect
          log("WARN", "Used fallback execCommand for copy");
          showToast("Text copied (using fallback)", "success");
        } catch (fallbackError) {
          log("ERROR", "Fallback copy also failed", { fallbackError });
          showToast("Could not copy text. Check browser permissions.", "error");
        }
      }
    }, "Copy Text")
  );

  $("#pasteButton").click(
    safeExecute(async function () {
      try {
        const textToPaste = await navigator.clipboard.readText();
        if (textToPaste) {
          // Replace selection or append/insert at cursor (more complex)
          // Simple append for now:
          const currentVal = $notepad.val();
          const newVal = currentVal + textToPaste; // Simple append
          $notepad.val(newVal);
          saveState("Paste"); // Save state after pasting
          updateStatsDisplay(); // Update stats after pasting
          log("INFO", "Pasted text from clipboard using modern API");
          showToast("Text pasted!", "success");
        } else {
          log("INFO", "Clipboard is empty or contains non-text content");
          showToast("Clipboard is empty or contains no text.", "info");
        }
      } catch (error) {
        log("ERROR", "Failed to read clipboard content", { error });
        showToast(
          "Could not paste text. Check browser permissions or clipboard content.",
          "error"
        );
      }
    }, "Paste Text")
  );

  // --- Generic Transformation Function ---
  // Helper to reduce repetition for simple text transformations
  function applyTextTransform(
    transformFn,
    actionName,
    requiresNonEmpty = true
  ) {
    const originalText = $notepad.val();
    if (requiresNonEmpty && !originalText.trim()) {
      showToast("Notepad is empty.", "warn");
      log("WARN", `${actionName} attempt on empty notepad.`);
      return;
    }
    const newText = transformFn(originalText);
    if (newText !== originalText) {
      $notepad.val(newText);
      saveState(actionName);
      updateStatsDisplay();
      showToast(`${actionName} applied successfully.`, "success");
    } else {
      showToast("No changes were made.", "info");
    }
  }

  // --- Tool Button Event Handlers ---

  // Change Order
  $("#sortLinesAZButton").click(
    safeExecute(function () {
      applyTextTransform((text) => {
        const lines = getLines(text);
        lines.sort((a, b) => a.localeCompare(b)); // Case-sensitive sort
        return setLines(lines);
      }, "Sort Lines A-Z");
    }, "Sort Lines A-Z")
  );

  $("#sortLinesZAButton").click(
    safeExecute(function () {
      applyTextTransform((text) => {
        const lines = getLines(text);
        lines.sort((a, b) => b.localeCompare(a));
        return setLines(lines);
      }, "Sort Lines Z-A");
    }, "Sort Lines Z-A")
  );

  $("#sortLinesShortestButton").click(
    safeExecute(function () {
      applyTextTransform((text) => {
        const lines = getLines(text);
        lines.sort((a, b) => a.length - b.length);
        return setLines(lines);
      }, "Sort Lines Shortest First");
    }, "Sort Lines Shortest First")
  );

  $("#sortLinesLongestButton").click(
    safeExecute(function () {
      applyTextTransform((text) => {
        const lines = getLines(text);
        lines.sort((a, b) => b.length - a.length);
        return setLines(lines);
      }, "Sort Lines Longest First");
    }, "Sort Lines Longest First")
  );

  $("#shuffleLinesButton").click(
    safeExecute(function () {
      applyTextTransform((text) => {
        const lines = getLines(text);
        // Fisher-Yates Shuffle
        for (let i = lines.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [lines[i], lines[j]] = [lines[j], lines[i]];
        }
        return setLines(lines);
      }, "Shuffle Lines");
    }, "Shuffle Lines")
  );

  // Transform
  $("#toLowerCaseButton").click(
    safeExecute(function () {
      applyTextTransform((text) => text.toLowerCase(), "Convert to Lowercase");
    }, "Convert to Lowercase")
  );

  $("#toUpperCaseButton").click(
    safeExecute(function () {
      applyTextTransform((text) => text.toUpperCase(), "Convert to Uppercase");
    }, "Convert to Uppercase")
  );

  $("#capitalizeWordsButton").click(
    safeExecute(function () {
      applyTextTransform((text) => {
        return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
      }, "Capitalize Words");
    }, "Capitalize Words")
  );

  $("#capitalizeFirstWordButton").click(
    safeExecute(function () {
      applyTextTransform((text) => {
        let result = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
        result = result.replace(
          /([.!?…]\s+)([a-z])/g, // Use ... as sentence end too
          (match, punctuation, char) => punctuation + char.toUpperCase()
        );
        return result;
      }, "Capitalize First Word of Sentence");
    }, "Capitalize First Word of Sentence")
  );

  $("#invertTextButton").click(
    safeExecute(function () {
      // Correctly handle Unicode characters (like emojis)
      applyTextTransform(
        (text) => [...text].reverse().join(""),
        "Invert Text"
      );
    }, "Invert Text")
  );

  // Add Prefix/Suffix
  $("#addPrefixButton").click(
    safeExecute(function () {
      const prefix = $prefixInput.val(); // Get value inside handler
      applyTextTransform(
        (text) => setLines(getLines(text).map((line) => prefix + line)),
        `Add Prefix "${prefix}"`,
        false // Allow applying to empty text
      );
      $prefixInput.val(""); // Clear input after use
    }, "Add Prefix")
  );

  $("#addSuffixButton").click(
    safeExecute(function () {
      const suffix = $suffixInput.val();
      applyTextTransform(
        (text) => setLines(getLines(text).map((line) => line + suffix)),
        `Add Suffix "${suffix}"`,
        false
      );
      $suffixInput.val("");
    }, "Add Suffix")
  );

  // Remove
  $("#removeDuplicatesButton").click(
    safeExecute(function () {
      applyTextTransform((text) => {
        const lines = getLines(text);
        return setLines([...new Set(lines)]);
      }, "Remove Duplicate Lines");
    }, "Remove Duplicate Lines")
  );

  $("#removeEmptyLinesButton").click(
    safeExecute(function () {
      applyTextTransform((text) => {
        return setLines(getLines(text).filter((line) => line.trim() !== ""));
      }, "Remove Empty Lines");
    }, "Remove Empty Lines")
  );

  $("#removeAccentsButton").click(
    safeExecute(function () {
      applyTextTransform((text) => {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      }, "Remove Accents");
    }, "Remove Accents")
  );

  $("#removeSpacesButton").click(
    safeExecute(function () {
      // Removes leading/trailing whitespace from each line and collapses multiple spaces within lines
      applyTextTransform((text) => {
        return setLines(
          getLines(text).map((line) => line.replace(/\s\s+/g, " ").trim())
        );
      }, "Remove Extra Spaces");
    }, "Remove Extra Spaces")
  );

  $("#removeAllSpacesButton").click(
    safeExecute(function () {
      applyTextTransform(
        (text) => text.replace(/\s/g, ""),
        "Remove All Spaces"
      );
    }, "Remove All Spaces")
  );

  $("#removeNumbersButton").click(
    safeExecute(function () {
      applyTextTransform((text) => text.replace(/[0-9]/g, ""), "Remove Numbers");
    }, "Remove Numbers")
  );

  $("#removePunctuationButton").click(
    safeExecute(function () {
      applyTextTransform(
        (text) => text.replace(/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g, ""),
        "Remove Punctuation"
      );
    }, "Remove Punctuation")
  );

  $("#removeLineBreaksButton").click(
    safeExecute(function () {
      applyTextTransform(
        (text) => text.replace(/(\r?\n)+/g, " ").trim(), // Replace with single space
        "Remove Line Breaks"
      );
    }, "Remove Line Breaks")
  );

  $("#trimRowsDuplicatesEmptyButton").click(
    safeExecute(function () {
      applyTextTransform((text) => {
        let lines = getLines(text);
        lines = lines.map((line) => line.trim()); // Trim whitespace
        lines = lines.filter((line) => line !== ""); // Remove empty
        lines = [...new Set(lines)]; // Remove duplicates
        return setLines(lines);
      }, "Clean Up Text");
    }, "Clean Up Text")
  );

  // --- Search and Replace ---
  // Helper function to escape regex special characters from user input
  function escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  }

  $("#searchTextButton").click(
    safeExecute(function () {
      const searchTerm = $searchInput.val();
      if (!searchTerm) {
        showToast("Please enter text to search for.", "warn");
        log("WARN", "Search term is empty");
        return;
      }
      try {
        const content = $notepad.val();
        // Case-insensitive global search
        const regex = new RegExp(escapeRegex(searchTerm), "gi");
        const matches = content.match(regex);
        const occurrences = matches ? matches.length : 0;
        showToast(
          `Found ${occurrences} occurrence(s) of "${searchTerm}".`,
          occurrences > 0 ? "success" : "info"
        );
        log("INFO", `Searched for "${searchTerm}", found ${occurrences}`);
        // Basic highlighting (can be improved)
        // Remove previous highlights first
        // $notepad.highlight(searchTerm); // Requires a highlight plugin
      } catch (error) {
        log("ERROR", "Regex search failed", { searchTerm, error });
        showToast("Invalid search term pattern.", "error");
      }
    }, "Search Text")
  );

  $("#searchAndReplaceButton").click(
    safeExecute(function () {
      const searchTerm = $searchInput.val();
      const replaceTerm = $replaceInput.val(); // Replacement can be empty
      if (!searchTerm) {
        showToast("Please enter text to search for.", "warn");
        log("WARN", "Search term is empty for replace");
        return;
      }
      try {
        // Use applyTextTransform for state saving and feedback
        applyTextTransform(
          (text) => {
            const regex = new RegExp(escapeRegex(searchTerm), "g"); // Global, case-sensitive. Add 'i' for insensitive.
            return text.replace(regex, replaceTerm);
          },
          `Replace "${searchTerm}" with "${replaceTerm}"`
        );
        // Optional: Clear inputs after successful replace
        // $searchInput.val('');
        // $replaceInput.val('');
      } catch (error) {
        log("ERROR", "Regex replace failed", { searchTerm, replaceTerm, error });
        showToast("Invalid search term pattern for replace.", "error");
      }
    }, "Search and Replace")
  );

  // --- Filter Lines ---
  $("#keepLinesButton").click(
    safeExecute(function () {
      const term = $keepLinesInput.val();
      if (!term) {
        showToast("Please enter a term to filter by.", "warn");
        log("WARN", "Term is empty for keep lines");
        return;
      }
      applyTextTransform(
        (text) =>
          setLines(getLines(text).filter((line) => line.includes(term))), // Case-sensitive
        // Case-insensitive: line.toLowerCase().includes(term.toLowerCase())
        `Keep Lines Containing "${term}"`
      );
      $keepLinesInput.val(""); // Clear input
    }, "Keep Lines Containing")
  );

  $("#removeLinesButton").click(
    safeExecute(function () {
      const term = $removeLinesInput.val();
      if (!term) {
        showToast("Please enter a term to filter by.", "warn");
        log("WARN", "Term is empty for remove lines");
        return;
      }
      applyTextTransform(
        (text) =>
          setLines(getLines(text).filter((line) => !line.includes(term))), // Case-sensitive
        // Case-insensitive: !line.toLowerCase().includes(term.toLowerCase())
        `Remove Lines Containing "${term}"`
      );
      $removeLinesInput.val(""); // Clear input
    }, "Remove Lines Containing")
  );

  // --- Download Logs ---
  $("#downloadLogsButton").click(
    safeExecute(function () {
      if (logs.length === 0) {
        showToast("No logs to download.", "info");
        return;
      }
      try {
        const logContent = logs
          .map((logEntry) => {
            const dataString =
              Object.keys(logEntry.data).length > 0
                ? JSON.stringify(logEntry.data)
                : "";
            return `[${logEntry.timestamp}] [${logEntry.type}] ${logEntry.message} ${dataString}`;
          })
          .join("\n");

        const blob = new Blob([logContent], {
          type: "text/plain;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const $tempLink = $("<a>"); // Use jQuery to create link
        $tempLink
          .attr("href", url)
          .attr("download", "textMan_logs.txt")
          .css("display", "none"); // Hide link

        $("body").append($tempLink); // Add to body
        $tempLink[0].click(); // Trigger download (need native click)
        $tempLink.remove(); // Clean up link
        URL.revokeObjectURL(url); // Release object URL

        showToast("Logs downloaded.", "success");
        log("INFO", "Downloaded logs");
      } catch (error) {
        log("ERROR", "Failed to prepare or download logs", { error });
        showToast("Could not download logs.", "error");
      }
    }, "Download Logs")
  );

  // --- Keyboard Shortcuts ---
  $notepad.on(
    "keydown",
    safeExecute(function (event) {
      // Use event.key for modern browsers
      const key = event.key.toLowerCase();
      // Check for Ctrl key (Windows/Linux) or Command key (Mac)
      if (event.ctrlKey || event.metaKey) {
        let shortcutUsed = false;
        if (key === "z") {
          event.preventDefault(); // Prevent native undo
          $undoButton.click(); // Trigger custom undo
          shortcutUsed = true;
        } else if (key === "y") {
          event.preventDefault(); // Prevent native redo
          $redoButton.click(); // Trigger custom redo
          shortcutUsed = true;
        }
        // Add more shortcuts here if needed (e.g., Ctrl+S for save - though not applicable here)

        if (shortcutUsed) {
          log("ACTION", `Keyboard shortcut used: ${event.key}`);
        }
      }
    }, "Keyboard Shortcut Listener")
  );

  // --- Global Error Handler ---
  window.onerror = function (message, source, lineno, colno, error) {
    log("ERROR", "Unhandled global error", {
      message,
      source,
      lineno,
      colno,
      errorObject: error ? error.stack : "N/A",
    });
    // Avoid showing generic toast for every minor error, rely on specific handlers
    // showToast(`An unexpected error occurred. See console/logs.`, 'error');
    return false; // Prevent default browser error handling (optional)
  };
  window.onunhandledrejection = function (event) {
    log("ERROR", "Unhandled promise rejection", {
      reason: event.reason ? event.reason.stack || event.reason : "N/A",
    });
    // showToast(`An unexpected promise error occurred.`, 'error');
  };

  // --- Initial Setup on Load ---
  log("INFO", "Document ready. Initializing TextMan v1.2.");
  updateStatsDisplay(); // Calculate initial stats
  updateUndoRedoButtons(); // Set initial button states
  showToast("TextMan v1.2 Ready!", "success", 1500); // Welcome message
  // Note: Initial state is already pushed to undoStack at declaration
});
