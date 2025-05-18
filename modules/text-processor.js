// TextProcessor module - Handles text transformation operations
export class TextProcessor {
  constructor() {
    // Track operations for potential analytics or undo/redo
    this.operationHistory = [];
  }
  
  // Helper method to log operations
  _logOperation(operation, params = {}) {
    this.operationHistory.push({
      operation,
      timestamp: new Date(),
      params
    });
    
    // Limit history size
    if (this.operationHistory.length > 100) {
      this.operationHistory.shift();
    }
  }
  
  // Helper to split text into lines
  getLines(text) {
    return text.split('\n');
  }
  
  // Helper to join lines into text
  joinLines(lines) {
    return lines.join('\n');
  }
  
  // Transform text case
  transformCase(text, type) {
    let result;
    
    switch (type) {
      case 'lowercase':
        result = text.toLowerCase();
        break;
        
      case 'uppercase':
        result = text.toUpperCase();
        break;
        
      case 'capitalize':
        result = text.replace(/\b\w+/g, (word) => {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        });
        break;
        
      case 'sentence':
        result = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, match => {
          return match.toUpperCase();
        });
        break;
        
      default:
        result = text;
    }
    
    this._logOperation('transformCase', { type });
    return result;
  }
  
  // Reverse text
  reverseText(text) {
    const result = [...text].reverse().join('');
    this._logOperation('reverseText');
    return result;
  }
  
  // Sort lines alphabetically
  sortLines(text, direction = 'asc') {
    const lines = this.getLines(text);
    
    if (direction === 'asc') {
      lines.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    } else {
      lines.sort((a, b) => b.localeCompare(a, undefined, { sensitivity: 'base' }));
    }
    
    this._logOperation('sortLines', { direction });
    return this.joinLines(lines);
  }
  
  // Remove duplicate lines
  removeDuplicateLines(text) {
    const lines = this.getLines(text);
    const uniqueLines = [...new Set(lines)];
    
    this._logOperation('removeDuplicateLines', { 
      removed: lines.length - uniqueLines.length 
    });
    
    return this.joinLines(uniqueLines);
  }
  
  // Remove empty lines
  removeEmptyLines(text) {
    const lines = this.getLines(text);
    const nonEmptyLines = lines.filter(line => line.trim() !== '');
    
    this._logOperation('removeEmptyLines', { 
      removed: lines.length - nonEmptyLines.length 
    });
    
    return this.joinLines(nonEmptyLines);
  }
  
  // Trim whitespace from each line
  trimWhitespace(text) {
    const lines = this.getLines(text);
    const trimmedLines = lines.map(line => line.trim());
    
    this._logOperation('trimWhitespace');
    return this.joinLines(trimmedLines);
  }
  
  // Remove extra spaces (collapse multiple spaces into a single space)
  removeExtraSpaces(text) {
    const result = text.replace(/\s+/g, ' ').trim();
    this._logOperation('removeExtraSpaces');
    return result;
  }
  
  // Remove line breaks (join all lines with a space)
  removeLineBreaks(text) {
    const result = text.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
    this._logOperation('removeLineBreaks');
    return result;
  }
  
  // Fix paragraphs (ensure single blank line between paragraphs)
  fixParagraphs(text) {
    // First normalize line endings
    let result = text.replace(/\r\n/g, '\n');
    
    // Replace multiple blank lines with a single blank line
    result = result.replace(/\n{3,}/g, '\n\n');
    
    // Trim whitespace from each line
    const lines = this.getLines(result);
    const trimmedLines = lines.map(line => line.trim());
    
    this._logOperation('fixParagraphs');
    return this.joinLines(trimmedLines);
  }
  
  // Search and replace (single occurrence)
  replace(text, searchTerm, replaceTerm, options = {}) {
    const { caseSensitive = false, wholeWord = false } = options;
    
    // Create regex based on options
    let flags = caseSensitive ? 'g' : 'gi';
    let pattern = searchTerm;
    
    // Escape special regex characters
    pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Add word boundary if whole word option is selected
    if (wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }
    
    // Create regex and replace
    const regex = new RegExp(pattern, flags);
    const result = text.replace(regex, replaceTerm);
    
    this._logOperation('replace', { searchTerm, replaceTerm, options });
    return result;
  }
  
  // Search and replace all occurrences
  replaceAll(text, searchTerm, replaceTerm, options = {}) {
    const { caseSensitive = false, wholeWord = false } = options;
    
    // Create regex based on options
    let flags = caseSensitive ? 'g' : 'gi';
    let pattern = searchTerm;
    
    // Escape special regex characters
    pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Add word boundary if whole word option is selected
    if (wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }
    
    // Create regex and replace
    const regex = new RegExp(pattern, flags);
    
    // Count occurrences
    const matches = text.match(regex);
    const count = matches ? matches.length : 0;
    
    // Perform replacement
    const result = text.replace(regex, replaceTerm);
    
    this._logOperation('replaceAll', { 
      searchTerm, 
      replaceTerm, 
      options,
      count 
    });
    
    return { text: result, count };
  }
  
  // Add prefix to each line
  addPrefixToLines(text, prefix) {
    const lines = this.getLines(text);
    const prefixedLines = lines.map(line => `${prefix}${line}`);
    
    this._logOperation('addPrefixToLines', { prefix });
    return this.joinLines(prefixedLines);
  }
  
  // Add suffix to each line
  addSuffixToLines(text, suffix) {
    const lines = this.getLines(text);
    const suffixedLines = lines.map(line => `${line}${suffix}`);
    
    this._logOperation('addSuffixToLines', { suffix });
    return this.joinLines(suffixedLines);
  }
  
  // Add both prefix and suffix to each line
  addPrefixAndSuffixToLines(text, prefix, suffix) {
    const lines = this.getLines(text);
    const modifiedLines = lines.map(line => `${prefix}${line}${suffix}`);
    
    this._logOperation('addPrefixAndSuffixToLines', { prefix, suffix });
    return this.joinLines(modifiedLines);
  }
  
  // Keep lines containing a term
  keepLinesContaining(text, term, options = {}) {
    const { caseSensitive = false } = options;
    const lines = this.getLines(text);
    
    let filteredLines;
    if (caseSensitive) {
      filteredLines = lines.filter(line => line.includes(term));
    } else {
      const lowerTerm = term.toLowerCase();
      filteredLines = lines.filter(line => line.toLowerCase().includes(lowerTerm));
    }
    
    this._logOperation('keepLinesContaining', { 
      term, 
      options,
      kept: filteredLines.length,
      total: lines.length
    });
    
    return this.joinLines(filteredLines);
  }
  
  // Remove lines containing a term
  removeLinesContaining(text, term, options = {}) {
    const { caseSensitive = false } = options;
    const lines = this.getLines(text);
    
    let filteredLines;
    if (caseSensitive) {
      filteredLines = lines.filter(line => !line.includes(term));
    } else {
      const lowerTerm = term.toLowerCase();
      filteredLines = lines.filter(line => !line.toLowerCase().includes(lowerTerm));
    }
    
    this._logOperation('removeLinesContaining', { 
      term, 
      options,
      removed: lines.length - filteredLines.length,
      total: lines.length
    });
    
    return this.joinLines(filteredLines);
  }
  
  // Get operation history
  getHistory() {
    return [...this.operationHistory];
  }
  
  // Clear operation history
  clearHistory() {
    this.operationHistory = [];
  }
}
