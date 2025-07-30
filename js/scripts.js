// textMan v2 - Modern JavaScript Implementation

// ===== Constants =====
const STORAGE_KEYS = {
    CURRENT_TEXT: 'textman_v2_current',
    HISTORY: 'textman_v2_history',
    SAVED_TEXTS: 'textman_v2_saved',
    SETTINGS: 'textman_v2_settings',
    UI_STATE: 'textman_v2_ui_state'
};

const DEFAULT_SETTINGS = {
    theme: 'dark',
    autoSave: true,
    autoSaveInterval: 30000,
    fontSize: 14,
    fontFamily: 'JetBrains Mono',
    wordWrap: true,
    spellCheck: true
};

const QUICK_ACTIONS = [
    { id: 'uppercase', label: 'UPPERCASE', icon: 'fa-font', action: 'transform' },
    { id: 'lowercase', label: 'lowercase', icon: 'fa-text-height', action: 'transform' },
    { id: 'analyze', label: 'Analyze', icon: 'fa-chart-bar', action: 'analyze' },
    { id: 'find', label: 'Find', icon: 'fa-search', action: 'find' }
];

const TEMPLATES = {
    email: {
        name: 'Email',
        icon: 'fa-envelope',
        content: `Subject: [Your Subject Here]

Dear [Recipient Name],

I hope this email finds you well. I am writing to [state your purpose].

[Main content of your email]

Please let me know if you have any questions or need any additional information.

Best regards,
[Your Name]
[Your Title]
[Contact Information]`
    },
    meeting: {
        name: 'Meeting Notes',
        icon: 'fa-users',
        content: `Meeting Notes
Date: ${new Date().toLocaleDateString()}
Time: [Start Time] - [End Time]
Attendees: [List attendees]

Agenda:
1. [Topic 1]
2. [Topic 2]
3. [Topic 3]

Discussion Points:
• [Key point 1]
• [Key point 2]
• [Key point 3]

Action Items:
□ [Task 1] - Assigned to: [Name] - Due: [Date]
□ [Task 2] - Assigned to: [Name] - Due: [Date]

Next Meeting: [Date and Time]`
    },
    blog: {
        name: 'Blog Post',
        icon: 'fa-blog',
        content: `# [Blog Post Title]

*Published on ${new Date().toLocaleDateString()}*

## Introduction

[Hook your readers with an engaging opening paragraph]

## Main Content

### Section 1: [Subheading]

[Content for section 1]

### Section 2: [Subheading]

[Content for section 2]

### Section 3: [Subheading]

[Content for section 3]

## Conclusion

[Summarize key points and include a call to action]

---

Tags: #tag1 #tag2 #tag3`
    },
    todo: {
        name: 'To-Do List',
        icon: 'fa-tasks',
        content: `To-Do List - ${new Date().toLocaleDateString()}

High Priority:
□ [Task 1]
□ [Task 2]
□ [Task 3]

Medium Priority:
□ [Task 4]
□ [Task 5]
□ [Task 6]

Low Priority:
□ [Task 7]
□ [Task 8]
□ [Task 9]

Notes:
• [Important note 1]
• [Important note 2]`
    }
};

// ===== State Management =====
class AppState {
    constructor() {
        this.currentText = '';
        this.history = [];
        this.savedTexts = [];
        this.settings = { ...DEFAULT_SETTINGS };
        this.undoStack = [];
        this.redoStack = [];
        this.lastSaved = Date.now();
        this.isFullscreen = false;
    }

    addToHistory(action, text) {
        const entry = {
            id: Date.now(),
            action,
            text,
            timestamp: new Date().toISOString(),
            wordCount: this.countWords(text),
            charCount: text.length
        };
        
        this.history.unshift(entry);
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        
        this.saveToStorage();
    }

    saveText(title, text) {
        const saved = {
            id: Date.now(),
            title,
            text,
            timestamp: new Date().toISOString(),
            wordCount: this.countWords(text),
            charCount: text.length
        };
        
        this.savedTexts.unshift(saved);
        this.saveToStorage();
        return saved;
    }

    deleteSavedText(id) {
        this.savedTexts = this.savedTexts.filter(text => text.id !== id);
        this.saveToStorage();
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveToStorage();
    }

    saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEYS.CURRENT_TEXT, this.currentText);
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
            localStorage.setItem(STORAGE_KEYS.SAVED_TEXTS, JSON.stringify(this.savedTexts));
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }

    loadFromStorage() {
        try {
            this.currentText = localStorage.getItem(STORAGE_KEYS.CURRENT_TEXT) || '';
            this.history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
            this.savedTexts = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_TEXTS) || '[]');
            this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}') };
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
        }
    }

    countWords(text) {
        return text.trim() ? text.trim().split(/\s+/).length : 0;
    }
}

// ===== UI Manager =====
class UIManager {
    constructor(state) {
        this.state = state;
        this.elements = {};
        this.autoSaveTimer = null;
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.renderQuickActions();
        this.renderTemplates();
        this.renderTools();
        this.updateHistory();
        this.updateSavedTexts();
        this.applySettings();
        this.startAutoSave();
        this.hideLoadingScreen();
    }

    cacheElements() {
        this.elements = {
            // Loading
            loadingScreen: document.getElementById('loadingScreen'),
            app: document.getElementById('app'),
            
            // Editor
            editor: document.getElementById('mainEditor'),
            charCount: document.getElementById('charCount'),
            wordCount: document.getElementById('wordCount'),
            lineCount: document.getElementById('lineCount'),
            readTime: document.getElementById('readTime'),
            statusMessage: document.getElementById('statusMessage'),
            
            // Toolbar
            undoBtn: document.getElementById('undoBtn'),
            redoBtn: document.getElementById('redoBtn'),
            cutBtn: document.getElementById('cutBtn'),
            copyBtn: document.getElementById('copyBtn'),
            pasteBtn: document.getElementById('pasteBtn'),
            boldBtn: document.getElementById('boldBtn'),
            italicBtn: document.getElementById('italicBtn'),
            underlineBtn: document.getElementById('underlineBtn'),
            saveBtn: document.getElementById('saveBtn'),
            clearBtn: document.getElementById('clearBtn'),
            
            // Header
            searchBtn: document.getElementById('searchBtn'),
            fullscreenBtn: document.getElementById('fullscreenBtn'),
            settingsBtn: document.getElementById('settingsBtn'),
            themeToggle: document.getElementById('themeToggle'),
            
            // Sidebars
            leftSidebar: document.getElementById('leftSidebar'),
            rightSidebar: document.getElementById('rightSidebar'),
            
            // Content areas
            quickActions: document.getElementById('quickActions'),
            historyContent: document.getElementById('historyContent'),
            templatesContent: document.getElementById('templatesContent'),
            savedContent: document.getElementById('savedContent'),
            analyticsMini: document.getElementById('analyticsMini'),
            transformTools: document.getElementById('transformTools'),
            formatTools: document.getElementById('formatTools'),
            encodeTools: document.getElementById('encodeTools'),
            exportOptions: document.getElementById('exportOptions'),
            
            // Modals
            modalBackdrop: document.getElementById('modalBackdrop'),
            modal: document.getElementById('modal'),
            modalTitle: document.getElementById('modalTitle'),
            modalBody: document.getElementById('modalBody'),
            modalFooter: document.getElementById('modalFooter'),
            modalClose: document.getElementById('modalClose'),
            
            // Search
            searchOverlay: document.getElementById('searchOverlay'),
            searchClose: document.getElementById('searchClose'),
            findInput: document.getElementById('findInput'),
            replaceInput: document.getElementById('replaceInput'),
            caseSensitive: document.getElementById('caseSensitive'),
            useRegex: document.getElementById('useRegex'),
            findNextBtn: document.getElementById('findNextBtn'),
            replaceBtn: document.getElementById('replaceBtn'),
            replaceAllBtn: document.getElementById('replaceAllBtn'),
            
            // Others
            toastContainer: document.getElementById('toastContainer'),
            contextMenu: document.getElementById('contextMenu'),
            autoSaveIndicator: document.getElementById('autoSaveIndicator'),
            importBtn: document.getElementById('importBtn'),
            fileInput: document.getElementById('fileInput'),
            fullAnalyticsBtn: document.getElementById('fullAnalyticsBtn')
        };
    }

    setupEventListeners() {
        // Editor
        this.elements.editor.addEventListener('input', () => this.handleTextChange());
        this.elements.editor.addEventListener('contextmenu', (e) => this.showContextMenu(e));
        
        // Toolbar
        this.elements.undoBtn.addEventListener('click', () => this.undo());
        this.elements.redoBtn.addEventListener('click', () => this.redo());
        this.elements.cutBtn.addEventListener('click', () => this.cut());
        this.elements.copyBtn.addEventListener('click', () => this.copy());
        this.elements.pasteBtn.addEventListener('click', () => this.paste());
        this.elements.saveBtn.addEventListener('click', () => this.saveText());
        this.elements.clearBtn.addEventListener('click', () => this.clearText());
        
        // Header
        this.elements.searchBtn.addEventListener('click', () => this.showSearch());
        this.elements.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.elements.settingsBtn.addEventListener('click', () => this.showSettings());
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Sidebars
        document.querySelectorAll('.sidebar-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sidebar = e.target.closest('[data-sidebar]').dataset.sidebar;
                this.toggleSidebar(sidebar);
            });
        });
        
        document.querySelectorAll('.panel-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const section = e.target.closest('.panel-section');
                section.classList.toggle('collapsed');
            });
        });
        
        // Modal
        this.elements.modalBackdrop.addEventListener('click', (e) => {
            if (e.target === this.elements.modalBackdrop) {
                this.hideModal();
            }
        });
        this.elements.modalClose.addEventListener('click', () => this.hideModal());
        
        // Search
        this.elements.searchClose.addEventListener('click', () => this.hideSearch());
        this.elements.findNextBtn.addEventListener('click', () => this.findNext());
        this.elements.replaceBtn.addEventListener('click', () => this.replace());
        this.elements.replaceAllBtn.addEventListener('click', () => this.replaceAll());
        
        // Import
        this.elements.importBtn.addEventListener('click', () => this.elements.fileInput.click());
        this.elements.fileInput.addEventListener('change', (e) => this.importFile(e));
        
        // Analytics
        this.elements.fullAnalyticsBtn.addEventListener('click', () => this.showFullAnalytics());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Window events
        window.addEventListener('beforeunload', (e) => this.handleBeforeUnload(e));
        document.addEventListener('click', () => this.hideContextMenu());
    }

    handleTextChange() {
        const text = this.elements.editor.value;
        
        // Update state
        if (text !== this.state.currentText) {
            this.state.undoStack.push(this.state.currentText);
            if (this.state.undoStack.length > 100) {
                this.state.undoStack.shift();
            }
            this.state.redoStack = [];
            this.state.currentText = text;
        }
        
        // Update stats
        this.updateStats();
        this.updateMiniAnalytics();
        
        // Update button states
        this.updateButtonStates();
    }

    updateStats() {
        const text = this.elements.editor.value;
        const chars = text.length;
        const words = this.state.countWords(text);
        const lines = text ? text.split('\n').length : 0;
        const readTime = Math.max(1, Math.ceil(words / 200));
        
        this.elements.charCount.innerHTML = `<i class="fas fa-text-width"></i> ${chars.toLocaleString()}`;
        this.elements.wordCount.innerHTML = `<i class="fas fa-font"></i> ${words.toLocaleString()}`;
        this.elements.lineCount.innerHTML = `<i class="fas fa-list"></i> ${lines.toLocaleString()}`;
        this.elements.readTime.innerHTML = `<i class="fas fa-clock"></i> ${readTime}m`;
    }

    updateMiniAnalytics() {
        const text = this.elements.editor.value;
        if (!text) {
            this.elements.analyticsMini.innerHTML = `
                <div class="analytics-card">
                    <div class="analytics-value">0</div>
                    <div class="analytics-label">Sentences</div>
                </div>
                <div class="analytics-card">
                    <div class="analytics-value">0</div>
                    <div class="analytics-label">Paragraphs</div>
                </div>
                <div class="analytics-card">
                    <div class="analytics-value">0.0</div>
                    <div class="analytics-label">Avg Words/Sent</div>
                </div>
                <div class="analytics-card">
                    <div class="analytics-value">Easy</div>
                    <div class="analytics-label">Readability</div>
                </div>
            `;
            return;
        }
        
        const analytics = TextAnalyzer.analyze(text);
        
        this.elements.analyticsMini.innerHTML = `
            <div class="analytics-card">
                <div class="analytics-value">${analytics.sentences}</div>
                <div class="analytics-label">Sentences</div>
            </div>
            <div class="analytics-card">
                <div class="analytics-value">${analytics.paragraphs}</div>
                <div class="analytics-label">Paragraphs</div>
            </div>
            <div class="analytics-card">
                <div class="analytics-value">${analytics.avgWordsPerSentence.toFixed(1)}</div>
                <div class="analytics-label">Avg Words/Sent</div>
            </div>
            <div class="analytics-card">
                <div class="analytics-value">${analytics.readability.level}</div>
                <div class="analytics-label">Readability</div>
            </div>
        `;
    }

    updateButtonStates() {
        this.elements.undoBtn.disabled = this.state.undoStack.length === 0;
        this.elements.redoBtn.disabled = this.state.redoStack.length === 0;
        this.elements.cutBtn.disabled = !this.elements.editor.value;
        this.elements.copyBtn.disabled = !this.elements.editor.value;
        this.elements.clearBtn.disabled = !this.elements.editor.value;
    }

    renderQuickActions() {
        this.elements.quickActions.innerHTML = QUICK_ACTIONS.map(action => `
            <button class="quick-action-btn" data-action="${action.id}">
                <i class="fas ${action.icon}"></i>
                <span>${action.label}</span>
            </button>
        `).join('');
        
        // Add event listeners
        this.elements.quickActions.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const actionId = e.currentTarget.dataset.action;
                this.handleQuickAction(actionId);
            });
        });
    }

    handleQuickAction(actionId) {
        switch (actionId) {
            case 'uppercase':
                this.transformText('uppercase');
                break;
            case 'lowercase':
                this.transformText('lowercase');
                break;
            case 'analyze':
                this.showFullAnalytics();
                break;
            case 'find':
                this.showSearch();
                break;
        }
    }

    renderTemplates() {
        this.elements.templatesContent.innerHTML = Object.entries(TEMPLATES).map(([key, template]) => `
            <button class="tool-btn" data-template="${key}">
                <i class="fas ${template.icon}"></i>
                <span>${template.name}</span>
            </button>
        `).join('');
        
        // Add event listeners
        this.elements.templatesContent.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const templateKey = e.currentTarget.dataset.template;
                this.applyTemplate(templateKey);
            });
        });
    }

    applyTemplate(templateKey) {
        const template = TEMPLATES[templateKey];
        if (!template) return;
        
        if (this.elements.editor.value.trim()) {
            this.showModal('Apply Template', 
                'This will replace your current text. Are you sure?',
                [
                    { label: 'Cancel', class: 'btn-secondary', action: () => this.hideModal() },
                    { label: 'Apply', class: 'btn-primary', action: () => {
                        this.state.addToHistory('Apply Template', this.elements.editor.value);
                        this.elements.editor.value = template.content;
                        this.handleTextChange();
                        this.hideModal();
                        this.showToast(`Applied ${template.name} template`, 'success');
                    }}
                ]
            );
        } else {
            this.elements.editor.value = template.content;
            this.handleTextChange();
            this.showToast(`Applied ${template.name} template`, 'success');
        }
    }

    renderTools() {
        // Transform tools
        this.elements.transformTools.innerHTML = `
            <button class="tool-btn" data-transform="title">Title Case</button>
            <button class="tool-btn" data-transform="sentence">Sentence case</button>
            <button class="tool-btn" data-transform="capitalize">Capitalize</button>
            <button class="tool-btn" data-transform="alternate">aLtErNaTe</button>
            <button class="tool-btn" data-transform="camel">camelCase</button>
            <button class="tool-btn" data-transform="pascal">PascalCase</button>
            <button class="tool-btn" data-transform="snake">snake_case</button>
            <button class="tool-btn" data-transform="kebab">kebab-case</button>
        `;
        
        // Format tools
        this.elements.formatTools.innerHTML = `
            <button class="tool-btn" data-format="trim">Trim Spaces</button>
            <button class="tool-btn" data-format="remove-extra">Remove Extra</button>
            <button class="tool-btn" data-format="remove-lines">Remove Lines</button>
            <button class="tool-btn" data-format="sort">Sort Lines</button>
            <button class="tool-btn" data-format="reverse">Reverse Lines</button>
            <button class="tool-btn" data-format="unique">Unique Lines</button>
            <button class="tool-btn" data-format="number">Number Lines</button>
            <button class="tool-btn" data-format="shuffle">Shuffle Lines</button>
        `;
        
        // Encode tools
        this.elements.encodeTools.innerHTML = `
            <button class="tool-btn" data-encode="base64-encode">Base64 Encode</button>
            <button class="tool-btn" data-encode="base64-decode">Base64 Decode</button>
            <button class="tool-btn" data-encode="url-encode">URL Encode</button>
            <button class="tool-btn" data-encode="url-decode">URL Decode</button>
            <button class="tool-btn" data-encode="html-encode">HTML Encode</button>
            <button class="tool-btn" data-encode="html-decode">HTML Decode</button>
            <button class="tool-btn" data-encode="morse">Morse Code</button>
            <button class="tool-btn" data-encode="reverse">Reverse Text</button>
        `;
        
        // Export options
        this.elements.exportOptions.innerHTML = `
            <button class="tool-btn" data-export="txt">
                <i class="fas fa-file-alt"></i> Export as TXT
            </button>
            <button class="tool-btn" data-export="pdf">
                <i class="fas fa-file-pdf"></i> Export as PDF
            </button>
            <button class="tool-btn" data-export="json">
                <i class="fas fa-file-code"></i> Export as JSON
            </button>
            <button class="tool-btn" data-export="markdown">
                <i class="fas fa-file-alt"></i> Export as MD
            </button>
        `;
        
        // Add event listeners
        document.querySelectorAll('[data-transform]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.transformText(e.target.dataset.transform);
            });
        });
        
        document.querySelectorAll('[data-format]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.formatText(e.target.dataset.format);
            });
        });
        
        document.querySelectorAll('[data-encode]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.encodeText(e.target.dataset.encode);
            });
        });
        
        document.querySelectorAll('[data-export]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.exportText(e.target.dataset.export);
            });
        });
    }

    // Text manipulation methods
    transformText(type) {
        const text = this.elements.editor.value;
        if (!text && type !== 'reverse') {
            this.showToast('No text to transform', 'warning');
            return;
        }
        
        let transformed = text;
        
        switch (type) {
            case 'uppercase':
                transformed = text.toUpperCase();
                break;
            case 'lowercase':
                transformed = text.toLowerCase();
                break;
            case 'title':
                transformed = text.replace(/\w\S*/g, txt => 
                    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
                );
                break;
            case 'sentence':
                transformed = text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase());
                break;
            case 'capitalize':
                transformed = text.replace(/\b\w/g, c => c.toUpperCase());
                break;
            case 'alternate':
                transformed = text.split('').map((c, i) => 
                    i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()
                ).join('');
                break;
            case 'camel':
                transformed = text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
                    index === 0 ? word.toLowerCase() : word.toUpperCase()
                ).replace(/\s+/g, '');
                break;
            case 'pascal':
                transformed = text.replace(/(?:^\w|[A-Z]|\b\w)/g, word => 
                    word.toUpperCase()
                ).replace(/\s+/g, '');
                break;
            case 'snake':
                transformed = text.replace(/\W+/g, ' ')
                    .split(/ |\B(?=[A-Z])/)
                    .map(word => word.toLowerCase())
                    .join('_');
                break;
            case 'kebab':
                transformed = text.replace(/\W+/g, ' ')
                    .split(/ |\B(?=[A-Z])/)
                    .map(word => word.toLowerCase())
                    .join('-');
                break;
        }
        
        if (transformed !== text) {
            this.state.addToHistory(`Transform: ${type}`, text);
            this.elements.editor.value = transformed;
            this.handleTextChange();
            this.showToast(`Applied ${type} transformation`, 'success');
        }
    }

    formatText(type) {
        const text = this.elements.editor.value;
        if (!text) {
            this.showToast('No text to format', 'warning');
            return;
        }
        
        let formatted = text;
        
        switch (type) {
            case 'trim':
                formatted = text.trim();
                break;
            case 'remove-extra':
                formatted = text.replace(/\s+/g, ' ').trim();
                break;
            case 'remove-lines':
                formatted = text.replace(/\n+/g, ' ').trim();
                break;
            case 'sort':
                formatted = text.split('\n').sort().join('\n');
                break;
            case 'reverse':
                formatted = text.split('\n').reverse().join('\n');
                break;
            case 'unique':
                formatted = [...new Set(text.split('\n'))].join('\n');
                break;
            case 'number':
                formatted = text.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n');
                break;
            case 'shuffle':
                const lines = text.split('\n');
                for (let i = lines.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [lines[i], lines[j]] = [lines[j], lines[i]];
                }
                formatted = lines.join('\n');
                break;
        }
        
        if (formatted !== text) {
            this.state.addToHistory(`Format: ${type}`, text);
            this.elements.editor.value = formatted;
            this.handleTextChange();
            this.showToast(`Applied ${type} formatting`, 'success');
        }
    }

    encodeText(type) {
        const text = this.elements.editor.value;
        if (!text) {
            this.showToast('No text to encode/decode', 'warning');
            return;
        }
        
        let encoded = text;
        
        try {
            switch (type) {
                case 'base64-encode':
                    encoded = btoa(unescape(encodeURIComponent(text)));
                    break;
                case 'base64-decode':
                    encoded = decodeURIComponent(escape(atob(text)));
                    break;
                case 'url-encode':
                    encoded = encodeURIComponent(text);
                    break;
                case 'url-decode':
                    encoded = decodeURIComponent(text);
                    break;
                case 'html-encode':
                    encoded = text.replace(/[&<>"']/g, m => ({
                        '&': '&amp;',
                        '<': '&lt;',
                        '>': '&gt;',
                        '"': '&quot;',
                        "'": '&#39;'
                    })[m]);
                    break;
                case 'html-decode':
                    const textarea = document.createElement('textarea');
                    textarea.innerHTML = text;
                    encoded = textarea.value;
                    break;
                case 'morse':
                    encoded = TextEncoder.toMorse(text);
                    break;
                case 'reverse':
                    encoded = text.split('').reverse().join('');
                    break;
            }
            
            if (encoded !== text) {
                this.state.addToHistory(`Encode: ${type}`, text);
                this.elements.editor.value = encoded;
                this.handleTextChange();
                this.showToast(`Applied ${type}`, 'success');
            }
        } catch (error) {
            this.showToast(`Failed to ${type}: ${error.message}`, 'error');
        }
    }

    // File operations
    importFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.state.addToHistory('Import File', this.elements.editor.value);
            this.elements.editor.value = e.target.result;
            this.handleTextChange();
            this.showToast(`Imported ${file.name}`, 'success');
        };
        reader.onerror = () => {
            this.showToast('Failed to read file', 'error');
        };
        reader.readAsText(file);
        
        // Reset input
        event.target.value = '';
    }

    exportText(format) {
        const text = this.elements.editor.value;
        if (!text) {
            this.showToast('No text to export', 'warning');
            return;
        }
        
        const timestamp = new Date().toISOString().slice(0, 10);
        let filename, content, mimeType;
        
        switch (format) {
            case 'txt':
                filename = `textman-${timestamp}.txt`;
                content = text;
                mimeType = 'text/plain';
                break;
            case 'json':
                filename = `textman-${timestamp}.json`;
                content = JSON.stringify({
                    text,
                    metadata: {
                        exported: new Date().toISOString(),
                        wordCount: this.state.countWords(text),
                        charCount: text.length
                    }
                }, null, 2);
                mimeType = 'application/json';
                break;
            case 'markdown':
                filename = `textman-${timestamp}.md`;
                content = text;
                mimeType = 'text/markdown';
                break;
            case 'pdf':
                this.exportAsPDF(text);
                return;
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast(`Exported as ${format.toUpperCase()}`, 'success');
    }

    exportAsPDF(text) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>textMan Export</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            padding: 40px;
                            max-width: 800px;
                            margin: 0 auto;
                        }
                        h1 {
                            color: #333;
                            border-bottom: 2px solid #333;
                            padding-bottom: 10px;
                        }
                        .metadata {
                            color: #666;
                            font-size: 0.9em;
                            margin-bottom: 30px;
                        }
                        .content {
                            white-space: pre-wrap;
                            font-family: 'Courier New', monospace;
                        }
                    </style>
                </head>
                <body>
                    <h1>textMan Export</h1>
                    <div class="metadata">
                        <p>Exported on: ${new Date().toLocaleString()}</p>
                        <p>Word count: ${this.state.countWords(text).toLocaleString()}</p>
                        <p>Character count: ${text.length.toLocaleString()}</p>
                    </div>
                    <div class="content">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
        
        this.showToast('Opening print dialog...', 'info');
    }

    // History and saved texts
    updateHistory() {
        if (this.state.history.length === 0) {
            this.elements.historyContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No history yet</p>
                </div>
            `;
            return;
        }
        
        this.elements.historyContent.innerHTML = this.state.history.slice(0, 10).map(entry => `
            <div class="history-item" data-id="${entry.id}">
                <div class="history-header">
                    <span class="history-action">${entry.action}</span>
                    <span class="history-time">${new Date(entry.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="history-stats">
                    <span><i class="fas fa-font"></i> ${entry.wordCount}</span>
                    <span><i class="fas fa-text-width"></i> ${entry.charCount}</span>
                </div>
                <button class="tool-btn" onclick="ui.restoreHistory(${entry.id})">
                    <i class="fas fa-undo"></i> Restore
                </button>
            </div>
        `).join('');
    }

    restoreHistory(id) {
        const entry = this.state.history.find(h => h.id === id);
        if (!entry) return;
        
        this.state.addToHistory('Restore from History', this.elements.editor.value);
        this.elements.editor.value = entry.text;
        this.handleTextChange();
        this.showToast('Restored from history', 'success');
    }

    updateSavedTexts() {
        if (this.state.savedTexts.length === 0) {
            this.elements.savedContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bookmark"></i>
                    <p>No saved texts</p>
                </div>
            `;
            return;
        }
        
        this.elements.savedContent.innerHTML = this.state.savedTexts.map(saved => `
            <div class="saved-item" data-id="${saved.id}">
                <div class="saved-header">
                    <span class="saved-title">${saved.title}</span>
                    <button class="icon-btn" onclick="ui.deleteSaved(${saved.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="saved-stats">
                    <span><i class="fas fa-font"></i> ${saved.wordCount}</span>
                    <span><i class="fas fa-text-width"></i> ${saved.charCount}</span>
                    <span><i class="fas fa-clock"></i> ${new Date(saved.timestamp).toLocaleDateString()}</span>
                </div>
                <button class="tool-btn" onclick="ui.loadSaved(${saved.id})">
                    <i class="fas fa-download"></i> Load
                </button>
            </div>
        `).join('');
    }

    loadSaved(id) {
        const saved = this.state.savedTexts.find(s => s.id === id);
        if (!saved) return;
        
        if (this.elements.editor.value.trim()) {
            this.showModal('Load Saved Text', 
                'This will replace your current text. Are you sure?',
                [
                    { label: 'Cancel', class: 'btn-secondary', action: () => this.hideModal() },
                    { label: 'Load', class: 'btn-primary', action: () => {
                        this.state.addToHistory('Load Saved Text', this.elements.editor.value);
                        this.elements.editor.value = saved.text;
                        this.handleTextChange();
                        this.hideModal();
                        this.showToast(`Loaded "${saved.title}"`, 'success');
                    }}
                ]
            );
        } else {
            this.elements.editor.value = saved.text;
            this.handleTextChange();
            this.showToast(`Loaded "${saved.title}"`, 'success');
        }
    }

    deleteSaved(id) {
        const saved = this.state.savedTexts.find(s => s.id === id);
        if (!saved) return;
        
        this.showModal('Delete Saved Text', 
            `Are you sure you want to delete "${saved.title}"?`,
            [
                { label: 'Cancel', class: 'btn-secondary', action: () => this.hideModal() },
                { label: 'Delete', class: 'btn-danger', action: () => {
                    this.state.deleteSavedText(id);
                    this.updateSavedTexts();
                    this.hideModal();
                    this.showToast('Deleted saved text', 'success');
                }}
            ]
        );
    }

    saveText() {
        const text = this.elements.editor.value.trim();
        if (!text) {
            this.showToast('No text to save', 'warning');
            return;
        }
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Enter a title...';
        input.className = 'modal-input';
        
        this.showModal('Save Text', input, [
            { label: 'Cancel', class: 'btn-secondary', action: () => this.hideModal() },
            { label: 'Save', class: 'btn-primary', action: () => {
                const title = input.value.trim();
                if (!title) {
                    this.showToast('Please enter a title', 'warning');
                    return;
                }
                
                this.state.saveText(title, text);
                this.updateSavedTexts();
                this.hideModal();
                this.showToast(`Saved "${title}"`, 'success');
            }}
        ]);
        
        setTimeout(() => input.focus(), 100);
    }

    // Editor operations
    undo() {
        if (this.state.undoStack.length === 0) return;
        
        this.state.redoStack.push(this.elements.editor.value);
        this.elements.editor.value = this.state.undoStack.pop();
        this.state.currentText = this.elements.editor.value;
        this.updateStats();
        this.updateMiniAnalytics();
        this.updateButtonStates();
        this.showToast('Undo', 'info');
    }

    redo() {
        if (this.state.redoStack.length === 0) return;
        
        this.state.undoStack.push(this.elements.editor.value);
        this.elements.editor.value = this.state.redoStack.pop();
        this.state.currentText = this.elements.editor.value;
        this.updateStats();
        this.updateMiniAnalytics();
        this.updateButtonStates();
        this.showToast('Redo', 'info');
    }

    cut() {
        if (!this.elements.editor.value) return;
        
        const selection = this.elements.editor.value.substring(
            this.elements.editor.selectionStart,
            this.elements.editor.selectionEnd
        );
        
        if (selection) {
            navigator.clipboard.writeText(selection);
            this.elements.editor.setRangeText('');
            this.handleTextChange();
            this.showToast('Cut to clipboard', 'success');
        } else {
            navigator.clipboard.writeText(this.elements.editor.value);
            this.elements.editor.value = '';
            this.handleTextChange();
            this.showToast('Cut all text to clipboard', 'success');
        }
    }

    copy() {
        if (!this.elements.editor.value) return;
        
        const selection = this.elements.editor.value.substring(
            this.elements.editor.selectionStart,
            this.elements.editor.selectionEnd
        );
        
        const textToCopy = selection || this.elements.editor.value;
        navigator.clipboard.writeText(textToCopy).then(() => {
            this.showToast('Copied to clipboard', 'success');
        }).catch(() => {
            this.showToast('Failed to copy', 'error');
        });
    }

    async paste() {
        try {
            const text = await navigator.clipboard.readText();
            const start = this.elements.editor.selectionStart;
            const end = this.elements.editor.selectionEnd;
            
            this.elements.editor.setRangeText(text, start, end, 'end');
            this.handleTextChange();
            this.showToast('Pasted from clipboard', 'success');
        } catch (error) {
            this.showToast('Failed to paste', 'error');
        }
    }

    clearText() {
        if (!this.elements.editor.value) return;
        
        this.showModal('Clear Text', 
            'Are you sure you want to clear all text?',
            [
                { label: 'Cancel', class: 'btn-secondary', action: () => this.hideModal() },
                { label: 'Clear', class: 'btn-danger', action: () => {
                    this.state.addToHistory('Clear Text', this.elements.editor.value);
                    this.elements.editor.value = '';
                    this.handleTextChange();
                    this.hideModal();
                    this.showToast('Text cleared', 'success');
                }}
            ]
        );
    }

    // Search functionality
    showSearch() {
        this.elements.searchOverlay.hidden = false;
        this.elements.searchOverlay.classList.add('show');
        setTimeout(() => this.elements.findInput.focus(), 100);
    }

    hideSearch() {
        this.elements.searchOverlay.classList.remove('show');
        setTimeout(() => {
            this.elements.searchOverlay.hidden = true;
            this.elements.findInput.value = '';
            this.elements.replaceInput.value = '';
        }, 300);
    }

    findNext() {
        const searchTerm = this.elements.findInput.value;
        if (!searchTerm) return;
        
        const text = this.elements.editor.value;
        const caseSensitive = this.elements.caseSensitive.checked;
        const useRegex = this.elements.useRegex.checked;
        
        let startPos = this.elements.editor.selectionEnd;
        let foundPos = -1;
        
        try {
            if (useRegex) {
                const flags = caseSensitive ? 'g' : 'gi';
                const regex = new RegExp(searchTerm, flags);
                const match = regex.exec(text.substring(startPos));
                if (match) {
                    foundPos = startPos + match.index;
                }
            } else {
                const searchIn = caseSensitive ? text : text.toLowerCase();
                const searchFor = caseSensitive ? searchTerm : searchTerm.toLowerCase();
                foundPos = searchIn.indexOf(searchFor, startPos);
            }
            
            if (foundPos === -1 && startPos > 0) {
                // Wrap around
                if (useRegex) {
                    const flags = caseSensitive ? 'g' : 'gi';
                    const regex = new RegExp(searchTerm, flags);
                    const match = regex.exec(text);
                    if (match) {
                        foundPos = match.index;
                    }
                } else {
                    const searchIn = caseSensitive ? text : text.toLowerCase();
                    const searchFor = caseSensitive ? searchTerm : searchTerm.toLowerCase();
                    foundPos = searchIn.indexOf(searchFor);
                }
            }
            
            if (foundPos !== -1) {
                this.elements.editor.setSelectionRange(foundPos, foundPos + searchTerm.length);
                this.elements.editor.focus();
                this.showToast('Found match', 'info');
            } else {
                this.showToast('No matches found', 'warning');
            }
        } catch (error) {
            this.showToast('Invalid search pattern', 'error');
        }
    }

    replace() {
        const searchTerm = this.elements.findInput.value;
        const replaceTerm = this.elements.replaceInput.value;
        
        if (!searchTerm) return;
        
        const selection = this.elements.editor.value.substring(
            this.elements.editor.selectionStart,
            this.elements.editor.selectionEnd
        );
        
        if (selection === searchTerm) {
            this.elements.editor.setRangeText(replaceTerm);
            this.handleTextChange();
            this.showToast('Replaced', 'success');
            this.findNext();
        } else {
            this.findNext();
        }
    }

    replaceAll() {
        const searchTerm = this.elements.findInput.value;
        const replaceTerm = this.elements.replaceInput.value;
        
        if (!searchTerm) return;
        
        const text = this.elements.editor.value;
        const caseSensitive = this.elements.caseSensitive.checked;
        const useRegex = this.elements.useRegex.checked;
        
        try {
            let newText;
            let count = 0;
            
            if (useRegex) {
                const flags = caseSensitive ? 'g' : 'gi';
                const regex = new RegExp(searchTerm, flags);
                newText = text.replace(regex, (match) => {
                    count++;
                    return replaceTerm;
                });
            } else {
                const regex = new RegExp(
                    searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                    caseSensitive ? 'g' : 'gi'
                );
                newText = text.replace(regex, (match) => {
                    count++;
                    return replaceTerm;
                });
            }
            
            if (count > 0) {
                this.state.addToHistory('Replace All', text);
                this.elements.editor.value = newText;
                this.handleTextChange();
                this.showToast(`Replaced ${count} occurrence(s)`, 'success');
            } else {
                this.showToast('No matches found', 'warning');
            }
        } catch (error) {
            this.showToast('Invalid search pattern', 'error');
        }
    }

    // UI utilities
    showModal(title, content, actions = []) {
        this.elements.modalTitle.textContent = title;
        
        if (typeof content === 'string') {
            this.elements.modalBody.innerHTML = content;
        } else {
            this.elements.modalBody.innerHTML = '';
            this.elements.modalBody.appendChild(content);
        }
        
        this.elements.modalFooter.innerHTML = actions.map((action, index) => `
            <button class="btn ${action.class}" data-action="${index}">
                ${action.label}
            </button>
        `).join('');
        
        // Add event listeners
        this.elements.modalFooter.querySelectorAll('button').forEach((btn, index) => {
            btn.addEventListener('click', () => actions[index].action());
        });
        
        this.elements.modalBackdrop.hidden = false;
        setTimeout(() => this.elements.modalBackdrop.classList.add('show'), 10);
    }

    hideModal() {
        this.elements.modalBackdrop.classList.remove('show');
        setTimeout(() => {
            this.elements.modalBackdrop.hidden = true;
            this.elements.modalBody.innerHTML = '';
            this.elements.modalFooter.innerHTML = '';
        }, 300);
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                           type === 'error' ? 'exclamation-circle' : 
                           type === 'warning' ? 'exclamation-triangle' : 
                           'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showContextMenu(event) {
        event.preventDefault();
        
        const x = event.pageX;
        const y = event.pageY;
        
        this.elements.contextMenu.style.left = `${x}px`;
        this.elements.contextMenu.style.top = `${y}px`;
        this.elements.contextMenu.hidden = false;
        
        // Add event listeners
        this.elements.contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                switch (action) {
                    case 'cut':
                        this.cut();
                        break;
                    case 'copy':
                        this.copy();
                        break;
                    case 'paste':
                        this.paste();
                        break;
                    case 'selectAll':
                        this.elements.editor.select();
                        break;
                }
                this.hideContextMenu();
            });
        });
    }

    hideContextMenu() {
        this.elements.contextMenu.hidden = true;
    }

    // Settings
    showSettings() {
        const settingsHTML = `
            <div class="settings-section">
                <h4>Theme</h4>
                <div class="settings-options">
                    <label class="settings-option">
                        <input type="radio" name="theme" value="light" ${this.state.settings.theme === 'light' ? 'checked' : ''}>
                        <span><i class="fas fa-sun"></i> Light</span>
                    </label>
                    <label class="settings-option">
                        <input type="radio" name="theme" value="dark" ${this.state.settings.theme === 'dark' ? 'checked' : ''}>
                        <span><i class="fas fa-moon"></i> Dark</span>
                    </label>
                </div>
            </div>
            
            <div class="settings-section">
                <h4>Editor</h4>
                <label class="settings-checkbox">
                    <input type="checkbox" id="autoSaveCheck" ${this.state.settings.autoSave ? 'checked' : ''}>
                    <span>Enable auto-save</span>
                </label>
                <label class="settings-checkbox">
                    <input type="checkbox" id="wordWrapCheck" ${this.state.settings.wordWrap ? 'checked' : ''}>
                    <span>Word wrap</span>
                </label>
                <label class="settings-checkbox">
                    <input type="checkbox" id="spellCheckCheck" ${this.state.settings.spellCheck ? 'checked' : ''}>
                    <span>Spell check</span>
                </label>
            </div>
            
            <div class="settings-section">
                <h4>Font Size</h4>
                <input type="range" id="fontSizeRange" min="12" max="24" value="${this.state.settings.fontSize}" class="settings-range">
                <span id="fontSizeValue">${this.state.settings.fontSize}px</span>
            </div>
            
            <div class="settings-section danger-zone">
                <h4>Danger Zone</h4>
                <button class="btn btn-danger" id="clearAllData">
                    <i class="fas fa-trash"></i> Clear All Data
                </button>
            </div>
        `;
        
        this.showModal('Settings', settingsHTML, [
            { label: 'Cancel', class: 'btn-secondary', action: () => this.hideModal() },
            { label: 'Save', class: 'btn-primary', action: () => this.saveSettings() }
        ]);
        
        // Add event listeners
        document.getElementById('fontSizeRange').addEventListener('input', (e) => {
            document.getElementById('fontSizeValue').textContent = `${e.target.value}px`;
        });
        
        document.getElementById('clearAllData').addEventListener('click', () => {
            this.clearAllData();
        });
    }

    saveSettings() {
        const newSettings = {
            theme: document.querySelector('input[name="theme"]:checked').value,
            autoSave: document.getElementById('autoSaveCheck').checked,
            wordWrap: document.getElementById('wordWrapCheck').checked,
            spellCheck: document.getElementById('spellCheckCheck').checked,
            fontSize: parseInt(document.getElementById('fontSizeRange').value)
        };
        
        this.state.updateSettings(newSettings);
        this.applySettings();
        this.hideModal();
        this.showToast('Settings saved', 'success');
    }

    applySettings() {
        // Theme
        document.documentElement.setAttribute('data-theme', this.state.settings.theme);
        this.elements.themeToggle.innerHTML = `<i class="fas fa-${this.state.settings.theme === 'dark' ? 'moon' : 'sun'}"></i>`;
        
        // Editor settings
        this.elements.editor.style.fontSize = `${this.state.settings.fontSize}px`;
        this.elements.editor.style.whiteSpace = this.state.settings.wordWrap ? 'pre-wrap' : 'pre';
        this.elements.editor.spellcheck = this.state.settings.spellCheck;
        
        // Auto-save
        if (this.state.settings.autoSave) {
            this.startAutoSave();
            this.elements.autoSaveIndicator.style.display = 'flex';
        } else {
            this.stopAutoSave();
            this.elements.autoSaveIndicator.style.display = 'none';
        }
    }

    clearAllData() {
        this.showModal('Clear All Data', 
            'Are you sure you want to clear all data? This will delete all saved texts, history, and settings. This action cannot be undone!',
            [
                { label: 'Cancel', class: 'btn-secondary', action: () => this.hideModal() },
                { label: 'Clear Everything', class: 'btn-danger', action: () => {
                    localStorage.clear();
                    this.showToast('All data cleared. Reloading...', 'info');
                    setTimeout(() => location.reload(), 1000);
                }}
            ]
        );
    }

    // Theme
    toggleTheme() {
        const newTheme = this.state.settings.theme === 'dark' ? 'light' : 'dark';
        this.state.updateSettings({ theme: newTheme });
        this.applySettings();
        this.showToast(`Switched to ${newTheme} theme`, 'info');
    }

    // Sidebar
    toggleSidebar(side) {
        const sidebar = side === 'left' ? this.elements.leftSidebar : this.elements.rightSidebar;
        sidebar.classList.toggle('collapsed');
        
        const icon = sidebar.querySelector('.sidebar-toggle i');
        if (side === 'left') {
            icon.className = sidebar.classList.contains('collapsed') ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
        } else {
            icon.className = sidebar.classList.contains('collapsed') ? 'fas fa-chevron-left' : 'fas fa-chevron-right';
        }
    }

    // Fullscreen
    toggleFullscreen() {
        if (!this.state.isFullscreen) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            }
            this.elements.fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
            this.state.isFullscreen = true;
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
            this.elements.fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
            this.state.isFullscreen = false;
        }
    }

    // Analytics
    showFullAnalytics() {
        const text = this.elements.editor.value;
        if (!text) {
            this.showToast('No text to analyze', 'warning');
            return;
        }
        
        const analytics = TextAnalyzer.analyze(text);
        
        const analyticsHTML = `
            <div class="analytics-report">
                <div class="analytics-section">
                    <h4>Basic Statistics</h4>
                    <div class="analytics-grid">
                        <div class="analytics-stat">
                            <span class="stat-label">Characters</span>
                            <span class="stat-value">${analytics.characters.toLocaleString()}</span>
                        </div>
                        <div class="analytics-stat">
                            <span class="stat-label">Words</span>
                            <span class="stat-value">${analytics.words.toLocaleString()}</span>
                        </div>
                        <div class="analytics-stat">
                            <span class="stat-label">Sentences</span>
                            <span class="stat-value">${analytics.sentences.toLocaleString()}</span>
                        </div>
                        <div class="analytics-stat">
                            <span class="stat-label">Paragraphs</span>
                            <span class="stat-value">${analytics.paragraphs.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                <div class="analytics-section">
                    <h4>Readability</h4>
                    <div class="readability-score">
                        <div class="score-circle ${analytics.readability.class}">
                            ${analytics.readability.score}
                        </div>
                        <div class="score-details">
                            <h5>${analytics.readability.level}</h5>
                            <p>${analytics.readability.description}</p>
                            <p class="score-breakdown">
                                Flesch-Kincaid Grade: ${analytics.fleschKincaid.toFixed(1)}<br>
                                Avg words/sentence: ${analytics.avgWordsPerSentence.toFixed(1)}<br>
                                Avg syllables/word: ${analytics.avgSyllablesPerWord.toFixed(1)}
                            </p>
                        </div>
                    </div>
                </div>
                
                <div class="analytics-section">
                    <h4>Reading Time</h4>
                    <div class="reading-time-grid">
                        <div class="reading-speed">
                            <span class="speed-label">Slow (150 wpm)</span>
                            <span class="speed-time">${Math.ceil(analytics.words / 150)} min</span>
                        </div>
                        <div class="reading-speed">
                            <span class="speed-label">Average (200 wpm)</span>
                            <span class="speed-time">${Math.ceil(analytics.words / 200)} min</span>
                        </div>
                        <div class="reading-speed">
                            <span class="speed-label">Fast (250 wpm)</span>
                            <span class="speed-time">${Math.ceil(analytics.words / 250)} min</span>
                        </div>
                    </div>
                </div>
                
                <div class="analytics-section">
                    <h4>Word Frequency</h4>
                    <div class="word-frequency">
                        ${analytics.topWords.slice(0, 10).map(([word, count]) => `
                            <div class="word-item">
                                <span class="word">${word}</span>
                                <span class="count">${count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        this.showModal('Text Analysis', analyticsHTML, [
            { label: 'Close', class: 'btn-primary', action: () => this.hideModal() }
        ]);
    }

    // Auto-save
    startAutoSave() {
        if (this.autoSaveTimer) return;
        
        this.autoSaveTimer = setInterval(() => {
            if (this.state.currentText !== this.elements.editor.value) {
                this.state.currentText = this.elements.editor.value;
                this.state.saveToStorage();
                this.elements.statusMessage.textContent = 'Auto-saved';
                this.elements.statusMessage.classList.add('success');
                setTimeout(() => {
                    this.elements.statusMessage.textContent = 'Ready';
                    this.elements.statusMessage.classList.remove('success');
                }, 2000);
            }
        }, this.state.settings.autoSaveInterval);
    }

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    // Keyboard shortcuts
    handleKeyboard(event) {
        const ctrl = event.ctrlKey || event.metaKey;
        
        if (ctrl) {
            switch (event.key) {
                case 's':
                    event.preventDefault();
                    this.saveText();
                    break;
                case 'f':
                    event.preventDefault();
                    this.showSearch();
                    break;
                case 'z':
                    if (!event.shiftKey) {
                        event.preventDefault();
                        this.undo();
                    }
                    break;
                case 'y':
                    event.preventDefault();
                    this.redo();
                    break;
                case 'a':
                    // Let default select all behavior work
                    break;
            }
        } else if (event.key === 'Escape') {
            if (!this.elements.modalBackdrop.hidden) {
                this.hideModal();
            } else if (!this.elements.searchOverlay.hidden) {
                this.hideSearch();
            }
        }
    }

    handleBeforeUnload(event) {
        if (this.state.currentText !== this.elements.editor.value && this.elements.editor.value.trim()) {
            event.preventDefault();
            event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        }
    }

    hideLoadingScreen() {
        setTimeout(() => {
            this.elements.loadingScreen.classList.add('hide');
            this.elements.app.classList.add('loaded');
            
            // Set initial text
            this.elements.editor.value = this.state.currentText;
            this.updateStats();
            this.updateMiniAnalytics();
            this.updateButtonStates();
            
            setTimeout(() => {
                this.elements.loadingScreen.style.display = 'none';
            }, 350);
        }, 500);
    }
}

// ===== Text Analyzer =====
class TextAnalyzer {
    static analyze(text) {
        if (!text.trim()) {
            return this.getEmptyAnalysis();
        }
        
        const characters = text.length;
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        const sentences = this.countSentences(text);
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length;
        const syllables = this.countSyllables(text);
        
        const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;
        const avgSyllablesPerWord = words > 0 ? syllables / words : 0;
        
        // Flesch Reading Ease
        const fleschScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
        const readability = this.getReadabilityLevel(fleschScore);
        
        // Flesch-Kincaid Grade Level
        const fleschKincaid = 0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59;
        
        // Word frequency
        const wordFreq = this.getWordFrequency(text);
        const topWords = Object.entries(wordFreq)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 20);
        
        return {
            characters,
            words,
            sentences,
            paragraphs,
            syllables,
            avgWordsPerSentence,
            avgSyllablesPerWord,
            fleschScore: Math.max(0, Math.min(100, fleschScore)),
            fleschKincaid: Math.max(0, fleschKincaid),
            readability,
            topWords
        };
    }
    
    static getEmptyAnalysis() {
        return {
            characters: 0,
            words: 0,
            sentences: 0,
            paragraphs: 0,
            syllables: 0,
            avgWordsPerSentence: 0,
            avgSyllablesPerWord: 0,
            fleschScore: 0,
            fleschKincaid: 0,
            readability: { score: 0, level: 'N/A', description: 'No text to analyze', class: 'easy' },
            topWords: []
        };
    }
    
    static countSentences(text) {
        // Count sentences ending with ., !, ?, or ellipsis
        const sentences = text.match(/[.!?…]+(\s|$)/g);
        return sentences ? sentences.length : 0;
    }
    
    static countSyllables(text) {
        const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
        let totalSyllables = 0;
        
        words.forEach(word => {
            totalSyllables += this.countWordSyllables(word);
        });
        
        return totalSyllables;
    }
    
    static countWordSyllables(word) {
        word = word.toLowerCase();
        let count = 0;
        let previousWasVowel = false;
        
        for (let i = 0; i < word.length; i++) {
            const isVowel = 'aeiouy'.includes(word[i]);
            if (isVowel && !previousWasVowel) {
                count++;
            }
            previousWasVowel = isVowel;
        }
        
        // Adjust for silent e
        if (word.endsWith('e')) {
            count--;
        }
        
        // Words should have at least one syllable
        return Math.max(1, count);
    }
    
    static getReadabilityLevel(score) {
        if (score >= 90) {
            return { score: Math.round(score), level: 'Very Easy', description: '5th grade level', class: 'very-easy' };
        } else if (score >= 80) {
            return { score: Math.round(score), level: 'Easy', description: '6th grade level', class: 'easy' };
        } else if (score >= 70) {
            return { score: Math.round(score), level: 'Fairly Easy', description: '7th grade level', class: 'fairly-easy' };
        } else if (score >= 60) {
            return { score: Math.round(score), level: 'Standard', description: '8th-9th grade level', class: 'standard' };
        } else if (score >= 50) {
            return { score: Math.round(score), level: 'Fairly Difficult', description: '10th-12th grade level', class: 'fairly-difficult' };
        } else if (score >= 30) {
            return { score: Math.round(score), level: 'Difficult', description: 'College level', class: 'difficult' };
        } else {
            return { score: Math.round(score), level: 'Very Difficult', description: 'Graduate level', class: 'very-difficult' };
        }
    }
    
    static getWordFrequency(text) {
        const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'it', 'that', 'this', 'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they']);
        
        const frequency = {};
        
        words.forEach(word => {
            if (word.length > 2 && !stopWords.has(word)) {
                frequency[word] = (frequency[word] || 0) + 1;
            }
        });
        
        return frequency;
    }
}

// ===== Text Encoder Utilities =====
class TextEncoder {
    static toMorse(text) {
        const morseCode = {
            'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
            'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
            'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
            'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
            'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
            '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
            '8': '---..', '9': '----.', '.': '.-.-.-', ',': '--..--', '?': '..--..',
            "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
            '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.',
            '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
            ' ': '/'
        };
        
        return text.toUpperCase().split('').map(char => morseCode[char] || char).join(' ');
    }
}

// ===== Initialize App =====
const state = new AppState();
const ui = new UIManager(state);

// Load saved data
state.loadFromStorage();

// Initialize UI when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ui.init());
} else {
    ui.init();
}

// Add styles for custom elements
const style = document.createElement('style');
style.textContent = `
.history-item, .saved-item {
    padding: 12px;
    margin-bottom: 8px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
}

.history-header, .saved-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.history-action, .saved-title {
    font-weight: 500;
    color: var(--text-primary);
}

.history-time {
    font-size: 0.75rem;
    color: var(--text-muted);
}

.history-stats, .saved-stats {
    display: flex;
    gap: 12px;
    font-size: 0.75rem;
    color: var(--text-tertiary);
    margin-bottom: 8px;
}

.modal-input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: 0.875rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--bg-primary);
    color: var(--text-primary);
}

.modal-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-alpha);
}

.settings-section {
    margin-bottom: 24px;
}

.settings-section h4 {
    font-size: 0.875rem;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--text-secondary);
}

.settings-options {
    display: flex;
    gap: 16px;
}

.settings-option {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

.settings-option input[type="radio"] {
    accent-color: var(--color-primary);
}

.settings-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    cursor: pointer;
}

.settings-checkbox input[type="checkbox"] {
    accent-color: var(--color-primary);
}

.settings-range {
    width: 100%;
    margin-bottom: 8px;
    accent-color: var(--color-primary);
}

.danger-zone {
    padding-top: 24px;
    border-top: 1px solid var(--border-color);
}

.analytics-report {
    max-height: 60vh;
    overflow-y: auto;
}

.analytics-section {
    margin-bottom: 24px;
}

.analytics-section h4 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--text-primary);
}

.analytics-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}

.analytics-stat {
    background: var(--bg-tertiary);
    padding: 12px;
    border-radius: var(--radius-md);
    text-align: center;
}

.stat-label {
    display: block;
    font-size: 0.75rem;
    color: var(--text-tertiary);
    text-transform: uppercase;
}

.stat-value {
    display: block;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-primary);
}

.readability-score {
    display: flex;
    gap: 20px;
    align-items: center;
}

.score-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
}

.score-circle.very-easy { background: #10b981; }
.score-circle.easy { background: #34d399; }
.score-circle.fairly-easy { background: #fbbf24; }
.score-circle.standard { background: #f59e0b; }
.score-circle.fairly-difficult { background: #f97316; }
.score-circle.difficult { background: #ef4444; }
.score-circle.very-difficult { background: #dc2626; }

.score-details h5 {
    font-size: 1rem;
    margin-bottom: 4px;
}

.score-breakdown {
    font-size: 0.875rem;
    color: var(--text-tertiary);
    line-height: 1.6;
}

.reading-time-grid {
    display: grid;
    gap: 8px;
}

.reading-speed {
    display: flex;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
}

.speed-label {
    color: var(--text-secondary);
}

.speed-time {
    font-weight: 600;
    color: var(--color-primary);
}

.word-frequency {
    display: grid;
    gap: 4px;
}

.word-item {
    display: flex;
    justify-content: space-between;
    padding: 6px 12px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-sm);
}

.word {
    font-weight: 500;
}

.count {
    color: var(--text-tertiary);
}

@keyframes slideOut {
    to {
        transform: translateX(110%);
        opacity: 0;
    }
}
`;
document.head.appendChild(style);
