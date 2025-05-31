// js/drag-drop.js - Drag & Drop Module

const DragDrop = {
  init() {
    this.bindEvents();
  },
  
  // Bind drag and drop events
  bindEvents() {
    const notepad = State.elements.notepad;
    
    // Prevent default drag behaviors
    notepad.on('dragenter dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    
    // Visual feedback on drag over
    notepad.on('dragenter', function() {
      $(this).addClass('drag-over');
    });
    
    notepad.on('dragleave', function(e) {
      // Only remove class if leaving the textarea completely
      if (e.target === this) {
        $(this).removeClass('drag-over');
      }
    });
    
    // Handle drop
    notepad.on('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      notepad.removeClass('drag-over');
      
      const files = e.originalEvent.dataTransfer.files;
      
      if (files.length > 0) {
        this.handleFilesDrop(files);
      } else {
        // Handle text drop
        const text = e.originalEvent.dataTransfer.getData('text');
        if (text) {
          this.handleTextDrop(text, e);
        }
      }
    });
    
    // Prevent drop on window
    $(window).on('dragover drop', (e) => {
      if (!$(e.target).is('#notepad')) {
        e.preventDefault();
      }
    });
  },
  
  // Handle dropped files
  handleFilesDrop(files) {
    const file = files[0];
    
    // Check if it's a text file
    if (!this.isTextFile(file)) {
      UIComponents.showToast('Please drop a text file', 'warning');
      return;
    }
    
    // Show loading
    Utils.showProgress(30);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      State.elements.notepad.val(e.target.result);
      Utils.saveState('drop file');
      Statistics.update();
      Editor.updateLineNumbers();
      Utils.showProgress(100);
      UIComponents.showToast(`Loaded ${file.name}`, 'success');
    };
    
    reader.onerror = () => {
      Utils.showProgress(100);
      UIComponents.showToast('Error reading file', 'error');
    };
    
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;
        Utils.showProgress(progress);
      }
    };
    
    reader.readAsText(file);
  },
  
  // Handle dropped text
  handleTextDrop(text, e) {
    const textarea = State.elements.notepad[0];
    const cursorPos = this.getDropPosition(e, textarea);
    
    const currentText = textarea.value;
    const newText = currentText.slice(0, cursorPos) + text + currentText.slice(cursorPos);
    
    State.elements.notepad.val(newText);
    Utils.saveState('drop text');
    Statistics.update();
    Editor.updateLineNumbers();
    
    // Set cursor position after dropped text
    const newCursorPos = cursorPos + text.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    textarea.focus();
  },
  
  // Check if file is a text file
  isTextFile(file) {
    // Check MIME type
    if (file.type.startsWith('text/')) {
      return true;
    }
    
    // Check file extension
    return CONFIG.TEXT_FILE_EXTENSIONS.test(file.name);
  },
  
  // Get drop position in textarea
  getDropPosition(e, textarea) {
    // This is a simplified calculation
    // In a real implementation, you'd calculate based on character positions
    const rect = textarea.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Get approximate character position
    const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
    const charWidth = 8; // Approximate character width for monospace
    
    const line = Math.floor(y / lineHeight);
    const column = Math.floor(x / charWidth);
    
    // Find position in text
    const lines = textarea.value.split('\n');
    let position = 0;
    
    for (let i = 0; i < Math.min(line, lines.length); i++) {
      position += lines[i].length + 1; // +1 for newline
    }
    
    if (line < lines.length) {
      position += Math.min(column, lines[line].length);
    }
    
    return position;
  }
};

// Export for use in other modules
window.DragDrop = DragDrop;