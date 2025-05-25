// Enhanced textMan v3.0 - Sidebar Edition

$(document).ready(function () {
  // ===== State Management =====
  const state = {
    undoStack: [''],
    redoStack: [],
    currentMode: 'plain',
    isDarkTheme: localStorage.getItem('textman-theme') === 'dark',
    isSidebarPinned: localStorage.getItem('textman-sidebar-pinned') === 'true',
    isSidebarOpen: true,
    findMatches: [],
    currentMatchIndex: -1,
    autoSaveInterval: null
  };

  // ===== Constants =====
  const MAX_UNDO_STACK = 50;
  const AUTOSAVE_DELAY = 30000; // 30 seconds
  const TOAST_DURATION = 3000;
  const MOBILE_BREAKPOINT = 768;

  // ===== DOM Elements Cache =====
  const elements = {
    notepad: $('#notepad'),
    lineNumbers: $('#lineNumbers'),
    wordCount: $('#wordCount'),
    charCount: $('#charCount'),
    lineCount: $('#lineCount'),
    paragraphCount: $('#paragraphCount'),
    readingTime: $('#readingTime'),
    languageDetect: $('#languageDetect'),
    undoButton: $('#undoButton'),
    redoButton: $('#redoButton'),
    themeToggle: $('#themeToggle'),
    progressBar: $('#progressBar'),
    progressFill: $('#progressBar .progress-fill'),
    contextMenu: $('#contextMenu'),
    findResults: $('#findResults'),
    fileInput: $('#fileInput'),
    sidebar: $('#toolsSidebar'),
    sidebarToggle: $('#sidebarToggle'),
    pinButton: $('#pinSidebar'),
    helpToggle: $('#helpToggle'),
    helpModal: $('#helpModal'),
    quickActionsBar: $('#quickActionsBar'),
    quickActionsToggle: $('#quickActionsToggle'),
    toolSearch: $('#toolSearch')
  };

  // ===== Initialization =====
  function init() {
    applyTheme();
    updateLineNumbers();
    updateStats();
    updateUndoRedoButtons();
    initializeEventListeners();
    initializeKeyboardShortcuts();
    initializeCollapsibles();
    initializeSidebar();
    initializeHelpModal();
    initializeQuickActions();
    setupAutoSave();
    restoreLastSession();
    showWelcomeMessage();
  }

  // ===== Theme Management =====
  function applyTheme() {
    if (state.isDarkTheme) {
      $('body').attr('data-theme', 'dark');
      elements.themeToggle.html('<i class="fas fa-sun"></i>');
    } else {
      $('body').removeAttr('data-theme');
      elements.themeToggle.html('<i class="fas fa-moon"></i>');
    }
  }

  elements.themeToggle.click(function() {
    state.isDarkTheme = !state.isDarkTheme;
    localStorage.setItem('textman-theme', state.isDarkTheme ? 'dark' : 'light');
    applyTheme();
    showToast('Theme changed', 'info');
  });

  // ===== Sidebar Management =====
  function initializeSidebar() {
    // Apply saved pin state
    if (state.isSidebarPinned) {
      elements.pinButton.addClass('pinned');
    }

    // Set initial sidebar state
    if (!state.isSidebarPinned && window.innerWidth > MOBILE_BREAKPOINT) {
      elements.sidebar.addClass('collapsed');
      state.isSidebarOpen = false;
    }

    // Sidebar toggle
    elements.sidebarToggle.click(toggleSidebar);

    // Pin button
    elements.pinButton.click(function() {
      state.isSidebarPinned = !state.isSidebarPinned;
      $(this).toggleClass('pinned');
      localStorage.setItem('textman-sidebar-pinned', state.isSidebarPinned);
      
      if (state.isSidebarPinned) {
        showToast('Sidebar pinned', 'info');
      } else {
        showToast('Sidebar unpinned', 'info');
      }
    });

    // Auto-close sidebar on mobile after tool use
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      $('.tool-btn, .quick-btn').click(function() {
        if (!state.isSidebarPinned) {
          setTimeout(() => {
            elements.sidebar.addClass('collapsed');
            elements.sidebarToggle.removeClass('active');
            state.isSidebarOpen = false;
          }, 500);
        }
      });
    }

    // Tool search functionality
    elements.toolSearch.on('input', debounce(function() {
      const searchTerm = $(this).val().toLowerCase();
      filterTools(searchTerm);
    }, 300));
  }

  function toggleSidebar() {
    state.isSidebarOpen = !state.isSidebarOpen;
    elements.sidebar.toggleClass('collapsed');
    elements.sidebarToggle.toggleClass('active');
  }

  function filterTools(searchTerm) {
    if (!searchTerm) {
      $('.tool-section').show();
      $('.tool-btn, .quick-btn').show();
      return;
    }

    $('.tool-section').each(function() {
      const section = $(this);
      let hasVisibleTools = false;

      section.find('.tool-btn, .quick-btn').each(function() {
        const button = $(this);
        const text = button.text().toLowerCase();
        const title = button.attr('title') || '';
        
        if (text.includes(searchTerm) || title.toLowerCase().includes(searchTerm)) {
          button.show();
          hasVisibleTools = true;
        } else {
          button.hide();
        }
      });

      if (hasVisibleTools) {
        section.show();
        section.removeClass('collapsed');
      } else {
        section.hide();
      }
    });
  }

  // ===== Quick Actions Bar =====
  function initializeQuickActions() {
    elements.quickActionsToggle.click(function() {
      elements.quickActionsBar.slideToggle(200);
      $(this).toggleClass('active');
    });

    $('.quick-action-btn').click(function() {
      const action = $(this).data('action');
      handleQuickAction(action);
    });
  }

  // ===== Help Modal =====
  function initializeHelpModal() {
    elements.helpToggle.click(function() {
      elements.helpModal.fadeIn(300);
    });

    $('#closeHelp').click(function() {
      elements.helpModal.fadeOut(300);
    });

    // Close on outside click
    elements.helpModal.click(function(e) {
      if ($(e.target).is('.help-modal')) {
        elements.helpModal.fadeOut(300);
      }
    });

    // Close on ESC
    $(document).on('keydown', function(e) {
      if (e.key === 'Escape' && elements.helpModal.is(':visible')) {
        elements.helpModal.fadeOut(300);
      }
    });
  }

  // ===== Line Numbers =====
  function updateLineNumbers() {
    const lines = elements.notepad.val().split('\n');
    let lineNumbersHtml = '';
    for (let i = 1; i <= lines.length; i++) {
      lineNumbersHtml += `${i}<br>`;
    }
    elements.lineNumbers.html(lineNumbersHtml);
  }

  // ===== Statistics =====
  function updateStats() {
    const text = elements.notepad.val();
    
    // Character count
    const charCount = text.length;
    elements.charCount.text(`${charCount} characters`);
    
    // Word count
    const words = text.match(/\b[\w']+\b/g) || [];
    const wordCount = words.length;
    elements.wordCount.text(`${wordCount} words`);
    
    // Line count
    const lines = text.split('\n');
    elements.lineCount.text(`${lines.length} lines`);
    
    // Paragraph count
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    elements.paragraphCount.text(`${paragraphs.length} paragraphs`);
    
    // Reading time (200 WPM average)
    const readingTime = Math.ceil(wordCount / 200);
    elements.readingTime.text(`${readingTime} min read`);
    
    // Simple language detection
    const language = detectLanguage(text);
    elements.languageDetect.text(language);
  }

  function detectLanguage(text) {
    // Simple heuristic - can be replaced with proper library
    const patterns = {
      'English': /\b(the|is|and|of|to|in|that|it|with|for)\b/gi,
      'Spanish': /\b(el|la|de|que|y|en|un|por|con|para)\b/gi,
      'French': /\b(le|de|la|et|en|un|que|pour|dans|ce)\b/gi,
      'German': /\b(der|die|das|und|in|den|von|zu|mit|auf)\b/gi
    };
    
    let maxCount = 0;
    let detectedLang = 'Unknown';
    
    for (const [lang, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern) || [];
      if (matches.length > maxCount) {
        maxCount = matches.length;
        detectedLang = lang;
      }
    }
    
    return detectedLang;
  }

  // ===== Undo/Redo System =====
  function saveState(action = 'user action') {
    const currentText = elements.notepad.val();
    
    if (state.undoStack[state.undoStack.length - 1] !== currentText) {
      state.undoStack.push(currentText);
      state.redoStack = [];
      
      if (state.undoStack.length > MAX_UNDO_STACK) {
        state.undoStack.shift();
      }
      
      updateUndoRedoButtons();
      console.log(`State saved: ${action}`);
    }
  }

  function updateUndoRedoButtons() {
    elements.undoButton.prop('disabled', state.undoStack.length <= 1);
    elements.redoButton.prop('disabled', state.redoStack.length === 0);
  }

  function undo() {
    if (state.undoStack.length > 1) {
      state.redoStack.push(state.undoStack.pop());
      const previousState = state.undoStack[state.undoStack.length - 1];
      elements.notepad.val(previousState);
      updateStats();
      updateLineNumbers();
      updateUndoRedoButtons();
      showToast('Undo successful', 'success');
    }
  }

  function redo() {
    if (state.redoStack.length > 0) {
      const nextState = state.redoStack.pop();
      state.undoStack.push(nextState);
      elements.notepad.val(nextState);
      updateStats();
      updateLineNumbers();
      updateUndoRedoButtons();
      showToast('Redo successful', 'success');
    }
  }

  // ===== Toast Notifications =====
  function showToast(message, type = 'info', duration = TOAST_DURATION) {
    const iconMap = {
      success: 'fa-check-circle',
      error: 'fa-times-circle',
      info: 'fa-info-circle',
      warning: 'fa-exclamation-triangle'
    };
    
    const toast = $(`
      <div class="toast ${type}">
        <i class="fas ${iconMap[type]}"></i>
        <span>${message}</span>
      </div>
    `);
    
    $('#toast-container').append(toast);
    
    setTimeout(() => {
      toast.css('animation', 'slideOut 0.3s ease-out');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ===== Progress Bar =====
  function showProgress(percent) {
    elements.progressBar.show();
    elements.progressFill.css('width', `${percent}%`);
    
    if (percent >= 100) {
      setTimeout(() => {
        elements.progressBar.hide();
        elements.progressFill.css('width', '0%');
      }, 500);
    }
  }

  // ===== Text Transformation Functions =====
  function transformText(transformFn, actionName) {
    const text = elements.notepad.val();
    if (!text && actionName !== 'Generate Lorem Ipsum') {
      showToast('No text to transform', 'warning');
      return;
    }
    
    showProgress(30);
    
    setTimeout(() => {
      try {
        const transformed = transformFn(text);
        if (transformed !== text) {
          elements.notepad.val(transformed);
          saveState(actionName);
          updateStats();
          updateLineNumbers();
          showToast(`${actionName} applied`, 'success');
        } else {
          showToast('No changes made', 'info');
        }
        showProgress(100);
      } catch (error) {
        console.error(`Error in ${actionName}:`, error);
        showToast(`Error: ${error.message}`, 'error');
        showProgress(100);
      }
    }, 100);
  }

  // Case transformations
  const caseTransformations = {
    lowercase: text => text.toLowerCase(),
    uppercase: text => text.toUpperCase(),
    titlecase: text => text.replace(/\w\S*/g, txt => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    ),
    sentenceCase: text => {
      return text.toLowerCase().replace(/(^|\. *)([a-z])/g, 
        (match, p1, p2) => p1 + p2.toUpperCase()
      );
    },
    camelCase: text => {
      return text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
        index === 0 ? word.toLowerCase() : word.toUpperCase()
      ).replace(/\s+/g, '');
    },
    snakeCase: text => text.toLowerCase().replace(/\s+/g, '_'),
    kebabCase: text => text.toLowerCase().replace(/\s+/g, '-'),
    alternatingCase: text => {
      return text.split('').map((char, i) => 
        i % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
      ).join('');
    },
    invertCase: text => {
      return text.split('').map(char => 
        char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
      ).join('');
    }
  };

  // Line operations
  function getLines(text) {
    return text.split(/\r?\n/);
  }

  function setLines(lines) {
    return lines.join('\n');
  }

  // ===== Event Listeners =====
  function initializeEventListeners() {
    // Notepad events
    elements.notepad.on('input', debounce(function() {
      updateStats();
      updateLineNumbers();
      saveState('typing');
    }, 500));

    // Toolbar buttons
    elements.undoButton.click(undo);
    elements.redoButton.click(redo);
    
    $('#copyButton').click(() => copyToClipboard());
    $('#cutButton').click(() => cutText());
    $('#pasteButton').click(() => pasteFromClipboard());
    $('#selectAllButton').click(() => elements.notepad.select());
    $('#clearButton').click(() => {
      if (confirm('Clear all text?')) {
        elements.notepad.val('');
        saveState('clear all');
        updateStats();
        updateLineNumbers();
        showToast('Text cleared', 'info');
      }
    });
    
    $('#saveButton').click(() => saveToFile());
    $('#loadButton').click(() => elements.fileInput.click());
    elements.fileInput.change(loadFromFile);

    // Quick actions
    $('.quick-btn').click(function() {
      const action = $(this).data('action');
      handleQuickAction(action);
    });

    // Transform buttons
    $('#toLowerCaseButton').click(() => 
      transformText(caseTransformations.lowercase, 'Lowercase'));
    $('#toUpperCaseButton').click(() => 
      transformText(caseTransformations.uppercase, 'Uppercase'));
    $('#capitalizeWordsButton').click(() => 
      transformText(caseTransformations.titlecase, 'Title Case'));
    $('#sentenceCaseButton').click(() => 
      transformText(caseTransformations.sentenceCase, 'Sentence Case'));
    $('#alternatingCaseButton').click(() => 
      transformText(caseTransformations.alternatingCase, 'Alternating Case'));
    $('#invertCaseButton').click(() => 
      transformText(caseTransformations.invertCase, 'Invert Case'));
    $('#camelCaseButton').click(() => 
      transformText(caseTransformations.camelCase, 'Camel Case'));
    $('#snakeCaseButton').click(() => 
      transformText(caseTransformations.snakeCase, 'Snake Case'));
    $('#kebabCaseButton').click(() => 
      transformText(caseTransformations.kebabCase, 'Kebab Case'));

    // Base64
    $('#base64EncodeButton').click(() => 
      transformText(text => btoa(unescape(encodeURIComponent(text))), 'Base64 Encode'));
    $('#base64DecodeButton').click(() => 
      transformText(text => {
        try {
          return decodeURIComponent(escape(atob(text)));
        } catch (e) {
          throw new Error('Invalid Base64 string');
        }
      }, 'Base64 Decode'));

    // Sort operations
    $('#sortLinesAZButton').click(() => 
      transformText(text => setLines(getLines(text).sort()), 'Sort A-Z'));
    $('#sortLinesZAButton').click(() => 
      transformText(text => setLines(getLines(text).sort().reverse()), 'Sort Z-A'));
    $('#sortLinesShortestButton').click(() => 
      transformText(text => setLines(getLines(text).sort((a, b) => a.length - b.length)), 'Sort by Length'));
    $('#sortLinesLongestButton').click(() => 
      transformText(text => setLines(getLines(text).sort((a, b) => b.length - a.length)), 'Sort by Length'));
    $('#sortNumericalButton').click(() => 
      transformText(text => setLines(getLines(text).sort((a, b) => {
        const numA = parseFloat(a) || 0;
        const numB = parseFloat(b) || 0;
        return numA - numB;
      })), 'Sort Numerically'));
    $('#shuffleLinesButton').click(() => 
      transformText(text => {
        const lines = getLines(text);
        for (let i = lines.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [lines[i], lines[j]] = [lines[j], lines[i]];
        }
        return setLines(lines);
      }, 'Shuffle Lines'));
    $('#reverseTextButton').click(() => 
      transformText(text => text.split('').reverse().join(''), 'Reverse Text'));
    $('#reverseLinesButton').click(() => 
      transformText(text => setLines(getLines(text).reverse()), 'Reverse Lines'));

    // Find & Replace
    $('#findButton').click(() => findInText());
    $('#replaceButton').click(() => replaceAll());
    $('#replaceOneButton').click(() => replaceNext());
    $('#prevMatch').click(() => navigateMatches(-1));
    $('#nextMatch').click(() => navigateMatches(1));

    // Add/Remove operations
    $('#addPrefixButton').click(() => {
      const prefix = $('#prefixInput').val();
      transformText(text => setLines(getLines(text).map(line => prefix + line)), 'Add Prefix');
    });
    
    $('#addSuffixButton').click(() => {
      const suffix = $('#suffixInput').val();
      transformText(text => setLines(getLines(text).map(line => line + suffix)), 'Add Suffix');
    });
    
    $('#wrapLinesButton').click(() => {
      const wrapper = $('#wrapInput').val();
      transformText(text => setLines(getLines(text).map(line => wrapper + line + wrapper)), 'Wrap Lines');
    });

    // Remove operations
    $('#removeDuplicatesButton').click(() => 
      transformText(text => setLines([...new Set(getLines(text))]), 'Remove Duplicates'));
    $('#removeEmptyLinesButton').click(() => 
      transformText(text => setLines(getLines(text).filter(line => line.trim())), 'Remove Empty Lines'));
    $('#removeExtraSpacesButton').click(() => 
      transformText(text => text.replace(/  +/g, ' ').trim(), 'Remove Extra Spaces'));
    $('#removeAllSpacesButton').click(() => 
      transformText(text => text.replace(/\s/g, ''), 'Remove All Spaces'));
    $('#removeNumbersButton').click(() => 
      transformText(text => text.replace(/\d/g, ''), 'Remove Numbers'));
    $('#removePunctuationButton').click(() => 
      transformText(text => text.replace(/[^\w\s]|_/g, ''), 'Remove Punctuation'));
    $('#removeLineBreaksButton').click(() => 
      transformText(text => text.replace(/\n/g, ' '), 'Remove Line Breaks'));
    $('#removeAccentsButton').click(() => 
      transformText(text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''), 'Remove Accents'));

    // Filter operations
    $('#keepLinesButton').click(() => {
      const term = $('#keepLinesInput').val();
      if (term) {
        transformText(text => setLines(getLines(text).filter(line => line.includes(term))), 'Keep Lines');
      }
    });
    
    $('#removeLinesButton').click(() => {
      const term = $('#removeLinesInput').val();
      if (term) {
        transformText(text => setLines(getLines(text).filter(line => !line.includes(term))), 'Remove Lines');
      }
    });

    // Extract operations
    $('#extractUrlsButton').click(() => 
      transformText(text => {
        const urls = text.match(/https?:\/\/[^\s]+/g) || [];
        return urls.join('\n');
      }, 'Extract URLs'));
    
    $('#extractEmailsButton').click(() => 
      transformText(text => {
        const emails = text.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
        return emails.join('\n');
      }, 'Extract Emails'));
    
    $('#extractNumbersButton').click(() => 
      transformText(text => {
        const numbers = text.match(/\b\d+\.?\d*\b/g) || [];
        return numbers.join('\n');
      }, 'Extract Numbers'));

    // Advanced tools
    $('#jsonFormatButton').click(() => 
      transformText(text => {
        try {
          return JSON.stringify(JSON.parse(text), null, 2);
        } catch (e) {
          throw new Error('Invalid JSON');
        }
      }, 'Format JSON'));
    
    $('#jsonMinifyButton').click(() => 
      transformText(text => {
        try {
          return JSON.stringify(JSON.parse(text));
        } catch (e) {
          throw new Error('Invalid JSON');
        }
      }, 'Minify JSON'));
    
    $('#generateLoremButton').click(() => {
      const lorem = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;
      transformText(() => lorem, 'Generate Lorem Ipsum');
    });
    
    $('#wordFrequencyButton').click(() => showWordFrequency());
    $('#csvToTableButton').click(() => csvToTable());
    $('#markdownPreviewButton').click(() => showMarkdownPreview());
    $('#textDiffButton').click(() => showTextDiff());

    // Context menu
    elements.notepad.on('contextmenu', function(e) {
      e.preventDefault();
      showContextMenu(e.pageX, e.pageY);
    });
    
    $(document).click(() => elements.contextMenu.hide());
    
    $('.context-item').click(function() {
      const action = $(this).data('action');
      handleContextAction(action);
      elements.contextMenu.hide();
    });

    // Editor mode buttons
    $('.mode-btn').click(function() {
      $('.mode-btn').removeClass('active');
      $(this).addClass('active');
      state.currentMode = $(this).data('mode');
      showToast(`Switched to ${state.currentMode} mode`, 'info');
    });
  }

  // ===== Quick Actions =====
  function handleQuickAction(action) {
    switch(action) {
      case 'lowercase':
        transformText(caseTransformations.lowercase, 'Lowercase');
        break;
      case 'uppercase':
        transformText(caseTransformations.uppercase, 'Uppercase');
        break;
      case 'titlecase':
        transformText(caseTransformations.titlecase, 'Title Case');
        break;
      case 'removeSpaces':
        transformText(text => text.replace(/  +/g, ' ').trim(), 'Remove Extra Spaces');
        break;
      case 'removeDuplicates':
        transformText(text => setLines([...new Set(getLines(text))]), 'Remove Duplicates');
        break;
      case 'reverse':
        transformText(text => text.split('').reverse().join(''), 'Reverse Text');
        break;
    }
  }

  // ===== Clipboard Operations =====
  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(elements.notepad.val());
      showToast('Copied to clipboard', 'success');
    } catch (err) {
      console.error('Failed to copy:', err);
      showToast('Failed to copy', 'error');
    }
  }

  async function cutText() {
    await copyToClipboard();
    elements.notepad.val('');
    saveState('cut');
    updateStats();
    updateLineNumbers();
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      const currentText = elements.notepad.val();
      const cursorPos = elements.notepad[0].selectionStart;
      const newText = currentText.slice(0, cursorPos) + text + currentText.slice(cursorPos);
      elements.notepad.val(newText);
      saveState('paste');
      updateStats();
      updateLineNumbers();
      showToast('Pasted from clipboard', 'success');
    } catch (err) {
      console.error('Failed to paste:', err);
      showToast('Failed to paste', 'error');
    }
  }

  // ===== File Operations =====
  function saveToFile() {
    const text = elements.notepad.val();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `textman_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('File saved', 'success');
  }

  function loadFromFile(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        elements.notepad.val(e.target.result);
        saveState('load file');
        updateStats();
        updateLineNumbers();
        showToast(`Loaded ${file.name}`, 'success');
      };
      reader.readAsText(file);
    }
  }

  // ===== Find & Replace =====
  function findInText() {
    const searchTerm = $('#findInput').val();
    if (!searchTerm) {
      showToast('Enter a search term', 'warning');
      return;
    }

    const text = elements.notepad.val();
    const caseSensitive = $('#caseSensitive').is(':checked');
    const wholeWord = $('#wholeWord').is(':checked');
    const useRegex = $('#useRegex').is(':checked');

    let pattern;
    if (useRegex) {
      try {
        pattern = new RegExp(searchTerm, caseSensitive ? 'g' : 'gi');
      } catch (e) {
        showToast('Invalid regex pattern', 'error');
        return;
      }
    } else {
      let escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (wholeWord) {
        escapedTerm = `\\b${escapedTerm}\\b`;
      }
      pattern = new RegExp(escapedTerm, caseSensitive ? 'g' : 'gi');
    }

    state.findMatches = [...text.matchAll(pattern)];
    state.currentMatchIndex = state.findMatches.length > 0 ? 0 : -1;

    $('#findResults').show();
    $('.results-count').text(`${state.findMatches.length} matches found`);
    updateMatchNavigation();
    
    if (state.findMatches.length > 0) {
      highlightCurrentMatch();
    }
  }

  function replaceAll() {
    const searchTerm = $('#findInput').val();
    const replaceTerm = $('#replaceInput').val();
    
    if (!searchTerm) {
      showToast('Enter a search term', 'warning');
      return;
    }

    findInText();
    if (state.findMatches.length === 0) {
      showToast('No matches to replace', 'info');
      return;
    }

    const text = elements.notepad.val();
    const caseSensitive = $('#caseSensitive').is(':checked');
    const wholeWord = $('#wholeWord').is(':checked');
    const useRegex = $('#useRegex').is(':checked');

    let pattern;
    if (useRegex) {
      pattern = new RegExp(searchTerm, caseSensitive ? 'g' : 'gi');
    } else {
      let escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (wholeWord) {
        escapedTerm = `\\b${escapedTerm}\\b`;
      }
      pattern = new RegExp(escapedTerm, caseSensitive ? 'g' : 'gi');
    }

    const newText = text.replace(pattern, replaceTerm);
    elements.notepad.val(newText);
    saveState('replace all');
    updateStats();
    updateLineNumbers();
    showToast(`Replaced ${state.findMatches.length} occurrences`, 'success');
    $('#findResults').hide();
  }

  function replaceNext() {
    if (state.findMatches.length === 0 || state.currentMatchIndex === -1) {
      findInText();
      if (state.findMatches.length === 0) {
        showToast('No matches to replace', 'info');
        return;
      }
    }

    const match = state.findMatches[state.currentMatchIndex];
    const replaceTerm = $('#replaceInput').val();
    const text = elements.notepad.val();
    
    const newText = text.slice(0, match.index) + 
                   replaceTerm + 
                   text.slice(match.index + match[0].length);
    
    elements.notepad.val(newText);
    saveState('replace next');
    updateStats();
    updateLineNumbers();
    
    // Re-find to update matches
    findInText();
    showToast('Replaced 1 occurrence', 'success');
  }

  function navigateMatches(direction) {
    if (state.findMatches.length === 0) return;
    
    state.currentMatchIndex += direction;
    if (state.currentMatchIndex < 0) {
      state.currentMatchIndex = state.findMatches.length - 1;
    } else if (state.currentMatchIndex >= state.findMatches.length) {
      state.currentMatchIndex = 0;
    }
    
    updateMatchNavigation();
    highlightCurrentMatch();
  }

  function updateMatchNavigation() {
    const total = state.findMatches.length;
    const current = total > 0 ? state.currentMatchIndex + 1 : 0;
    $('.current-match').text(`${current}/${total}`);
    $('#prevMatch, #nextMatch').prop('disabled', total === 0);
  }

  function highlightCurrentMatch() {
    if (state.currentMatchIndex === -1) return;
    
    const match = state.findMatches[state.currentMatchIndex];
    const textarea = elements.notepad[0];
    textarea.setSelectionRange(match.index, match.index + match[0].length);
    textarea.focus();
    
    // Scroll to match
    const textBeforeMatch = textarea.value.substring(0, match.index);
    const lineNumber = textBeforeMatch.split('\n').length;
    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
    textarea.scrollTop = (lineNumber - 5) * lineHeight;
  }

  // ===== Advanced Tools =====
  function showWordFrequency() {
    const text = elements.notepad.val();
    const words = text.toLowerCase().match(/\b[\w']+\b/g) || [];
    const frequency = {};
    
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    const sorted = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    
    const result = 'Word Frequency Analysis:\n\n' +
      sorted.map(([word, count]) => `${word}: ${count}`).join('\n');
    
    transformText(() => result, 'Word Frequency Analysis');
  }

  function csvToTable() {
    const text = elements.notepad.val();
    const lines = getLines(text);
    if (lines.length === 0) {
      showToast('No CSV data found', 'warning');
      return;
    }
    
    const separator = text.includes('\t') ? '\t' : ',';
    const rows = lines.map(line => line.split(separator));
    
    // Create markdown table
    let table = '| ' + rows[0].join(' | ') + ' |\n';
    table += '| ' + rows[0].map(() => '---').join(' | ') + ' |\n';
    
    for (let i = 1; i < rows.length; i++) {
      table += '| ' + rows[i].join(' | ') + ' |\n';
    }
    
    transformText(() => table, 'CSV to Table');
  }

  function showMarkdownPreview() {
    const markdown = elements.notepad.val();
    // Simple markdown to HTML conversion (can be enhanced with a library)
    let html = markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\n/g, '<br>');
    
    const preview = window.open('', 'Markdown Preview', 'width=800,height=600');
    preview.document.write(`
      <html>
        <head>
          <title>Markdown Preview</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1, h2, h3 { color: #333; }
            a { color: #0066cc; }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);
    preview.document.close();
  }

  function showTextDiff() {
    const currentText = elements.notepad.val();
    const diffContainer = $(`
      <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                  background: white; border: 1px solid #ccc; padding: 20px; 
                  box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 1000; 
                  max-width: 80%; max-height: 80%; overflow: auto;">
        <h3>Text Diff Tool</h3>
        <p>Paste text to compare:</p>
        <textarea id="compareText" rows="10" cols="50" style="width: 100%;"></textarea>
        <div style="margin-top: 10px;">
          <button id="performDiff">Compare</button>
          <button id="closeDiff">Close</button>
        </div>
        <div id="diffResult" style="margin-top: 20px;"></div>
      </div>
    `);
    
    $('body').append(diffContainer);
    
    $('#performDiff').click(() => {
      const compareText = $('#compareText').val();
      const diff = findDifferences(currentText, compareText);
      $('#diffResult').html(diff);
    });
    
    $('#closeDiff').click(() => diffContainer.remove());
  }

  function findDifferences(text1, text2) {
    const lines1 = getLines(text1);
    const lines2 = getLines(text2);
    let result = '<pre style="font-family: monospace;">';
    
    const maxLines = Math.max(lines1.length, lines2.length);
    
    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';
      
      if (line1 === line2) {
        result += `  ${line1}\n`;
      } else {
        if (line1) result += `<span style="color: red;">- ${line1}</span>\n`;
        if (line2) result += `<span style="color: green;">+ ${line2}</span>\n`;
      }
    }
    
    result += '</pre>';
    return result;
  }

  // ===== Context Menu =====
  function showContextMenu(x, y) {
    elements.contextMenu.css({
      display: 'block',
      left: x + 'px',
      top: y + 'px'
    });
  }

  function handleContextAction(action) {
    switch(action) {
      case 'cut':
        cutText();
        break;
      case 'copy':
        copyToClipboard();
        break;
      case 'paste':
        pasteFromClipboard();
        break;
      case 'selectAll':
        elements.notepad.select();
        break;
      case 'transform':
        showTransformMenu();
        break;
    }
  }

  function showTransformMenu() {
    // Open sidebar and scroll to transform section
    if (elements.sidebar.hasClass('collapsed')) {
      toggleSidebar();
    }
    
    setTimeout(() => {
      const transformSection = $('.tool-section').eq(1);
      transformSection.removeClass('collapsed');
      $('.sidebar-content').animate({
        scrollTop: transformSection.position().top
      }, 500);
    }, 300);
  }

  // ===== Keyboard Shortcuts =====
  function initializeKeyboardShortcuts() {
    $(document).on('keydown', function(e) {
      // Check if a text input is focused (except notepad)
      if ($(e.target).is('input:not(#notepad), select') || 
          ($(e.target).is('textarea') && !$(e.target).is('#notepad'))) {
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;
      const key = e.key.toLowerCase();

      // Ctrl shortcuts
      if (ctrl && !shift && !alt) {
        switch(key) {
          case 'z':
            e.preventDefault();
            undo();
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 's':
            e.preventDefault();
            saveToFile();
            break;
          case 'o':
            e.preventDefault();
            elements.fileInput.click();
            break;
          case 'f':
            e.preventDefault();
            if (elements.sidebar.hasClass('collapsed')) {
              toggleSidebar();
            }
            $('#findInput').focus();
            break;
          case 'h':
            e.preventDefault();
            if (elements.sidebar.hasClass('collapsed')) {
              toggleSidebar();
            }
            $('#replaceInput').focus();
            break;
          case 'l':
            e.preventDefault();
            transformText(caseTransformations.lowercase, 'Lowercase');
            break;
          case 'u':
            e.preventDefault();
            transformText(caseTransformations.uppercase, 'Uppercase');
            break;
          case 't':
            e.preventDefault();
            transformText(caseTransformations.titlecase, 'Title Case');
            break;
          case 'd':
            e.preventDefault();
            duplicateCurrentLine();
            break;
          case 'b':
            e.preventDefault();
            toggleSidebar();
            break;
        }
      }

      // Alt + Arrow shortcuts for moving lines
      if (alt && (key === 'arrowup' || key === 'arrowdown')) {
        e.preventDefault();
        moveCurrentLine(key === 'arrowup' ? -1 : 1);
      }

      // ESC to close help modal
      if (key === 'escape') {
        if (elements.helpModal.is(':visible')) {
          elements.helpModal.fadeOut(300);
        }
      }
    });
  }

  function duplicateCurrentLine() {
    const textarea = elements.notepad[0];
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;
    const lines = getLines(text);
    
    // Find current line
    let charCount = 0;
    let currentLineIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= cursorPos) {
        currentLineIndex = i;
        break;
      }
      charCount += lines[i].length + 1; // +1 for newline
    }
    
    // Duplicate the line
    lines.splice(currentLineIndex + 1, 0, lines[currentLineIndex]);
    elements.notepad.val(setLines(lines));
    
    // Move cursor to duplicated line
    let newCursorPos = charCount;
    for (let i = 0; i <= currentLineIndex + 1; i++) {
      if (i === currentLineIndex + 1) {
        newCursorPos += cursorPos - charCount;
      } else {
        newCursorPos += lines[i].length + 1;
      }
    }
    
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    saveState('duplicate line');
    updateStats();
    updateLineNumbers();
  }

  function moveCurrentLine(direction) {
    const textarea = elements.notepad[0];
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;
    const lines = getLines(text);
    
    // Find current line
    let charCount = 0;
    let currentLineIndex = 0;
    let posInLine = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= cursorPos) {
        currentLineIndex = i;
        posInLine = cursorPos - charCount;
        break;
      }
      charCount += lines[i].length + 1;
    }
    
    // Check bounds
    const newIndex = currentLineIndex + direction;
    if (newIndex < 0 || newIndex >= lines.length) return;
    
    // Swap lines
    [lines[currentLineIndex], lines[newIndex]] = [lines[newIndex], lines[currentLineIndex]];
    elements.notepad.val(setLines(lines));
    
    // Calculate new cursor position
    let newCursorPos = 0;
    for (let i = 0; i < newIndex; i++) {
      newCursorPos += lines[i].length + 1;
    }
    newCursorPos += Math.min(posInLine, lines[newIndex].length);
    
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    saveState('move line');
    updateStats();
    updateLineNumbers();
  }

  // ===== Collapsible Sections =====
  function initializeCollapsibles() {
    $('.collapsible .section-toggle').click(function() {
      $(this).parent().toggleClass('collapsed');
    });
  }

  // ===== Auto Save =====
  function setupAutoSave() {
    state.autoSaveInterval = setInterval(() => {
      const text = elements.notepad.val();
      if (text) {
        localStorage.setItem('textman-autosave', text);
        localStorage.setItem('textman-autosave-time', new Date().toISOString());
      }
    }, AUTOSAVE_DELAY);
  }

  function restoreLastSession() {
    const savedText = localStorage.getItem('textman-autosave');
    const savedTime = localStorage.getItem('textman-autosave-time');
    
    if (savedText && savedTime) {
      const timeDiff = Date.now() - new Date(savedTime).getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      if (hoursDiff < 24) {
        elements.notepad.val(savedText);
        saveState('restore session');
        updateStats();
        updateLineNumbers();
        showToast('Previous session restored', 'info');
      }
    }
  }

  // ===== Utility Functions =====
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function showWelcomeMessage() {
    const lastVisit = localStorage.getItem('textman-last-visit');
    const now = new Date().toDateString();
    
    if (lastVisit !== now) {
      showToast('Welcome to textMan v3.0! 🎉', 'success', 5000);
      localStorage.setItem('textman-last-visit', now);
    }
  }

  // ===== Drag & Drop =====
  elements.notepad.on('dragover', function(e) {
    e.preventDefault();
    $(this).addClass('drag-over');
  });

  elements.notepad.on('dragleave', function() {
    $(this).removeClass('drag-over');
  });

  elements.notepad.on('drop', function(e) {
    e.preventDefault();
    $(this).removeClass('drag-over');
    
    const files = e.originalEvent.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('text/') || file.name.match(/\.(txt|md|json|csv|html|css|js)$/i)) {
        const reader = new FileReader();
        reader.onload = function(e) {
          elements.notepad.val(e.target.result);
          saveState('drop file');
          updateStats();
          updateLineNumbers();
          showToast(`Loaded ${file.name}`, 'success');
        };
        reader.readAsText(file);
      } else {
        showToast('Please drop a text file', 'warning');
      }
    }
  });

  // ===== Window Resize Handler =====
  $(window).resize(debounce(function() {
    // Auto-close sidebar on mobile if not pinned
    if (window.innerWidth <= MOBILE_BREAKPOINT && !state.isSidebarPinned && state.isSidebarOpen) {
      elements.sidebar.addClass('collapsed');
      elements.sidebarToggle.removeClass('active');
      state.isSidebarOpen = false;
    }
  }, 250));

  // ===== Initialize Everything =====
  init();
});
