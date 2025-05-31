// Clipboard Management Module
const ClipboardManager = (function() {
  'use strict';
  
  let clipboardHistory = [];
  const maxHistorySize = 10;
  
  // Initialize clipboard manager
  function init() {
    // Setup event listeners
    setupEventListeners();
    
    // Load clipboard history from storage
    loadHistory();
    
    console.log('Clipboard manager initialized');
  }
  
  // Setup event listeners
  function setupEventListeners() {
    // Toolbar buttons
    const copyBtn = document.getElementById('copyButton');
    const cutBtn = document.getElementById('cutButton');
    const pasteBtn = document.getElementById('pasteButton');
    
    if (copyBtn) {
      copyBtn.addEventListener('click', copy);
    }
    
    if (cutBtn) {
      cutBtn.addEventListener('click', cut);
    }
    
    if (pasteBtn) {
      pasteBtn.addEventListener('click', paste);
    }
    
    // Listen for copy/cut events
    document.addEventListener('copy', handleCopyEvent);
    document.addEventListener('cut', handleCutEvent);
    document.addEventListener('paste', handlePasteEvent);
  }
  
  // Copy selected text
  async function copy() {
    const selection = Editor.getSelection();
    
    if (!selection) {
      ToastManager.show({
        message: 'Nothing to copy',
        type: 'warning'
      });
      return false;
    }
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(selection);
      } else {
        // Fallback to execCommand
        document.execCommand('copy');
      }
      
      // Add to history
      addToHistory(selection, 'copy');
      
      // Show feedback
      ToastManager.show({
        message: 'Copied to clipboard',
        type: 'success',
        duration: 1500,
        icon: 'fa-copy'
      });
      
      return true;
    } catch (error) {
      console.error('Copy failed:', error);
      ToastManager.show({
        message: 'Failed to copy',
        type: 'error'
      });
      return false;
    }
  }
  
  // Cut selected text
  async function cut() {
    const selection = Editor.getSelection();
    
    if (!selection) {
      ToastManager.show({
        message: 'Nothing to cut',
        type: 'warning'
      });
      return false;
    }
    
    try {
      // Copy to clipboard
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(selection);
      } else {
        document.execCommand('copy');
      }
      
      // Remove selected text
      Editor.replaceSelection('');
      
      // Add to history
      addToHistory(selection, 'cut');
      
      // Show feedback
      ToastManager.show({
        message: 'Cut to clipboard',
        type: 'success',
        duration: 1500,
        icon: 'fa-cut'
      });
      
      return true;
    } catch (error) {
      console.error('Cut failed:', error);
      ToastManager.show({
        message: 'Failed to cut',
        type: 'error'
      });
      return false;
    }
  }
  
  // Paste from clipboard
  async function paste() {
    try {
      let text = '';
      
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        text = await navigator.clipboard.readText();
      } else {
        // Fallback - create temporary textarea
        const textarea = document.createElement('textarea');
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        document.body.appendChild(textarea);
        textarea.focus();
        document.execCommand('paste');
        text = textarea.value;
        document.body.removeChild(textarea);
      }
      
      if (text) {
        Editor.insertText(text);
        
        // Add to history
        addToHistory(text, 'paste');
        
        // Show feedback
        ToastManager.show({
          message: 'Pasted from clipboard',
          type: 'success',
          duration: 1500,
          icon: 'fa-paste'
        });
      } else {
        ToastManager.show({
          message: 'Clipboard is empty',
          type: 'info'
        });
      }
      
      return true;
    } catch (error) {
      console.error('Paste failed:', error);
      
      // Try execCommand as last resort
      try {
        document.execCommand('paste');
        return true;
      } catch (execError) {
        ToastManager.show({
          message: 'Failed to paste. Try Ctrl+V',
          type: 'error'
        });
        return false;
      }
    }
  }
  
  // Handle copy event
  function handleCopyEvent(e) {
    const selection = window.getSelection().toString();
    if (selection) {
      addToHistory(selection, 'copy');
    }
  }
  
  // Handle cut event
  function handleCutEvent(e) {
    const selection = window.getSelection().toString();
    if (selection) {
      addToHistory(selection, 'cut');
    }
  }
  
  // Handle paste event
  function handlePasteEvent(e) {
    const text = e.clipboardData?.getData('text/plain');
    if (text) {
      addToHistory(text, 'paste');
    }
  }
  
  // Add to clipboard history
  function addToHistory(text, action) {
    const entry = {
      text: text.substring(0, 1000), // Limit stored text
      action,
      timestamp: Date.now(),
      preview: text.substring(0, 50) + (text.length > 50 ? '...' : '')
    };
    
    // Remove duplicates
    clipboardHistory = clipboardHistory.filter(item => item.text !== text);
    
    // Add to beginning
    clipboardHistory.unshift(entry);
    
    // Limit size
    if (clipboardHistory.length > maxHistorySize) {
      clipboardHistory = clipboardHistory.slice(0, maxHistorySize);
    }
    
    // Save to storage
    saveHistory();
  }
  
  // Get clipboard history
  function getHistory() {
    return clipboardHistory;
  }
  
  // Clear clipboard history
  function clearHistory() {
    clipboardHistory = [];
    saveHistory();
    
    ToastManager.show({
      message: 'Clipboard history cleared',
      type: 'info'
    });
  }
  
  // Show clipboard history modal
  function showHistory() {
    if (clipboardHistory.length === 0) {
      ToastManager.show({
        message: 'Clipboard history is empty',
        type: 'info'
      });
      return;
    }
    
    // Create modal content
    const content = `
      <div class="clipboard-history">
        ${clipboardHistory.map((entry, index) => `
          <div class="history-item" data-index="${index}">
            <div class="history-header">
              <span class="history-action">
                <i class="fas fa-${entry.action}"></i> ${entry.action}
              </span>
              <span class="history-time">${formatTime(entry.timestamp)}</span>
            </div>
            <div class="history-preview">${Utils.string.escapeHtml(entry.preview)}</div>
            <div class="history-actions">
              <button class="btn btn-sm" onclick="ClipboardManager.pasteFromHistory(${index})">
                <i class="fas fa-paste"></i> Paste
              </button>
              <button class="btn btn-sm" onclick="ClipboardManager.copyFromHistory(${index})">
                <i class="fas fa-copy"></i> Copy
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    // Create modal
    const modal = ModalManager.create({
      title: 'Clipboard History',
      content,
      footer: `
        <button class="btn btn-ghost" onclick="ClipboardManager.clearHistory(); ModalManager.hide('${modalId}')">
          Clear History
        </button>
        <button class="btn btn-primary" onclick="ModalManager.hide('${modalId}')">
          Close
        </button>
      `,
      size: 'medium'
    });
    
    const modalId = modal.id;
    modal.show();
  }
  
  // Paste from history
  function pasteFromHistory(index) {
    const entry = clipboardHistory[index];
    if (entry) {
      Editor.insertText(entry.text);
      ToastManager.show({
        message: 'Pasted from history',
        type: 'success'
      });
    }
  }
  
  // Copy from history
  async function copyFromHistory(index) {
    const entry = clipboardHistory[index];
    if (entry) {
      try {
        await navigator.clipboard.writeText(entry.text);
        ToastManager.show({
          message: 'Copied from history',
          type: 'success'
        });
      } catch (error) {
        console.error('Copy from history failed:', error);
      }
    }
  }
  
  // Format timestamp
  function formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  }
  
  // Save history to storage
  function saveHistory() {
    try {
      Utils.storage.set('clipboard-history', clipboardHistory);
    } catch (error) {
      console.error('Failed to save clipboard history:', error);
    }
  }
  
  // Load history from storage
  function loadHistory() {
    try {
      const saved = Utils.storage.get('clipboard-history');
      if (Array.isArray(saved)) {
        clipboardHistory = saved;
      }
    } catch (error) {
      console.error('Failed to load clipboard history:', error);
    }
  }
  
  // Check clipboard API support
  function isSupported() {
    return !!(navigator.clipboard && window.isSecureContext);
  }
  
  // Get clipboard content (if permission granted)
  async function getClipboardContent() {
    if (!isSupported()) {
      return null;
    }
    
    try {
      const text = await navigator.clipboard.readText();
      return text;
    } catch (error) {
      // Permission denied or other error
      return null;
    }
  }
  
  // Monitor clipboard changes (experimental)
  function startMonitoring() {
    if (!isSupported()) return;
    
    // This would require clipboard-read permission
    // and periodic checking - not implemented for privacy
    console.log('Clipboard monitoring not implemented for privacy reasons');
  }
  
  // Public API
  return {
    init,
    copy,
    cut,
    paste,
    getHistory,
    clearHistory,
    showHistory,
    pasteFromHistory,
    copyFromHistory,
    isSupported,
    getClipboardContent
  };
})();