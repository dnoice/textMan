// ============================================================================
// Modal Manager
// ============================================================================

const Modal = {
    backdrop: null,
    modal: null,
    titleEl: null,
    bodyEl: null,
    footerEl: null,

    /**
     * Initialize modal
     */
    init() {
        this.backdrop = document.getElementById('modalBackdrop');
        this.modal = document.getElementById('modal');
        this.titleEl = document.getElementById('modalTitle');
        this.bodyEl = document.getElementById('modalBody');
        this.footerEl = document.getElementById('modalFooter');

        // Close button
        document.getElementById('modalClose').addEventListener('click', () => this.close());

        // Click outside to close
        this.backdrop.addEventListener('click', (e) => {
            if (e.target === this.backdrop) {
                this.close();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.backdrop.hasAttribute('hidden')) {
                this.close();
            }
        });
    },

    /**
     * Open modal with content
     */
    open(title, bodyHTML, footerHTML = '') {
        this.titleEl.innerHTML = title;
        this.bodyEl.innerHTML = bodyHTML;
        this.footerEl.innerHTML = footerHTML;
        this.backdrop.removeAttribute('hidden');
    },

    /**
     * Close modal
     */
    close() {
        this.backdrop.setAttribute('hidden', '');
    }
};

// ============================================================================
// Editor Manager
// ============================================================================

const Editor = {
    textarea: null,
    autoSaveTimer: null,

    /**
     * Initialize editor
     */
    init() {
        this.textarea = document.getElementById('mainEditor');

        // Load saved content
        const savedContent = Storage.load('editorContent', '');
        this.textarea.value = savedContent;
        APP_STATE.editor.content = savedContent;

        // Add to history
        if (savedContent) {
            this.addToHistory(savedContent);
        }

        // Event listeners
        this.textarea.addEventListener('input', () => this.handleInput());
        this.textarea.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Load settings
        const settings = Storage.load('settings', APP_STATE.settings);
        APP_STATE.settings = settings;
        this.applySettings();

        // Initial stats update
        this.updateStats();
    },

    /**
     * Handle input changes
     */
    handleInput() {
        APP_STATE.editor.content = this.textarea.value;
        this.updateStats();

        if (APP_STATE.settings.autoSave) {
            this.scheduleAutoSave();
        }
    },

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboard(e) {
        // Ctrl/Cmd + S - Save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.saveContent();
        }

        // Ctrl/Cmd + Z - Undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.undo();
        }

        // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z - Redo
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            this.redo();
        }

        // Ctrl/Cmd + F - Search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            SearchManager.open();
        }
    },

    /**
     * Update text statistics
     */
    updateStats() {
        const text = this.textarea.value;
        const chars = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const lines = text ? text.split('\n').length : 0;
        const readTime = Math.ceil(words / 200); // Average reading speed

        document.getElementById('charCount').innerHTML = `<i class="fas fa-text-width"></i> ${chars}`;
        document.getElementById('wordCount').innerHTML = `<i class="fas fa-font"></i> ${words}`;
        document.getElementById('lineCount').innerHTML = `<i class="fas fa-list"></i> ${lines}`;
        document.getElementById('readTime').innerHTML = `<i class="fas fa-clock"></i> ${readTime}m`;

        // Update analytics panel
        Analytics.updateMini({ chars, words, lines, readTime });
    },

    /**
     * Schedule auto-save
     */
    scheduleAutoSave() {
        clearTimeout(this.autoSaveTimer);
        this.autoSaveTimer = setTimeout(() => {
            this.saveContent(true);
        }, APP_CONFIG.autoSaveDelay);
    },

    /**
     * Save content
     */
    saveContent(isAutoSave = false) {
        const content = this.textarea.value;
        Storage.save('editorContent', content);

        if (!isAutoSave) {
            this.addToHistory(content);
            Toast.show('Saved', 'Your text has been saved', 'success');
        }

        this.setStatus(isAutoSave ? 'Auto-saved' : 'Saved');
    },

    /**
     * Add to undo history
     */
    addToHistory(content) {
        // Remove any entries after current index
        APP_STATE.editor.history = APP_STATE.editor.history.slice(0, APP_STATE.editor.historyIndex + 1);

        // Add new entry
        APP_STATE.editor.history.push(content);

        // Limit history size
        if (APP_STATE.editor.history.length > APP_STATE.editor.maxHistory) {
            APP_STATE.editor.history.shift();
        } else {
            APP_STATE.editor.historyIndex++;
        }
    },

    /**
     * Undo
     */
    undo() {
        if (APP_STATE.editor.historyIndex > 0) {
            APP_STATE.editor.historyIndex--;
            this.textarea.value = APP_STATE.editor.history[APP_STATE.editor.historyIndex];
            APP_STATE.editor.content = this.textarea.value;
            this.updateStats();
            this.setStatus('Undone');
        }
    },

    /**
     * Redo
     */
    redo() {
        if (APP_STATE.editor.historyIndex < APP_STATE.editor.history.length - 1) {
            APP_STATE.editor.historyIndex++;
            this.textarea.value = APP_STATE.editor.history[APP_STATE.editor.historyIndex];
            APP_STATE.editor.content = this.textarea.value;
            this.updateStats();
            this.setStatus('Redone');
        }
    },

    /**
     * Clear editor
     */
    clear() {
        Modal.open(
            '<i class="fas fa-exclamation-triangle"></i> Clear Confirmation',
            '<p>Are you sure you want to clear all text? This action cannot be undone.</p>',
            `
                <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
                <button class="btn btn-danger" onclick="Editor.confirmClear()">Clear All</button>
            `
        );
    },

    /**
     * Confirm clear
     */
    confirmClear() {
        this.textarea.value = '';
        APP_STATE.editor.content = '';
        this.addToHistory('');
        this.updateStats();
        Storage.save('editorContent', '');
        Modal.close();
        Toast.show('Cleared', 'Editor has been cleared', 'success');
    },

    /**
     * Set status message
     */
    setStatus(message, duration = 2000) {
        const statusEl = document.getElementById('statusMessage');
        statusEl.textContent = message;
        setTimeout(() => {
            statusEl.textContent = 'Ready';
        }, duration);
    },

    /**
     * Apply settings
     */
    applySettings() {
        this.textarea.style.fontSize = `${APP_STATE.settings.fontSize}px`;
        this.textarea.style.lineHeight = APP_STATE.settings.lineHeight;
    },

    /**
     * Get selected text
     */
    getSelection() {
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        return {
            text: this.textarea.value.substring(start, end),
            start,
            end
        };
    },

    /**
     * Replace selected text
     */
    replaceSelection(newText) {
        const { start, end } = this.getSelection();
        const before = this.textarea.value.substring(0, start);
        const after = this.textarea.value.substring(end);
        this.textarea.value = before + newText + after;
        this.textarea.setSelectionRange(start, start + newText.length);
        this.handleInput();
    }
};

// ============================================================================
// Text Manipulation Tools
// ============================================================================

const TextTools = {
    /**
     * Transform text to uppercase
     */
    toUpperCase() {
        const selection = Editor.getSelection();
        if (selection.text) {
            Editor.replaceSelection(selection.text.toUpperCase());
        } else {
            Editor.textarea.value = Editor.textarea.value.toUpperCase();
            Editor.handleInput();
        }
        Toast.show('Transformed', 'Text converted to uppercase', 'success');
    },

    /**
     * Transform text to lowercase
     */
    toLowerCase() {
        const selection = Editor.getSelection();
        if (selection.text) {
            Editor.replaceSelection(selection.text.toLowerCase());
        } else {
            Editor.textarea.value = Editor.textarea.value.toLowerCase();
            Editor.handleInput();
        }
        Toast.show('Transformed', 'Text converted to lowercase', 'success');
    },

    /**
     * Transform to title case
     */
    toTitleCase() {
        const titleCase = (str) => {
            return str.replace(/\w\S*/g, (txt) => {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        };

        const selection = Editor.getSelection();
        if (selection.text) {
            Editor.replaceSelection(titleCase(selection.text));
        } else {
            Editor.textarea.value = titleCase(Editor.textarea.value);
            Editor.handleInput();
        }
        Toast.show('Transformed', 'Text converted to title case', 'success');
    },

    /**
     * Transform to sentence case
     */
    toSentenceCase() {
        const sentenceCase = (str) => {
            return str.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, (c) => c.toUpperCase());
        };

        const selection = Editor.getSelection();
        if (selection.text) {
            Editor.replaceSelection(sentenceCase(selection.text));
        } else {
            Editor.textarea.value = sentenceCase(Editor.textarea.value);
            Editor.handleInput();
        }
        Toast.show('Transformed', 'Text converted to sentence case', 'success');
    },

    /**
     * Reverse text
     */
    reverse() {
        const selection = Editor.getSelection();
        if (selection.text) {
            Editor.replaceSelection(selection.text.split('').reverse().join(''));
        } else {
            Editor.textarea.value = Editor.textarea.value.split('').reverse().join('');
            Editor.handleInput();
        }
        Toast.show('Transformed', 'Text has been reversed', 'success');
    },

    /**
     * Remove extra spaces
     */
    removeExtraSpaces() {
        Editor.textarea.value = Editor.textarea.value.replace(/\s+/g, ' ').trim();
        Editor.handleInput();
        Toast.show('Cleaned', 'Extra spaces removed', 'success');
    },

    /**
     * Remove line breaks
     */
    removeLineBreaks() {
        Editor.textarea.value = Editor.textarea.value.replace(/\n/g, ' ').replace(/\s+/g, ' ');
        Editor.handleInput();
        Toast.show('Cleaned', 'Line breaks removed', 'success');
    },

    /**
     * Add line numbers
     */
    addLineNumbers() {
        const lines = Editor.textarea.value.split('\n');
        const numbered = lines.map((line, i) => `${i + 1}. ${line}`).join('\n');
        Editor.textarea.value = numbered;
        Editor.handleInput();
        Toast.show('Formatted', 'Line numbers added', 'success');
    },

    /**
     * Sort lines alphabetically
     */
    sortLines() {
        const lines = Editor.textarea.value.split('\n');
        Editor.textarea.value = lines.sort().join('\n');
        Editor.handleInput();
        Toast.show('Sorted', 'Lines sorted alphabetically', 'success');
    },

    /**
     * Remove duplicate lines
     */
    removeDuplicates() {
        const lines = Editor.textarea.value.split('\n');
        const unique = [...new Set(lines)];
        Editor.textarea.value = unique.join('\n');
        Editor.handleInput();
        Toast.show('Cleaned', 'Duplicate lines removed', 'success');
    },

    /**
     * Encode to Base64
     */
    encodeBase64() {
        try {
            const encoded = btoa(Editor.textarea.value);
            Editor.textarea.value = encoded;
            Editor.handleInput();
            Toast.show('Encoded', 'Text encoded to Base64', 'success');
        } catch (error) {
            Toast.show('Error', 'Failed to encode to Base64', 'error');
        }
    },

    /**
     * Decode from Base64
     */
    decodeBase64() {
        try {
            const decoded = atob(Editor.textarea.value);
            Editor.textarea.value = decoded;
            Editor.handleInput();
            Toast.show('Decoded', 'Text decoded from Base64', 'success');
        } catch (error) {
            Toast.show('Error', 'Failed to decode from Base64', 'error');
        }
    },

    /**
     * URL Encode
     */
    encodeURL() {
        Editor.textarea.value = encodeURIComponent(Editor.textarea.value);
        Editor.handleInput();
        Toast.show('Encoded', 'Text URL encoded', 'success');
    },

    /**
     * URL Decode
     */
    decodeURL() {
        try {
            Editor.textarea.value = decodeURIComponent(Editor.textarea.value);
            Editor.handleInput();
            Toast.show('Decoded', 'Text URL decoded', 'success');
        } catch (error) {
            Toast.show('Error', 'Failed to decode URL', 'error');
        }
    },

    /**
     * HTML Encode
     */
    encodeHTML() {
        const htmlEncode = (str) => {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        };

        Editor.textarea.value = htmlEncode(Editor.textarea.value);
        Editor.handleInput();
        Toast.show('Encoded', 'Text HTML encoded', 'success');
    },

    /**
     * HTML Decode
     */
    decodeHTML() {
        const htmlDecode = (str) => {
            const div = document.createElement('div');
            div.innerHTML = str;
            return div.textContent;
        };

        Editor.textarea.value = htmlDecode(Editor.textarea.value);
        Editor.handleInput();
        Toast.show('Decoded', 'Text HTML decoded', 'success');
    },

    /**
     * Transform to camelCase
     */
    toCamelCase() {
        const camelCase = (str) => {
            return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
                if (+match === 0) return '';
                return index === 0 ? match.toLowerCase() : match.toUpperCase();
            });
        };

        const selection = Editor.getSelection();
        if (selection.text) {
            Editor.replaceSelection(camelCase(selection.text));
        } else {
            Editor.textarea.value = camelCase(Editor.textarea.value);
            Editor.handleInput();
        }
        Toast.show('Transformed', 'Text converted to camelCase', 'success');
    },

    /**
     * Transform to snake_case
     */
    toSnakeCase() {
        const snakeCase = (str) => {
            return str.replace(/\W+/g, ' ')
                .split(/ |\B(?=[A-Z])/)
                .map(word => word.toLowerCase())
                .join('_');
        };

        const selection = Editor.getSelection();
        if (selection.text) {
            Editor.replaceSelection(snakeCase(selection.text));
        } else {
            Editor.textarea.value = snakeCase(Editor.textarea.value);
            Editor.handleInput();
        }
        Toast.show('Transformed', 'Text converted to snake_case', 'success');
    },

    /**
     * Transform to kebab-case
     */
    toKebabCase() {
        const kebabCase = (str) => {
            return str.replace(/\W+/g, ' ')
                .split(/ |\B(?=[A-Z])/)
                .map(word => word.toLowerCase())
                .join('-');
        };

        const selection = Editor.getSelection();
        if (selection.text) {
            Editor.replaceSelection(kebabCase(selection.text));
        } else {
            Editor.textarea.value = kebabCase(Editor.textarea.value);
            Editor.handleInput();
        }
        Toast.show('Transformed', 'Text converted to kebab-case', 'success');
    },

    /**
     * Trim whitespace
     */
    trim() {
        const lines = Editor.textarea.value.split('\n');
        Editor.textarea.value = lines.map(line => line.trim()).join('\n');
        Editor.handleInput();
        Toast.show('Cleaned', 'Whitespace trimmed', 'success');
    },

    /**
     * Remove numbers
     */
    removeNumbers() {
        Editor.textarea.value = Editor.textarea.value.replace(/\d/g, '');
        Editor.handleInput();
        Toast.show('Cleaned', 'Numbers removed', 'success');
    },

    /**
     * Remove punctuation
     */
    removePunctuation() {
        Editor.textarea.value = Editor.textarea.value.replace(/[^\w\s]|_/g, '');
        Editor.handleInput();
        Toast.show('Cleaned', 'Punctuation removed', 'success');
    },

    /**
     * Shuffle lines
     */
    shuffleLines() {
        const lines = Editor.textarea.value.split('\n');
        for (let i = lines.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [lines[i], lines[j]] = [lines[j], lines[i]];
        }
        Editor.textarea.value = lines.join('\n');
        Editor.handleInput();
        Toast.show('Shuffled', 'Lines shuffled randomly', 'success');
    },

    /**
     * Word wrap at specified column
     */
    wordWrap(columns = 80) {
        const lines = Editor.textarea.value.split('\n');
        const wrapped = [];

        lines.forEach(line => {
            if (line.length <= columns) {
                wrapped.push(line);
            } else {
                const words = line.split(' ');
                let currentLine = '';

                words.forEach(word => {
                    if ((currentLine + word).length <= columns) {
                        currentLine += (currentLine ? ' ' : '') + word;
                    } else {
                        if (currentLine) wrapped.push(currentLine);
                        currentLine = word;
                    }
                });

                if (currentLine) wrapped.push(currentLine);
            }
        });

        Editor.textarea.value = wrapped.join('\n');
        Editor.handleInput();
        Toast.show('Formatted', `Text wrapped at ${columns} columns`, 'success');
    },

    /**
     * Indent text
     */
    indent(spaces = 4) {
        const lines = Editor.textarea.value.split('\n');
        const indent = ' '.repeat(spaces);
        Editor.textarea.value = lines.map(line => indent + line).join('\n');
        Editor.handleInput();
        Toast.show('Formatted', `Text indented by ${spaces} spaces`, 'success');
    }
};

// ============================================================================
// Analytics Manager
// ============================================================================

const Analytics = {
    /**
     * Update mini analytics panel
     */
    updateMini(stats) {
        const miniPanel = document.getElementById('analyticsMini');
        if (miniPanel) {
            miniPanel.innerHTML = `
                <div class="analytics-row">
                    <span class="analytics-label">Characters</span>
                    <span class="analytics-value">${stats.chars}</span>
                </div>
                <div class="analytics-row">
                    <span class="analytics-label">Words</span>
                    <span class="analytics-value">${stats.words}</span>
                </div>
                <div class="analytics-row">
                    <span class="analytics-label">Lines</span>
                    <span class="analytics-value">${stats.lines}</span>
                </div>
            `;
        }
    },

    /**
     * Show full analytics in modal
     */
    showFull() {
        const text = Editor.textarea.value;
        const chars = text.length;
        const charsNoSpaces = text.replace(/\s/g, '').length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const lines = text ? text.split('\n').length : 0;
        const paragraphs = text.trim() ? text.trim().split(/\n\n+/).length : 0;
        const sentences = text.trim() ? text.split(/[.!?]+/).filter(s => s.trim()).length : 0;
        const readTime = Math.ceil(words / 200);
        const speakTime = Math.ceil(words / 150);

        // Character frequency
        const charFreq = {};
        text.split('').forEach(char => {
            if (char !== ' ' && char !== '\n') {
                charFreq[char] = (charFreq[char] || 0) + 1;
            }
        });
        const topChars = Object.entries(charFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([char, count]) => `<strong>${char}</strong>: ${count}`)
            .join(', ');

        // Word frequency
        const wordFreq = {};
        text.toLowerCase().match(/\b\w+\b/g)?.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });
        const topWords = Object.entries(wordFreq || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([word, count]) => `<strong>${word}</strong>: ${count}`)
            .join(', ');

        Modal.open(
            '<i class="fas fa-chart-line"></i> Full Text Analysis',
            `
                <div class="analytics-full">
                    <h4>Basic Statistics</h4>
                    <div class="analytics-row">
                        <span class="analytics-label">Total Characters</span>
                        <span class="analytics-value">${chars.toLocaleString()}</span>
                    </div>
                    <div class="analytics-row">
                        <span class="analytics-label">Characters (no spaces)</span>
                        <span class="analytics-value">${charsNoSpaces.toLocaleString()}</span>
                    </div>
                    <div class="analytics-row">
                        <span class="analytics-label">Words</span>
                        <span class="analytics-value">${words.toLocaleString()}</span>
                    </div>
                    <div class="analytics-row">
                        <span class="analytics-label">Sentences</span>
                        <span class="analytics-value">${sentences.toLocaleString()}</span>
                    </div>
                    <div class="analytics-row">
                        <span class="analytics-label">Paragraphs</span>
                        <span class="analytics-value">${paragraphs.toLocaleString()}</span>
                    </div>
                    <div class="analytics-row">
                        <span class="analytics-label">Lines</span>
                        <span class="analytics-value">${lines.toLocaleString()}</span>
                    </div>

                    <h4 class="mt-3">Reading Time</h4>
                    <div class="analytics-row">
                        <span class="analytics-label">Read Time (200 WPM)</span>
                        <span class="analytics-value">${readTime} min</span>
                    </div>
                    <div class="analytics-row">
                        <span class="analytics-label">Speak Time (150 WPM)</span>
                        <span class="analytics-value">${speakTime} min</span>
                    </div>

                    <h4 class="mt-3">Frequency Analysis</h4>
                    <div class="analytics-row">
                        <span class="analytics-label">Top Characters</span>
                        <span class="analytics-value" style="font-size: 0.75rem;">${topChars || 'N/A'}</span>
                    </div>
                    <div class="analytics-row">
                        <span class="analytics-label">Top Words</span>
                        <span class="analytics-value" style="font-size: 0.75rem;">${topWords || 'N/A'}</span>
                    </div>
                </div>
            `,
            '<button class="btn btn-primary" onclick="Modal.close()">Close</button>'
        );
    }
};

// ============================================================================
// Search & Replace Manager
// ============================================================================

const SearchManager = {
    overlay: null,
    findInput: null,
    replaceInput: null,

    /**
     * Initialize search manager
     */
    init() {
        this.overlay = document.getElementById('searchOverlay');
        this.findInput = document.getElementById('findInput');
        this.replaceInput = document.getElementById('replaceInput');

        // Event listeners
        document.getElementById('searchBtn').addEventListener('click', () => this.open());
        document.getElementById('searchClose').addEventListener('click', () => this.close());
        document.getElementById('findPrevBtn').addEventListener('click', () => this.findPrev());
        document.getElementById('findNextBtn').addEventListener('click', () => this.findNext());
        document.getElementById('replaceBtn').addEventListener('click', () => this.replace());
        document.getElementById('replaceAllBtn').addEventListener('click', () => this.replaceAll());

        // Close on backdrop click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });

        // ESC to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.overlay.hasAttribute('hidden')) {
                this.close();
            }
        });
    },

    /**
     * Open search overlay
     */
    open() {
        this.overlay.removeAttribute('hidden');
        this.findInput.focus();
    },

    /**
     * Close search overlay
     */
    close() {
        this.overlay.setAttribute('hidden', '');
    },

    /**
     * Find next occurrence
     */
    findNext() {
        const searchText = this.findInput.value;
        if (!searchText) return;

        const text = Editor.textarea.value;
        const caseSensitive = document.getElementById('caseSensitive').checked;
        const useRegex = document.getElementById('useRegex').checked;

        let index;
        if (useRegex) {
            try {
                const regex = new RegExp(searchText, caseSensitive ? 'g' : 'gi');
                const match = regex.exec(text.substring(Editor.textarea.selectionEnd));
                index = match ? Editor.textarea.selectionEnd + match.index : -1;
            } catch (error) {
                Toast.show('Error', 'Invalid regular expression', 'error');
                return;
            }
        } else {
            const searchIn = caseSensitive ? text : text.toLowerCase();
            const searchFor = caseSensitive ? searchText : searchText.toLowerCase();
            index = searchIn.indexOf(searchFor, Editor.textarea.selectionEnd);
            if (index === -1) {
                index = searchIn.indexOf(searchFor, 0);
            }
        }

        if (index !== -1) {
            Editor.textarea.setSelectionRange(index, index + searchText.length);
            Editor.textarea.focus();
        } else {
            Toast.show('Not Found', 'No matches found', 'warning');
        }
    },

    /**
     * Find previous occurrence
     */
    findPrev() {
        const searchText = this.findInput.value;
        if (!searchText) return;

        const text = Editor.textarea.value;
        const caseSensitive = document.getElementById('caseSensitive').checked;
        const searchIn = caseSensitive ? text : text.toLowerCase();
        const searchFor = caseSensitive ? searchText : searchText.toLowerCase();

        // Search backwards from current position
        const currentPos = Editor.textarea.selectionStart;
        let index = searchIn.lastIndexOf(searchFor, currentPos - 1);

        // If not found before cursor, wrap to end
        if (index === -1) {
            index = searchIn.lastIndexOf(searchFor);
        }

        if (index !== -1) {
            Editor.textarea.setSelectionRange(index, index + searchText.length);
            Editor.textarea.focus();
        } else {
            Toast.show('Not Found', 'No matches found', 'warning');
        }
    },

    /**
     * Replace current selection
     */
    replace() {
        const replaceText = this.replaceInput.value;
        const selection = Editor.getSelection();

        if (selection.text) {
            Editor.replaceSelection(replaceText);
            Toast.show('Replaced', 'Text replaced', 'success');
        }
    },

    /**
     * Replace all occurrences
     */
    replaceAll() {
        const searchText = this.findInput.value;
        const replaceText = this.replaceInput.value;

        if (!searchText) return;

        const caseSensitive = document.getElementById('caseSensitive').checked;
        const useRegex = document.getElementById('useRegex').checked;

        let newText;
        let count = 0;

        if (useRegex) {
            try {
                const regex = new RegExp(searchText, caseSensitive ? 'g' : 'gi');
                newText = Editor.textarea.value.replace(regex, (match) => {
                    count++;
                    return replaceText;
                });
            } catch (error) {
                Toast.show('Error', 'Invalid regular expression', 'error');
                return;
            }
        } else {
            const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitive ? 'g' : 'gi');
            newText = Editor.textarea.value.replace(regex, (match) => {
                count++;
                return replaceText;
            });
        }

        Editor.textarea.value = newText;
        Editor.handleInput();
        Toast.show('Replaced', `${count} occurrence(s) replaced`, 'success');
    }
};

// ============================================================================
// History Manager
// ============================================================================

const HistoryManager = {
    /**
     * Add to recent history
     */
    add(text) {
        const timestamp = new Date().toISOString();
        const preview = text.substring(0, 100);

        APP_STATE.recentHistory.unshift({
            id: Date.now(),
            text,
            preview,
            timestamp
        });

        // Limit history size
        if (APP_STATE.recentHistory.length > APP_CONFIG.maxHistory) {
            APP_STATE.recentHistory.pop();
        }

        Storage.save('history', APP_STATE.recentHistory);
        this.render();
    },

    /**
     * Load from history
     */
    load(id) {
        const item = APP_STATE.recentHistory.find(h => h.id === id);
        if (item) {
            Editor.textarea.value = item.text;
            Editor.handleInput();
            Toast.show('Loaded', 'History item loaded', 'success');
        }
    },

    /**
     * Delete history item
     */
    delete(id) {
        APP_STATE.recentHistory = APP_STATE.recentHistory.filter(h => h.id !== id);
        Storage.save('history', APP_STATE.recentHistory);
        this.render();
        Toast.show('Deleted', 'History item deleted', 'success');
    },

    /**
     * Clear all history
     */
    clearAll() {
        APP_STATE.recentHistory = [];
        Storage.save('history', []);
        this.render();
        Toast.show('Cleared', 'All history cleared', 'success');
    },

    /**
     * Render history list
     */
    render() {
        const container = document.getElementById('historyContent');

        if (APP_STATE.recentHistory.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No history yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = APP_STATE.recentHistory.map(item => `
            <div class="history-item">
                <div class="item-header">
                    <span class="item-time">${new Date(item.timestamp).toLocaleString()}</span>
                </div>
                <div class="item-preview">${item.preview}...</div>
                <div class="item-actions">
                    <button class="item-btn" onclick="HistoryManager.load(${item.id})">
                        <i class="fas fa-download"></i> Load
                    </button>
                    <button class="item-btn" onclick="HistoryManager.delete(${item.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Initialize from storage
     */
    init() {
        APP_STATE.recentHistory = Storage.load('history', []);
        this.render();
    }
};

// ============================================================================
// Saved Texts Manager
// ============================================================================

const SavedTexts = {
    /**
     * Save current text
     */
    save() {
        Modal.open(
            '<i class="fas fa-save"></i> Save Text',
            `
                <div class="form-group">
                    <label class="form-label">Name</label>
                    <input type="text" id="saveTextName" class="form-input" placeholder="Enter a name for this text">
                </div>
                <div class="form-group">
                    <label class="form-label">Tags (comma-separated)</label>
                    <input type="text" id="saveTextTags" class="form-input" placeholder="e.g., important, work, draft">
                </div>
            `,
            `
                <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
                <button class="btn btn-primary" onclick="SavedTexts.confirmSave()">Save</button>
            `
        );
    },

    /**
     * Confirm save
     */
    confirmSave() {
        const name = document.getElementById('saveTextName').value.trim();
        const tags = document.getElementById('saveTextTags').value.split(',').map(t => t.trim()).filter(t => t);

        if (!name) {
            Toast.show('Error', 'Please enter a name', 'error');
            return;
        }

        const savedItem = {
            id: Date.now(),
            name,
            tags,
            text: Editor.textarea.value,
            timestamp: new Date().toISOString()
        };

        APP_STATE.savedTexts.unshift(savedItem);

        if (APP_STATE.savedTexts.length > APP_CONFIG.maxSaved) {
            APP_STATE.savedTexts.pop();
        }

        Storage.save('savedTexts', APP_STATE.savedTexts);
        this.render();
        Modal.close();
        Toast.show('Saved', `"${name}" has been saved`, 'success');
    },

    /**
     * Load saved text
     */
    load(id) {
        const item = APP_STATE.savedTexts.find(s => s.id === id);
        if (item) {
            Editor.textarea.value = item.text;
            Editor.handleInput();
            Toast.show('Loaded', `"${item.name}" loaded`, 'success');
        }
    },

    /**
     * Delete saved text
     */
    delete(id) {
        APP_STATE.savedTexts = APP_STATE.savedTexts.filter(s => s.id !== id);
        Storage.save('savedTexts', APP_STATE.savedTexts);
        this.render();
        Toast.show('Deleted', 'Saved text deleted', 'success');
    },

    /**
     * Render saved texts
     */
    render() {
        const container = document.getElementById('savedContent');

        if (APP_STATE.savedTexts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bookmark"></i>
                    <p>No saved texts</p>
                </div>
            `;
            return;
        }

        container.innerHTML = APP_STATE.savedTexts.map(item => `
            <div class="saved-item">
                <div class="item-header">
                    <strong>${item.name}</strong>
                    <span class="item-time">${new Date(item.timestamp).toLocaleDateString()}</span>
                </div>
                ${item.tags.length > 0 ? `<div style="margin-bottom: 0.5rem;">${item.tags.map(tag => `<span style="background: var(--bg-secondary); padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; margin-right: 0.25rem;">${tag}</span>`).join('')}</div>` : ''}
                <div class="item-actions">
                    <button class="item-btn" onclick="SavedTexts.load(${item.id})">
                        <i class="fas fa-download"></i> Load
                    </button>
                    <button class="item-btn" onclick="SavedTexts.delete(${item.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Initialize from storage
     */
    init() {
        APP_STATE.savedTexts = Storage.load('savedTexts', []);
        this.render();
    }
};

// ============================================================================
// Import/Export Manager
// ============================================================================

const ImportExport = {
    /**
     * Initialize
     */
    init() {
        // Import button
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        // File input handler
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.importFile(e.target.files[0]);
        });

        // Export options
        this.renderExportOptions();
    },

    /**
     * Import file
     */
    importFile(file) {
        if (!file) return;

        // Validate file size
        if (!Utils.validateFileSize(file)) {
            Toast.show(
                'File Too Large',
                `Maximum file size is ${Utils.formatBytes(APP_CONFIG.maxFileSize)}. Your file is ${Utils.formatBytes(file.size)}.`,
                'error'
            );
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                Editor.textarea.value = e.target.result;
                Editor.handleInput();
                Toast.show('Imported', `File "${Utils.escapeHTML(file.name)}" imported successfully`, 'success');
            } catch (error) {
                console.error('Import error:', error);
                Toast.show('Error', 'Failed to process imported file', 'error');
            }
        };
        reader.onerror = (error) => {
            console.error('FileReader error:', error);
            Toast.show('Error', 'Failed to read file', 'error');
        };
        reader.readAsText(file);
    },

    /**
     * Export as text file (or route to other formats)
     */
    exportText(format = 'txt') {
        switch (format) {
            case 'txt':
                const blob = new Blob([Editor.textarea.value], { type: 'text/plain' });
                this.download(blob, 'textman-export.txt');
                break;
            case 'md':
                const mdBlob = new Blob([Editor.textarea.value], { type: 'text/markdown' });
                this.download(mdBlob, 'textman-export.md');
                break;
            case 'json':
                this.exportJSON();
                break;
            case 'html':
                this.exportHTML();
                break;
            default:
                const defaultBlob = new Blob([Editor.textarea.value], { type: 'text/plain' });
                this.download(defaultBlob, 'textman-export.txt');
        }
    },

    /**
     * Export as JSON
     */
    exportJSON() {
        const data = {
            text: Editor.textarea.value,
            metadata: {
                exported: new Date().toISOString(),
                version: APP_CONFIG.version
            }
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.download(blob, 'textman-export.json');
    },

    /**
     * Export as HTML
     */
    exportHTML() {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>textMan Export</title>
    <style>
        body { font-family: monospace; padding: 2rem; max-width: 800px; margin: 0 auto; }
        pre { white-space: pre-wrap; word-wrap: break-word; }
    </style>
</head>
<body>
    <h1>textMan Export</h1>
    <p>Exported: ${new Date().toLocaleString()}</p>
    <hr>
    <pre>${Editor.textarea.value}</pre>
</body>
</html>
        `;
        const blob = new Blob([html], { type: 'text/html' });
        this.download(blob, 'textman-export.html');
    },

    /**
     * Download file
     */
    download(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Toast.show('Exported', `Downloaded as ${filename}`, 'success');
    },

    /**
     * Render export options
     */
    renderExportOptions() {
        const container = document.getElementById('exportOptions');
        container.innerHTML = `
            <button class="tool-btn" onclick="ImportExport.exportText()">
                <i class="fas fa-file-alt"></i> Export TXT
            </button>
            <button class="tool-btn" onclick="ImportExport.exportJSON()">
                <i class="fas fa-file-code"></i> Export JSON
            </button>
            <button class="tool-btn" onclick="ImportExport.exportHTML()">
                <i class="fas fa-file-code"></i> Export HTML
            </button>
        `;
    }
};

// ============================================================================
// Toolbar & Tools Initialization
// ============================================================================

const ToolsManager = {
    /**
     * Initialize all tool buttons
     */
    init() {
        // Toolbar buttons
        document.getElementById('undoBtn').addEventListener('click', () => Editor.undo());
        document.getElementById('redoBtn').addEventListener('click', () => Editor.redo());
        document.getElementById('copyBtn').addEventListener('click', () => this.copyText());
        document.getElementById('cutBtn').addEventListener('click', () => this.cutText());
        document.getElementById('pasteBtn').addEventListener('click', () => this.pasteText());
        document.getElementById('selectAllBtn').addEventListener('click', () => Editor.textarea.select());
        document.getElementById('saveBtn').addEventListener('click', () => SavedTexts.save());
        document.getElementById('downloadBtn').addEventListener('click', () => ImportExport.exportText());
        document.getElementById('printBtn').addEventListener('click', () => window.print());
        document.getElementById('clearBtn').addEventListener('click', () => Editor.clear());

        // Text formatting buttons (markdown style)
        document.getElementById('boldBtn')?.addEventListener('click', () => this.wrapSelection('**', '**'));
        document.getElementById('italicBtn')?.addEventListener('click', () => this.wrapSelection('*', '*'));
        document.getElementById('underlineBtn')?.addEventListener('click', () => this.wrapSelection('__', '__'));

        // Quick action buttons (header)
        document.getElementById('newTextBtn')?.addEventListener('click', () => CommandPalette.newText());
        document.getElementById('compareBtn')?.addEventListener('click', () => AdvancedTools.showDiff());

        // Header buttons
        document.getElementById('fullAnalyticsBtn')?.addEventListener('click', () => Analytics.showFull());
        document.getElementById('themeToggle').addEventListener('click', () => ThemeManager.toggle());
        document.getElementById('fullscreenBtn').addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());

        // Attach tool button listeners using event delegation
        this.attachToolListeners();

        // Initialize export buttons
        this.initExportButtons();
    },

    /**
     * Initialize export buttons
     */
    initExportButtons() {
        const exportButtons = document.querySelectorAll('.export-options .tool-btn[data-format]');
        exportButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.getAttribute('data-format');
                ImportExport.exportText(format);
            });
        });
    },

    /**
     * Copy text
     */
    copyText() {
        Editor.textarea.select();
        document.execCommand('copy');
        Toast.show('Copied', 'Text copied to clipboard', 'success');
    },

    /**
     * Cut text
     */
    cutText() {
        Editor.textarea.select();
        document.execCommand('cut');
        Editor.handleInput();
        Toast.show('Cut', 'Text cut to clipboard', 'success');
    },

    /**
     * Paste text
     */
    async pasteText() {
        try {
            const text = await navigator.clipboard.readText();
            Editor.replaceSelection(text);
            Toast.show('Pasted', 'Text pasted from clipboard', 'success');
        } catch (error) {
            console.error('Paste error:', error);
            Toast.show('Error', 'Failed to paste from clipboard', 'error');
        }
    },

    /**
     * Wrap selection with prefix and suffix (for markdown formatting)
     */
    wrapSelection(prefix, suffix) {
        const selection = Editor.getSelection();
        if (selection.text) {
            const wrapped = prefix + selection.text + suffix;
            Editor.replaceSelection(wrapped);
            Toast.show('Formatted', 'Text formatted successfully', 'success');
        } else {
            Toast.show('No Selection', 'Please select text to format', 'warning');
        }
    },

    /**
     * Toggle fullscreen
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            document.getElementById('fullscreenBtn').innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            document.exitFullscreen();
            document.getElementById('fullscreenBtn').innerHTML = '<i class="fas fa-expand"></i>';
        }
    },

    /**
     * Show settings modal
     */
    showSettings() {
        Modal.open(
            '<i class="fas fa-cog"></i> Settings',
            `
                <div class="form-group">
                    <label class="form-label">Auto-save</label>
                    <label class="checkbox-label">
                        <input type="checkbox" id="settingAutoSave" ${APP_STATE.settings.autoSave ? 'checked' : ''}>
                        <span>Enable auto-save</span>
                    </label>
                </div>
                <div class="form-group">
                    <label class="form-label">Font Size</label>
                    <input type="range" id="settingFontSize" min="12" max="24" value="${APP_STATE.settings.fontSize}"
                           class="form-input" oninput="this.nextElementSibling.textContent = this.value + 'px'">
                    <span>${APP_STATE.settings.fontSize}px</span>
                </div>
                <div class="form-group">
                    <label class="form-label">Line Height</label>
                    <input type="range" id="settingLineHeight" min="1.2" max="2.0" step="0.1" value="${APP_STATE.settings.lineHeight}"
                           class="form-input" oninput="this.nextElementSibling.textContent = this.value">
                    <span>${APP_STATE.settings.lineHeight}</span>
                </div>
            `,
            `
                <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
                <button class="btn btn-primary" onclick="ToolsManager.saveSettings()">Save Settings</button>
            `
        );
    },

    /**
     * Save settings
     */
    saveSettings() {
        APP_STATE.settings.autoSave = document.getElementById('settingAutoSave').checked;
        APP_STATE.settings.fontSize = parseInt(document.getElementById('settingFontSize').value);
        APP_STATE.settings.lineHeight = parseFloat(document.getElementById('settingLineHeight').value);

        Storage.save('settings', APP_STATE.settings);
        Editor.applySettings();
        Modal.close();
        Toast.show('Settings Saved', 'Your settings have been updated', 'success');
    },

    /**
     * Attach tool button event listeners using event delegation
     */
    attachToolListeners() {
        // Event delegation for all tool buttons
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.tool-btn[data-action]');
            if (!btn) return;

            const action = btn.getAttribute('data-action');
            this.handleToolAction(action);
        });
    },

    /**
     * Handle tool button actions
     */
    handleToolAction(action) {
        const actionMap = {
            // Transform tools
            'uppercase': () => TextTools.toUpperCase(),
            'lowercase': () => TextTools.toLowerCase(),
            'titlecase': () => TextTools.toTitleCase(),
            'sentencecase': () => TextTools.toSentenceCase(),
            'camelcase': () => TextTools.toCamelCase(),
            'snakecase': () => TextTools.toSnakeCase(),
            'kebabcase': () => TextTools.toKebabCase(),
            'reverse': () => TextTools.reverse(),

            // Format tools
            'trim': () => TextTools.trim(),
            'removeSpaces': () => TextTools.removeExtraSpaces(),
            'removeBreaks': () => TextTools.removeLineBreaks(),
            'removeNumbers': () => TextTools.removeNumbers(),
            'removePunctuation': () => TextTools.removePunctuation(),
            'removeDuplicates': () => TextTools.removeDuplicates(),
            'sortLines': () => TextTools.sortLines(),
            'shuffleLines': () => TextTools.shuffleLines(),

            // Encode/Decode tools
            'base64Encode': () => TextTools.encodeBase64(),
            'base64Decode': () => TextTools.decodeBase64(),
            'urlEncode': () => TextTools.encodeURL(),
            'urlDecode': () => TextTools.decodeURL(),
            'htmlEncode': () => TextTools.encodeHTML(),
            'htmlDecode': () => TextTools.decodeHTML(),

            // Advanced tools
            'diff': () => AdvancedTools.showDiff(),
            'hash': () => AdvancedTools.showHash(),
            'lorem': () => AdvancedTools.showLorem(),
            'regex': () => AdvancedTools.showRegex(),
            'wordwrap': () => TextTools.wordWrap(),
            'indent': () => TextTools.indent()
        };

        if (actionMap[action]) {
            actionMap[action]();
        } else {
            console.warn('Unknown tool action:', action);
        }
    }
}
};

// ============================================================================
// Sidebar Manager
// ============================================================================

const SidebarManager = {
    /**
     * Initialize sidebars
     */
    init() {
        // Sidebar header toggles
        document.querySelectorAll('.sidebar-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const sidebarType = btn.getAttribute('data-sidebar');
                const sidebar = document.getElementById(sidebarType === 'left' ? 'leftSidebar' : 'rightSidebar');
                this.toggleSidebar(sidebar);
            });
        });

        // Floating sidebar toggles
        document.querySelectorAll('.sidebar-float-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                const sidebarType = btn.getAttribute('data-sidebar');
                const sidebar = document.getElementById(sidebarType === 'left' ? 'leftSidebar' : 'rightSidebar');
                this.toggleSidebar(sidebar);
            });
        });

        // Panel section toggles (left sidebar) - with keyboard support
        document.querySelectorAll('.panel-header').forEach(header => {
            // Click handler
            header.addEventListener('click', () => {
                this.toggleSection(header);
            });

            // Keyboard handler (Enter and Space)
            header.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleSection(header);
                }
            });
        });

        // Tool section toggles (right sidebar) - with keyboard support
        document.querySelectorAll('.tool-section-title').forEach(title => {
            // Click handler
            title.addEventListener('click', () => {
                this.toggleSection(title);
            });

            // Keyboard handler (Enter and Space)
            title.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.toggleSection(title);
                }
            });
        });
    },

    /**
     * Toggle sidebar collapsed state
     */
    toggleSidebar(sidebar) {
        sidebar.classList.toggle('collapsed');

        // Save sidebar state to local storage
        const sidebarId = sidebar.id;
        const isCollapsed = sidebar.classList.contains('collapsed');
        Storage.save(`sidebar_${sidebarId}`, isCollapsed);
    },

    /**
     * Toggle section collapsed state (works for both panel-section and tool-section)
     */
    toggleSection(header) {
        const section = header.closest('.panel-section, .tool-section');
        if (!section) return;

        const isCollapsed = section.classList.contains('collapsed');
        section.classList.toggle('collapsed');

        // Update aria-expanded attribute
        header.setAttribute('aria-expanded', isCollapsed ? 'true' : 'false');

        // Save section state to local storage
        const sectionId = section.id;
        if (sectionId) {
            Storage.save(`section_${sectionId}`, !isCollapsed);
        }
    },

    /**
     * Restore saved sidebar and section states
     */
    restoreStates() {
        // Restore sidebar states
        ['leftSidebar', 'rightSidebar'].forEach(sidebarId => {
            const sidebar = document.getElementById(sidebarId);
            const savedState = Storage.load(`sidebar_${sidebarId}`);
            if (savedState === true) {
                sidebar.classList.add('collapsed');
            }
        });

        // Restore section states
        document.querySelectorAll('.panel-section, .tool-section').forEach(section => {
            const sectionId = section.id;
            if (sectionId) {
                const savedState = Storage.load(`section_${sectionId}`);
                if (savedState === true) {
                    section.classList.add('collapsed');
                    const header = section.querySelector('.panel-header, .tool-section-title');
                    if (header) {
                        header.setAttribute('aria-expanded', 'false');
                    }
                }
            }
        });
    }
};

// ============================================================================
// Context Menu
// ============================================================================

const ContextMenu = {
    menu: null,

    /**
     * Initialize context menu
     */
    init() {
        this.menu = document.getElementById('contextMenu');

        // Show context menu on right click
        Editor.textarea.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.show(e.clientX, e.clientY);
        });

        // Hide on click outside
        document.addEventListener('click', () => this.hide());

        // Menu item actions
        this.menu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.getAttribute('data-action');
                this.handleAction(action);
                this.hide();
            });
        });
    },

    /**
     * Show menu at position
     */
    show(x, y) {
        this.menu.style.left = `${x}px`;
        this.menu.style.top = `${y}px`;
        this.menu.removeAttribute('hidden');
    },

    /**
     * Hide menu
     */
    hide() {
        this.menu.setAttribute('hidden', '');
    },

    /**
     * Handle menu action
     */
    handleAction(action) {
        switch (action) {
            case 'cut':
                ToolsManager.cutText();
                break;
            case 'copy':
                ToolsManager.copyText();
                break;
            case 'paste':
                ToolsManager.pasteText();
                break;
            case 'selectAll':
                Editor.textarea.select();
                break;
        }
    }
};

// ============================================================================
// Loading Tips Manager
// ============================================================================

const LoadingTips = {
    tips: [
        'Pro tip: Press Ctrl+K to open the command palette',
        'Did you know? You can drag & drop files directly into the editor',
        'Keyboard shortcut: Ctrl+F for find and replace',
        'Use Ctrl+S to save your work instantly',
        'Pro tip: Right-click for quick actions menu',
        'Tip: All your data is saved locally in your browser',
        'Did you know? textMan works completely offline',
        'Keyboard shortcut: Ctrl+/ for keyboard shortcuts list',
        'Pro tip: Use the templates panel for quick text snippets',
        'Tip: Export your text in multiple formats (TXT, JSON, HTML)'
    ],

    /**
     * Show random tip
     */
    showRandomTip() {
        const tipEl = document.getElementById('loadingTip');
        if (tipEl) {
            const randomTip = this.tips[Math.floor(Math.random() * this.tips.length)];
            tipEl.textContent = randomTip;
        }
    },

    /**
     * Initialize
     */
    init() {
        this.showRandomTip();
    }
};

// ============================================================================
// Command Palette Manager
// ============================================================================

const CommandPalette = {
    overlay: null,
    input: null,
    results: null,
    commands: [],
    filteredCommands: [],

    /**
     * Initialize command palette
     */
    init() {
        this.overlay = document.getElementById('commandPaletteOverlay');
        this.input = document.getElementById('commandInput');
        this.results = document.getElementById('commandResults');

        // Define all available commands
        this.commands = [
            { id: 'new', icon: 'fa-file', title: 'New Text', description: 'Clear editor and start fresh', shortcut: 'Ctrl+N', action: () => this.newText() },
            { id: 'save', icon: 'fa-save', title: 'Save Text', description: 'Save current text to collection', shortcut: 'Ctrl+S', action: () => SavedTexts.save() },
            { id: 'search', icon: 'fa-search', title: 'Find & Replace', description: 'Search and replace text', shortcut: 'Ctrl+F', action: () => SearchManager.open() },
            { id: 'uppercase', icon: 'fa-arrow-up', title: 'Transform to UPPERCASE', description: 'Convert text to uppercase', action: () => TextTools.toUpperCase() },
            { id: 'lowercase', icon: 'fa-arrow-down', title: 'Transform to lowercase', description: 'Convert text to lowercase', action: () => TextTools.toLowerCase() },
            { id: 'titlecase', icon: 'fa-heading', title: 'Transform to Title Case', description: 'Convert text to title case', action: () => TextTools.toTitleCase() },
            { id: 'reverse', icon: 'fa-exchange-alt', title: 'Reverse Text', description: 'Reverse character order', action: () => TextTools.reverse() },
            { id: 'sort', icon: 'fa-sort-alpha-down', title: 'Sort Lines', description: 'Sort lines alphabetically', action: () => TextTools.sortLines() },
            { id: 'dedupe', icon: 'fa-clone', title: 'Remove Duplicates', description: 'Remove duplicate lines', action: () => TextTools.removeDuplicates() },
            { id: 'base64-encode', icon: 'fa-lock', title: 'Base64 Encode', description: 'Encode text to Base64', action: () => TextTools.encodeBase64() },
            { id: 'base64-decode', icon: 'fa-unlock', title: 'Base64 Decode', description: 'Decode from Base64', action: () => TextTools.decodeBase64() },
            { id: 'url-encode', icon: 'fa-link', title: 'URL Encode', description: 'Encode text for URL', action: () => TextTools.encodeURL() },
            { id: 'url-decode', icon: 'fa-unlink', title: 'URL Decode', description: 'Decode URL encoded text', action: () => TextTools.decodeURL() },
            { id: 'analytics', icon: 'fa-chart-line', title: 'Full Analytics', description: 'Show detailed text analysis', action: () => Analytics.showFull() },
            { id: 'settings', icon: 'fa-cog', title: 'Settings', description: 'Open settings panel', action: () => ToolsManager.showSettings() },
            { id: 'theme', icon: 'fa-palette', title: 'Toggle Theme', description: 'Switch between light/dark theme', action: () => ThemeManager.toggle() },
            { id: 'shortcuts', icon: 'fa-keyboard', title: 'Keyboard Shortcuts', description: 'View all keyboard shortcuts', action: () => KeyboardShortcuts.show() },
            { id: 'lorem', icon: 'fa-paragraph', title: 'Lorem Ipsum Generator', description: 'Generate placeholder text', action: () => AdvancedTools.showLorem() },
            { id: 'hash', icon: 'fa-hashtag', title: 'Hash Generator', description: 'Generate text hashes', action: () => AdvancedTools.showHash() },
            { id: 'diff', icon: 'fa-code-compare', title: 'Text Comparison', description: 'Compare two texts', action: () => AdvancedTools.showDiff() },
            { id: 'regex', icon: 'fa-asterisk', title: 'Regex Tester', description: 'Test regular expressions', action: () => AdvancedTools.showRegex() }
        ];

        // Event listeners
        document.getElementById('commandPaletteBtn').addEventListener('click', () => this.open());
        this.input.addEventListener('input', () => this.handleInput());
        this.input.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Close on backdrop click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
    },

    /**
     * Open command palette
     */
    open() {
        APP_STATE.commandPalette.isOpen = true;
        APP_STATE.commandPalette.selectedIndex = 0;
        this.overlay.removeAttribute('hidden');
        this.input.value = '';
        this.input.focus();
        this.filteredCommands = [...this.commands];
        this.renderResults();
    },

    /**
     * Close command palette
     */
    close() {
        APP_STATE.commandPalette.isOpen = false;
        this.overlay.setAttribute('hidden', '');
    },

    /**
     * Handle input changes
     */
    handleInput() {
        const query = this.input.value.toLowerCase().trim();

        if (!query) {
            this.filteredCommands = [...this.commands];
        } else {
            this.filteredCommands = this.commands.filter(cmd =>
                cmd.title.toLowerCase().includes(query) ||
                cmd.description.toLowerCase().includes(query) ||
                cmd.id.includes(query)
            );
        }

        APP_STATE.commandPalette.selectedIndex = 0;
        this.renderResults();
    },

    /**
     * Handle keyboard navigation
     */
    handleKeyboard(e) {
        const { selectedIndex } = APP_STATE.commandPalette;
        const maxIndex = this.filteredCommands.length - 1;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            APP_STATE.commandPalette.selectedIndex = Math.min(selectedIndex + 1, maxIndex);
            this.renderResults();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            APP_STATE.commandPalette.selectedIndex = Math.max(selectedIndex - 1, 0);
            this.renderResults();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.filteredCommands[selectedIndex]) {
                this.executeCommand(this.filteredCommands[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
        }
    },

    /**
     * Execute command
     */
    executeCommand(command) {
        this.close();
        command.action();
        Toast.show('Command Executed', command.title, 'success');
    },

    /**
     * New text command
     */
    newText() {
        if (Editor.textarea.value && !confirm('Clear current text? This cannot be undone.')) {
            return;
        }
        Editor.textarea.value = '';
        Editor.handleInput();
        Toast.show('New Text', 'Editor cleared and ready', 'success');
    },

    /**
     * Render command results
     */
    renderResults() {
        if (this.filteredCommands.length === 0) {
            this.results.innerHTML = '<div class="command-empty">No commands found</div>';
            return;
        }

        this.results.innerHTML = this.filteredCommands.map((cmd, index) => `
            <div class="command-item ${index === APP_STATE.commandPalette.selectedIndex ? 'selected' : ''}"
                 data-command="${cmd.id}">
                <div class="command-item-icon">
                    <i class="fas ${cmd.icon}"></i>
                </div>
                <div class="command-item-content">
                    <div class="command-item-title">${cmd.title}</div>
                    <div class="command-item-description">${cmd.description}</div>
                </div>
                ${cmd.shortcut ? `<div class="command-item-shortcut">${cmd.shortcut}</div>` : ''}
            </div>
        `).join('');

        // Add click listeners
        this.results.querySelectorAll('.command-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.executeCommand(this.filteredCommands[index]);
            });
        });

        // Scroll selected into view
        const selected = this.results.querySelector('.command-item.selected');
        if (selected) {
            selected.scrollIntoView({ block: 'nearest' });
        }
    }
};

// ============================================================================
// Drag & Drop Manager
// ============================================================================

const DragDrop = {
    dropZone: null,
    wrapper: null,

    /**
     * Initialize drag and drop
     */
    init() {
        this.wrapper = document.getElementById('editorWrapper');
        this.dropZone = document.getElementById('dropZoneOverlay');

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.wrapper.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // Highlight drop zone
        ['dragenter', 'dragover'].forEach(eventName => {
            this.wrapper.addEventListener(eventName, () => {
                this.dropZone.removeAttribute('hidden');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.wrapper.addEventListener(eventName, () => {
                this.dropZone.setAttribute('hidden', '');
            });
        });

        // Handle dropped files
        this.wrapper.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });
    },

    /**
     * Handle dropped file
     */
    handleFile(file) {
        const validTypes = ['.txt', '.md', '.json', '.csv', '.html'];
        const fileName = file.name.toLowerCase();
        const isValid = validTypes.some(type => fileName.endsWith(type));

        if (!isValid) {
            Toast.show('Invalid File', 'Please drop a TXT, MD, JSON, CSV, or HTML file', 'error');
            return;
        }

        // Validate file size
        if (!Utils.validateFileSize(file)) {
            Toast.show(
                'File Too Large',
                `Maximum file size is ${Utils.formatBytes(APP_CONFIG.maxFileSize)}. Your file is ${Utils.formatBytes(file.size)}.`,
                'error'
            );
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                Editor.textarea.value = e.target.result;
                Editor.handleInput();
                Toast.show('File Loaded', `"${Utils.escapeHTML(file.name)}" imported successfully`, 'success');
            } catch (error) {
                console.error('File load error:', error);
                Toast.show('Error', 'Failed to process file', 'error');
            }
        };
        reader.onerror = (error) => {
            console.error('FileReader error:', error);
            Toast.show('Error', 'Failed to read file', 'error');
        };
        reader.readAsText(file);
    }
};

// ============================================================================
// Clipboard History Manager
// ============================================================================

const ClipboardHistory = {
    maxItems: 20,

    /**
     * Add to clipboard history
     */
    add(text) {
        if (!text || text.length === 0) return;

        const item = {
            id: Date.now(),
            text,
            preview: text.substring(0, 50),
            timestamp: new Date().toISOString()
        };

        APP_STATE.clipboardHistory.unshift(item);

        // Limit size
        if (APP_STATE.clipboardHistory.length > this.maxItems) {
            APP_STATE.clipboardHistory.pop();
        }

        Storage.save('clipboardHistory', APP_STATE.clipboardHistory);
        this.render();
    },

    /**
     * Load from clipboard history
     */
    load(id) {
        const item = APP_STATE.clipboardHistory.find(c => c.id === id);
        if (item) {
            Editor.replaceSelection(item.text);
            Toast.show('Inserted', 'Clipboard item inserted', 'success');
        }
    },

    /**
     * Delete clipboard item
     */
    delete(id) {
        APP_STATE.clipboardHistory = APP_STATE.clipboardHistory.filter(c => c.id !== id);
        Storage.save('clipboardHistory', APP_STATE.clipboardHistory);
        this.render();
    },

    /**
     * Clear all
     */
    clearAll() {
        APP_STATE.clipboardHistory = [];
        Storage.save('clipboardHistory', []);
        this.render();
        Toast.show('Cleared', 'Clipboard history cleared', 'success');
    },

    /**
     * Render clipboard history
     */
    render() {
        const container = document.getElementById('clipboardContent');

        if (APP_STATE.clipboardHistory.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No clipboard history</p>
                </div>
            `;
            return;
        }

        container.innerHTML = APP_STATE.clipboardHistory.map(item => `
            <div class="history-item">
                <div class="item-header">
                    <span class="item-time">${new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="item-preview">${item.preview}${item.text.length > 50 ? '...' : ''}</div>
                <div class="item-actions">
                    <button class="item-btn" onclick="ClipboardHistory.load(${item.id})">
                        <i class="fas fa-paste"></i> Insert
                    </button>
                    <button class="item-btn" onclick="ClipboardHistory.delete(${item.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Initialize
     */
    init() {
        APP_STATE.clipboardHistory = Storage.load('clipboardHistory', []);
        this.render();

        // Intercept copy events
        document.addEventListener('copy', () => {
            const selection = Editor.getSelection();
            if (selection.text) {
                setTimeout(() => this.add(selection.text), 100);
            }
        });
    }
};

// ============================================================================
// Templates Manager
// ============================================================================

const Templates = {
    defaultTemplates: [
        { name: 'Email Template', content: 'Dear [Name],\n\n[Your message here]\n\nBest regards,\n[Your name]' },
        { name: 'Meeting Notes', content: '# Meeting Notes\n\nDate: [Date]\nAttendees: [Names]\n\n## Agenda\n- \n\n## Discussion\n- \n\n## Action Items\n- ' },
        { name: 'TODO List', content: '# TODO List\n\n## Today\n- [ ] \n\n## This Week\n- [ ] \n\n## This Month\n- [ ] ' },
        { name: 'Bug Report', content: '# Bug Report\n\n## Description\n[Describe the bug]\n\n## Steps to Reproduce\n1. \n\n## Expected Behavior\n[What should happen]\n\n## Actual Behavior\n[What actually happens]\n\n## Environment\n- Browser: \n- OS: ' },
        { name: 'Code Review', content: '# Code Review\n\n## Summary\n[Brief overview]\n\n## Positives\n- \n\n## Suggestions\n- \n\n## Issues\n- \n\n## Conclusion\n[Overall assessment]' }
    ],

    /**
     * Load template
     */
    load(template) {
        Editor.textarea.value = template.content;
        Editor.handleInput();
        Toast.show('Template Loaded', template.name, 'success');
    },

    /**
     * Save custom template
     */
    saveCustom() {
        Modal.open(
            '<i class="fas fa-save"></i> Save as Template',
            `
                <div class="form-group">
                    <label class="form-label">Template Name</label>
                    <input type="text" id="templateName" class="form-input" placeholder="My Template">
                </div>
                <div class="form-group">
                    <label class="form-label">Content</label>
                    <textarea id="templateContent" class="form-textarea">${Editor.textarea.value}</textarea>
                </div>
            `,
            `
                <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
                <button class="btn btn-primary" onclick="Templates.confirmSave()">Save Template</button>
            `
        );
    },

    /**
     * Confirm save
     */
    confirmSave() {
        const name = document.getElementById('templateName').value.trim();
        const content = document.getElementById('templateContent').value;

        if (!name) {
            Toast.show('Error', 'Please enter a template name', 'error');
            return;
        }

        APP_STATE.templates.push({ id: Date.now(), name, content, custom: true });
        Storage.save('templates', APP_STATE.templates);
        this.render();
        Modal.close();
        Toast.show('Saved', 'Template saved successfully', 'success');
    },

    /**
     * Delete custom template
     */
    delete(id) {
        APP_STATE.templates = APP_STATE.templates.filter(t => t.id !== id);
        Storage.save('templates', APP_STATE.templates);
        this.render();
    },

    /**
     * Render templates
     */
    render() {
        const container = document.getElementById('templatesContent');
        const allTemplates = [...this.defaultTemplates, ...APP_STATE.templates];

        if (allTemplates.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-file-alt"></i><p>No templates</p></div>';
            return;
        }

        container.innerHTML = allTemplates.map((template, index) => `
            <button class="tool-btn" onclick="Templates.load(${JSON.stringify(template).replace(/"/g, '&quot;')})">
                <i class="fas fa-file-alt"></i> ${template.name}
            </button>
            ${template.custom ? `<button class="item-btn" onclick="Templates.delete(${template.id})"><i class="fas fa-trash"></i></button>` : ''}
        `).join('');
    },

    /**
     * Initialize
     */
    init() {
        APP_STATE.templates = Storage.load('templates', []);
        this.render();

        // Add save template button
        document.getElementById('templatesBtn')?.addEventListener('click', () => this.saveCustom());
    }
};

// ============================================================================
// Advanced Tools Manager
// ============================================================================

const AdvancedTools = {
    /**
     * Show Lorem Ipsum generator
     */
    showLorem() {
        Modal.open(
            '<i class="fas fa-paragraph"></i> Lorem Ipsum Generator',
            `
                <div class="form-group">
                    <label class="form-label">Number of Paragraphs</label>
                    <input type="number" id="loremParagraphs" class="form-input" value="3" min="1" max="20">
                </div>
            `,
            `
                <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
                <button class="btn btn-primary" onclick="AdvancedTools.generateLorem()">Generate</button>
            `
        );
    },

    /**
     * Generate Lorem Ipsum
     */
    generateLorem() {
        const paragraphs = parseInt(document.getElementById('loremParagraphs').value) || 3;
        const loremText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

        const result = Array(paragraphs).fill(loremText).join('\n\n');
        Editor.textarea.value = result;
        Editor.handleInput();
        Modal.close();
        Toast.show('Generated', `${paragraphs} paragraph(s) generated`, 'success');
    },

    /**
     * Show hash generator
     */
    async showHash() {
        const text = Editor.textarea.value;
        if (!text) {
            Toast.show('Error', 'Please enter text to hash', 'error');
            return;
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(text);

        // Generate hashes
        const sha256 = await crypto.subtle.digest('SHA-256', data);
        const sha256Hash = Array.from(new Uint8Array(sha256)).map(b => b.toString(16).padStart(2, '0')).join('');

        const sha512 = await crypto.subtle.digest('SHA-512', data);
        const sha512Hash = Array.from(new Uint8Array(sha512)).map(b => b.toString(16).padStart(2, '0')).join('');

        Modal.open(
            '<i class="fas fa-hashtag"></i> Hash Generator',
            `
                <div class="form-group">
                    <label class="form-label">SHA-256</label>
                    <input type="text" class="form-input" value="${sha256Hash}" readonly onclick="this.select()">
                </div>
                <div class="form-group">
                    <label class="form-label">SHA-512</label>
                    <input type="text" class="form-input" value="${sha512Hash}" readonly onclick="this.select()">
                </div>
            `,
            '<button class="btn btn-primary" onclick="Modal.close()">Close</button>'
        );
    },

    /**
     * Show diff tool
     */
    showDiff() {
        Modal.open(
            '<i class="fas fa-code-compare"></i> Text Comparison',
            `
                <div class="form-group">
                    <label class="form-label">Original Text</label>
                    <textarea id="diffOriginal" class="form-textarea" placeholder="Enter original text"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Modified Text</label>
                    <textarea id="diffModified" class="form-textarea" placeholder="Enter modified text"></textarea>
                </div>
                <div id="diffResult"></div>
            `,
            `
                <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
                <button class="btn btn-primary" onclick="AdvancedTools.performDiff()">Compare</button>
            `
        );
    },

    /**
     * Perform diff
     */
    performDiff() {
        const original = document.getElementById('diffOriginal').value;
        const modified = document.getElementById('diffModified').value;

        const origLines = original.split('\n');
        const modLines = modified.split('\n');

        let result = '<h4>Comparison Results:</h4>';
        result += `<p>Original: ${origLines.length} lines | Modified: ${modLines.length} lines</p>`;

        // Simple line-by-line comparison
        const maxLines = Math.max(origLines.length, modLines.length);
        let differences = 0;

        for (let i = 0; i < maxLines; i++) {
            if (origLines[i] !== modLines[i]) {
                differences++;
            }
        }

        result += `<p><strong>${differences}</strong> line(s) differ</p>`;
        document.getElementById('diffResult').innerHTML = result;
    },

    /**
     * Show regex tester
     */
    showRegex() {
        Modal.open(
            '<i class="fas fa-asterisk"></i> Regex Tester',
            `
                <div class="form-group">
                    <label class="form-label">Regular Expression</label>
                    <input type="text" id="regexPattern" class="form-input" placeholder="\\w+@\\w+\\.\\w+">
                </div>
                <div class="form-group">
                    <label class="form-label">Flags</label>
                    <input type="text" id="regexFlags" class="form-input" placeholder="gi" value="g">
                </div>
                <div class="form-group">
                    <label class="form-label">Test Text</label>
                    <textarea id="regexText" class="form-textarea" placeholder="Enter text to test">${Editor.textarea.value}</textarea>
                </div>
                <div id="regexResult"></div>
            `,
            `
                <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
                <button class="btn btn-primary" onclick="AdvancedTools.testRegex()">Test</button>
            `
        );
    },

    /**
     * Test regex
     */
    testRegex() {
        const pattern = document.getElementById('regexPattern').value;
        const flags = document.getElementById('regexFlags').value;
        const text = document.getElementById('regexText').value;

        try {
            const regex = new RegExp(pattern, flags);
            const matches = text.match(regex);

            let result = '<h4>Results:</h4>';
            if (matches) {
                result += `<p><strong>${matches.length}</strong> match(es) found:</p>`;
                result += '<ul>' + matches.slice(0, 10).map(m => `<li>${m}</li>`).join('') + '</ul>';
                if (matches.length > 10) result += `<p>... and ${matches.length - 10} more</p>`;
            } else {
                result += '<p>No matches found</p>';
            }

            document.getElementById('regexResult').innerHTML = result;
        } catch (error) {
            document.getElementById('regexResult').innerHTML = `<p style="color: var(--color-danger)">Error: ${error.message}</p>`;
        }
    },

    /**
     * Initialize
     */
    init() {
        document.getElementById('loremBtn')?.addEventListener('click', () => this.showLorem());
        document.getElementById('hashToolBtn')?.addEventListener('click', () => this.showHash());
        document.getElementById('diffToolBtn')?.addEventListener('click', () => this.showDiff());
        document.getElementById('regexToolBtn')?.addEventListener('click', () => this.showRegex());
    }
};

// ============================================================================
// Keyboard Shortcuts Manager
// ============================================================================

const KeyboardShortcuts = {
    shortcuts: [
        { keys: 'Ctrl+K', description: 'Open Command Palette' },
        { keys: 'Ctrl+N', description: 'New Text' },
        { keys: 'Ctrl+S', description: 'Save Text' },
        { keys: 'Ctrl+F', description: 'Find & Replace' },
        { keys: 'Ctrl+Z', description: 'Undo' },
        { keys: 'Ctrl+Y', description: 'Redo' },
        { keys: 'Ctrl+X', description: 'Cut' },
        { keys: 'Ctrl+C', description: 'Copy' },
        { keys: 'Ctrl+V', description: 'Paste' },
        { keys: 'Ctrl+A', description: 'Select All' },
        { keys: 'Ctrl+P', description: 'Print' },
        { keys: 'Esc', description: 'Close Dialogs' }
    ],

    /**
     * Show shortcuts modal
     */
    show() {
        const shortcutsHTML = this.shortcuts.map(s => `
            <div class="analytics-row">
                <span class="analytics-label">${s.description}</span>
                <span class="analytics-value" style="font-family: var(--font-family-mono);">${s.keys}</span>
            </div>
        `).join('');

        Modal.open(
            '<i class="fas fa-keyboard"></i> Keyboard Shortcuts',
            `<div class="analytics-mini">${shortcutsHTML}</div>`,
            '<button class="btn btn-primary" onclick="Modal.close()">Close</button>'
        );
    },

    /**
     * Initialize
     */
    init() {
        document.getElementById('keyboardShortcutsBtn')?.addEventListener('click', () => this.show());

        // Register global shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+K - Command Palette
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                CommandPalette.open();
            }

            // Ctrl+N - New Text
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                CommandPalette.newText();
            }

            // Ctrl+P - Print
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                window.print();
            }

            // Escape - Close overlays
            if (e.key === 'Escape') {
                if (APP_STATE.commandPalette.isOpen) {
                    CommandPalette.close();
                }
            }
        });
    }
};

// ============================================================================
// Cursor Position Tracker
// ============================================================================

const CursorTracker = {
    /**
     * Update cursor position
     */
    update() {
        const textarea = Editor.textarea;
        const text = textarea.value.substring(0, textarea.selectionStart);
        const lines = text.split('\n');
        const line = lines.length;
        const col = lines[lines.length - 1].length + 1;

        document.getElementById('cursorPosition').textContent = `Ln ${line}, Col ${col}`;

        // Update selected count
        const selection = Editor.getSelection();
        const selectedEl = document.getElementById('selectedCount');
        if (selection.text) {
            selectedEl.textContent = `${selection.text.length} selected`;
            selectedEl.removeAttribute('hidden');
        } else {
            selectedEl.setAttribute('hidden', '');
        }
    },

    /**
     * Initialize
     */
    init() {
        Editor.textarea.addEventListener('keyup', () => this.update());
        Editor.textarea.addEventListener('mouseup', () => this.update());
        Editor.textarea.addEventListener('select', () => this.update());
        this.update();
    }
};

// ============================================================================
// Help System
// ============================================================================

const HelpSystem = {
    /**
     * Show help modal
     */
    show() {
        Modal.open(
            '<i class="fas fa-question-circle"></i> Help & About',
            `
                <h3>Welcome to textMan v${APP_CONFIG.version}</h3>
                <p>A powerful text manipulation tool with advanced features.</p>

                <h4 class="mt-3">Features</h4>
                <ul>
                    <li>50+ text manipulation tools</li>
                    <li>Advanced find & replace with regex</li>
                    <li>Text analytics and statistics</li>
                    <li>Import/Export in multiple formats</li>
                    <li>Local storage - all data stays on your device</li>
                    <li>Light & Dark themes</li>
                    <li>Completely offline capable</li>
                </ul>

                <h4 class="mt-3">Quick Start</h4>
                <ul>
                    <li>Press <code>Ctrl+K</code> to open Command Palette</li>
                    <li>Drag & drop files directly into editor</li>
                    <li>Use right-click for quick actions</li>
                    <li>All changes are auto-saved locally</li>
                </ul>

                <h4 class="mt-3">Privacy</h4>
                <p>textMan runs entirely in your browser. No data is sent to any server. Everything is stored locally using localStorage.</p>
            `,
            '<button class="btn btn-primary" onclick="Modal.close()">Got it!</button>'
        );
    },

    /**
     * Initialize
     */
    init() {
        document.getElementById('helpBtn')?.addEventListener('click', () => this.show());
    }
};

// ============================================================================
// Application Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log(`%c🚀 textMan v${APP_CONFIG.version}`, 'font-size: 20px; font-weight: bold; color: #10b981;');

    // Show loading tips
    LoadingTips.init();

    // Initialize all modules
    ThemeManager.init();
    Modal.init();
    Editor.init();
    SearchManager.init();
    HistoryManager.init();
    SavedTexts.init();
    ImportExport.init();
    ToolsManager.init();
    SidebarManager.init();
    SidebarManager.restoreStates(); // Restore saved sidebar/section states
    ContextMenu.init();

    // Initialize new features
    CommandPalette.init();
    DragDrop.init();
    ClipboardHistory.init();
    Templates.init();
    AdvancedTools.init();
    KeyboardShortcuts.init();
    CursorTracker.init();
    HelpSystem.init();

    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
    }, 2000);

    console.log('✅ textMan initialized successfully!');
});

// ============================================================================
// Expose Global API
