// js/theme.js - Theme Management

/**
 * textMan Theme Module
 * 
 * Handles theme switching, persistence, and system theme detection.
 * Manages smooth transitions between light and dark modes.
 */

const TextManTheme = (function() {
  'use strict';

  // Theme state
  let currentTheme = 'light';
  let systemThemeMediaQuery = null;
  let isTransitioning = false;

  // DOM elements
  let elements = {
    root: null,
    themeToggle: null,
    body: null
  };

  // Private methods
  function initializeElements() {
    elements.root = document.documentElement;
    elements.themeToggle = document.getElementById('themeToggle');
    elements.body = document.body;
  }

  function applyTheme(theme, animate = true) {
    if (!elements.root || isTransitioning) return;

    // Validate theme
    if (!TextManConfig.theme.availableThemes.includes(theme)) {
      console.error(`Invalid theme: ${theme}`);
      return;
    }

    // Don't apply if already active
    if (currentTheme === theme && elements.root.getAttribute('data-theme') === theme) {
      return;
    }

    isTransitioning = true;

    // Add transitioning class for smooth change
    if (animate) {
      elements.body.classList.add('theme-transitioning');
      
      // Add ripple effect to theme toggle button
      if (elements.themeToggle) {
        elements.themeToggle.classList.add('transitioning');
      }
    }

    // Apply theme
    elements.root.setAttribute('data-theme', theme);
    currentTheme = theme;

    // Update theme toggle icon
    updateThemeToggleIcon(theme);

    // Update state
    TextManState.set('ui.theme', theme);

    // Save to localStorage
    TextManUtils.storage.set('theme', theme);

    // Emit theme change event
    TextManUtils.events.emit('theme:changed', { theme });

    // Remove transitioning class after animation
    if (animate) {
      setTimeout(() => {
        elements.body.classList.remove('theme-transitioning');
        if (elements.themeToggle) {
          elements.themeToggle.classList.remove('transitioning');
        }
        isTransitioning = false;
      }, TextManConfig.theme.transitionDuration);
    } else {
      isTransitioning = false;
    }
  }

  function updateThemeToggleIcon(theme) {
    if (!elements.themeToggle) return;

    const icon = elements.themeToggle.querySelector('i');
    if (!icon) return;

    // Animate icon change
    icon.style.transform = 'rotate(180deg) scale(0)';
    
    setTimeout(() => {
      if (theme === 'dark') {
        icon.className = 'fas fa-sun';
      } else {
        icon.className = 'fas fa-moon';
      }
      icon.style.transform = 'rotate(0deg) scale(1)';
    }, 150);
  }

  function getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function handleSystemThemeChange(e) {
    const newTheme = e.matches ? 'dark' : 'light';
    
    // Only apply if user hasn't manually set a theme
    const savedTheme = TextManUtils.storage.get('theme');
    if (!savedTheme) {
      applyTheme(newTheme);
    }
  }

  function setupEventListeners() {
    // Theme toggle button
    if (elements.themeToggle) {
      elements.themeToggle.addEventListener('click', () => {
        toggleTheme();
      });
    }

    // System theme change listener
    if (window.matchMedia) {
      systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Modern browsers
      if (systemThemeMediaQuery.addEventListener) {
        systemThemeMediaQuery.addEventListener('change', handleSystemThemeChange);
      } else if (systemThemeMediaQuery.addListener) {
        // Older browsers
        systemThemeMediaQuery.addListener(handleSystemThemeChange);
      }
    }

    // Keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        toggleTheme();
      }
    });

    // Listen for theme state changes
    TextManState.subscribe('ui.theme', (theme) => {
      if (theme !== currentTheme) {
        applyTheme(theme);
      }
    });
  }

  function toggleTheme() {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    
    // Show toast notification
    showThemeToast(newTheme);
  }

  function showThemeToast(theme) {
    const message = theme === 'dark' 
      ? 'Dark mode enabled' 
      : 'Light mode enabled';
    
    // Emit toast event (will be handled by ui-components.js)
    TextManUtils.events.emit('toast:show', {
      message,
      type: 'info',
      duration: 2000
    });
  }

  // Color scheme utilities
  function adjustColorForTheme(color, theme) {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    if (theme === 'dark') {
      // Lighten color for dark theme
      const factor = 1.2;
      return `rgb(${Math.min(255, r * factor)}, ${Math.min(255, g * factor)}, ${Math.min(255, b * factor)})`;
    } else {
      // Darken color for light theme
      const factor = 0.8;
      return `rgb(${r * factor}, ${g * factor}, ${b * factor})`;
    }
  }

  // Meta theme color for mobile browsers
  function updateMetaThemeColor(theme) {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const color = theme === 'dark' ? '#0d0d0d' : '#ffffff';
      metaThemeColor.setAttribute('content', color);
    }
  }

  // Public API
  return {
    // Initialize theme system
    init() {
      initializeElements();

      // Get initial theme (priority: saved > system > default)
      const savedTheme = TextManUtils.storage.get('theme');
      const systemTheme = getSystemTheme();
      const initialTheme = savedTheme || systemTheme || TextManConfig.theme.default;

      // Apply initial theme without animation
      applyTheme(initialTheme, false);

      // Setup event listeners
      setupEventListeners();

      // Update meta theme color
      updateMetaThemeColor(initialTheme);

      console.log(`Theme initialized: ${initialTheme}`);
    },

    // Get current theme
    getTheme() {
      return currentTheme;
    },

    // Set theme
    setTheme(theme) {
      applyTheme(theme);
    },

    // Toggle theme
    toggle() {
      toggleTheme();
    },

    // Check if dark mode
    isDark() {
      return currentTheme === 'dark';
    },

    // Get computed color value
    getColor(cssVariable) {
      const computed = getComputedStyle(elements.root);
      return computed.getPropertyValue(cssVariable).trim();
    },

    // Get all theme colors
    getColors() {
      const computed = getComputedStyle(elements.root);
      const colors = {};
      
      // Extract CSS variables
      const cssVariables = [
        '--primary-500',
        '--accent-red',
        '--accent-cyan',
        '--accent-yellow',
        '--accent-purple',
        '--text-primary',
        '--text-secondary',
        '--bg-primary',
        '--bg-secondary'
      ];
      
      cssVariables.forEach(variable => {
        colors[variable] = computed.getPropertyValue(variable).trim();
      });
      
      return colors;
    },

    // Apply theme to external elements (like modals)
    applyToElement(element) {
      if (element) {
        element.setAttribute('data-theme', currentTheme);
      }
    },

    // Create themed color
    createThemedColor(lightColor, darkColor) {
      return currentTheme === 'dark' ? darkColor : lightColor;
    },

    // Adjust color brightness
    adjustBrightness(color, percent) {
      const num = parseInt(color.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = (num >> 16) + amt;
      const G = (num >> 8 & 0x00FF) + amt;
      const B = (num & 0x0000FF) + amt;
      
      return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16)
        .slice(1);
    },

    // Check system preference
    getSystemPreference() {
      return getSystemTheme();
    },

    // Reset to system preference
    resetToSystem() {
      TextManUtils.storage.remove('theme');
      const systemTheme = getSystemTheme();
      applyTheme(systemTheme);
    }
  };
})();

// Initialize theme when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  TextManTheme.init();
});

// Make available globally
window.TextManTheme = TextManTheme;