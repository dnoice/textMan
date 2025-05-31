// Keyboard Shortcuts Module
const KeyboardShortcuts = (function() {
  'use strict';
  
  const shortcuts = new Map();
  let isEnabled = true;
  
  // Initialize keyboard shortcuts
  function init() {
    // Register default shortcuts
    registerDefaultShortcuts();
    
    // Setup global keyboard event listener
    document.addEventListener('keydown', handleKeyDown, true);
    
    console.log('Keyboard shortcuts initialized');
  }
  
  // Register default shortcuts
  function registerDefaultShortcuts() {
    // Editor shortcuts
    register('Ctrl+Z', () => {
      handleUndo();
    }, 'Undo');
    
    register('Ctrl+Y', () => {
      handleRedo();
    }, 'Redo');
    
    register('Ctrl+S', (e) => {
      e.preventDefault();
      FileOperations.save();
    }, 'Save');
    
    register('Ctrl+O', (e) => {
      e.preventDefault();
      document.getElementById('fileInput')?.click();
    }, 'Open file');
    
    register('Ctrl+A', (e) => {
      e.preventDefault();
      Editor.selectAll();
    }, 'Select all');
    
    register('Ctrl+F', (e) => {
      e.preventDefault();
      FindReplace.openFind();
    }, 'Find');
    
    register('Ctrl+H', (e) => {
      e.preventDefault();
      FindReplace.openReplace();
    }, 'Replace');
    
    // Transform shortcuts
    register('Ctrl+L', () => {
      Transformations.toLowerCase();
    }, 'Convert to lowercase');
    
    register('Ctrl+U', () => {
      Transformations.toUpperCase();
    }, 'Convert to UPPERCASE');
    
    register('Ctrl+T', () => {
      Transformations.toTitleCase();
    }, 'Convert to Title Case');
    
    // UI shortcuts
    register('Ctrl+B', (e) => {
      e.preventDefault();
      Sidebar.toggle();
    }, 'Toggle sidebar');
    
    register('Ctrl+Shift+T', (e) => {
      e.preventDefault();
      ThemeManager.toggleTheme();
    }, 'Toggle theme');
    
    register('F1', (e) => {
      e.preventDefault();
      showHelp();
    }, 'Show help');
    
    // Line operations
    register('Ctrl+D', () => {
      duplicateLine();
    }, 'Duplicate line');
    
    register('Alt+ArrowUp', (e) => {
      e.preventDefault();
      moveLine('up');
    }, 'Move line up');
    
    register('Alt+ArrowDown', (e) => {
      e.preventDefault();
      moveLine('down');
    }, 'Move line down');
    
    register('Ctrl+K', () => {
      deleteLine();
    }, 'Delete line');
    
    // Navigation shortcuts
    register('Ctrl+Home', () => {
      goToStart();
    }, 'Go to start');
    
    register('Ctrl+End', () => {
      goToEnd();
    }, 'Go to end');
    
    register('Ctrl+G', () => {
      goToLine();
    }, 'Go to line');
    
    // Quick actions
    register('Ctrl+Shift+L', () => {
      selectAllOccurrences();
    }, 'Select all occurrences');
    
    register('Escape', () => {
      clearSelection();
    }, 'Clear selection/Close dialogs');
    
    // Multi-cursor support (simplified)
    register('Ctrl+Alt+ArrowUp', (e) => {
      e.preventDefault();
      addCursorAbove();
    }, 'Add cursor above');
    
    register('Ctrl+Alt+ArrowDown', (e) => {
      e.preventDefault();
      addCursorBelow();
    }, 'Add cursor below');
  }
  
  // Handle keydown event
  function handleKeyDown(e) {
    if (!isEnabled) return;
    
    // Don't handle shortcuts in input fields (except textarea)
    const target = e.target;
    if (target.tagName === 'INPUT' && target.type !== 'checkbox' && target.type !== 'radio') {
      return;
    }
    
    // Build shortcut string
    const shortcut = buildShortcutString(e);
    
    // Check if shortcut exists
    const handler = shortcuts.get(shortcut);
    if (handler) {
      handler.callback(e);
    }
  }
  
  // Build shortcut string from event
  function buildShortcutString(e) {
    const parts = [];
    
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    
    // Special keys
    const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    parts.push(key);
    
    return parts.join('+');
  }
  
  // Register a shortcut
  function register(shortcut, callback, description = '') {
    // Normalize shortcut string
    const normalized = normalizeShortcut(shortcut);
    
    shortcuts.set(normalized, {
      shortcut: normalized,
      callback,
      description
    });
  }
  
  // Unregister a shortcut
  function unregister(shortcut) {
    const normalized = normalizeShortcut(shortcut);
    shortcuts.delete(normalized);
  }
  
  // Normalize shortcut string
  function normalizeShortcut(shortcut) {
    return shortcut
      .split('+')
      .map(part => {
        const normalized = part.trim();
        if (normalized.length === 1) {
          return normalized.toUpperCase();
        }
        return normalized;
      })
      .join('+');
  }
  
  // Enable/disable shortcuts
  function enable() {
    isEnabled = true;
  }
  
  function disable() {
    isEnabled = false;
  }
  
  // Get all registered shortcuts
  function getAll() {
    const list = [];
    shortcuts.forEach((value, key) => {
      list.push({
        shortcut: key,
        description: value.description
      });
    });
    return list;
  }
  
  // Shortcut handlers
  function handleUndo() {
    const content = AppState.undo();
    if (content !== null) {
      Editor.setContent(content);
      ToastManager.show({
        message: 'Undo',
        type: 'info',
        duration: 1000
      });
    }
  }
  
  function handleRedo() {
    const content = AppState.redo();
    if (content !== null) {
      Editor.setContent(content);
      ToastManager.show({
        message: 'Redo',
        type: 'info',
        duration: 1000
      });
    }
  }
  
  function duplicateLine() {
    const textarea = document.getElementById('notepad');
    if (!textarea) return;
    
    const content = textarea.value;
    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    
    // Find line boundaries
    const lineStart = content.lastIndexOf('\n', selectionStart - 1) + 1;
    const lineEnd = content.indexOf('\n', selectionEnd);
    const actualLineEnd = lineEnd === -1 ? content.length : lineEnd;
    
    // Get line content
    const lineContent = content.substring(lineStart, actualLineEnd);
    
    // Insert duplicate
    const newContent = 
      content.substring(0, actualLineEnd) + 
      '\n' + lineContent + 
      content.substring(actualLineEnd);
    
    textarea.value = newContent;
    
    // Update cursor position
    const newPosition = actualLineEnd + lineContent.length + 1;
    textarea.setSelectionRange(newPosition, newPosition);
    
    // Trigger input event
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  function moveLine(direction) {
    const textarea = document.getElementById('notepad');
    if (!textarea) return;
    
    const content = textarea.value;
    const lines = content.split('\n');
    const selectionStart = textarea.selectionStart;
    
    // Find current line index
    let charCount = 0;
    let currentLineIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= selectionStart) {
        currentLineIndex = i;
        break;
      }
      charCount += lines[i].length + 1; // +1 for newline
    }
    
    // Move line
    if (direction === 'up' && currentLineIndex > 0) {
      [lines[currentLineIndex - 1], lines[currentLineIndex]] = 
      [lines[currentLineIndex], lines[currentLineIndex - 1]];
    } else if (direction === 'down' && currentLineIndex < lines.length - 1) {
      [lines[currentLineIndex], lines[currentLineIndex + 1]] = 
      [lines[currentLineIndex + 1], lines[currentLineIndex]];
    } else {
      return; // Can't move
    }
    
    // Update content
    textarea.value = lines.join('\n');
    
    // Update cursor position
    const newLineIndex = direction === 'up' ? currentLineIndex - 1 : currentLineIndex + 1;
    let newCharCount = 0;
    for (let i = 0; i < newLineIndex; i++) {
      newCharCount += lines[i].length + 1;
    }
    
    textarea.setSelectionRange(newCharCount, newCharCount);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  function deleteLine() {
    const textarea = document.getElementById('notepad');
    if (!textarea) return;
    
    const content = textarea.value;
    const selectionStart = textarea.selectionStart;
    
    // Find line boundaries
    const lineStart = content.lastIndexOf('\n', selectionStart - 1) + 1;
    let lineEnd = content.indexOf('\n', selectionStart);
    
    if (lineEnd === -1) {
      lineEnd = content.length;
    } else {
      lineEnd += 1; // Include the newline
    }
    
    // Delete line
    const newContent = content.substring(0, lineStart) + content.substring(lineEnd);
    textarea.value = newContent;
    
    // Update cursor position
    textarea.setSelectionRange(lineStart, lineStart);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  function goToStart() {
    const textarea = document.getElementById('notepad');
    if (textarea) {
      textarea.setSelectionRange(0, 0);
      textarea.scrollTop = 0;
      textarea.focus();
    }
  }
  
  function goToEnd() {
    const textarea = document.getElementById('notepad');
    if (textarea) {
      const length = textarea.value.length;
      textarea.setSelectionRange(length, length);
      textarea.scrollTop = textarea.scrollHeight;
      textarea.focus();
    }
  }
  
  function goToLine() {
    const lineNumber = prompt('Go to line:');
    if (!lineNumber || isNaN(lineNumber)) return;
    
    const textarea = document.getElementById('notepad');
    if (!textarea) return;
    
    const lines = textarea.value.split('\n');
    const targetLine = Math.max(1, Math.min(parseInt(lineNumber), lines.length));
    
    // Calculate character position
    let charPos = 0;
    for (let i = 0; i < targetLine - 1; i++) {
      charPos += lines[i].length + 1; // +1 for newline
    }
    
    textarea.setSelectionRange(charPos, charPos);
    textarea.focus();
    
    // Scroll to line
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    textarea.scrollTop = (targetLine - 1) * lineHeight - textarea.clientHeight / 2;
  }
  
  function selectAllOccurrences() {
    const selection = Editor.getSelection();
    if (!selection) return;
    
    // This would implement multi-cursor functionality
    // For now, just highlight all occurrences
    FindReplace.openFind();
    document.getElementById('findInput').value = selection;
    FindReplace.find();
  }
  
  function clearSelection() {
    const textarea = document.getElementById('notepad');
    if (textarea) {
      const pos = textarea.selectionStart;
      textarea.setSelectionRange(pos, pos);
    }
    
    // Also close any open dialogs
    FindReplace.clearFind();
    ContextMenu.hide();
  }
  
  function addCursorAbove() {
    // Simplified multi-cursor support
    ToastManager.show({
      message: 'Multi-cursor editing coming soon!',
      type: 'info'
    });
  }
  
  function addCursorBelow() {
    // Simplified multi-cursor support
    ToastManager.show({
      message: 'Multi-cursor editing coming soon!',
      type: 'info'
    });
  }
  
  function showHelp() {
    const helpModal = document.getElementById('helpModal');
    if (helpModal) {
      helpModal.style.display = 'flex';
      Utils.animation.fadeIn(helpModal, 200);
    }
  }
  
  // Public API
  return {
    init,
    register,
    unregister,
    enable,
    disable,
    getAll,
    isEnabled: () => isEnabled
  };
})();