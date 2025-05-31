// Find and Replace Module
const FindReplace = (function() {
  'use strict';
  
  let findInput = null;
  let replaceInput = null;
  let caseSensitiveCheck = null;
  let wholeWordCheck = null;
  let useRegexCheck = null;
  let findResults = null;
  let resultsCount = null;
  let currentMatchSpan = null;
  let prevMatchBtn = null;
  let nextMatchBtn = null;
  
  let matches = [];
  let currentMatchIndex = -1;
  let highlightedElements = [];
  
  // Initialize find and replace
  function init() {
    // Get elements
    findInput = document.getElementById('findInput');
    replaceInput = document.getElementById('replaceInput');
    caseSensitiveCheck = document.getElementById('caseSensitive');
    wholeWordCheck = document.getElementById('wholeWord');
    useRegexCheck = document.getElementById('useRegex');
    findResults = document.getElementById('findResults');
    resultsCount = findResults?.querySelector('.results-count');
    currentMatchSpan = findResults?.querySelector('.current-match');
    prevMatchBtn = document.getElementById('prevMatch');
    nextMatchBtn = document.getElementById('nextMatch');
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts();
  }
  
  // Setup event listeners
  function setupEventListeners() {
    // Find button
    const findBtn = document.getElementById('findButton');
    if (findBtn) {
      findBtn.addEventListener('click', find);
    }
    
    // Replace buttons
    const replaceBtn = document.getElementById('replaceButton');
    const replaceOneBtn = document.getElementById('replaceOneButton');
    
    if (replaceBtn) {
      replaceBtn.addEventListener('click', replaceAll);
    }
    
    if (replaceOneBtn) {
      replaceOneBtn.addEventListener('click', replaceNext);
    }
    
    // Input events
    if (findInput) {
      findInput.addEventListener('input', Utils.function.debounce(() => {
        if (findInput.value) {
          find();
        } else {
          clearHighlights();
        }
      }, 300));
      
      findInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (e.shiftKey) {
            navigateToPrevious();
          } else {
            navigateToNext();
          }
        }
        if (e.key === 'Escape') {
          clearFind();
        }
      });
    }
    
    if (replaceInput) {
      replaceInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          replaceNext();
        }
      });
    }
    
    // Navigation buttons
    if (prevMatchBtn) {
      prevMatchBtn.addEventListener('click', navigateToPrevious);
    }
    
    if (nextMatchBtn) {
      nextMatchBtn.addEventListener('click', navigateToNext);
    }
    
    // Options checkboxes
    [caseSensitiveCheck, wholeWordCheck, useRegexCheck].forEach(checkbox => {
      if (checkbox) {
        checkbox.addEventListener('change', () => {
          if (findInput.value) {
            find();
          }
        });
      }
    });
  }
  
  // Setup keyboard shortcuts
  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'f') {
          e.preventDefault();
          openFind();
        } else if (e.key === 'h') {
          e.preventDefault();
          openReplace();
        } else if (e.key === 'g') {
          e.preventDefault();
          if (e.shiftKey) {
            navigateToPrevious();
          } else {
            navigateToNext();
          }
        }
      }
      
      // F3 shortcuts
      if (e.key === 'F3') {
        e.preventDefault();
        if (e.shiftKey) {
          navigateToPrevious();
        } else {
          navigateToNext();
        }
      }
    });
  }
  
  // Open find dialog
  function openFind() {
    if (findInput) {
      findInput.focus();
      findInput.select();
      
      // Populate with selected text
      const selection = Editor.getSelection();
      if (selection) {
        findInput.value = selection;
        find();
      }
    }
  }
  
  // Open replace dialog
  function openReplace() {
    openFind();
    if (replaceInput) {
      setTimeout(() => replaceInput.focus(), 100);
    }
  }
  
  // Find all matches
  function find() {
    const searchTerm = findInput.value;
    
    if (!searchTerm) {
      clearHighlights();
      return;
    }
    
    const content = Editor.getContent();
    const options = getSearchOptions();
    
    try {
      matches = findMatches(content, searchTerm, options);
      
      // Update UI
      updateResults(matches.length);
      
      // Highlight matches
      highlightMatches();
      
      // Navigate to first match
      if (matches.length > 0) {
        currentMatchIndex = 0;
        navigateToMatch(0);
      }
      
      // Update state
      AppState.update({
        'find.searchTerm': searchTerm,
        'find.matches': matches,
        'find.currentMatch': currentMatchIndex
      });
      
    } catch (error) {
      console.error('Find error:', error);
      ToastManager.show({
        message: 'Invalid search pattern',
        type: 'error'
      });
    }
  }
  
  // Find matches in content
  function findMatches(content, searchTerm, options) {
    const matches = [];
    let regex;
    
    if (options.useRegex) {
      // Use regex as-is
      regex = new RegExp(searchTerm, options.caseSensitive ? 'g' : 'gi');
    } else {
      // Escape special regex characters
      let pattern = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Whole word option
      if (options.wholeWord) {
        pattern = `\\b${pattern}\\b`;
      }
      
      regex = new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
    }
    
    let match;
    while ((match = regex.exec(content)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        line: getLineNumber(content, match.index)
      });
    }
    
    return matches;
  }
  
  // Get line number for position
  function getLineNumber(content, position) {
    const lines = content.substring(0, position).split('\n');
    return lines.length;
  }
  
  // Get search options
  function getSearchOptions() {
    return {
      caseSensitive: caseSensitiveCheck?.checked || false,
      wholeWord: wholeWordCheck?.checked || false,
      useRegex: useRegexCheck?.checked || false
    };
  }
  
  // Highlight matches in editor
  function highlightMatches() {
    // This is a simplified version - in a real implementation,
    // you might use a more sophisticated highlighting approach
    const textarea = document.getElementById('notepad');
    if (!textarea) return;
    
    // Store current selection
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    
    // Clear previous highlights
    clearHighlights();
    
    // For now, we'll just show visual feedback
    // In a production app, you might overlay spans or use a rich text editor
    
    // Restore selection
    textarea.setSelectionRange(selectionStart, selectionEnd);
  }
  
  // Navigate to match
  function navigateToMatch(index) {
    if (index < 0 || index >= matches.length) return;
    
    const match = matches[index];
    const textarea = document.getElementById('notepad');
    
    if (textarea) {
      // Set selection to match
      textarea.setSelectionRange(match.start, match.end);
      
      // Scroll to match
      scrollToMatch(match);
      
      // Update current match display
      updateCurrentMatch(index);
      
      // Focus textarea
      textarea.focus();
    }
  }
  
  // Scroll to match
  function scrollToMatch(match) {
    const textarea = document.getElementById('notepad');
    if (!textarea) return;
    
    // Calculate approximate scroll position
    const content = textarea.value;
    const beforeMatch = content.substring(0, match.start);
    const lines = beforeMatch.split('\n');
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    const scrollTop = (lines.length - 1) * lineHeight;
    
    // Scroll with some offset to center the match
    const offset = textarea.clientHeight / 2;
    textarea.scrollTop = Math.max(0, scrollTop - offset);
  }
  
  // Navigate to next match
  function navigateToNext() {
    if (matches.length === 0) {
      if (findInput.value) {
        find();
      }
      return;
    }
    
    currentMatchIndex = (currentMatchIndex + 1) % matches.length;
    navigateToMatch(currentMatchIndex);
  }
  
  // Navigate to previous match
  function navigateToPrevious() {
    if (matches.length === 0) {
      if (findInput.value) {
        find();
      }
      return;
    }
    
    currentMatchIndex = currentMatchIndex - 1;
    if (currentMatchIndex < 0) {
      currentMatchIndex = matches.length - 1;
    }
    navigateToMatch(currentMatchIndex);
  }
  
  // Replace next match
  function replaceNext() {
    if (matches.length === 0) {
      find();
      return;
    }
    
    const replaceText = replaceInput.value;
    const content = Editor.getContent();
    const match = matches[currentMatchIndex];
    
    if (!match) return;
    
    // Perform replacement
    const newContent = 
      content.substring(0, match.start) + 
      replaceText + 
      content.substring(match.end);
    
    Editor.setContent(newContent);
    
    // Re-find matches (positions have changed)
    find();
    
    // Show feedback
    ToastManager.show({
      message: 'Replaced 1 occurrence',
      type: 'success',
      duration: 1500
    });
  }
  
  // Replace all matches
  function replaceAll() {
    const searchTerm = findInput.value;
    const replaceText = replaceInput.value;
    
    if (!searchTerm) {
      ToastManager.show({
        message: 'Please enter a search term',
        type: 'warning'
      });
      return;
    }
    
    const content = Editor.getContent();
    const options = getSearchOptions();
    
    try {
      let newContent;
      let count;
      
      if (options.useRegex) {
        const regex = new RegExp(searchTerm, options.caseSensitive ? 'g' : 'gi');
        count = (content.match(regex) || []).length;
        newContent = content.replace(regex, replaceText);
      } else {
        let pattern = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        if (options.wholeWord) {
          pattern = `\\b${pattern}\\b`;
        }
        
        const regex = new RegExp(pattern, options.caseSensitive ? 'g' : 'gi');
        count = (content.match(regex) || []).length;
        newContent = content.replace(regex, replaceText);
      }
      
      if (count > 0) {
        Editor.setContent(newContent);
        
        // Clear highlights
        clearHighlights();
        
        // Show feedback
        ToastManager.show({
          message: `Replaced ${count} occurrence${count > 1 ? 's' : ''}`,
          type: 'success'
        });
      } else {
        ToastManager.show({
          message: 'No matches found',
          type: 'info'
        });
      }
      
    } catch (error) {
      console.error('Replace error:', error);
      ToastManager.show({
        message: 'Invalid search pattern',
        type: 'error'
      });
    }
  }
  
  // Update results display
  function updateResults(count) {
    if (!findResults) return;
    
    if (count > 0) {
      findResults.style.display = 'flex';
      resultsCount.textContent = `${count} match${count > 1 ? 'es' : ''} found`;
      prevMatchBtn.disabled = false;
      nextMatchBtn.disabled = false;
    } else {
      if (findInput.value) {
        findResults.style.display = 'flex';
        resultsCount.textContent = 'No matches found';
      } else {
        findResults.style.display = 'none';
      }
      prevMatchBtn.disabled = true;
      nextMatchBtn.disabled = true;
    }
  }
  
  // Update current match display
  function updateCurrentMatch(index) {
    if (!currentMatchSpan || matches.length === 0) return;
    
    currentMatchSpan.textContent = `${index + 1}/${matches.length}`;
  }
  
  // Clear highlights
  function clearHighlights() {
    highlightedElements.forEach(el => el.remove());
    highlightedElements = [];
    
    if (findResults) {
      findResults.style.display = 'none';
    }
    
    matches = [];
    currentMatchIndex = -1;
  }
  
  // Clear find
  function clearFind() {
    if (findInput) {
      findInput.value = '';
    }
    clearHighlights();
  }
  
  // Get current state
  function getState() {
    return {
      searchTerm: findInput?.value || '',
      replaceTerm: replaceInput?.value || '',
      options: getSearchOptions(),
      matches: matches.length,
      currentMatch: currentMatchIndex
    };
  }
  
  // Public API
  return {
    init,
    find,
    replaceNext,
    replaceAll,
    navigateToNext,
    navigateToPrevious,
    openFind,
    openReplace,
    clearFind,
    getState
  };
})();