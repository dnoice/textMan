// File Operations Module
const FileOperations = (function() {
  'use strict';
  
  let fileInput = null;
  let currentFile = null;
  
  // Initialize file operations
  function init() {
    // Get elements
    fileInput = document.getElementById('fileInput');
    const saveBtn = document.getElementById('saveButton');
    const loadBtn = document.getElementById('loadButton');
    
    // Setup event listeners
    if (fileInput) {
      fileInput.addEventListener('change', handleFileSelect);
    }
    
    if (saveBtn) {
      saveBtn.addEventListener('click', () => save());
    }
    
    if (loadBtn) {
      loadBtn.addEventListener('click', () => fileInput.click());
    }
    
    // Setup keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          save();
        } else if (e.key === 'o') {
          e.preventDefault();
          fileInput.click();
        }
      }
    });
  }
  
  // Handle file selection
  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
      loadFile(file);
    }
  }
  
  // Load file
  function loadFile(file) {
    // Check file size
    if (file.size > CONFIG.editor.maxFileSize) {
      ToastManager.show({
        message: `File too large. Maximum size is ${Utils.format.bytes(CONFIG.editor.maxFileSize)}`,
        type: 'error'
      });
      return;
    }
    
    // Check file type
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const validExtensions = CONFIG.fileTypes.all.split(',');
    
    if (!validExtensions.includes(extension) && !file.type.startsWith('text/')) {
      ToastManager.show({
        message: 'Invalid file type. Please select a text file.',
        type: 'error'
      });
      return;
    }
    
    // Show loading state
    showLoading(true);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        
        // Set content in editor
        Editor.setContent(content);
        
        // Update current file info
        currentFile = {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        };
        
        // Update app state
        AppState.set('editor.currentFile', currentFile);
        AppState.set('editor.isDirty', false);
        
        // Add to recent files
        addToRecentFiles(currentFile);
        
        // Detect and set editor mode
        detectAndSetMode(file.name);
        
        // Show success message
        ToastManager.show({
          message: `Loaded ${file.name} (${Utils.format.bytes(file.size)})`,
          type: 'success',
          icon: 'fa-file-alt'
        });
        
      } catch (error) {
        console.error('Error loading file:', error);
        ToastManager.show({
          message: 'Failed to load file',
          type: 'error'
        });
      } finally {
        showLoading(false);
        // Reset file input
        fileInput.value = '';
      }
    };
    
    reader.onerror = () => {
      showLoading(false);
      ToastManager.show({
        message: 'Error reading file',
        type: 'error'
      });
    };
    
    // Read file as text
    reader.readAsText(file);
  }
  
  // Save file
  function save(filename) {
    const content = Editor.getContent();
    
    if (!content) {
      ToastManager.show({
        message: 'Nothing to save',
        type: 'warning'
      });
      return;
    }
    
    // Generate filename if not provided
    if (!filename) {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const mode = AppState.get('editor.mode');
      const extension = getExtensionForMode(mode);
      filename = `textman-${timestamp}${extension}`;
    }
    
    try {
      // Create blob
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      // Update state
      AppState.set('editor.isDirty', false);
      
      // Show success message
      ToastManager.show({
        message: `Saved as ${filename}`,
        type: 'success',
        icon: 'fa-save'
      });
      
    } catch (error) {
      console.error('Error saving file:', error);
      ToastManager.show({
        message: 'Failed to save file',
        type: 'error'
      });
    }
  }
  
  // Save with custom name
  function saveAs() {
    // Create modal for filename input
    const modal = document.createElement('div');
    modal.className = 'save-as-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h3>Save As</h3>
        <input type="text" id="saveAsFilename" placeholder="Enter filename..." value="${getDefaultFilename()}">
        <div class="modal-buttons">
          <button class="btn btn-primary" id="saveAsConfirm">Save</button>
          <button class="btn btn-ghost" id="saveAsCancel">Cancel</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const filenameInput = document.getElementById('saveAsFilename');
    const confirmBtn = document.getElementById('saveAsConfirm');
    const cancelBtn = document.getElementById('saveAsCancel');
    
    // Focus input and select text
    filenameInput.focus();
    filenameInput.select();
    
    // Handle save
    const handleSave = () => {
      const filename = filenameInput.value.trim();
      if (filename) {
        save(filename);
        document.body.removeChild(modal);
      } else {
        filenameInput.classList.add('input-error');
      }
    };
    
    // Event listeners
    confirmBtn.addEventListener('click', handleSave);
    cancelBtn.addEventListener('click', () => document.body.removeChild(modal));
    filenameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSave();
      if (e.key === 'Escape') document.body.removeChild(modal);
    });
  }
  
  // Export in different formats
  function exportAs(format) {
    const content = Editor.getContent();
    
    if (!content) {
      ToastManager.show({
        message: 'Nothing to export',
        type: 'warning'
      });
      return;
    }
    
    let exportContent = content;
    let mimeType = 'text/plain';
    let extension = '.txt';
    
    switch (format) {
      case 'html':
        exportContent = convertToHTML(content);
        mimeType = 'text/html';
        extension = '.html';
        break;
        
      case 'markdown':
        exportContent = convertToMarkdown(content);
        mimeType = 'text/markdown';
        extension = '.md';
        break;
        
      case 'json':
        exportContent = JSON.stringify({
          content: content,
          statistics: Statistics.exportStats(),
          metadata: {
            exported: new Date().toISOString(),
            version: CONFIG.app.version
          }
        }, null, 2);
        mimeType = 'application/json';
        extension = '.json';
        break;
        
      case 'pdf':
        exportAsPDF(content);
        return;
    }
    
    const filename = `export-${Date.now()}${extension}`;
    const blob = new Blob([exportContent], { type: mimeType });
    
    // Download file
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
    
    ToastManager.show({
      message: `Exported as ${format.toUpperCase()}`,
      type: 'success'
    });
  }
  
  // Convert to HTML
  function convertToHTML(content) {
    const stats = Statistics.getStats();
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>textMan Export</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }
        pre {
            background: #f5f5f5;
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
        }
        .metadata {
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 0.875rem;
        }
    </style>
</head>
<body>
    <pre>${Utils.string.escapeHtml(content)}</pre>
    <div class="metadata">
        <p>Exported from textMan on ${new Date().toLocaleString()}</p>
        <p>${stats.wordCount} words • ${stats.charCount} characters • ${stats.lineCount} lines</p>
    </div>
</body>
</html>`;
  }
  
  // Convert to Markdown
  function convertToMarkdown(content) {
    const stats = Statistics.getStats();
    return `# textMan Export

\`\`\`
${content}
\`\`\`

---

*Exported from textMan on ${new Date().toLocaleString()}*  
*${stats.wordCount} words • ${stats.charCount} characters • ${stats.lineCount} lines*`;
  }
  
  // Export as PDF
  function exportAsPDF(content) {
    // Open print dialog
    const printWindow = window.open('', '_blank');
    printWindow.document.write(convertToHTML(content));
    printWindow.document.close();
    printWindow.print();
  }
  
  // Detect file type and set editor mode
  function detectAndSetMode(filename) {
    const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    
    let mode = 'plain';
    
    if (CONFIG.fileTypes.markdown.includes(extension)) {
      mode = 'markdown';
    } else if (CONFIG.fileTypes.code.includes(extension)) {
      mode = 'code';
    }
    
    Editor.setMode(mode);
    
    // Update mode button
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
  }
  
  // Get extension for mode
  function getExtensionForMode(mode) {
    switch (mode) {
      case 'markdown':
        return '.md';
      case 'code':
        return '.js';
      default:
        return '.txt';
    }
  }
  
  // Get default filename
  function getDefaultFilename() {
    if (currentFile) {
      return currentFile.name;
    }
    
    const mode = AppState.get('editor.mode');
    const extension = getExtensionForMode(mode);
    return `document${extension}`;
  }
  
  // Add to recent files
  function addToRecentFiles(fileInfo) {
    let recentFiles = AppState.get('cache.recentFiles') || [];
    
    // Remove if already exists
    recentFiles = recentFiles.filter(f => f.name !== fileInfo.name);
    
    // Add to beginning
    recentFiles.unshift({
      ...fileInfo,
      openedAt: Date.now()
    });
    
    // Limit to max recent files
    recentFiles = recentFiles.slice(0, CONFIG.limits.maxRecentFiles);
    
    // Update state
    AppState.set('cache.recentFiles', recentFiles);
  }
  
  // Get recent files
  function getRecentFiles() {
    return AppState.get('cache.recentFiles') || [];
  }
  
  // Clear recent files
  function clearRecentFiles() {
    AppState.set('cache.recentFiles', []);
    ToastManager.show({
      message: 'Recent files cleared',
      type: 'info'
    });
  }
  
  // Show loading state
  function showLoading(show) {
    const editorArea = document.querySelector('.editor-area');
    if (editorArea) {
      editorArea.classList.toggle('loading', show);
    }
  }
  
  // Import from URL
  async function importFromURL(url) {
    try {
      showLoading(true);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch URL');
      }
      
      const content = await response.text();
      Editor.setContent(content);
      
      // Extract filename from URL
      const filename = url.split('/').pop() || 'imported.txt';
      
      ToastManager.show({
        message: `Imported from ${filename}`,
        type: 'success'
      });
      
    } catch (error) {
      console.error('Import error:', error);
      ToastManager.show({
        message: 'Failed to import from URL',
        type: 'error'
      });
    } finally {
      showLoading(false);
    }
  }
  
  // Public API
  return {
    init,
    loadFile,
    save,
    saveAs,
    exportAs,
    importFromURL,
    getRecentFiles,
    clearRecentFiles,
    getCurrentFile: () => currentFile
  };
})();