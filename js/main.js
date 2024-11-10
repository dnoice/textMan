  // js/main.js

$(document).ready(function () {
  const $notepad = $('#notepad');

  // Show toast notification
  function showToast(message) {
    const $toast = $('<div class="toast"></div>').text(message);
    $('#toast-container').append($toast);
    setTimeout(function () {
      $toast.fadeOut(500, function () {
        $(this).remove();
      });
    }, 2000);
  }

  // Safe execute function to wrap event handlers
  function safeExecute(fn) {
    return function (...args) {
      try {
        return fn.apply(this, args);
      } catch (error) {
        showToast(`An error occurred: ${error.message}`);
      }
    };
  }

  // Undo and Redo functionality
  let undoStack = [];
  let redoStack = [];

  function updateUndoRedoButtons() {
    $('#undoButton').prop('disabled', undoStack.length <= 1);
    $('#redoButton').prop('disabled', redoStack.length === 0);
  }

  function saveState() {
    const currentState = $notepad.val();
    if (undoStack.length === 0 || undoStack[undoStack.length - 1] !== currentState) {
      undoStack.push(currentState);
      redoStack = [];
      updateUndoRedoButtons();
    }
  }

  // Initialize the undo stack with the initial state
  saveState();

  $notepad.on('input', function () {
    saveState();
  });

  // Event Handlers for Buttons
  // Undo
  $('#undoButton').click(safeExecute(function () {
    if (undoStack.length > 1) {
      redoStack.push(undoStack.pop());
      $notepad.val(undoStack[undoStack.length - 1]);
      updateUndoRedoButtons();
    }
  }));

  // Redo
  $('#redoButton').click(safeExecute(function () {
    if (redoStack.length > 0) {
      const nextState = redoStack.pop();
      $notepad.val(nextState);
      undoStack.push(nextState);
      updateUndoRedoButtons();
    }
  }));

  // Copy
  $('#copyButton').click(safeExecute(function () {
    $notepad.select();
    document.execCommand('copy');
    showToast('Text copied to clipboard');
  }));

  // Paste
  $('#pasteButton').click(safeExecute(function () {
    navigator.clipboard.readText().then(function (text) {
      $notepad.val($notepad.val() + text);
      saveState();
    }).catch(function (error) {
      showToast('Failed to read clipboard content');
    });
  }));

  // Sort A to Z
  $('#sortLinesAZButton').click(safeExecute(function () {
    const lines = $notepad.val().split('\n');
    lines.sort();
    $notepad.val(lines.join('\n'));
    saveState();
  }));

  // Sort Z to A
  $('#sortLinesZAButton').click(safeExecute(function () {
    const lines = $notepad.val().split('\n');
    lines.sort().reverse();
    $notepad.val(lines.join('\n'));
    saveState();
  }));

  // Sort Shortest to Longest
  $('#sortLinesShortestButton').click(safeExecute(function () {
    const lines = $notepad.val().split('\n');
    lines.sort((a, b) => a.length - b.length);
    $notepad.val(lines.join('\n'));
    saveState();
  }));

  // Sort Longest to Shortest
  $('#sortLinesLongestButton').click(safeExecute(function () {
    const lines = $notepad.val().split('\n');
    lines.sort((a, b) => b.length - a.length);
    $notepad.val(lines.join('\n'));
    saveState();
  }));

  // Shuffle Lines
  $('#shuffleLinesButton').click(safeExecute(function () {
    const lines = $notepad.val().split('\n');
    for (let i = lines.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lines[i], lines[j]] = [lines[j], lines[i]];
    }
    $notepad.val(lines.join('\n'));
    saveState();
  }));

  // Transformations
  // Lowercase
  $('#toLowerCaseButton').click(safeExecute(function () {
    $notepad.val($notepad.val().toLowerCase());
    saveState();
  }));

  // Uppercase
  $('#toUpperCaseButton').click(safeExecute(function () {
    $notepad.val($notepad.val().toUpperCase());
    saveState();
  }));

  // Capitalize Words
  $('#capitalizeWordsButton').click(safeExecute(function () {
    const text = $notepad.val().replace(/\b\w/g, function (char) {
      return char.toUpperCase();
    });
    $notepad.val(text);
    saveState();
  }));

  // Capitalize First Word
  $('#capitalizeFirstWordButton').click(safeExecute(function () {
    const text = $notepad.val().replace(/(^\s*\w|[\.\!\?]\s*\w)/g, function (char) {
      return char.toUpperCase();
    });
    $notepad.val(text);
    saveState();
  }));

  // Invert Text
  $('#invertTextButton').click(safeExecute(function () {
    const text = $notepad.val().split('').reverse().join('');
    $notepad.val(text);
    saveState();
  }));

  // Add Prefix
  $('#addPrefixButton').click(safeExecute(function () {
    const prefix = $('#prefixInput').val();
    const lines = $notepad.val().split('\n');
    const newLines = lines.map(line => prefix + line);
    $notepad.val(newLines.join('\n'));
    saveState();
  }));

  // Add Suffix
  $('#addSuffixButton').click(safeExecute(function () {
    const suffix = $('#suffixInput').val();
    const lines = $notepad.val().split('\n');
    const newLines = lines.map(line => line + suffix);
    $notepad.val(newLines.join('\n'));
    saveState();
  }));

  // Remove Duplicates
  $('#removeDuplicatesButton').click(safeExecute(function () {
    const lines = $notepad.val().split('\n');
    const uniqueLines = [...new Set(lines)];
    $notepad.val(uniqueLines.join('\n'));
    saveState();
  }));

  // Remove Empty Lines
  $('#removeEmptyLinesButton').click(safeExecute(function () {
    const lines = $notepad.val().split('\n');
    const nonEmptyLines = lines.filter(line => line.trim() !== '');
    $notepad.val(nonEmptyLines.join('\n'));
    saveState();
  }));

  // Remove Accents
  $('#removeAccentsButton').click(safeExecute(function () {
    const text = $notepad.val().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    $notepad.val(text);
    saveState();
  }));

  // Remove Extra Spaces
  $('#removeSpacesButton').click(safeExecute(function () {
    const text = $notepad.val().replace(/\s+/g, ' ').trim();
    $notepad.val(text);
    saveState();]
  }));

  // Remove All Spaces
  $('#removeAllSpacesButton').click(safeExecute(function () {
    const text = $notepad.val().replace(/\s+/g, '');
    $notepad.val(text);
    saveState();
  }));

  // Remove Numbers
  $('#removeNumbersButton').click(safeExecute(function () {
    const text = $notepad.val().replace(/\d+/g, '');
    $notepad.val(text);
    saveState();
  }));

  // Remove Punctuation
  $('#removePunctuationButton').click(safeExecute(function () {
    const punctuationRegex = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g;
    const text = $notepad.val().replace(punctuationRegex, '');
    $notepad.val(text);
    saveState();
  }));

  // Remove Line Breaks
  $('#removeLineBreaksButton').click(safeExecute(function () {
    const text = $notepad.val().replace(/\n/g, ' ');
    $notepad.val(text);
    saveState();
  }));

  // Clean Up
  $('#trimRowsDuplicatesEmptyButton').click(safeExecute(function () {
    const lines = $notepad.val().split('\n');
    const trimmedLines = lines.map(line => line.trim()).filter(line => line !== '');
    const uniqueLines = [...new Set(trimmedLines)];
    $notepad.val(uniqueLines.join('\n'));
    saveState();
  }));

  // Search Text
  $('#searchTextButton').click(safeExecute(function () {
    const searchTerm = $('#searchInput').val();
    if (searchTerm) {
      const content = $notepad.val();
      const regex = new RegExp(searchTerm, 'g');
      const occurrences = (content.match(regex) || []).length;
      showToast(`Found ${occurrences} occurrences of "${searchTerm}"`);
    } else {
      showToast('Please enter a search term.');
    }
  }));

  // Search and Replace
  $('#searchAndReplaceButton').click(safeExecute(function () {
    const searchTerm = $('#searchInput').val();
    const replaceTerm = $('#replaceInput').val();
    if (searchTerm) {
      const regex = new RegExp(searchTerm, 'g');
      const content = $notepad.val().replace(regex, replaceTerm);
      $notepad.val(content);
      saveState();
      showToast(`Replaced "${searchTerm}" with "${replaceTerm}"`);
    } else {
      showToast('Please enter a search term.');
    }
  }));

  // Keep Lines Containing
  $('#keepLinesButton').click(safeExecute(function () {
    const term = $('#keepLinesInput').val();
    if (term) {
      const lines = $notepad.val().split('\n');
      const filteredLines = lines.filter(line => line.includes(term));
      $notepad.val(filteredLines.join('\n'));
      saveState();
      showToast(`Kept lines containing "${term}"`);
    } else {
      showToast('Please enter a term to keep lines containing.');
    }
  }));

  // Remove Lines Containing
  $('#removeLinesButton').click(safeExecute(function () {
    const term = $('#removeLinesInput').val();
    if (term) {
      const lines = $notepad.val().split('\n');
      const filteredLines = lines.filter(line => !line.includes(term));
      $notepad.val(filteredLines.join('\n'));
      saveState();
      showToast(`Removed lines containing "${term}"`);
    } else {
      showToast('Please enter a term to remove lines containing.');
    }
  }));

  // Scroll to Top
  $('.scroll-to-top button').click(safeExecute(function () {
    $('html, body').animate({ scrollTop: 0 }, 'slow');
  }));

  // Add Keyboard Shortcut Event Listeners
  $notepad.on('keydown', function (event) {
    // Check if the Control key (or Command key on Mac) is pressed
    if (event.ctrlKey || event.metaKey) { // metaKey for Mac support
      switch (event.key.toLowerCase()) {
        case 'z':
          event.preventDefault(); // Prevent browser's default undo
          $('#undoButton').click(); // Trigger Undo
          break;
        case 'y':
          event.preventDefault(); // Prevent browser's default redo
          $('#redoButton').click(); // Trigger Redo
          break;
        default:
          break;
      }
    }
  });
});
