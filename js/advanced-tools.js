// js/advanced-tools.js - Advanced Tools Module

const AdvancedTools = {
  init() {
    this.bindEvents();
  },
  
  // Format JSON
  formatJSON() {
    Transformations.transformText(text => {
      try {
        const parsed = JSON.parse(text);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        throw new Error('Invalid JSON: ' + e.message);
      }
    }, 'Format JSON');
  },
  
  // Minify JSON
  minifyJSON() {
    Transformations.transformText(text => {
      try {
        const parsed = JSON.parse(text);
        return JSON.stringify(parsed);
      } catch (e) {
        throw new Error('Invalid JSON: ' + e.message);
      }
    }, 'Minify JSON');
  },
  
  // Convert CSV to table
  csvToTable() {
    const text = State.elements.notepad.val();
    const lines = Utils.getLines(text);
    
    if (lines.length === 0) {
      UIComponents.showToast('No CSV data found', 'warning');
      return;
    }
    
    // Detect separator
    const separator = text.includes('\t') ? '\t' : ',';
    const rows = lines.map(line => line.split(separator));
    
    // Create markdown table
    let table = '| ' + rows[0].join(' | ') + ' |\n';
    table += '| ' + rows[0].map(() => '---').join(' | ') + ' |\n';
    
    for (let i = 1; i < rows.length; i++) {
      table += '| ' + rows[i].join(' | ') + ' |\n';
    }
    
    Transformations.transformText(() => table, 'CSV to Table');
  },
  
  // Generate Lorem Ipsum
  generateLoremIpsum() {
    const paragraphs = [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
      'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.',
      'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores.',
      'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.',
      'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?'
    ];
    
    const numParagraphs = prompt('How many paragraphs? (1-8)', '3');
    if (!numParagraphs || isNaN(numParagraphs)) return;
    
    const count = Math.min(Math.max(1, parseInt(numParagraphs)), 8);
    const lorem = paragraphs.slice(0, count).join('\n\n');
    
    Transformations.transformText(() => lorem, 'Generate Lorem Ipsum');
  },
  
  // Word frequency analysis
  showWordFrequency() {
    const text = State.elements.notepad.val();
    const words = text.toLowerCase().match(/\b[\w']+\b/g) || [];
    const frequency = {};
    
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    const sorted = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50);
    
    let result = 'Word Frequency Analysis\n';
    result += '======================\n\n';
    result += 'Total words: ' + words.length + '\n';
    result += 'Unique words: ' + Object.keys(frequency).length + '\n\n';
    result += 'Top 50 most frequent words:\n\n';
    
    sorted.forEach(([word, count], index) => {
      const percentage = ((count / words.length) * 100).toFixed(2);
      result += `${index + 1}. ${word}: ${count} (${percentage}%)\n`;
    });
    
    Transformations.transformText(() => result, 'Word Frequency Analysis');
  },
  
  // Show markdown preview
  showMarkdownPreview() {
    if (State.currentMode !== 'markdown') {
      Editor.switchMode('markdown');
    } else {
      Editor.updateMarkdownPreview();
    }
  },
  
  // Text diff tool
  showTextDiff() {
    const currentText = State.elements.notepad.val();
    
    const diffContainer = $(`
      <div class="diff-modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                  background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; 
                  justify-content: center; z-index: 1100;">
        <div style="background: var(--bg-primary); border-radius: var(--radius-lg); 
                    box-shadow: var(--shadow-xl); max-width: 80%; max-height: 80vh; 
                    width: 800px; display: flex; flex-direction: column;">
          <div style="padding: 20px; border-bottom: 1px solid var(--border-color);">
            <h3 style="margin: 0;">Text Diff Tool</h3>
          </div>
          <div style="flex: 1; padding: 20px; overflow: auto;">
            <p>Paste text to compare:</p>
            <textarea id="compareText" style="width: 100%; height: 200px; 
                      border: 1px solid var(--border-color); border-radius: var(--radius-sm); 
                      padding: 10px; font-family: var(--font-mono); margin-bottom: 15px;"></textarea>
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
              <button id="performDiff" style="padding: 8px 16px; background: var(--primary-color); 
                      color: white; border: none; border-radius: var(--radius-sm);">Compare</button>
              <button id="closeDiff" style="padding: 8px 16px;">Close</button>
            </div>
            <div id="diffResult" style="border: 1px solid var(--border-color); 
                        border-radius: var(--radius-sm); padding: 15px; 
                        background: var(--bg-secondary); min-height: 200px; 
                        overflow: auto; font-family: var(--font-mono);"></div>
          </div>
        </div>
      </div>
    `);
    
    $('body').append(diffContainer);
    
    $('#performDiff').click(() => {
      const compareText = $('#compareText').val();
      const diff = this.computeDiff(currentText, compareText);
      $('#diffResult').html(diff);
    });
    
    $('#closeDiff').click(() => diffContainer.remove());
    
    // Close on outside click
    diffContainer.click((e) => {
      if ($(e.target).is('.diff-modal')) {
        diffContainer.remove();
      }
    });
  },
  
  // Compute text diff
  computeDiff(text1, text2) {
    const lines1 = Utils.getLines(text1);
    const lines2 = Utils.getLines(text2);
    let result = '<pre style="margin: 0; white-space: pre-wrap;">';
    
    const maxLines = Math.max(lines1.length, lines2.length);
    
    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';
      
      if (line1 === line2) {
        result += `  ${this.escapeHtml(line1)}\n`;
      } else {
        if (line1) {
          result += `<span style="color: #e74c3c; background: rgba(231, 76, 60, 0.1);">- ${this.escapeHtml(line1)}</span>\n`;
        }
        if (line2) {
          result += `<span style="color: #27ae60; background: rgba(39, 174, 96, 0.1);">+ ${this.escapeHtml(line2)}</span>\n`;
        }
      }
    }
    
    result += '</pre>';
    return result;
  },
  
  // Format code (for code mode)
  formatCode() {
    const text = State.elements.notepad.val();
    
    // Try to detect language
    if (text.includes('function') || text.includes('const') || text.includes('let')) {
      // JavaScript formatting
      try {
        // Simple formatting - add proper indentation
        const formatted = this.formatJavaScript(text);
        State.elements.notepad.val(formatted);
        Utils.saveState('format code');
        UIComponents.showToast('Code formatted', 'success');
      } catch (e) {
        UIComponents.showToast('Unable to format code', 'error');
      }
    } else {
      UIComponents.showToast('Code language not detected', 'info');
    }
  },
  
  // Simple JavaScript formatter
  formatJavaScript(code) {
    let formatted = '';
    let indentLevel = 0;
    const lines = code.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Decrease indent for closing braces
      if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      // Add indentation
      if (trimmed) {
        formatted += '  '.repeat(indentLevel) + trimmed + '\n';
      } else {
        formatted += '\n';
      }
      
      // Increase indent for opening braces
      if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
        indentLevel++;
      }
    });
    
    return formatted.trim();
  },
  
  // Escape HTML
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  },
  
  // Bind events
  bindEvents() {
    $('#jsonFormatButton').click(() => this.formatJSON());
    $('#jsonMinifyButton').click(() => this.minifyJSON());
    $('#csvToTableButton').click(() => this.csvToTable());
    $('#generateLoremButton').click(() => this.generateLoremIpsum());
    $('#wordFrequencyButton').click(() => this.showWordFrequency());
    $('#markdownPreviewButton').click(() => this.showMarkdownPreview());
    $('#textDiffButton').click(() => this.showTextDiff());
  }
};

// Export for use in other modules
window.AdvancedTools = AdvancedTools;