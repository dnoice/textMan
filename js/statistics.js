// Text Statistics Module
const Statistics = (function() {
  'use strict';
  
  let statsElements = {};
  let updateTimer = null;
  
  // Initialize statistics
  function init() {
    // Get stat elements
    statsElements = {
      wordCount: document.getElementById('wordCount'),
      charCount: document.getElementById('charCount'),
      lineCount: document.getElementById('lineCount'),
      paragraphCount: document.getElementById('paragraphCount'),
      readingTime: document.getElementById('readingTime'),
      languageDetect: document.getElementById('languageDetect')
    };
    
    // Initial update
    update('');
    
    // Subscribe to editor content changes
    AppState.subscribe('editor.content', (content) => {
      scheduleUpdate(content);
    });
  }
  
  // Schedule update with debouncing
  function scheduleUpdate(content) {
    clearTimeout(updateTimer);
    updateTimer = setTimeout(() => {
      update(content);
    }, CONFIG.statistics.updateDelay);
  }
  
  // Update all statistics
  function update(content) {
    const stats = calculateStats(content);
    
    // Update state
    AppState.update({
      'statistics.charCount': stats.charCount,
      'statistics.charCountNoSpaces': stats.charCountNoSpaces,
      'statistics.wordCount': stats.wordCount,
      'statistics.lineCount': stats.lineCount,
      'statistics.paragraphCount': stats.paragraphCount,
      'statistics.readingTime': stats.readingTime
    });
    
    // Update UI
    updateUI(stats);
  }
  
  // Calculate all statistics
  function calculateStats(content) {
    return {
      charCount: countCharacters(content),
      charCountNoSpaces: countCharactersNoSpaces(content),
      wordCount: countWords(content),
      lineCount: countLines(content),
      paragraphCount: countParagraphs(content),
      readingTime: calculateReadingTime(content),
      language: detectLanguage(content)
    };
  }
  
  // Count total characters
  function countCharacters(text) {
    return text.length;
  }
  
  // Count characters excluding spaces
  function countCharactersNoSpaces(text) {
    return text.replace(/\s/g, '').length;
  }
  
  // Count words
  function countWords(text) {
    if (!text.trim()) return 0;
    
    // Split by whitespace and filter empty strings
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }
  
  // Count lines
  function countLines(text) {
    if (!text) return 0;
    return text.split('\n').length;
  }
  
  // Count paragraphs
  function countParagraphs(text) {
    if (!text.trim()) return 0;
    
    // Split by double line breaks and filter empty paragraphs
    const paragraphs = text
      .split(/\n\s*\n/)
      .filter(para => para.trim().length > 0);
    
    return paragraphs.length;
  }
  
  // Calculate reading time
  function calculateReadingTime(text) {
    const words = countWords(text);
    const wpm = CONFIG.statistics.readingSpeed;
    const minutes = Math.ceil(words / wpm);
    
    return minutes;
  }
  
  // Simple language detection
  function detectLanguage(text) {
    if (!text.trim()) return 'Unknown';
    
    // Language patterns (simplified)
    const patterns = {
      English: {
        common: /\b(the|be|to|of|and|a|in|that|have|I|it|for|not|on|with|he|as|you|do|at)\b/gi,
        chars: /[a-zA-Z]/g
      },
      Spanish: {
        common: /\b(el|la|de|que|y|a|en|un|ser|se|no|haber|por|con|su|para|como|estar|tener|le)\b/gi,
        chars: /[áéíóúñü]/gi
      },
      French: {
        common: /\b(le|de|un|être|et|à|il|avoir|ne|je|son|que|se|qui|ce|dans|en|du|elle|au)\b/gi,
        chars: /[àâäéèêëïîôùûüÿæœç]/gi
      },
      German: {
        common: /\b(der|die|und|in|den|von|zu|das|mit|sich|des|auf|für|ist|im|dem|nicht|ein|eine|als)\b/gi,
        chars: /[äöüß]/gi
      },
      Italian: {
        common: /\b(di|che|è|e|la|il|un|a|non|con|si|da|in|per|del|al|sono|dei|come|una)\b/gi,
        chars: /[àèéìíîòóùú]/gi
      },
      Portuguese: {
        common: /\b(de|a|o|que|e|do|da|em|um|para|é|com|não|uma|os|no|se|na|por|mais)\b/gi,
        chars: /[ãáàâçéêíõóôú]/gi
      },
      Russian: {
        chars: /[а-яА-ЯёЁ]/g
      },
      Japanese: {
        chars: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g
      },
      Korean: {
        chars: /[\uAC00-\uD7AF\u1100-\u11FF]/g
      },
      Chinese: {
        chars: /[\u4E00-\u9FFF\u3400-\u4DBF]/g
      }
    };
    
    // Count matches for each language
    const scores = {};
    
    for (const [lang, pattern] of Object.entries(patterns)) {
      let score = 0;
      
      // Check for common words
      if (pattern.common) {
        const matches = text.match(pattern.common);
        score += matches ? matches.length * 10 : 0;
      }
      
      // Check for characteristic characters
      if (pattern.chars) {
        const matches = text.match(pattern.chars);
        score += matches ? matches.length : 0;
      }
      
      scores[lang] = score;
    }
    
    // Find language with highest score
    let detectedLang = 'Unknown';
    let highestScore = 0;
    
    for (const [lang, score] of Object.entries(scores)) {
      if (score > highestScore) {
        highestScore = score;
        detectedLang = lang;
      }
    }
    
    // If score is too low, return Unknown
    if (highestScore < 5) {
      detectedLang = 'Unknown';
    }
    
    return detectedLang;
  }
  
  // Update UI elements
  function updateUI(stats) {
    // Format numbers with locale formatting
    const formatNumber = (num) => num.toLocaleString();
    
    // Update word count
    if (statsElements.wordCount) {
      const wordText = stats.wordCount === 1 ? 'word' : 'words';
      statsElements.wordCount.textContent = `${formatNumber(stats.wordCount)} ${wordText}`;
    }
    
    // Update character count
    if (statsElements.charCount) {
      const charText = stats.charCount === 1 ? 'character' : 'characters';
      statsElements.charCount.textContent = `${formatNumber(stats.charCount)} ${charText}`;
      
      // Add tooltip with no-spaces count
      statsElements.charCount.title = `${formatNumber(stats.charCountNoSpaces)} without spaces`;
    }
    
    // Update line count
    if (statsElements.lineCount) {
      const lineText = stats.lineCount === 1 ? 'line' : 'lines';
      statsElements.lineCount.textContent = `${formatNumber(stats.lineCount)} ${lineText}`;
    }
    
    // Update paragraph count
    if (statsElements.paragraphCount) {
      const paraText = stats.paragraphCount === 1 ? 'paragraph' : 'paragraphs';
      statsElements.paragraphCount.textContent = `${formatNumber(stats.paragraphCount)} ${paraText}`;
    }
    
    // Update reading time
    if (statsElements.readingTime) {
      if (stats.readingTime === 0) {
        statsElements.readingTime.textContent = '0 min read';
      } else if (stats.readingTime === 1) {
        statsElements.readingTime.textContent = '1 min read';
      } else if (stats.readingTime < 60) {
        statsElements.readingTime.textContent = `${stats.readingTime} min read`;
      } else {
        const hours = Math.floor(stats.readingTime / 60);
        const minutes = stats.readingTime % 60;
        const hourText = hours === 1 ? 'hr' : 'hrs';
        
        if (minutes === 0) {
          statsElements.readingTime.textContent = `${hours} ${hourText}`;
        } else {
          statsElements.readingTime.textContent = `${hours} ${hourText} ${minutes} min`;
        }
      }
      
      // Add tooltip with WPM info
      statsElements.readingTime.title = `Based on ${CONFIG.statistics.readingSpeed} words per minute`;
    }
    
    // Update language detection
    if (statsElements.languageDetect) {
      statsElements.languageDetect.textContent = stats.language;
    }
  }
  
  // Get current statistics
  function getStats() {
    const content = AppState.get('editor.content') || '';
    return calculateStats(content);
  }
  
  // Export statistics to object
  function exportStats() {
    const stats = getStats();
    return {
      words: stats.wordCount,
      characters: stats.charCount,
      charactersNoSpaces: stats.charCountNoSpaces,
      lines: stats.lineCount,
      paragraphs: stats.paragraphCount,
      readingTime: `${stats.readingTime} minutes`,
      language: stats.language,
      generated: new Date().toISOString()
    };
  }
  
  // Get word frequency analysis
  function getWordFrequency(limit = 10) {
    const content = AppState.get('editor.content') || '';
    
    if (!content.trim()) return [];
    
    // Extract words (alphanumeric only)
    const words = content
      .toLowerCase()
      .match(/\b[a-z0-9]+\b/g) || [];
    
    // Count frequency
    const frequency = {};
    words.forEach(word => {
      // Skip very short words
      if (word.length < 3) return;
      
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    // Sort by frequency and return top N
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word, count]) => ({ word, count }));
  }
  
  // Get sentence statistics
  function getSentenceStats() {
    const content = AppState.get('editor.content') || '';
    
    if (!content.trim()) return {
      count: 0,
      avgLength: 0,
      shortest: 0,
      longest: 0
    };
    
    // Split into sentences (simple approach)
    const sentences = content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    if (sentences.length === 0) return {
      count: 0,
      avgLength: 0,
      shortest: 0,
      longest: 0
    };
    
    const lengths = sentences.map(s => countWords(s));
    const totalWords = lengths.reduce((sum, len) => sum + len, 0);
    
    return {
      count: sentences.length,
      avgLength: Math.round(totalWords / sentences.length),
      shortest: Math.min(...lengths),
      longest: Math.max(...lengths)
    };
  }
  
  // Public API
  return {
    init,
    update,
    getStats,
    exportStats,
    getWordFrequency,
    getSentenceStats,
    countWords,
    countLines,
    countCharacters
  };
})();