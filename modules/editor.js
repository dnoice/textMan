// TextEditor module - Handles the text editor functionality and state
export class TextEditor {
  constructor() {
    this.editor = document.getElementById('text-editor');
    this.wordCountElement = document.getElementById('word-count');
    this.charCountElement = document.getElementById('char-count');
    this.lineCountElement = document.getElementById('line-count');
    this.paragraphCountElement = document.getElementById('paragraph-count');
    this.readingTimeElement = document.getElementById('reading-time');
    
    this.undoButton = document.querySelector('.tool-btn[data-action="undo"]');
    this.redoButton = document.querySelector('.tool-btn[data-action="redo"]');
    
    this.undoStack = [''];
    this.redoStack = [];
    this.currentPosition = 0;
    
    this.initEventListeners();
  }
  
  // Initialize event listeners for the editor
  initEventListeners() {
    this.editor.addEventListener('input', () => {
      this.saveState();
      this.updateStats();
    });
    
    // Handle keyboard shortcuts
    this.editor.addEventListener('keydown', (e) => {
      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        this.undo();
      }
      
      // Redo: Ctrl+Y or Cmd+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        this.redo();
      }
    });
  }
  
  // Get text from editor
  getText() {
    return this.editor.value;
  }
  
  // Set text in editor
  setText(text) {
    this.editor.value = text;
    this.saveState();
    this.updateStats();
  }
  
  // Clear the editor
  clear() {
    this.setText('');
  }
  
  // Save the current state for undo/redo
  saveState() {
    const currentText = this.getText();
    
    // Only save if text has changed
    if (currentText !== this.undoStack[this.currentPosition]) {
      // Remove any future states if we're not at the end
      if (this.currentPosition < this.undoStack.length - 1) {
        this.undoStack = this.undoStack.slice(0, this.currentPosition + 1);
      }
      
      // Add the new state
      this.undoStack.push(currentText);
      this.currentPosition = this.undoStack.length - 1;
      
      // Clear redo stack
      this.redoStack = [];
      
      // Limit stack size
      if (this.undoStack.length > 100) {
        this.undoStack.shift();
        this.currentPosition--;
      }
    }
    
    // Update button states
    this.updateUndoRedoButtons();
  }
  
  // Undo the last change
  undo() {
    if (this.currentPosition > 0) {
      const currentText = this.getText();
      
      // Save current state to redo stack
      this.redoStack.push(currentText);
      
      // Move to previous state
      this.currentPosition--;
      this.editor.value = this.undoStack[this.currentPosition];
      
      // Update stats and buttons
      this.updateStats();
      this.updateUndoRedoButtons();
      
      return true;
    }
    
    return false;
  }
  
  // Redo the last undone change
  redo() {
    if (this.redoStack.length > 0) {
      // Get the last redo state
      const redoText = this.redoStack.pop();
      
      // Save current position
      this.currentPosition++;
      
      // If we need to extend the undo stack
      if (this.currentPosition >= this.undoStack.length) {
        this.undoStack.push(redoText);
      } else {
        this.undoStack[this.currentPosition] = redoText;
      }
      
      // Update editor
      this.editor.value = redoText;
      
      // Update stats and buttons
      this.updateStats();
      this.updateUndoRedoButtons();
      
      return true;
    }
    
    return false;
  }
  
  // Update undo/redo button states
  updateUndoRedoButtons() {
    this.undoButton.disabled = this.currentPosition <= 0;
    this.redoButton.disabled = this.redoStack.length === 0;
  }
  
  // Copy text to clipboard
  async copyToClipboard() {
    const text = this.getText();
    
    if (!text) {
      throw new Error('No text to copy');
    }
    
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Failed to copy text: ', err);
      throw err;
    }
  }
  
  // Paste text from clipboard
  async pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      
      if (text) {
        // Get current selection or cursor position
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        
        // Current value
        const currentValue = this.editor.value;
        
        // Insert text at cursor position or replace selection
        const newValue = currentValue.substring(0, start) + text + currentValue.substring(end);
        
        // Update editor
        this.setText(newValue);
        
        // Set cursor position after the pasted text
        const newPosition = start + text.length;
        this.editor.setSelectionRange(newPosition, newPosition);
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Failed to paste text: ', err);
      throw err;
    }
  }
  
  // Update text statistics
  updateStats() {
    const text = this.getText();
    
    // Character count
    const charCount = text.length;
    this.charCountElement.textContent = `${charCount} characters`;
    
    // Word count
    const words = text.trim() ? text.match(/\S+/g) || [] : [];
    const wordCount = words.length;
    this.wordCountElement.textContent = `${wordCount} words`;
    
    // Line count
    const lines = text.split('\n');
    const lineCount = lines.length;
    this.lineCountElement.textContent = `${lineCount} lines`;
    
    // Paragraph count
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const paragraphCount = paragraphs.length || 0;
    this.paragraphCountElement.textContent = `${paragraphCount} paragraphs`;
    
    // Reading time (based on 200 words per minute)
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    this.readingTimeElement.textContent = `${readingTime} min read`;
  }
  
  // Focus the editor
  focus() {
    this.editor.focus();
  }
  
  // Set editor font size
  setFontSize(size) {
    this.editor.style.fontSize = size;
  }
  
  // Set editor font family
  setFontFamily(family) {
    this.editor.style.fontFamily = family;
  }
}
