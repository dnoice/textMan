// Main Application Entry Point
(function() {
  'use strict';
  
  // App initialization
  const App = {
    // Initialize all modules
    init() {
      console.log('🚀 textMan v' + CONFIG.app.version + ' initializing...');
      
      // Check browser compatibility
      if (!this.checkCompatibility()) {
        this.showCompatibilityWarning();
        return;
      }
      
      // Initialize core modules in order
      this.initializeModules();
      
      // Setup global error handling
      this.setupErrorHandling();
      
      // Setup performance monitoring
      this.setupPerformanceMonitoring();
      
      // Mark app as ready
      document.body.classList.add('app-ready');
      
      console.log('✅ textMan initialized successfully');
    },
    
    // Check browser compatibility
    checkCompatibility() {
      const required = {
        localStorage: typeof Storage !== 'undefined',
        querySelector: !!document.querySelector,
        addEventListener: !!window.addEventListener,
        JSON: window.JSON && typeof JSON.parse === 'function',
        Promise: typeof Promise !== 'undefined'
      };
      
      for (const [feature, supported] of Object.entries(required)) {
        if (!supported) {
          console.error(`Missing required feature: ${feature}`);
          return false;
        }
      }
      
      return true;
    },
    
    // Show compatibility warning
    showCompatibilityWarning() {
      const warning = document.createElement('div');
      warning.className = 'compatibility-warning';
      warning.innerHTML = `
        <h2>Browser Not Supported</h2>
        <p>Your browser doesn't support all the features required by textMan.</p>
        <p>Please upgrade to a modern browser like Chrome, Firefox, Safari, or Edge.</p>
      `;
      document.body.appendChild(warning);
    },
    
    // Initialize all modules
    initializeModules() {
      try {
        // Core modules (order matters)
        ThemeManager.init();
        AppState.load();
        Editor.init();
        Sidebar.init();
        Statistics.init();
        
        // Feature modules
        if (window.Transformations) Transformations.init();
        if (window.FileOperations) FileOperations.init();
        if (window.FindReplace) FindReplace.init();
        if (window.Clipboard) ClipboardManager.init();
        if (window.KeyboardShortcuts) KeyboardShortcuts.init();
        if (window.DragDrop) DragDrop.init();
        if (window.AdvancedTools) AdvancedTools.init();
        if (window.ToastManager) ToastManager.init();
        if (window.UIComponents) UIComponents.init();
        
        // Initialize help modal
        this.initializeHelp();
        
        // Initialize quick actions bar
        this.initializeQuickActions();
        
      } catch (error) {
        console.error('Failed to initialize modules:', error);
        this.showInitError(error);
      }
    },
    
    // Initialize help modal
    initializeHelp() {
      const helpToggle = document.getElementById('helpToggle');
      const helpModal = document.getElementById('helpModal');
      const closeHelp = document.getElementById('closeHelp');
      
      if (helpToggle && helpModal) {
        helpToggle.addEventListener('click', () => {
          helpModal.style.display = 'flex';
          Utils.animation.fadeIn(helpModal, 200);
        });
        
        if (closeHelp) {
          closeHelp.addEventListener('click', () => {
            Utils.animation.fadeOut(helpModal, 200);
          });
        }
        
        // Close on outside click
        helpModal.addEventListener('click', (e) => {
          if (e.target === helpModal) {
            Utils.animation.fadeOut(helpModal, 200);
          }
        });
      }
    },
    
    // Initialize quick actions bar
    initializeQuickActions() {
      const toggleBtn = document.getElementById('quickActionsToggle');
      const quickBar = document.getElementById('quickActionsBar');
      
      if (toggleBtn && quickBar) {
        toggleBtn.addEventListener('click', () => {
          const isVisible = quickBar.style.display !== 'none';
          
          if (isVisible) {
            Utils.animation.fadeOut(quickBar, 150);
          } else {
            quickBar.style.display = 'flex';
            Utils.animation.fadeIn(quickBar, 150);
          }
          
          toggleBtn.classList.toggle('active');
        });
      }
    },
    
    // Setup global error handling
    setupErrorHandling() {
      window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        
        // Don't show errors in production
        if (window.location.hostname === 'localhost') {
          this.showError('An unexpected error occurred', event.error.message);
        }
      });
      
      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        
        // Don't show errors in production
        if (window.location.hostname === 'localhost') {
          this.showError('An unexpected error occurred', event.reason);
        }
      });
    },
    
    // Setup performance monitoring
    setupPerformanceMonitoring() {
      if ('performance' in window) {
        window.addEventListener('load', () => {
          setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Page load performance:', {
              domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart) + 'ms',
              loadComplete: Math.round(perfData.loadEventEnd - perfData.loadEventStart) + 'ms',
              totalTime: Math.round(perfData.loadEventEnd - perfData.fetchStart) + 'ms'
            });
          }, 0);
        });
      }
    },
    
    // Show initialization error
    showInitError(error) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'init-error';
      errorDiv.innerHTML = `
        <h3>Initialization Error</h3>
        <p>Failed to initialize textMan. Please refresh the page.</p>
        <p class="error-details">${error.message}</p>
        <button onclick="location.reload()">Refresh Page</button>
      `;
      document.body.appendChild(errorDiv);
    },
    
    // Show error toast
    showError(title, message) {
      if (window.ToastManager) {
        ToastManager.show({
          message: `${title}: ${message}`,
          type: 'error',
          duration: 5000
        });
      } else {
        console.error(title, message);
      }
    },
    
    // Public API methods
    api: {
      // Get current text
      getText() {
        return Editor.getContent();
      },
      
      // Set text
      setText(text) {
        Editor.setContent(text);
      },
      
      // Get statistics
      getStats() {
        return Statistics.exportStats();
      },
      
      // Transform text
      transform(transformation, ...args) {
        if (window.Transformations && Transformations[transformation]) {
          return Transformations[transformation](...args);
        }
        throw new Error(`Unknown transformation: ${transformation}`);
      },
      
      // Save to file
      save(filename) {
        if (window.FileOperations) {
          FileOperations.save(filename);
        }
      },
      
      // Load from file
      load(file) {
        if (window.FileOperations) {
          FileOperations.loadFile(file);
        }
      }
    }
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }
  
  // Expose API to window for external access
  window.textMan = App.api;
  
  // Add some helpful console messages
  console.log('%c🚀 textMan', 'font-size: 24px; font-weight: bold; color: #6bbb8c;');
  console.log('%cAdvanced Text Manipulation Suite', 'font-size: 14px; color: #666;');
  console.log('%cType textMan in the console to access the API', 'font-size: 12px; color: #999;');
  
})();

// Add basic styles for error/warning messages
(function() {
  const style = document.createElement('style');
  style.textContent = `
    .compatibility-warning,
    .init-error {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      text-align: center;
      max-width: 400px;
      z-index: 10000;
    }
    
    .compatibility-warning h2,
    .init-error h3 {
      margin: 0 0 1rem 0;
      color: #ef4444;
    }
    
    .compatibility-warning p,
    .init-error p {
      margin: 0.5rem 0;
      color: #666;
    }
    
    .error-details {
      font-family: monospace;
      font-size: 12px;
      background: #f3f4f6;
      padding: 0.5rem;
      border-radius: 4px;
      margin-top: 1rem;
    }
    
    .init-error button {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background: #6bbb8c;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .init-error button:hover {
      background: #5aa77a;
    }
    
    .app-ready {
      opacity: 1;
      transition: opacity 300ms ease-in-out;
    }
    
    body:not(.app-ready) {
      opacity: 0;
    }
  `;
  document.head.appendChild(style);
})();