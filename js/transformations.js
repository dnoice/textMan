// Text Transformation Functions
const Transformations = (function() {
  'use strict';
  
  // Initialize transformations
  function init() {
    console.log('Transformations module initialized');
  }
  
  // Helper function to apply transformation
  function applyTransformation(transformFn, options = {}) {
    const hasSelection = Editor.hasSelection();
    const content = hasSelection ? Editor.getSelection() : Editor.getContent();
    
    if (!content && !options.allowEmpty) {
      ToastManager.show({
        message: 'No text to transform',
        type: 'warning'
      });
      return;
    }
    
    try {
      const transformed = transformFn(content);
      
      if (hasSelection) {
        Editor.replaceSelection(transformed);
      } else {
        Editor.setContent(transformed);
      }
      
      // Add to history
      AppState.addToHistory(Editor.getContent());
      
      // Show success message
      if (options.successMessage) {
        ToastManager.show({
          message: options.successMessage,
          type: 'success',
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Transformation error:', error);
      ToastManager.show({
        message: 'Transformation failed: ' + error.message,
        type: 'error'
      });
    }
  }
  
  // Case Transformations
  function toLowerCase() {
    applyTransformation(text => text.toLowerCase(), {
      successMessage: 'Converted to lowercase'
    });
  }
  
  function toUpperCase() {
    applyTransformation(text => text.toUpperCase(), {
      successMessage: 'Converted to UPPERCASE'
    });
  }
  
  function toTitleCase() {
    applyTransformation(text => Utils.string.toTitleCase(text), {
      successMessage: 'Converted to Title Case'
    });
  }
  
  function toSentenceCase() {
    applyTransformation(text => {
      return text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, match => match.toUpperCase());
    }, {
      successMessage: 'Converted to Sentence case'
    });
  }
  
  function toCamelCase() {
    applyTransformation(text => Utils.string.toCamelCase(text), {
      successMessage: 'Converted to camelCase'
    });
  }
  
  function toSnakeCase() {
    applyTransformation(text => Utils.string.toSnakeCase(text), {
      successMessage: 'Converted to snake_case'
    });
  }
  
  function toKebabCase() {
    applyTransformation(text => Utils.string.toKebabCase(text), {
      successMessage: 'Converted to kebab-case'
    });
  }
  
  function toAlternatingCase() {
    applyTransformation(text => {
      return text.split('').map((char, index) => 
        index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
      ).join('');
    }, {
      successMessage: 'Converted to aLtErNaTiNg CaSe'
    });
  }
  
  function invertCase() {
    applyTransformation(text => {
      return text.split('').map(char => 
        char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
      ).join('');
    }, {
      successMessage: 'Inverted case'
    });
  }
  
  // Encoding/Decoding
  function base64Encode() {
    applyTransformation(text => {
      try {
        return btoa(unescape(encodeURIComponent(text)));
      } catch (error) {
        throw new Error('Invalid characters for Base64 encoding');
      }
    }, {
      successMessage: 'Encoded to Base64'
    });
  }
  
  function base64Decode() {
    applyTransformation(text => {
      try {
        return decodeURIComponent(escape(atob(text.trim())));
      } catch (error) {
        throw new Error('Invalid Base64 string');
      }
    }, {
      successMessage: 'Decoded from Base64'
    });
  }
  
  // Sorting Functions
  function sortLines(order = 'az') {
    applyTransformation(text => {
      const lines = text.split('\n');
      
      switch (order) {
        case 'az':
          lines.sort((a, b) => a.localeCompare(b));
          break;
        case 'za':
          lines.sort((a, b) => b.localeCompare(a));
          break;
        case 'shortest':
          lines.sort((a, b) => a.length - b.length);
          break;
        case 'longest':
          lines.sort((a, b) => b.length - a.length);
          break;
        case 'numerical':
          lines.sort((a, b) => {
            const numA = parseFloat(a) || 0;
            const numB = parseFloat(b) || 0;
            return numA - numB;
          });
          break;
      }
      
      return lines.join('\n');
    }, {
      successMessage: 'Lines sorted'
    });
  }
  
  function shuffleLines() {
    applyTransformation(text => {
      const lines = text.split('\n');
      return Utils.array.shuffle(lines).join('\n');
    }, {
      successMessage: 'Lines shuffled'
    });
  }
  
  function reverseText() {
    applyTransformation(text => text.split('').reverse().join(''), {
      successMessage: 'Text reversed'
    });
  }
  
  function reverseLines() {
    applyTransformation(text => {
      const lines = text.split('\n');
      return lines.reverse().join('\n');
    }, {
      successMessage: 'Lines reversed'
    });
  }
  
  // Add/Remove Functions
  function addPrefix() {
    const prefixInput = document.getElementById('prefixInput');
    const prefix = prefixInput ? prefixInput.value : '';
    
    if (!prefix) {
      ToastManager.show({
        message: 'Please enter a prefix',
        type: 'warning'
      });
      return;
    }
    
    applyTransformation(text => {
      const lines = text.split('\n');
      return lines.map(line => prefix + line).join('\n');
    }, {
      successMessage: 'Prefix added to all lines'
    });
  }
  
  function addSuffix() {
    const suffixInput = document.getElementById('suffixInput');
    const suffix = suffixInput ? suffixInput.value : '';
    
    if (!suffix) {
      ToastManager.show({
        message: 'Please enter a suffix',
        type: 'warning'
      });
      return;
    }
    
    applyTransformation(text => {
      const lines = text.split('\n');
      return lines.map(line => line + suffix).join('\n');
    }, {
      successMessage: 'Suffix added to all lines'
    });
  }
  
  function wrapLines() {
    const wrapInput = document.getElementById('wrapInput');
    const wrapper = wrapInput ? wrapInput.value : '';
    
    if (!wrapper) {
      ToastManager.show({
        message: 'Please enter a wrapper',
        type: 'warning'
      });
      return;
    }
    
    applyTransformation(text => {
      const lines = text.split('\n');
      return lines.map(line => wrapper + line + wrapper).join('\n');
    }, {
      successMessage: 'Lines wrapped'
    });
  }
  
  function removeDuplicates() {
    applyTransformation(text => Utils.string.getUniqueLines(text), {
      successMessage: 'Duplicate lines removed'
    });
  }
  
  function removeEmptyLines() {
    applyTransformation(text => {
      const lines = text.split('\n');
      return lines.filter(line => line.trim().length > 0).join('\n');
    }, {
      successMessage: 'Empty lines removed'
    });
  }
  
  function removeExtraSpaces() {
    applyTransformation(text => {
      return text
        .split('\n')
        .map(line => line.trim().replace(/\s+/g, ' '))
        .join('\n');
    }, {
      successMessage: 'Extra spaces removed'
    });
  }
  
  function removeAllSpaces() {
    applyTransformation(text => text.replace(/\s/g, ''), {
      successMessage: 'All spaces removed'
    });
  }
  
  function removeNumbers() {
    applyTransformation(text => text.replace(/\d/g, ''), {
      successMessage: 'Numbers removed'
    });
  }
  
  function removePunctuation() {
    applyTransformation(text => text.replace(CONFIG.regex.punctuation, ''), {
      successMessage: 'Punctuation removed'
    });
  }
  
  function removeLineBreaks() {
    applyTransformation(text => text.replace(/\r?\n/g, ' '), {
      successMessage: 'Line breaks removed'
    });
  }
  
  function removeAccents() {
    applyTransformation(text => Utils.string.removeAccents(text), {
      successMessage: 'Accents removed'
    });
  }
  
  // Filter Functions
  function keepLines() {
    const keepInput = document.getElementById('keepLinesInput');
    const pattern = keepInput ? keepInput.value : '';
    
    if (!pattern) {
      ToastManager.show({
        message: 'Please enter a pattern to keep',
        type: 'warning'
      });
      return;
    }
    
    applyTransformation(text => {
      const lines = text.split('\n');
      const regex = new RegExp(pattern, 'i');
      return lines.filter(line => regex.test(line)).join('\n');
    }, {
      successMessage: 'Lines filtered'
    });
  }
  
  function removeLines() {
    const removeInput = document.getElementById('removeLinesInput');
    const pattern = removeInput ? removeInput.value : '';
    
    if (!pattern) {
      ToastManager.show({
        message: 'Please enter a pattern to remove',
        type: 'warning'
      });
      return;
    }
    
    applyTransformation(text => {
      const lines = text.split('\n');
      const regex = new RegExp(pattern, 'i');
      return lines.filter(line => !regex.test(line)).join('\n');
    }, {
      successMessage: 'Lines removed'
    });
  }
  
  function extractUrls() {
    applyTransformation(text => {
      const urls = text.match(CONFIG.regex.url) || [];
      return [...new Set(urls)].join('\n');
    }, {
      successMessage: urls => `Extracted ${urls.split('\n').length} URLs`,
      allowEmpty: true
    });
  }
  
  function extractEmails() {
    applyTransformation(text => {
      const emails = text.match(CONFIG.regex.email) || [];
      return [...new Set(emails)].join('\n');
    }, {
      successMessage: emails => `Extracted ${emails.split('\n').length} emails`,
      allowEmpty: true
    });
  }
  
  function extractNumbers() {
    applyTransformation(text => {
      const numbers = text.match(CONFIG.regex.number) || [];
      return [...new Set(numbers)].join('\n');
    }, {
      successMessage: numbers => `Extracted ${numbers.split('\n').length} numbers`,
      allowEmpty: true
    });
  }
  
  // Public API
  return {
    init,
    
    // Case transformations
    toLowerCase,
    toUpperCase,
    toTitleCase,
    toSentenceCase,
    toCamelCase,
    toSnakeCase,
    toKebabCase,
    toAlternatingCase,
    invertCase,
    
    // Encoding
    base64Encode,
    base64Decode,
    
    // Sorting
    sortLines,
    shuffleLines,
    reverseText,
    reverseLines,
    
    // Add/Remove
    addPrefix,
    addSuffix,
    wrapLines,
    removeDuplicates,
    removeEmptyLines,
    removeExtraSpaces,
    removeAllSpaces,
    removeNumbers,
    removePunctuation,
    removeLineBreaks,
    removeAccents,
    
    // Filter
    keepLines,
    removeLines,
    extractUrls,
    extractEmails,
    extractNumbers
  };
})();

// Export the Transformations module
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Transformations;
}

// Initialize the Transformations module
document.addEventListener('DOMContentLoaded', () => {
  Transformations.init();
});

// Ensure the Transformations module is available globally
window.Transformations = Transformations;

// Ensure Utils and Editor are available globally
window.Utils = window.Utils || {};
window.Editor = window.Editor || {};
window.AppState = window.AppState || {};
window.ToastManager = window.ToastManager || {};
window.CONFIG = window.CONFIG || {
  regex: {
    punctuation: /[!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]/g,
    url: /https?:\/\/[^\s]+/g,
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    number: /\d+/g
  }
};
