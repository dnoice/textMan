// Utility Functions
const Utils = (function() {
  'use strict';
  
  return {
    // DOM Utilities
    dom: {
      // Query selector wrapper
      $(selector, parent = document) {
        return parent.querySelector(selector);
      },
      
      // Query selector all wrapper
      $$(selector, parent = document) {
        return Array.from(parent.querySelectorAll(selector));
      },
      
      // Create element with attributes
      createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
          if (key === 'className') {
            element.className = value;
          } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
              element.dataset[dataKey] = dataValue;
            });
          } else if (key.startsWith('on')) {
            element.addEventListener(key.slice(2).toLowerCase(), value);
          } else {
            element.setAttribute(key, value);
          }
        });
        
        children.forEach(child => {
          if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
          } else if (child instanceof HTMLElement) {
            element.appendChild(child);
          }
        });
        
        return element;
      },
      
      // Add event listener with delegation
      on(element, event, selector, handler) {
        if (typeof selector === 'function') {
          handler = selector;
          selector = null;
        }
        
        const callback = selector
          ? (e) => {
              const target = e.target.closest(selector);
              if (target && element.contains(target)) {
                handler.call(target, e);
              }
            }
          : handler;
        
        element.addEventListener(event, callback);
        
        // Return cleanup function
        return () => element.removeEventListener(event, callback);
      }
    },
    
    // String Utilities
    string: {
      // Escape HTML
      escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
      },
      
      // Truncate string
      truncate(str, length, suffix = '...') {
        if (str.length <= length) return str;
        return str.substring(0, length - suffix.length) + suffix;
      },
      
      // Convert to title case
      toTitleCase(str) {
        return str.replace(/\w\S*/g, (txt) => {
          return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
      },
      
      // Convert to sentence case
      toSentenceCase(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      },
      
      // Convert to camelCase
      toCamelCase(str) {
        return str
          .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
            return index === 0 ? word.toLowerCase() : word.toUpperCase();
          })
          .replace(/\s+/g, '');
      },
      
      // Convert to snake_case
      toSnakeCase(str) {
        return str
          .replace(/\W+/g, ' ')
          .split(/ |\B(?=[A-Z])/)
          .map(word => word.toLowerCase())
          .join('_');
      },
      
      // Convert to kebab-case
      toKebabCase(str) {
        return str
          .replace(/\W+/g, ' ')
          .split(/ |\B(?=[A-Z])/)
          .map(word => word.toLowerCase())
          .join('-');
      },
      
      // Remove accents
      removeAccents(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      },
      
      // Count words
      countWords(str) {
        return str.trim().split(/\s+/).filter(word => word.length > 0).length;
      },
      
      // Count lines
      countLines(str) {
        if (!str) return 0;
        return str.split('\n').length;
      },
      
      // Get unique lines
      getUniqueLines(str) {
        const lines = str.split('\n');
        return [...new Set(lines)].join('\n');
      }
    },
    
    // Array Utilities
    array: {
      // Chunk array
      chunk(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
          chunks.push(array.slice(i, i + size));
        }
        return chunks;
      },
      
      // Shuffle array
      shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
      },
      
      // Move item in array
      move(array, from, to) {
        const arr = [...array];
        const item = arr.splice(from, 1)[0];
        arr.splice(to, 0, item);
        return arr;
      }
    },
    
    // Function Utilities
    function: {
      // Debounce function
      debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            clearTimeout(timeout);
            func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      },
      
      // Throttle function
      throttle(func, limit) {
        let inThrottle;
        return function(...args) {
          if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
          }
        };
      },
      
      // Memoize function
      memoize(fn) {
        const cache = new Map();
        return (...args) => {
          const key = JSON.stringify(args);
          if (cache.has(key)) {
            return cache.get(key);
          }
          const result = fn(...args);
          cache.set(key, result);
          return result;
        };
      }
    },
    
    // Format Utilities
    format: {
      // Format bytes
      bytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
      },
      
      // Format number
      number(num) {
        return new Intl.NumberFormat().format(num);
      },
      
      // Format time
      time(seconds) {
        if (seconds < 60) return `${Math.round(seconds)}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        return `${Math.round(seconds / 3600)}h`;
      },
      
      // Format date
      date(date, format = 'short') {
        const d = new Date(date);
        
        if (format === 'short') {
          return d.toLocaleDateString();
        } else if (format === 'long') {
          return d.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } else if (format === 'time') {
          return d.toLocaleTimeString();
        }
        
        return d.toLocaleString();
      }
    },
    
    // Clipboard Utilities
    clipboard: {
      // Copy to clipboard
      async copy(text) {
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
          } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
              document.execCommand('copy');
              return true;
            } finally {
              textArea.remove();
            }
          }
        } catch (error) {
          console.error('Failed to copy:', error);
          return false;
        }
      },
      
      // Read from clipboard
      async read() {
        try {
          if (navigator.clipboard && window.isSecureContext) {
            return await navigator.clipboard.readText();
          }
          return null;
        } catch (error) {
          console.error('Failed to read clipboard:', error);
          return null;
        }
      }
    },
    
    // Storage Utilities
    storage: {
      // Get item with prefix
      get(key) {
        try {
          const item = localStorage.getItem(CONFIG.localStorage.prefix + key);
          return item ? JSON.parse(item) : null;
        } catch (error) {
          console.error('Storage get error:', error);
          return null;
        }
      },
      
      // Set item with prefix
      set(key, value) {
        try {
          localStorage.setItem(
            CONFIG.localStorage.prefix + key,
            JSON.stringify(value)
          );
          return true;
        } catch (error) {
          console.error('Storage set error:', error);
          return false;
        }
      },
      
      // Remove item
      remove(key) {
        try {
          localStorage.removeItem(CONFIG.localStorage.prefix + key);
          return true;
        } catch (error) {
          console.error('Storage remove error:', error);
          return false;
        }
      },
      
      // Clear all app storage
      clear() {
        try {
          Object.keys(localStorage)
            .filter(key => key.startsWith(CONFIG.localStorage.prefix))
            .forEach(key => localStorage.removeItem(key));
          return true;
        } catch (error) {
          console.error('Storage clear error:', error);
          return false;
        }
      }
    },
    
    // Validation Utilities
    validation: {
      // Check if valid email
      isEmail(str) {
        return CONFIG.regex.email.test(str);
      },
      
      // Check if valid URL
      isUrl(str) {
        return CONFIG.regex.url.test(str);
      },
      
      // Check if valid JSON
      isJson(str) {
        try {
          JSON.parse(str);
          return true;
        } catch {
          return false;
        }
      }
    },
    
    // Animation Utilities
    animation: {
      // Fade in
      fadeIn(element, duration = 200) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        const start = performance.now();
        
        const animate = (currentTime) => {
          const elapsed = currentTime - start;
          const progress = Math.min(elapsed / duration, 1);
          
          element.style.opacity = progress;
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };
        
        requestAnimationFrame(animate);
      },
      
      // Fade out
      fadeOut(element, duration = 200) {
        const start = performance.now();
        const initialOpacity = parseFloat(getComputedStyle(element).opacity);
        
        const animate = (currentTime) => {
          const elapsed = currentTime - start;
          const progress = Math.min(elapsed / duration, 1);
          
          element.style.opacity = initialOpacity * (1 - progress);
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            element.style.display = 'none';
          }
        };
        
        requestAnimationFrame(animate);
      }
    }
  };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}