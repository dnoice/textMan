// textCraft.js - Main Application Entry Point
import { TextEditor } from './modules/editor.js';
import { UIController } from './modules/ui-controller.js';
import { TextProcessor } from './modules/text-processor.js';
import { SettingsManager } from './modules/settings-manager.js';
import { ToastManager } from './modules/toast-manager.js';

// Main application class
class TextCraftApp {
  constructor() {
    // Initialize components
    this.editor = new TextEditor();
    this.textProcessor = new TextProcessor();
    this.settings = new SettingsManager();
    this.toast = new ToastManager();
    this.ui = new UIController(this.editor, this.textProcessor, this.settings, this.toast);
    
    // Initialize the application
    this.init();
  }
  
  init() {
    // Load saved settings
    this.settings.loadSettings();
    
    // Initialize UI components
    this.ui.initUI();
    
    // Register event listeners
    this.registerEventListeners();
    
    // Show welcome message
    this.toast.show('Welcome to TextCraft', 'info');
  }
  
  registerEventListeners() {
    // Listen for tool operations
    document.querySelectorAll('.tool-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        if (action) {
          this.handleToolAction(action);
        }
      });
    });
    
    // Listen for toolbar button clicks (drawer controls)
    document.querySelectorAll('.toolbar-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const buttonId = e.currentTarget.id;
        this.ui.toggleDrawer(buttonId);
      });
    });
    
    // Listen for drawer panel button clicks
    this.registerDrawerPanelListeners();
    
    // Listen for settings changes
    this.registerSettingsListeners();
  }
  
  registerDrawerPanelListeners() {
    // Search and Replace panel
    document.getElementById('replace-btn').addEventListener('click', () => {
      const searchTerm = document.getElementById('search-input').value;
      const replaceTerm = document.getElementById('replace-input').value;
      const caseSensitive = document.getElementById('case-sensitive').checked;
      const wholeWord = document.getElementById('whole-word').checked;
      
      if (!searchTerm) {
        this.toast.show('Please enter a search term', 'warning');
        return;
      }
      
      const replaced = this.textProcessor.replace(
        this.editor.getText(),
        searchTerm,
        replaceTerm,
        { caseSensitive, wholeWord }
      );
      
      this.editor.setText(replaced);
      this.toast.show('Text replaced successfully', 'success');
    });
    
    document.getElementById('replace-all-btn').addEventListener('click', () => {
      const searchTerm = document.getElementById('search-input').value;
      const replaceTerm = document.getElementById('replace-input').value;
      const caseSensitive = document.getElementById('case-sensitive').checked;
      const wholeWord = document.getElementById('whole-word').checked;
      
      if (!searchTerm) {
        this.toast.show('Please enter a search term', 'warning');
        return;
      }
      
      const { text, count } = this.textProcessor.replaceAll(
        this.editor.getText(),
        searchTerm,
        replaceTerm,
        { caseSensitive, wholeWord }
      );
      
      this.editor.setText(text);
      this.toast.show(`Replaced ${count} occurrence(s)`, 'success');
    });
    
    // Prefix/Suffix panel
    document.getElementById('add-prefix-btn').addEventListener('click', () => {
      const prefix = document.getElementById('prefix-input').value;
      
      if (!prefix) {
        this.toast.show('Please enter a prefix', 'warning');
        return;
      }
      
      const result = this.textProcessor.addPrefixToLines(this.editor.getText(), prefix);
      this.editor.setText(result);
      this.toast.show('Prefix added to lines', 'success');
    });
    
    document.getElementById('add-suffix-btn').addEventListener('click', () => {
      const suffix = document.getElementById('suffix-input').value;
      
      if (!suffix) {
        this.toast.show('Please enter a suffix', 'warning');
        return;
      }
      
      const result = this.textProcessor.addSuffixToLines(this.editor.getText(), suffix);
      this.editor.setText(result);
      this.toast.show('Suffix added to lines', 'success');
    });
    
    document.getElementById('add-both-btn').addEventListener('click', () => {
      const prefix = document.getElementById('prefix-input').value;
      const suffix = document.getElementById('suffix-input').value;
      
      if (!prefix && !suffix) {
        this.toast.show('Please enter a prefix or suffix', 'warning');
        return;
      }
      
      const result = this.textProcessor.addPrefixAndSuffixToLines(
        this.editor.getText(),
        prefix || '',
        suffix || ''
      );
      
      this.editor.setText(result);
      this.toast.show('Prefix and suffix added to lines', 'success');
    });
    
    // Filter Lines panel
    document.getElementById('keep-lines-btn').addEventListener('click', () => {
      const term = document.getElementById('filter-input').value;
      const caseSensitive = document.getElementById('filter-case-sensitive').checked;
      
      if (!term) {
        this.toast.show('Please enter a filter term', 'warning');
        return;
      }
      
      const result = this.textProcessor.keepLinesContaining(
        this.editor.getText(),
        term,
        { caseSensitive }
      );
      
      this.editor.setText(result);
      this.toast.show('Filtered to keep matching lines', 'success');
    });
    
    document.getElementById('remove-lines-btn').addEventListener('click', () => {
      const term = document.getElementById('filter-input').value;
      const caseSensitive = document.getElementById('filter-case-sensitive').checked;
      
      if (!term) {
        this.toast.show('Please enter a filter term', 'warning');
        return;
      }
      
      const result = this.textProcessor.removeLinesContaining(
        this.editor.getText(),
        term,
        { caseSensitive }
      );
      
      this.editor.setText(result);
      this.toast.show('Filtered to remove matching lines', 'success');
    });
  }
  
  registerSettingsListeners() {
    // Theme toggle button
    document.getElementById('theme-toggle').addEventListener('click', () => {
      const currentTheme = this.settings.getSetting('theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      this.settings.updateSetting('theme', newTheme);
      this.settings.applySettings();
      
      // Update toggle button text
      const themeToggle = document.getElementById('theme-toggle');
      const themeIcon = themeToggle.querySelector('i');
      
      if (newTheme === 'dark') {
        themeIcon.className = 'fas fa-moon';
        themeToggle.innerHTML = `<i class="fas fa-moon"></i> Dark Mode`;
      } else {
        themeIcon.className = 'fas fa-sun';
        themeToggle.innerHTML = `<i class="fas fa-sun"></i> Light Mode`;
      }
    });
    
    // Settings modal
    document.getElementById('settings-btn').addEventListener('click', () => {
      this.ui.openSettingsModal();
    });
    
    document.querySelector('.close-btn').addEventListener('click', () => {
      this.ui.closeSettingsModal();
    });
    
    document.getElementById('save-settings-btn').addEventListener('click', () => {
      this.settings.saveSettingsFromForm();
      this.settings.applySettings();
      this.ui.closeSettingsModal();
      this.toast.show('Settings saved', 'success');
    });
    
    document.getElementById('reset-settings-btn').addEventListener('click', () => {
      if (confirm('Reset all settings to default values?')) {
        this.settings.resetSettings();
        this.settings.applySettings();
        this.ui.updateSettingsForm();
        this.toast.show('Settings reset to defaults', 'info');
      }
    });
  }
  
  handleToolAction(action) {
    // Get current text from editor
    const text = this.editor.getText();
    
    // Handle empty text for certain operations
    if (!text && !['paste', 'clear'].includes(action)) {
      this.toast.show('Editor is empty', 'warning');
      return;
    }
    
    let result;
    
    // Process the action
    switch (action) {
      // Editor actions
      case 'undo':
        this.editor.undo();
        this.toast.show('Undo successful', 'info');
        break;
        
      case 'redo':
        this.editor.redo();
        this.toast.show('Redo successful', 'info');
        break;
        
      case 'clear':
        if (confirm('Are you sure you want to clear the editor?')) {
          this.editor.clear();
          this.toast.show('Editor cleared', 'info');
        }
        break;
        
      case 'copy':
        this.editor.copyToClipboard();
        this.toast.show('Text copied to clipboard', 'success');
        break;
        
      case 'paste':
        this.editor.pasteFromClipboard()
          .then(() => this.toast.show('Text pasted from clipboard', 'success'))
          .catch(err => this.toast.show('Failed to paste: ' + err.message, 'error'));
        break;
        
      // Transform actions
      case 'lowercase':
        result = this.textProcessor.transformCase(text, 'lowercase');
        this.editor.setText(result);
        this.toast.show('Text converted to lowercase', 'success');
        break;
        
      case 'uppercase':
        result = this.textProcessor.transformCase(text, 'uppercase');
        this.editor.setText(result);
        this.toast.show('Text converted to uppercase', 'success');
        break;
        
      case 'capitalize':
        result = this.textProcessor.transformCase(text, 'capitalize');
        this.editor.setText(result);
        this.toast.show('Words capitalized', 'success');
        break;
        
      case 'reverse':
        result = this.textProcessor.reverseText(text);
        this.editor.setText(result);
        this.toast.show('Text reversed', 'success');
        break;
        
      // Line operations
      case 'sort-az':
        result = this.textProcessor.sortLines(text, 'asc');
        this.editor.setText(result);
        this.toast.show('Lines sorted A-Z', 'success');
        break;
        
      case 'sort-za':
        result = this.textProcessor.sortLines(text, 'desc');
        this.editor.setText(result);
        this.toast.show('Lines sorted Z-A', 'success');
        break;
        
      case 'remove-duplicates':
        result = this.textProcessor.removeDuplicateLines(text);
        this.editor.setText(result);
        this.toast.show('Duplicate lines removed', 'success');
        break;
        
      case 'remove-empty':
        result = this.textProcessor.removeEmptyLines(text);
        this.editor.setText(result);
        this.toast.show('Empty lines removed', 'success');
        break;
        
      // Clean up operations
      case 'trim-whitespace':
        result = this.textProcessor.trimWhitespace(text);
        this.editor.setText(result);
        this.toast.show('Whitespace trimmed', 'success');
        break;
        
      case 'remove-spaces':
        result = this.textProcessor.removeExtraSpaces(text);
        this.editor.setText(result);
        this.toast.show('Extra spaces removed', 'success');
        break;
        
      case 'remove-linebreaks':
        result = this.textProcessor.removeLineBreaks(text);
        this.editor.setText(result);
        this.toast.show('Line breaks removed', 'success');
        break;
        
      case 'fix-paragraphs':
        result = this.textProcessor.fixParagraphs(text);
        this.editor.setText(result);
        this.toast.show('Paragraphs fixed', 'success');
        break;
        
      default:
        this.toast.show(`Action '${action}' not implemented`, 'error');
    }
  }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new TextCraftApp();
});
