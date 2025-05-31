// Application State Management
const AppState = (function() {
  'use strict';
  
  // Private state object
  let state = {
    editor: {
      content: '',
      mode: 'plain',
      isDirty: false,
      currentFile: null,
      selection: {
        start: 0,
        end: 0,
        text: ''
      },
      cursor: {
        line: 1,
        column: 1
      }
    },
    
    ui: {
      theme: 'light',
      sidebarOpen: true,
      sidebarPinned: false,
      quickActionsOpen: false,
      activeModal: null,
      isLoading: false
    },
    
    history: {
      undoStack: [],
      redoStack: [],
      currentIndex: -1
    },
    
    find: {
      searchTerm: '',
      replaceTerm: '',
      caseSensitive: false,
      wholeWord: false,
      useRegex: false,
      matches: [],
      currentMatch: -1
    },
    
    statistics: {
      charCount: 0,
      charCountNoSpaces: 0,
      wordCount: 0,
      lineCount: 0,
      paragraphCount: 0,
      readingTime: 0,
      language: 'en'
    },
    
    preferences: {
      autoSave: true,
      wordWrap: true,
      lineNumbers: true,
      tabSize: 2,
      fontSize: 15
    },
    
    cache: {
      recentFiles: [],
      lastSaved: null,
      transformHistory: []
    }
  };
  
  // State change listeners
  const listeners = new Map();
  
  // Deep clone helper
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  
  // Get nested property
  function getNestedProperty(obj, path) {
    return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
  }
  
  // Set nested property
  function setNestedProperty(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((curr, key) => {
      if (!curr[key]) curr[key] = {};
      return curr[key];
    }, obj);
    target[lastKey] = value;
  }
  
  // Notify listeners
  function notifyListeners(path, value, oldValue) {
    // Notify specific path listeners
    const pathListeners = listeners.get(path) || [];
    pathListeners.forEach(callback => {
      try {
        callback(value, oldValue, path);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
    
    // Notify wildcard listeners
    const wildcardListeners = listeners.get('*') || [];
    wildcardListeners.forEach(callback => {
      try {
        callback(value, oldValue, path);
      } catch (error) {
        console.error('Error in wildcard listener:', error);
      }
    });
  }
  
  // Public API
  return {
    // Get state value
    get(path) {
      if (!path) return deepClone(state);
      return deepClone(getNestedProperty(state, path));
    },
    
    // Set state value
    set(path, value) {
      const oldValue = getNestedProperty(state, path);
      if (JSON.stringify(oldValue) === JSON.stringify(value)) {
        return; // No change
      }
      
      setNestedProperty(state, path, value);
      notifyListeners(path, value, oldValue);
      
      // Auto-save to localStorage for certain paths
      if (path.startsWith('preferences') || path.startsWith('ui.theme')) {
        this.persist();
      }
    },
    
    // Update multiple values at once
    update(updates) {
      Object.entries(updates).forEach(([path, value]) => {
        this.set(path, value);
      });
    },
    
    // Subscribe to state changes
    subscribe(path, callback) {
      if (typeof callback !== 'function') {
        throw new Error('Callback must be a function');
      }
      
      if (!listeners.has(path)) {
        listeners.set(path, []);
      }
      
      listeners.get(path).push(callback);
      
      // Return unsubscribe function
      return () => {
        const callbacks = listeners.get(path);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      };
    },
    
    // Add to history
    addToHistory(content) {
      const { undoStack, currentIndex } = state.history;
      
      // Remove any redo history
      undoStack.length = currentIndex + 1;
      
      // Add new state
      undoStack.push(content);
      
      // Limit history size
      if (undoStack.length > CONFIG.editor.maxUndoSteps) {
        undoStack.shift();
      } else {
        state.history.currentIndex++;
      }
      
      state.history.redoStack = [];
      this.set('editor.isDirty', true);
    },
    
    // Undo action
    undo() {
      const { undoStack, redoStack, currentIndex } = state.history;
      
      if (currentIndex > 0) {
        redoStack.push(undoStack[currentIndex]);
        state.history.currentIndex--;
        return undoStack[currentIndex - 1];
      }
      
      return null;
    },
    
    // Redo action
    redo() {
      const { redoStack } = state.history;
      
      if (redoStack.length > 0) {
        const content = redoStack.pop();
        state.history.currentIndex++;
        return content;
      }
      
      return null;
    },
    
    // Save state to localStorage
    persist() {
      try {
        const persistData = {
          preferences: state.preferences,
          theme: state.ui.theme,
          sidebarPinned: state.ui.sidebarPinned,
          recentFiles: state.cache.recentFiles
        };
        
        localStorage.setItem(
          CONFIG.localStorage.prefix + 'state',
          JSON.stringify(persistData)
        );
      } catch (error) {
        console.error('Failed to persist state:', error);
      }
    },
    
    // Load state from localStorage
    load() {
      try {
        const stored = localStorage.getItem(CONFIG.localStorage.prefix + 'state');
        if (stored) {
          const data = JSON.parse(stored);
          
          if (data.preferences) {
            state.preferences = { ...state.preferences, ...data.preferences };
          }
          
          if (data.theme) {
            state.ui.theme = data.theme;
          }
          
          if (typeof data.sidebarPinned === 'boolean') {
            state.ui.sidebarPinned = data.sidebarPinned;
          }
          
          if (Array.isArray(data.recentFiles)) {
            state.cache.recentFiles = data.recentFiles;
          }
        }
      } catch (error) {
        console.error('Failed to load state:', error);
      }
    },
    
    // Reset state to defaults
    reset(path) {
      if (!path) {
        // Reset entire state
        state = deepClone(this.getInitialState());
        notifyListeners('*', state, null);
      } else {
        // Reset specific path
        const initialState = this.getInitialState();
        const initialValue = getNestedProperty(initialState, path);
        this.set(path, initialValue);
      }
    },
    
    // Get initial state
    getInitialState() {
      return {
        editor: {
          content: '',
          mode: 'plain',
          isDirty: false,
          currentFile: null,
          selection: { start: 0, end: 0, text: '' },
          cursor: { line: 1, column: 1 }
        },
        ui: {
          theme: CONFIG.theme.default,
          sidebarOpen: true,
          sidebarPinned: false,
          quickActionsOpen: false,
          activeModal: null,
          isLoading: false
        },
        history: {
          undoStack: [],
          redoStack: [],
          currentIndex: -1
        },
        find: {
          searchTerm: '',
          replaceTerm: '',
          caseSensitive: false,
          wholeWord: false,
          useRegex: false,
          matches: [],
          currentMatch: -1
        },
        statistics: {
          charCount: 0,
          charCountNoSpaces: 0,
          wordCount: 0,
          lineCount: 0,
          paragraphCount: 0,
          readingTime: 0,
          language: 'en'
        },
        preferences: {
          autoSave: true,
          wordWrap: true,
          lineNumbers: true,
          tabSize: 2,
          fontSize: 15
        },
        cache: {
          recentFiles: [],
          lastSaved: null,
          transformHistory: []
        }
      };
    },
    
    // Debug helper
    debug() {
      console.group('AppState Debug');
      console.log('Current State:', deepClone(state));
      console.log('Listeners:', listeners);
      console.groupEnd();
    }
  };
})();

// Initialize state from localStorage on load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    AppState.load();
  });
}