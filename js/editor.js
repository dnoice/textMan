// Core Editor Functionality
const Editor = (function() {
  'use strict';
  
  let textarea = null;
  let lineNumbers = null;
  let lastContent = '';
  let isComposing = false;
  
  // Initialize editor
  function init() {
    textarea = document.getElementById('notepad');
    lineNumbers = document.getElementById('lineNumbers');
    
    if (!textarea) {
      console.error('Editor textarea not found');
      return;
    }
    
    // Set initial content from localStorage
    loadSavedContent();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize line numbers
    updateLineNumbers();
    
    // Sync scroll between textarea and line numbers
    syncScroll();
    
    // Initialize editor modes
    initializeModes();
    
    // Subscribe to state changes
    subscribeToState();
  }
  
  // Setup event listeners
  function setupEventListeners() {
    // Text input events
    textarea.addEventListener('input', handleInput);
    textarea.addEventListener('change', handleChange);
    textarea.addEventListener('scroll', handleScroll);
    textarea.addEventListener('keydown', handleKeyDown);
    textarea.addEventListener('select', handleSelection);
    textarea.addEventListener('focus', handleFocus);
    textarea.addEventListener('blur', handleBlur);
    
    // Composition events for IME support
    textarea.addEventListener('compositionstart', () => isComposing = true);
    textarea.addEventListener('compositionend', () => isComposing = false);
    
    // Context menu
    textarea.addEventListener('contextmenu', handleContextMenu);
    
    // Paste event
    textarea.addEventListener('paste', handlePaste);
    
    // Drag and drop
    textarea.addEventListener('dragover', handleDragOver);
    textarea.addEventListener('drop', handleDrop);
  }
  
  // Handle input event
  function handleInput(e) {
    if (isComposing) return;
    
    const content = textarea.value;
    
    // Update state
    AppState.set('editor.content', content);
    AppState.set('editor.isDirty', content !== lastContent);
    
    // Update line numbers
    updateLineNumbers();
    
    // Update statistics (debounced)
    if (window.Statistics) {
      Statistics.update(content);
    }
    
    // Auto-save (debounced)
    if (AppState.get('preferences.autoSave')) {
      autoSave();
    }
    
    // Update cursor position
    updateCursorPosition();
  }
  
  // Handle change event
  function handleChange(e) {
    // Add to history for undo/redo
    AppState.addToHistory(textarea.value);
  }
  
  // Handle scroll event
  function handleScroll(e) {
    if (lineNumbers) {
      lineNumbers.scrollTop = textarea.scrollTop;
    }
  }
  
  // Handle keydown event
  function handleKeyDown(e) {
    // Tab key handling
    if (e.key === 'Tab') {
      e.preventDefault();
      insertTab();
      return;
    }
    
    // Auto-indent on Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      const autoIndent = getAutoIndent();
      if (autoIndent) {
        e.preventDefault();
        insertText('\n' + autoIndent);
      }
    }
    
    // Bracket/quote auto-closing
    if (AppState.get('editor.mode') === 'code') {
      handleAutoClose(e);
    }
  }
  
  // Handle selection event
  function handleSelection(e) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    AppState.set('editor.selection', {
      start,
      end,
      text: selectedText
    });
  }
  
  // Handle focus event
  function handleFocus(e) {
    textarea.classList.add('focused');
  }
  
  // Handle blur event
  function handleBlur(e) {
    textarea.classList.remove('focused');
  }
  
  // Handle context menu
  function handleContextMenu(e) {
    e.preventDefault();
    
    if (window.ContextMenu) {
      ContextMenu.show(e.clientX, e.clientY, [
        { action: 'cut', label: 'Cut', icon: 'fa-cut', enabled: hasSelection() },
        { action: 'copy', label: 'Copy', icon: 'fa-copy', enabled: hasSelection() },
        { action: 'paste', label: 'Paste', icon: 'fa-paste' },
        { separator: true },
        { action: 'selectAll', label: 'Select All', icon: 'fa-check-square' },
        { action: 'transform', label: 'Transform...', icon: 'fa-exchange-alt', enabled: hasSelection() }
      ]);
    }
  }
  
  // Handle paste event
  function handlePaste(e) {
    // Could process paste data here if needed
    setTimeout(() => {
      handleInput();
    }, 0);
  }
  
  // Handle drag over
  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    textarea.classList.add('drag-over');
  }
  
  // Handle drop
  function handleDrop(e) {
    e.preventDefault();
    textarea.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    const textFile = files.find(file => 
      file.type.startsWith('text/') || 
      CONFIG.fileTypes.all.includes(file.name.substring(file.name.lastIndexOf('.')))
    );
    
    if (textFile && window.FileOperations) {
      FileOperations.loadFile(textFile);
    }
  }
  
  // Update line numbers
  function updateLineNumbers() {
    if (!lineNumbers) return;
    
    const lines = textarea.value.split('\n');
    const lineCount = lines.length;
    
    // Generate line numbers
    let html = '';
    for (let i = 1; i <= lineCount; i++) {
      html += `<div class="line-number">${i}</div>`;
    }
    
    lineNumbers.innerHTML = html;
    
    // Update state
    AppState.set('statistics.lineCount', lineCount);
  }
  
  // Sync scroll between textarea and line numbers
  function syncScroll() {
    if (!lineNumbers) return;
    
    // Match line height and padding
    const computedStyle = window.getComputedStyle(textarea);
    lineNumbers.style.lineHeight = computedStyle.lineHeight;
    lineNumbers.style.paddingTop = computedStyle.paddingTop;
    lineNumbers.style.paddingBottom = computedStyle.paddingBottom;
  }
  
  // Initialize editor modes
  function initializeModes() {
    const modeBtns = document.querySelectorAll('.mode-btn');
    
    modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        setMode(mode);
        
        // Update active state
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
    
    // Set initial mode
    const savedMode = Utils.storage.get('editor-mode') || CONFIG.editor.defaultMode;
    setMode(savedMode);
  }
  
  // Set editor mode
  function setMode(mode) {
    AppState.set('editor.mode', mode);
    Utils.storage.set('editor-mode', mode);
    
    // Update editor class
    textarea.className = `editor-${mode}`;
    
    // Update placeholder
    const placeholders = {
      plain: 'Start typing or paste your text here...',
      markdown: 'Start writing in Markdown...',
      code: 'Paste or write your code here...'
    };
    
    textarea.placeholder = placeholders[mode] || placeholders.plain;
  }
  
  // Subscribe to state changes
  function subscribeToState() {
    // Word wrap preference
    AppState.subscribe('preferences.wordWrap', (enabled) => {
      textarea.style.whiteSpace = enabled ? 'pre-wrap' : 'pre';
    });
    
    // Font size preference
    AppState.subscribe('preferences.fontSize', (size) => {
      textarea.style.fontSize = size + 'px';
      syncScroll();
    });
    
    // Line numbers preference
    AppState.subscribe('preferences.lineNumbers', (enabled) => {
      if (lineNumbers) {
        lineNumbers.style.display = enabled ? 'block' : 'none';
      }
    });
  }
  
  // Insert text at cursor
  function insertText(text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = textarea.value;
    
    textarea.value = content.substring(0, start) + text + content.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    
    // Trigger input event
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // Insert tab character
  function insertTab() {
    const tabSize = AppState.get('preferences.tabSize') || CONFIG.editor.tabSize;
    const spaces = ' '.repeat(tabSize);
    insertText(spaces);
  }
  
  // Get auto-indent for new line
  function getAutoIndent() {
    const start = textarea.selectionStart;
    const content = textarea.value;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const currentLine = content.substring(lineStart, start);
    
    // Match leading whitespace
    const indent = currentLine.match(/^\s*/)[0];
    
    // Additional indent for code mode
    if (AppState.get('editor.mode') === 'code') {
      const trimmed = currentLine.trim();
      if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
        const tabSize = AppState.get('preferences.tabSize') || CONFIG.editor.tabSize;
        return indent + ' '.repeat(tabSize);
      }
    }
    
    return indent;
  }
  
  // Handle auto-closing brackets and quotes
  function handleAutoClose(e) {
    const pairs = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'",
      '`': '`'
    };
    
    if (pairs[e.key]) {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      if (start !== end) {
        // Wrap selection
        const selected = textarea.value.substring(start, end);
        insertText(e.key + selected + pairs[e.key]);
        textarea.setSelectionRange(start + 1, end + 1);
      } else {
        // Insert pair
        insertText(e.key + pairs[e.key]);
        textarea.setSelectionRange(start + 1, start + 1);
      }
    }
  }
  
  // Update cursor position
  function updateCursorPosition() {
    const pos = textarea.selectionStart;
    const content = textarea.value.substring(0, pos);
    const lines = content.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    
    AppState.set('editor.cursor', { line, column });
  }
  
  // Check if there's a selection
  function hasSelection() {
    return textarea.selectionStart !== textarea.selectionEnd;
  }
  
  // Get editor content
  function getContent() {
    return textarea.value;
  }
  
  // Set editor content
  function setContent(content) {
    textarea.value = content;
    lastContent = content;
    
    // Update everything
    handleInput();
    updateLineNumbers();
    
    // Reset undo history
    AppState.set('history.undoStack', [content]);
    AppState.set('history.redoStack', []);
    AppState.set('history.currentIndex', 0);
  }
  
  // Get selected text
  function getSelection() {
    return textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
  }
  
  // Replace selection
  function replaceSelection(text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = textarea.value;
    
    textarea.value = content.substring(0, start) + text + content.substring(end);
    textarea.setSelectionRange(start, start + text.length);
    
    handleInput();
  }
  
  // Select all text
  function selectAll() {
    textarea.select();
    handleSelection();
  }
  
  // Focus editor
  function focus() {
    textarea.focus();
  }
  
  // Load saved content
  function loadSavedContent() {
    const saved = Utils.storage.get('editor-content');
    if (saved) {
      setContent(saved);
      AppState.set('editor.isDirty', false);
    }
  }
  
  // Auto-save functionality
  const autoSave = Utils.function.debounce(() => {
    Utils.storage.set('editor-content', textarea.value);
    AppState.set('editor.isDirty', false);
    lastContent = textarea.value;
    
    if (window.ToastManager) {
      ToastManager.show({
        message: 'Auto-saved',
        type: 'success',
        duration: 1500,
        icon: 'fa-save'
      });
    }
  }, CONFIG.editor.autoSaveDelay);
  
  // Public API
  return {
    init,
    getContent,
    setContent,
    getSelection,
    replaceSelection,
    selectAll,
    focus,
    insertText,
    hasSelection,
    setMode
  };
})();