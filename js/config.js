// Application Configuration
const CONFIG = {
  app: {
    name: 'textMan',
    version: '1.0.0',
    description: 'Advanced Text Manipulation Suite'
  },
  
  editor: {
    defaultMode: 'plain',
    tabSize: 2,
    wordWrap: true,
    lineNumbers: true,
    autoSave: true,
    autoSaveDelay: 5000, // 5 seconds
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxUndoSteps: 100
  },
  
  theme: {
    default: 'light',
    storageKey: 'textman-theme',
    transitionDuration: 200
  },
  
  sidebar: {
    defaultState: 'open',
    collapsedWidth: 60,
    expandedWidth: 320,
    storageKey: 'textman-sidebar-state',
    pinnedStorageKey: 'textman-sidebar-pinned'
  },
  
  shortcuts: {
    // Editor shortcuts
    undo: 'Ctrl+Z',
    redo: 'Ctrl+Y',
    save: 'Ctrl+S',
    open: 'Ctrl+O',
    find: 'Ctrl+F',
    replace: 'Ctrl+H',
    selectAll: 'Ctrl+A',
    
    // Transform shortcuts
    lowercase: 'Ctrl+L',
    uppercase: 'Ctrl+U',
    titleCase: 'Ctrl+T',
    
    // UI shortcuts
    toggleSidebar: 'Ctrl+B',
    toggleTheme: 'Ctrl+Shift+T',
    help: 'F1'
  },
  
  fileTypes: {
    text: ['.txt', '.text'],
    markdown: ['.md', '.markdown', '.mdown', '.mkd'],
    code: ['.js', '.json', '.html', '.css', '.xml', '.py', '.java', '.cpp', '.c', '.h'],
    all: '.txt,.md,.js,.html,.css,.json,.xml,.py,.java,.cpp,.c,.h,.markdown,.mdown,.mkd'
  },
  
  statistics: {
    updateDelay: 300, // Debounce delay in ms
    readingSpeed: 200 // Words per minute
  },
  
  toast: {
    duration: 3000,
    position: 'bottom-right',
    maxToasts: 3
  },
  
  animations: {
    enabled: true,
    duration: {
      fast: 150,
      normal: 200,
      slow: 300
    },
    easing: {
      default: 'ease-in-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.4, 0.0, 0.2, 1)'
    }
  },
  
  localStorage: {
    prefix: 'textman-',
    keys: {
      content: 'editor-content',
      mode: 'editor-mode',
      theme: 'theme',
      sidebar: 'sidebar-state',
      sidebarPinned: 'sidebar-pinned',
      recentFiles: 'recent-files',
      preferences: 'preferences',
      history: 'history'
    }
  },
  
  limits: {
    maxTextLength: 5000000, // 5 million characters
    maxLineLength: 10000,
    maxHistoryItems: 50,
    maxRecentFiles: 10
  },
  
  regex: {
    url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
    email: /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
    number: /[-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/g,
    whitespace: /\s+/g,
    lineBreak: /\r?\n/g,
    extraSpaces: /\s{2,}/g,
    punctuation: /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/g
  },
  
  languages: {
    supported: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
    default: 'en'
  }
};

// Freeze the configuration to prevent accidental modifications
Object.freeze(CONFIG);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}