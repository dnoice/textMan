// textMan v2 - Complete JavaScript Implementation

// ===== Constants & Configuration =====
const APP_VERSION = '2.0.0';
const APP_NAME = 'textMan';

const STORAGE_KEYS = {
    CURRENT_TEXT: 'textman_v2_current',
    HISTORY: 'textman_v2_history',
    SAVED_TEXTS: 'textman_v2_saved',
    SETTINGS: 'textman_v2_settings',
    UI_STATE: 'textman_v2_ui_state',
    LAST_SAVED: 'textman_v2_last_saved'
};

const DEFAULT_SETTINGS = {
    theme: 'dark',
    autoSave: true,
    autoSaveInterval: 30000,
    fontSize: 14,
    fontFamily: 'JetBrains Mono',
    wordWrap: true,
    spellCheck: true,
    showLineNumbers: false,
    highlightCurrentLine: true,
    tabSize: 4
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
    },
    report: {
        name: 'Report',
        icon: 'fa-file-alt',
        content: `[Report Title]
${new Date().toLocaleDateString()}

Executive Summary
-----------------
[Brief overview of the report's key findings and recommendations]

Introduction
------------
[Background information and context]

Methodology
-----------
[How data was collected and analyzed]

Findings
--------
1. [Finding 1]
   - Supporting data
   - Analysis

2. [Finding 2]
   - Supporting data
   - Analysis

3. [Finding 3]
   - Supporting data
   - Analysis

Recommendations
---------------
1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

Conclusion
----------
[Summary and next steps]

Appendices
----------
[Additional supporting material]`
    },
    code: {
        name: 'Code Documentation',
        icon: 'fa-code',
        content: `/**
 * [Component/Module Name]
 * 
 * @description [Brief description of what this does]
 * @author [Your Name]
 * @date ${new Date().toLocaleDateString()}
 * @version 1.0.0
 */

// Dependencies
import { dependency1, dependency2 } from './dependencies';

// Constants
const CONFIG = {
    // Configuration options
};

/**
 * [Function Name]
 * @param {Type} paramName - Description
 * @returns {Type} Description
 */
function functionName(paramName) {
    // Implementation
}

// Usage Example
/*
const example = functionName(param);
console.log(example);
*/

// Export
export { functionName };`
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
        this.uiState = {
            leftSidebarCollapsed: false,
            rightSidebarCollapsed: false,
            panelStates: {}
        };
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
            charCount: text.length,
            tags: [],
            favorite: false
        };
        
        this.savedTexts.unshift(saved);
        this.saveToStorage();
        return saved;
    }

    updateSavedText(id, updates) {
        const index = this.savedTexts.findIndex(text => text.id === id);
        if (index !== -1) {
            this.savedTexts[index] = { ...this.savedTexts[index], ...updates };
            this.saveToStorage();
        }
    }

    deleteSavedText(id) {
        this.savedTexts = this.savedTexts.filter(text => text.id !== id);
        this.saveToStorage();
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveToStorage();
    }

    updateUIState(updates) {
        this.uiState = { ...this.uiState, ...updates };
        this.saveToStorage();
    }

    saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEYS.CURRENT_TEXT, this.currentText);
            localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(this.history));
            localStorage.setItem(STORAGE_KEYS.SAVED_TEXTS, JSON.stringify(this.savedTexts));
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
            localStorage.setItem(STORAGE_KEYS.UI_STATE, JSON.stringify(this.uiState));
            localStorage.setItem(STORAGE_KEYS.LAST_SAVED, Date.now().toString());
            this.lastSaved = Date.now();
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
            return false;
        }
        return true;
    }

    loadFromStorage() {
        try {
            this.currentText = localStorage.getItem(STORAGE_KEYS.CURRENT_TEXT) || '';
            this.history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
            this.savedTexts = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_TEXTS) || '[]');
            this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}') };
            this.uiState = { 
                leftSidebarCollapsed: false,
                rightSidebarCollapsed: false,
                panelStates: {},
                ...JSON.parse(localStorage.getItem(STORAGE_KEYS.UI_STATE) || '{}') 
            };
            this.lastSaved = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_SAVED) || Date.now());
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
            this.resetToDefaults();
        }
    }

    resetToDefaults() {
        this.currentText = '';
        this.history = [];
        this.savedTexts = [];
        this.settings = { ...DEFAULT_SETTINGS };
        this.uiState = {
            leftSidebarCollapsed: false,
            rightSidebarCollapsed: false,
            panelStates: {}
        };
    }

    countWords(text) {
        return text.trim() ? text.trim().split(/\s+/).length : 0;
    }

    clearAllData() {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        this.resetToDefaults();
    }
}

// ===== UI Manager =====
class UIManager {
    constructor(state) {
        this.state = state;
        this.elements = {};
        this.autoSaveTimer = null;
        this.searchIndex = -1;
        this.searchMatches = [];
        this.isInitialized = false;
    }

    async init() {
        try {
            // Show loading progress
            this.updateLoadingProgress(10);
            
            // Cache DOM elements
            this.cacheElements();
            this.updateLoadingProgress(20);
            
            // Setup event listeners
            this.setupEventListeners();
            this.updateLoadingProgress(30);
            
            // Initialize UI components
            this.renderQuickActions();
            this.updateLoadingProgress(40);
            
            this.renderTemplates();
            this.updateLoadingProgress(50);
            
            this.renderTools();
            this.updateLoadingProgress(60);
            
            // Update displays
            this.updateHistory();
            this.updateLoadingProgress(70);
            
            this.updateSavedTexts();
            this.updateLoadingProgress(80);
            
            // Apply settings and restore state
            this.applySettings();
            this.restoreUIState();
            this.updateLoadingProgress(90);
            
            // Start auto-save if enabled
            if (this.state.settings.autoSave) {
                this.startAutoSave();
            }
            
            // Final initialization
            this.updateLoadingProgress(100);
            
            // Hide loading screen after a brief delay
            await this.delay(300);
            this.hideLoadingScreen();
            
            this.isInitialized = true;
            this.showToast('Welcome to textMan v2!', 'success');
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.handleInitError(error);
        }
    }

    updateLoadingProgress(percent) {
        const progressBar = document.querySelector('.loading-progress');
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    handleInitError(error) {
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = 'Error loading textMan. Please refresh the page.';
            loadingText.style.color = '#ef4444';
        }
        console.error('Failed to initialize textMan:', error);
    }

    cacheElements() {
        // This method caches all DOM elements for better performance
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
        // Editor events
        this.elements.editor.addEventListener('input', () => this.handleTextChange());
        this.elements.editor.addEventListener('contextmenu', (e) => this.showContextMenu(e));
        this.elements.editor.addEventListener('keydown', (e) => this.handleEditorKeydown(e));
        this.elements.editor.addEventListener('scroll', () => this.handleEditorScroll());
        
        // Toolbar events
        this.elements.undoBtn.addEventListener('click', () => this.undo());
        this.elements.redoBtn.addEventListener('click', () => this.redo());
        this.elements.cutBtn.addEventListener('click', () => this.cut());
        this.elements.copyBtn.addEventListener('click', () => this.copy());
        this.elements.pasteBtn.addEventListener('click', () => this.paste());
        this.elements.saveBtn.addEventListener('click', () => this.saveText());
        this.elements.clearBtn.addEventListener('click', () => this.clearText());
        
        // Text formatting buttons (these will wrap selected text)
        this.elements.boldBtn.addEventListener('click', () => this.wrapSelection('**', '**'));
        this.elements.italicBtn.addEventListener('click', () => this.wrapSelection('*', '*'));
        this.elements.underlineBtn.addEventListener('click', () => this.wrapSelection('<u>', '</u>'));
        
        // Header events
        this.elements.searchBtn.addEventListener('click', () => this.showSearch());
        this.elements.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.elements.settingsBtn.addEventListener('click', () => this.showSettings());
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Sidebar toggles
        document.querySelectorAll('.sidebar-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sidebar = e.target.closest('.sidebar').id;
                this.toggleSidebar(sidebar === 'leftSidebar' ? 'left' : 'right');
            });
        });
        
        // Panel headers
        document.querySelectorAll('.panel-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const section = e.target.closest('.panel-section');
                this.togglePanel(section);
            });
        });
        
        // Modal events
        this.elements.modalBackdrop.addEventListener('click', (e) => {
            if (e.target === this.elements.modalBackdrop) {
                this.hideModal();
            }
        });
        this.elements.modalClose.addEventListener('click', () => this.hideModal());
        
        // Search events
        this.elements.searchClose.addEventListener('click', () => this.hideSearch());
        this.elements.findInput.addEventListener('input', () => this.resetSearch());
        this.elements.findInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.findNext();
            }
        });
        this.elements.replaceInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.replace();
            }
        });
        this.elements.findNextBtn.addEventListener('click', () => this.findNext());
        this.elements.replaceBtn.addEventListener('click', () => this.replace());
        this.elements.replaceAllBtn.addEventListener('click', () => this.replaceAll());
        
        // Import/Export
        this.elements.importBtn.addEventListener('click', () => this.elements.fileInput.click());
        this.elements.fileInput.addEventListener('change', (e) => this.importFile(e));
        
        // Analytics
        this.elements.fullAnalyticsBtn.addEventListener('click', () => this.showFullAnalytics());
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleGlobalKeyboard(e));
        
        // Window events
        window.addEventListener('beforeunload', (e) => this.handleBeforeUnload(e));
        window.addEventListener('resize', () => this.handleResize());
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('click', () => this.hideContextMenu());
        
        // Prevent accidental navigation
        this.elements.editor.addEventListener('dragover', (e) => e.preventDefault());
        this.elements.editor.addEventListener('drop', (e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('text/')) {
                this.importFile({ target: { files: [file] } });
            }
        });
    }

    // ===== Text Editor Methods =====
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
        
        // Update UI
        this.updateStats();
        this.updateMiniAnalytics();
        this.updateButtonStates();
        
        // Update status
        this.updateStatus('Typing...', 'default');
    }

    handleEditorKeydown(e) {
        // Tab key handling
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.elements.editor.selectionStart;
            const end = this.elements.editor.selectionEnd;
            const spaces = ' '.repeat(this.state.settings.tabSize);
            
            this.elements.editor.setRangeText(spaces, start, end, 'end');
            this.handleTextChange();
        }
    }

    handleEditorScroll() {
        // Update line highlight if enabled
        if (this.state.settings.highlightCurrentLine) {
            // This would require additional implementation for line highlighting
        }
    }

    wrapSelection(prefix, suffix) {
        const start = this.elements.editor.selectionStart;
        const end = this.elements.editor.selectionEnd;
        const selectedText = this.elements.editor.value.substring(start, end);
        
        if (selectedText) {
            const wrappedText = prefix + selectedText + suffix;
            this.elements.editor.setRangeText(wrappedText, start, end, 'select');
            this.handleTextChange();
        } else {
            // Insert at cursor with placeholder
            const placeholder = 'text';
            const wrappedText = prefix + placeholder + suffix;
            this.elements.editor.setRangeText(wrappedText, start, end, 'select');
            // Select the placeholder
            this.elements.editor.setSelectionRange(start + prefix.length, start + prefix.length + placeholder.length);
            this.handleTextChange();
        }
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

    updateStatus(message, type = 'default', duration = 0) {
        this.elements.statusMessage.textContent = message;
        this.elements.statusMessage.className = `status-message ${type}`;
        
        if (duration > 0) {
            setTimeout(() => {
                this.elements.statusMessage.textContent = 'Ready';
                this.elements.statusMessage.className = 'status-message';
            }, duration);
        }
    }

    // ===== Quick Actions =====
    renderQuickActions() {
        this.elements.quickActions.innerHTML = QUICK_ACTIONS.map(action => `
            <button class="quick-action-btn" data-action="${action.id}" title="${action.label}">
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

    // ===== Templates =====
    renderTemplates() {
        this.elements.templatesContent.innerHTML = Object.entries(TEMPLATES).map(([key, template]) => `
            <button class="tool-btn" data-template="${key}" title="Apply ${template.name} template">
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
                `<p>This will replace your current text with the "${template.name}" template.</p>
                 <p>Your current text will be saved to history.</p>
                 <p><strong>Are you sure you want to continue?</strong></p>`,
                [
                    { label: 'Cancel', class: 'btn-secondary', action: () => this.hideModal() },
                    { label: 'Apply Template', class: 'btn-primary', action: () => {
                        this.state.addToHistory(`Apply Template: ${template.name}`, this.elements.editor.value);
                        this.elements.editor.value = template.content;
                        this.handleTextChange();
                        this.hideModal();
                        this.showToast(`Applied ${template.name} template`, 'success');
                        this.updateStatus(`Template applied: ${template.name}`, 'success', 3000);
                    }}
                ]
            );
        } else {
            this.elements.editor.value = template.content;
            this.handleTextChange();
            this.showToast(`Applied ${template.name} template`, 'success');
            this.updateStatus(`Template applied: ${template.name}`, 'success', 3000);
        }
    }

    // ===== Text Tools =====
    renderTools() {
        // Transform tools
        this.elements.transformTools.innerHTML = `
            <button class="tool-btn" data-transform="title" title="Title Case">Title Case</button>
            <button class="tool-btn" data-transform="sentence" title="Sentence case">Sentence case</button>
            <button class="tool-btn" data-transform="capitalize" title="Capitalize Each Word">Capitalize</button>
            <button class="tool-btn" data-transform="alternate" title="aLtErNaTe CaSe">aLtErNaTe</button>
            <button class="tool-btn" data-transform="camel" title="camelCase">camelCase</button>
            <button class="tool-btn" data-transform="pascal" title="PascalCase">PascalCase</button>
            <button class="tool-btn" data-transform="snake" title="snake_case">snake_case</button>
            <button class="tool-btn" data-transform="kebab" title="kebab-case">kebab-case</button>
        `;
        
        // Format tools
        this.elements.formatTools.innerHTML = `
            <button class="tool-btn" data-format="trim" title="Remove leading/trailing spaces">Trim Spaces</button>
            <button class="tool-btn" data-format="remove-extra" title="Remove extra spaces">Remove Extra</button>
            <button class="tool-btn" data-format="remove-lines" title="Remove all line breaks">Remove Lines</button>
            <button class="tool-btn" data-format="sort" title="Sort lines alphabetically">Sort Lines</button>
            <button class="tool-btn" data-format="reverse" title="Reverse line order">Reverse Lines</button>
            <button class="tool-btn" data-format="unique" title="Remove duplicate lines">Unique Lines</button>
            <button class="tool-btn" data-format="number" title="Add line numbers">Number Lines</button>
            <button class="tool-btn" data-format="shuffle" title="Randomly shuffle lines">Shuffle Lines</button>
        `;
        
        // Encode tools
        this.elements.encodeTools.innerHTML = `
            <button class="tool-btn" data-encode="base64-encode" title="Encode to Base64">Base64 Encode</button>
            <button class="tool-btn" data-encode="base64-decode" title="Decode from Base64">Base64 Decode</button>
            <button class="tool-btn" data-encode="url-encode" title="URL encode text">URL Encode</button>
            <button class="tool-btn" data-encode="url-decode" title="URL decode text">URL Decode</button>
            <button class="tool-btn" data-encode="html-encode" title="HTML encode text">HTML Encode</button>
            <button class="tool-btn" data-encode="html-decode" title="HTML decode text">HTML Decode</button>
            <button class="tool-btn" data-encode="morse" title="Convert to Morse code">Morse Code</button>
            <button class="tool-btn" data-encode="reverse" title="Reverse text">Reverse Text</button>
        `;
        
        // Export options
        this.elements.exportOptions.innerHTML = `
            <button class="tool-btn" data-export="txt" title="Export as plain text file">
                <i class="fas fa-file-alt"></i> Export as TXT
            </button>
            <button class="tool-btn" data-export="pdf" title="Export as PDF (print)">
                <i class="fas fa-file-pdf"></i> Export as PDF
            </button>
            <button class="tool-btn" data-export="json" title="Export as JSON with metadata">
                <i class="fas fa-file-code"></i> Export as JSON
            </button>
            <button class="tool-btn" data-export="markdown" title="Export as Markdown file">
                <i class="fas fa-file-alt"></i> Export as MD
            </button>
            <button class="tool-btn" data-export="html" title="Export as HTML file">
                <i class="fas fa-file-code"></i> Export as HTML
            </button>
            <button class="tool-btn" data-export="docx" title="Export as Word document">
                <i class="fas fa-file-word"></i> Export as DOCX
            </button>
        `;
        
        // Add all event listeners
        document.querySelectorAll('[data-transform]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.transformText(e.currentTarget.dataset.transform);
            });
        });
        
        document.querySelectorAll('[data-format]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.formatText(e.currentTarget.dataset.format);
            });
        });
        
        document.querySelectorAll('[data-encode]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.encodeText(e.currentTarget.dataset.encode);
            });
        });
        
        document.querySelectorAll('[data-export]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.exportText(e.currentTarget.dataset.export);
            });
        });
    }

    // ===== Text Manipulation Methods =====
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
            this.updateStatus(`Transformation applied: ${type}`, 'success', 3000);
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
                formatted = text.split('\n').sort((a, b) => a.localeCompare(b)).join('\n');
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
            this.updateStatus(`Formatting applied: ${type}`, 'success', 3000);
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
                this.updateStatus(`Encoding applied: ${type}`, 'success', 3000);
            }
        } catch (error) {
            this.showToast(`Failed to ${type}: ${error.message}`, 'error');
            this.updateStatus(`Error: ${error.message}`, 'error', 5000);
        }
    }

    // ===== File Operations =====
    importFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showToast('File too large. Maximum size is 10MB.', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.state.addToHistory(`Import: ${file.name}`, this.elements.editor.value);
            this.elements.editor.value = e.target.result;
            this.handleTextChange();
            this.showToast(`Imported ${file.name}`, 'success');
            this.updateStatus(`File imported: ${file.name}`, 'success', 3000);
        };
        reader.onerror = () => {
            this.showToast('Failed to read file', 'error');
            this.updateStatus('Error reading file', 'error', 3000);
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
                        charCount: text.length,
                        lineCount: text.split('\n').length,
                        app: APP_NAME,
                        version: APP_VERSION
                    }
                }, null, 2);
                mimeType = 'application/json';
                break;
                
            case 'markdown':
                filename = `textman-${timestamp}.md`;
                content = text;
                mimeType = 'text/markdown';
                break;
                
            case 'html':
                filename = `textman-${timestamp}.html`;
                content = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>textMan Export - ${timestamp}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #333;
        }
        pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #ddd;
        }
        .metadata {
            background: #e9ecef;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-size: 0.9em;
        }
        .metadata h2 {
            margin-top: 0;
            color: #495057;
        }
    </style>
</head>
<body>
    <div class="metadata">
        <h2>Document Information</h2>
        <p><strong>Exported:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Words:</strong> ${this.state.countWords(text).toLocaleString()}</p>
        <p><strong>Characters:</strong> ${text.length.toLocaleString()}</p>
        <p><strong>Lines:</strong> ${text.split('\n').length.toLocaleString()}</p>
    </div>
    <pre>${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</body>
</html>`;
                mimeType = 'text/html';
                break;
                
            case 'docx':
                this.exportAsDocx(text);
                return;
                
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
        this.updateStatus(`Exported as ${format.toUpperCase()}`, 'success', 3000);
    }

    exportAsPDF(text) {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            this.showToast('Please allow popups to export PDF', 'error');
            return;
        }
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>textMan Export - ${new Date().toLocaleDateString()}</title>
                <style>
                    @page {
                        size: A4;
                        margin: 1in;
                    }
                    body {
                        font-family: 'Times New Roman', serif;
                        line-height: 1.6;
                        color: #000;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #000;
                        padding-bottom: 20px;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 24px;
                    }
                    .metadata {
                        margin-bottom: 30px;
                        background: #f0f0f0;
                        padding: 15px;
                        border-radius: 5px;
                    }
                    .metadata p {
                        margin: 5px 0;
                        font-size: 12px;
                    }
                    .content {
                        white-space: pre-wrap;
                        word-wrap: break-word;
                        font-family: 'Courier New', monospace;
                        font-size: 11px;
                    }
                    @media print {
                        .no-print {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>textMan Document Export</h1>
                    <p>${new Date().toLocaleString()}</p>
                </div>
                <div class="metadata">
                    <p><strong>Document Statistics:</strong></p>
                    <p>Words: ${this.state.countWords(text).toLocaleString()} | 
                       Characters: ${text.length.toLocaleString()} | 
                       Lines: ${text.split('\n').length.toLocaleString()}</p>
                </div>
                <div class="content">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() {
                            window.close();
                        }, 100);
                    }
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        this.showToast('Opening print dialog...', 'info');
    }

    exportAsDocx(text) {
        // For DOCX export, we'll create a simple HTML that can be opened in Word
        const content = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>textMan Export</title>
                <style>
                    body { font-family: Calibri, sans-serif; }
                    @page { size: 8.5in 11in; margin: 1in; }
                </style>
            </head>
            <body>
                <div style='font-size: 11pt; line-height: 1.5;'>
                    ${text.split('\n').map(line => `<p>${line || '&nbsp;'}</p>`).join('')}
                </div>
            </body>
            </html>
        `;
        
        const blob = new Blob([content], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `textman-${new Date().toISOString().slice(0, 10)}.doc`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('Exported as Word document', 'success');
    }

    // ===== History & Saved Texts =====
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
        
        this.elements.historyContent.innerHTML = this.state.history.slice(0, 20).map(entry => `
            <div class="history-item" data-id="${entry.id}">
                <div class="history-header">
                    <span class="history-action">${entry.action}</span>
                    <span class="history-time" title="${new Date(entry.timestamp).toLocaleString()}">
                        ${this.formatRelativeTime(entry.timestamp)}
                    </span>
                </div>
                <div class="history-stats">
                    <span><i class="fas fa-font"></i> ${entry.wordCount.toLocaleString()}</span>
                    <span><i class="fas fa-text-width"></i> ${entry.charCount.toLocaleString()}</span>
                </div>
                <div class="history-preview">${this.truncateText(entry.text, 100)}</div>
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
        this.updateStatus('Text restored from history', 'success', 3000);
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
            <div class="saved-item ${saved.favorite ? 'favorite' : ''}" data-id="${saved.id}">
                <div class="saved-header">
                    <span class="saved-title">
                        ${saved.favorite ? '<i class="fas fa-star" style="color: #f59e0b;"></i>' : ''}
                        ${saved.title}
                    </span>
                    <div class="saved-actions">
                        <button class="icon-btn icon-btn-sm" onclick="ui.toggleFavorite(${saved.id})" 
                                title="${saved.favorite ? 'Remove from favorites' : 'Add to favorites'}">
                            <i class="fas fa-star ${saved.favorite ? 'text-yellow-500' : ''}"></i>
                        </button>
                        <button class="icon-btn icon-btn-sm" onclick="ui.deleteSaved(${saved.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="saved-stats">
                    <span><i class="fas fa-font"></i> ${saved.wordCount.toLocaleString()}</span>
                    <span><i class="fas fa-text-width"></i> ${saved.charCount.toLocaleString()}</span>
                    <span><i class="fas fa-clock"></i> ${this.formatRelativeTime(saved.timestamp)}</span>
                </div>
                <div class="saved-preview">${this.truncateText(saved.text, 100)}</div>
                <button class="tool-btn" onclick="ui.loadSaved(${saved.id})">
                    <i class="fas fa-download"></i> Load
                </button>
            </div>
        `).join('');
    }

    toggleFavorite(id) {
        const saved = this.state.savedTexts.find(s => s.id === id);
        if (saved) {
            saved.favorite = !saved.favorite;
            this.state.saveToStorage();
            this.updateSavedTexts();
            this.showToast(saved.favorite ? 'Added to favorites' : 'Removed from favorites', 'success');
        }
    }

    loadSaved(id) {
        const saved = this.state.savedTexts.find(s => s.id === id);
        if (!saved) return;
        
        if (this.elements.editor.value.trim()) {
            this.showModal('Load Saved Text', 
                `<p>This will replace your current text with "${saved.title}".</p>
                 <p>Your current text will be saved to history.</p>
                 <p><strong>Continue?</strong></p>`,
                [
                    { label: 'Cancel', class: 'btn-secondary', action: () => this.hideModal() },
                    { label: 'Load Text', class: 'btn-primary', action: () => {
                        this.state.addToHistory('Load Saved Text', this.elements.editor.value);
                        this.elements.editor.value = saved.text;
                        this.handleTextChange();
                        this.hideModal();
                        this.showToast(`Loaded "${saved.title}"`, 'success');
                        this.updateStatus(`Loaded: ${saved.title}`, 'success', 3000);
                    }}
                ]
            );
        } else {
            this.elements.editor.value = saved.text;
            this.handleTextChange();
            this.showToast(`Loaded "${saved.title}"`, 'success');
            this.updateStatus(`Loaded: ${saved.title}`, 'success', 3000);
        }
    }

    deleteSaved(id) {
        const saved = this.state.savedTexts.find(s => s.id === id);
        if (!saved) return;
        
        this.showModal('Delete Saved Text', 
            `<p>Are you sure you want to delete "${saved.title}"?</p>
             <p><strong>This action cannot be undone.</strong></p>`,
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
        
        const inputContainer = document.createElement('div');
        inputContainer.innerHTML = `
            <input type="text" id="saveTitle" class="modal-input" placeholder="Enter a title..." maxlength="100">
            <div style="margin-top: 10px; font-size: 0.875rem; color: var(--text-tertiary);">
                <i class="fas fa-info-circle"></i> 
                ${text.length.toLocaleString()} characters, 
                ${this.state.countWords(text).toLocaleString()} words
            </div>
        `;
        
        this.showModal('Save Text', inputContainer, [
            { label: 'Cancel', class: 'btn-secondary', action: () => this.hideModal() },
            { label: 'Save', class: 'btn-primary', action: () => {
                const titleInput = document.getElementById('saveTitle');
                const title = titleInput.value.trim();
                
                if (!title) {
                    titleInput.classList.add('error');
                    this.showToast('Please enter a title', 'warning');
                    titleInput.focus();
                    return;
                }
                
                this.state.saveText(title, text);
                this.updateSavedTexts();
                this.hideModal();
                this.showToast(`Saved "${title}"`, 'success');
                this.updateStatus('Text saved successfully', 'success', 3000);
            }}
        ]);
        
        setTimeout(() => {
            const input = document.getElementById('saveTitle');
            if (input) {
                input.focus();
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const saveBtn = this.elements.modalFooter.querySelector('.btn-primary');
                        if (saveBtn) saveBtn.click();
                    }
                });
            }
        }, 100);
    }

    // ===== Editor Operations =====
    undo() {
        if (this.state.undoStack.length === 0) return;
        
        this.state.redoStack.push(this.elements.editor.value);
        this.elements.editor.value = this.state.undoStack.pop();
        this.state.currentText = this.elements.editor.value;
        this.updateStats();
        this.updateMiniAnalytics();
        this.updateButtonStates();
        this.showToast('Undo', 'info');
        this.updateStatus('Undo', 'default', 2000);
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
        this.updateStatus('Redo', 'default', 2000);
    }

    cut() {
        const selection = this.getSelectedText();
        
        if (selection.text) {
            navigator.clipboard.writeText(selection.text).then(() => {
                this.elements.editor.setRangeText('', selection.start, selection.end, 'end');
                this.handleTextChange();
                this.showToast('Cut to clipboard', 'success');
            }).catch(() => {
                this.showToast('Failed to cut', 'error');
            });
        } else if (this.elements.editor.value) {
            navigator.clipboard.writeText(this.elements.editor.value).then(() => {
                this.elements.editor.value = '';
                this.handleTextChange();
                this.showToast('Cut all text to clipboard', 'success');
            }).catch(() => {
                this.showToast('Failed to cut', 'error');
            });
        }
    }

    copy() {
        const selection = this.getSelectedText();
        const textToCopy = selection.text || this.elements.editor.value;
        
        if (!textToCopy) return;
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            this.showToast('Copied to clipboard', 'success');
            this.updateStatus('Copied to clipboard', 'success', 2000);
        }).catch(() => {
            // Fallback method
            const tempTextArea = document.createElement('textarea');
            tempTextArea.value = textToCopy;
            tempTextArea.style.position = 'fixed';
            tempTextArea.style.opacity = '0';
            document.body.appendChild(tempTextArea);
            tempTextArea.select();
            
            try {
                document.execCommand('copy');
                this.showToast('Copied to clipboard', 'success');
                this.updateStatus('Copied to clipboard', 'success', 2000);
            } catch (err) {
                this.showToast('Failed to copy', 'error');
            }
            
            document.body.removeChild(tempTextArea);
        });
    }

    async paste() {
        try {
            const text = await navigator.clipboard.readText();
            const selection = this.getSelectedText();
            
            this.elements.editor.setRangeText(text, selection.start, selection.end, 'end');
            this.handleTextChange();
            this.showToast('Pasted from clipboard', 'success');
            this.updateStatus('Pasted from clipboard', 'success', 2000);
        } catch (error) {
            // Try to focus and use execCommand as fallback
            this.elements.editor.focus();
            try {
                document.execCommand('paste');
                this.handleTextChange();
                this.showToast('Pasted from clipboard', 'success');
            } catch (err) {
                this.showToast('Failed to paste. Use Ctrl+V', 'error');
            }
        }
    }

    clearText() {
        if (!this.elements.editor.value) return;
        
        this.showModal('Clear Text', 
            `<p>Are you sure you want to clear all text?</p>
             <p>Your current text will be saved to history.</p>`,
            [
                { label: 'Cancel', class: 'btn-secondary', action: () => this.hideModal() },
                { label: 'Clear All', class: 'btn-danger', action: () => {
                    this.state.addToHistory('Clear Text', this.elements.editor.value);
                    this.elements.editor.value = '';
                    this.handleTextChange();
                    this.hideModal();
                    this.showToast('Text cleared', 'success');
                    this.updateStatus('Text cleared', 'success', 2000);
                }}
            ]
        );
    }

    getSelectedText() {
        const start = this.elements.editor.selectionStart;
        const end = this.elements.editor.selectionEnd;
        const text = this.elements.editor.value.substring(start, end);
        return { text, start, end };
    }

    // ===== Search Functionality =====
    showSearch() {
        this.elements.searchOverlay.hidden = false;
        setTimeout(() => {
            this.elements.searchOverlay.classList.add('show');
            this.elements.findInput.focus();
            this.elements.findInput.select();
        }, 10);
    }

    hideSearch() {
        this.elements.searchOverlay.classList.remove('show');
        setTimeout(() => {
            this.elements.searchOverlay.hidden = true;
            this.resetSearch();
        }, 300);
    }

    resetSearch() {
        this.searchIndex = -1;
        this.searchMatches = [];
    }

    findNext() {
        const searchTerm = this.elements.findInput.value;
        if (!searchTerm) {
            this.showToast('Please enter search text', 'warning');
            return;
        }
        
        const text = this.elements.editor.value;
        const caseSensitive = this.elements.caseSensitive.checked;
        const useRegex = this.elements.useRegex.checked;
        
        try {
            let regex;
            if (useRegex) {
                regex = new RegExp(searchTerm, caseSensitive ? 'g' : 'gi');
            } else {
                const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                regex = new RegExp(escapedTerm, caseSensitive ? 'g' : 'gi');
            }
            
            // Find all matches
            this.searchMatches = [];
            let match;
            while ((match = regex.exec(text)) !== null) {
                this.searchMatches.push({
                    start: match.index,
                    end: match.index + match[0].length
                });
            }
            
            if (this.searchMatches.length === 0) {
                this.showToast('No matches found', 'warning');
                return;
            }
            
            // Navigate to next match
            this.searchIndex = (this.searchIndex + 1) % this.searchMatches.length;
            const currentMatch = this.searchMatches[this.searchIndex];
            
            // Select the match
            this.elements.editor.setSelectionRange(currentMatch.start, currentMatch.end);
            this.elements.editor.focus();
            
            // Scroll into view
            const lineHeight = parseInt(getComputedStyle(this.elements.editor).lineHeight);
            const linesBeforeMatch = text.substring(0, currentMatch.start).split('\n').length - 1;
            const scrollTop = linesBeforeMatch * lineHeight - this.elements.editor.clientHeight / 2;
            this.elements.editor.scrollTop = Math.max(0, scrollTop);
            
            this.showToast(`Match ${this.searchIndex + 1} of ${this.searchMatches.length}`, 'info');
        } catch (error) {
            this.showToast('Invalid search pattern', 'error');
        }
    }

    replace() {
        const searchTerm = this.elements.findInput.value;
        const replaceTerm = this.elements.replaceInput.value;
        
        if (!searchTerm) {
            this.showToast('Please enter search text', 'warning');
            return;
        }
        
        const selection = this.getSelectedText();
        if (selection.text) {
            // Check if selection matches search term
            const caseSensitive = this.elements.caseSensitive.checked;
            const matches = caseSensitive 
                ? selection.text === searchTerm
                : selection.text.toLowerCase() === searchTerm.toLowerCase();
            
            if (matches) {
                this.elements.editor.setRangeText(replaceTerm, selection.start, selection.end, 'end');
                this.handleTextChange();
                this.showToast('Replaced', 'success');
                this.findNext();
            } else {
                this.findNext();
            }
        } else {
            this.findNext();
        }
    }

    replaceAll() {
        const searchTerm = this.elements.findInput.value;
        const replaceTerm = this.elements.replaceInput.value;
        
        if (!searchTerm) {
            this.showToast('Please enter search text', 'warning');
            return;
        }
        
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
                this.updateStatus(`Replaced ${count} occurrence(s)`, 'success', 3000);
            } else {
                this.showToast('No matches found', 'warning');
            }
        } catch (error) {
            this.showToast('Invalid search pattern', 'error');
        }
    }

    // ===== UI Utilities =====
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
        setTimeout(() => {
            this.elements.modalBackdrop.classList.add('show');
            
            // Focus first input or button
            const firstInput = this.elements.modalBody.querySelector('input, textarea, select');
            const firstButton = this.elements.modalFooter.querySelector('.btn-primary') || 
                              this.elements.modalFooter.querySelector('button');
            
            if (firstInput) {
                firstInput.focus();
            } else if (firstButton) {
                firstButton.focus();
            }
        }, 10);
    }

    hideModal() {
        this.elements.modalBackdrop.classList.remove('show');
        setTimeout(() => {
            this.elements.modalBackdrop.hidden = true;
            this.elements.modalBody.innerHTML = '';
            this.elements.modalFooter.innerHTML = '';
        }, 300);
    }

    showToast(message, type = 'info', duration = 3000) {
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
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    showContextMenu(event) {
        event.preventDefault();
        
        const x = Math.min(event.pageX, window.innerWidth - 200);
        const y = Math.min(event.pageY, window.innerHeight - 200);
        
        this.elements.contextMenu.style.left = `${x}px`;
        this.elements.contextMenu.style.top = `${y}px`;
        this.elements.contextMenu.hidden = false;
        
        // Clear existing listeners
        const newContextMenu = this.elements.contextMenu.cloneNode(true);
        this.elements.contextMenu.parentNode.replaceChild(newContextMenu, this.elements.contextMenu);
        this.elements.contextMenu = newContextMenu;
        
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

    // ===== Settings =====
    showSettings() {
        const settingsHTML = `
            <div class="settings-container">
                <div class="settings-section">
                    <h4><i class="fas fa-palette"></i> Theme</h4>
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
                    <h4><i class="fas fa-font"></i> Editor Settings</h4>
                    
                    <div class="settings-field">
                        <label for="fontSizeRange">Font Size: <span id="fontSizeValue">${this.state.settings.fontSize}px</span></label>
                        <input type="range" id="fontSizeRange" min="12" max="24" value="${this.state.settings.fontSize}" class="settings-range">
                    </div>
                    
                    <div class="settings-field">
                        <label for="tabSizeRange">Tab Size: <span id="tabSizeValue">${this.state.settings.tabSize} spaces</span></label>
                        <input type="range" id="tabSizeRange" min="2" max="8" step="2" value="${this.state.settings.tabSize}" class="settings-range">
                    </div>
                    
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
                    
                    <label class="settings-checkbox">
                        <input type="checkbox" id="highlightLineCheck" ${this.state.settings.highlightCurrentLine ? 'checked' : ''}>
                        <span>Highlight current line</span>
                    </label>
                </div>
                
                <div class="settings-section">
                    <h4><i class="fas fa-database"></i> Data Management</h4>
                    
                    <div class="data-info">
                        <p><i class="fas fa-info-circle"></i> Storage used: ${this.getStorageSize()}</p>
                        <p><i class="fas fa-history"></i> History entries: ${this.state.history.length}</p>
                        <p><i class="fas fa-bookmark"></i> Saved texts: ${this.state.savedTexts.length}</p>
                    </div>
                    
                    <button class="btn btn-secondary" id="exportDataBtn">
                        <i class="fas fa-download"></i> Export All Data
                    </button>
                    
                    <button class="btn btn-secondary" id="importDataBtn">
                        <i class="fas fa-upload"></i> Import Data
                    </button>
                    
                    <div class="danger-zone">
                        <h5>Danger Zone</h5>
                        <button class="btn btn-danger" id="clearAllDataBtn">
                            <i class="fas fa-trash"></i> Clear All Data
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.showModal('Settings', settingsHTML, [
            { label: 'Cancel', class: 'btn-secondary', action: () => this.hideModal() },
            { label: 'Save Settings', class: 'btn-primary', action: () => this.saveSettings() }
        ]);
        
        // Add event listeners
        document.getElementById('fontSizeRange').addEventListener('input', (e) => {
            document.getElementById('fontSizeValue').textContent = `${e.target.value}px`;
            this.elements.editor.style.fontSize = `${e.target.value}px`;
        });
        
        document.getElementById('tabSizeRange').addEventListener('input', (e) => {
            document.getElementById('tabSizeValue').textContent = `${e.target.value} spaces`;
        });
        
        document.getElementById('exportDataBtn').addEventListener('click', () => this.exportAllData());
        document.getElementById('importDataBtn').addEventListener('click', () => this.importData());
        document.getElementById('clearAllDataBtn').addEventListener('click', () => this.clearAllData());
    }

    saveSettings() {
        const newSettings = {
            theme: document.querySelector('input[name="theme"]:checked').value,
            autoSave: document.getElementById('autoSaveCheck').checked,
            wordWrap: document.getElementById('wordWrapCheck').checked,
            spellCheck: document.getElementById('spellCheckCheck').checked,
            highlightCurrentLine: document.getElementById('highlightLineCheck').checked,
            fontSize: parseInt(document.getElementById('fontSizeRange').value),
            tabSize: parseInt(document.getElementById('tabSizeRange').value)
        };
        
        this.state.updateSettings(newSettings);
        this.applySettings();
        this.hideModal();
        this.showToast('Settings saved', 'success');
        this.updateStatus('Settings saved', 'success', 2000);
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

    getStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (key.startsWith('textman_v2_')) {
                total += localStorage[key].length;
            }
        }
        
        if (total < 1024) {
            return `${total} bytes`;
        } else if (total < 1024 * 1024) {
            return `${(total / 1024).toFixed(1)} KB`;
        } else {
            return `${(total / (1024 * 1024)).toFixed(1)} MB`;
        }
    }

    exportAllData() {
        const data = {
            version: APP_VERSION,
            exportDate: new Date().toISOString(),
            currentText: this.state.currentText,
            history: this.state.history,
            savedTexts: this.state.savedTexts,
            settings: this.state.settings,
            uiState: this.state.uiState
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `textman-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('Data exported successfully', 'success');
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    // Validate data structure
                    if (!data.version || !data.exportDate) {
                        throw new Error('Invalid backup file');
                    }
                    
                    // Confirm import
                    this.showModal('Import Data', 
                        `<p>This will replace all your current data with the imported data.</p>
                         <p>Backup date: ${new Date(data.exportDate).toLocaleString()}</p>
                         <p><strong>Are you sure you want to continue?</strong></p>`,
                        [
                            { label: 'Cancel', class: 'btn-secondary', action: () => this.hideModal() },
                            { label: 'Import', class: 'btn-primary', action: () => {
                                // Import data
                                this.state.currentText = data.currentText || '';
                                this.state.history = data.history || [];
                                this.state.savedTexts = data.savedTexts || [];
                                this.state.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
                                this.state.uiState = data.uiState || {};
                                
                                // Save and apply
                                this.state.saveToStorage();
                                this.elements.editor.value = this.state.currentText;
                                this.handleTextChange();
                                this.updateHistory();
                                this.updateSavedTexts();
                                this.applySettings();
                                this.restoreUIState();
                                
                                this.hideModal();
                                this.showToast('Data imported successfully', 'success');
                            }}
                        ]
                    );
                } catch (error) {
                    this.showToast('Failed to import data: ' + error.message, 'error');
                }
            };
            reader.readAsText(file);
        });
        
        input.click();
    }

    clearAllData() {
        this.showModal('Clear All Data', 
            `<p>Are you sure you want to clear all data?</p>
             <p>This will permanently delete:</p>
             <ul style="margin: 10px 0; padding-left: 20px;">
                <li>All saved texts</li>
                <li>All history entries</li>
                <li>Current text in editor</li>
                <li>All settings and preferences</li>
             </ul>
             <p><strong>This action cannot be undone!</strong></p>`,
            [
                { label: 'Cancel', class: 'btn-secondary', action: () => this.hideModal() },
                { label: 'Clear Everything', class: 'btn-danger', action: () => {
                    this.state.clearAllData();
                    this.elements.editor.value = '';
                    this.handleTextChange();
                    this.updateHistory();
                    this.updateSavedTexts();
                    this.applySettings();
                    this.hideModal();
                    this.showToast('All data cleared', 'success');
                    this.updateStatus('All data cleared', 'success', 3000);
                }}
            ]
        );
    }

    // ===== Theme =====
    toggleTheme() {
        const newTheme = this.state.settings.theme === 'dark' ? 'light' : 'dark';
        this.state.updateSettings({ theme: newTheme });
        this.applySettings();
        this.showToast(`Switched to ${newTheme} theme`, 'info');
    }

    // ===== Sidebar & Panels =====
    toggleSidebar(side) {
        const sidebar = side === 'left' ? this.elements.leftSidebar : this.elements.rightSidebar;
        const isCollapsed = sidebar.classList.contains('collapsed');
        
        sidebar.classList.toggle('collapsed');
        
        // Update button icon
        const icon = sidebar.querySelector('.sidebar-toggle i');
        if (side === 'left') {
            icon.className = isCollapsed ? 'fas fa-chevron-left' : 'fas fa-chevron-right';
        } else {
            icon.className = isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
        }
        
        // Save state
        const uiUpdates = {};
        uiUpdates[`${side}SidebarCollapsed`] = !isCollapsed;
        this.state.updateUIState(uiUpdates);
    }

    togglePanel(panel) {
        panel.classList.toggle('collapsed');
        
        // Save state
        const panelId = panel.id;
        const panelStates = { ...this.state.uiState.panelStates };
        panelStates[panelId] = !panel.classList.contains('collapsed');
        this.state.updateUIState({ panelStates });
    }

    restoreUIState() {
        // Restore sidebar states
        if (this.state.uiState.leftSidebarCollapsed) {
            this.elements.leftSidebar.classList.add('collapsed');
            this.elements.leftSidebar.querySelector('.sidebar-toggle i').className = 'fas fa-chevron-right';
        }
        
        if (this.state.uiState.rightSidebarCollapsed) {
            this.elements.rightSidebar.classList.add('collapsed');
            this.elements.rightSidebar.querySelector('.sidebar-toggle i').className = 'fas fa-chevron-left';
        }
        
        // Restore panel states
        if (this.state.uiState.panelStates) {
            Object.entries(this.state.uiState.panelStates).forEach(([panelId, isExpanded]) => {
                const panel = document.getElementById(panelId);
                if (panel) {
                    if (!isExpanded) {
                        panel.classList.add('collapsed');
                    }
                }
            });
        }
    }

    // ===== Fullscreen =====
    toggleFullscreen() {
        if (!this.state.isFullscreen) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
                document.documentElement.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    handleFullscreenChange() {
        this.state.isFullscreen = !!document.fullscreenElement;
        this.elements.fullscreenBtn.innerHTML = this.state.isFullscreen 
            ? '<i class="fas fa-compress"></i>' 
            : '<i class="fas fa-expand"></i>';
    }

    // ===== Analytics =====
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
                    <h4><i class="fas fa-chart-bar"></i> Basic Statistics</h4>
                    <div class="analytics-grid">
                        <div class="analytics-stat">
                            <span class="stat-label">Characters</span>
                            <span class="stat-value">${analytics.characters.toLocaleString()}</span>
                        </div>
                        <div class="analytics-stat">
                            <span class="stat-label">Characters (no spaces)</span>
                            <span class="stat-value">${analytics.charactersNoSpaces.toLocaleString()}</span>
                        </div>
                        <div class="analytics-stat">
                            <span class="stat-label">Words</span>
                            <span class="stat-value">${analytics.words.toLocaleString()}</span>
                        </div>
                        <div class="analytics-stat">
                            <span class="stat-label">Unique Words</span>
                            <span class="stat-value">${analytics.uniqueWords.toLocaleString()}</span>
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
                    <h4><i class="fas fa-book-open"></i> Readability Analysis</h4>
                    <div class="readability-score">
                        <div class="score-circle ${analytics.readability.class}">
                            ${analytics.readability.score}
                        </div>
                        <div class="score-details">
                            <h5>${analytics.readability.level}</h5>
                            <p>${analytics.readability.description}</p>
                            <div class="score-breakdown">
                                <div>Flesch-Kincaid Grade: <strong>${analytics.fleschKincaid.toFixed(1)}</strong></div>
                                <div>Avg words/sentence: <strong>${analytics.avgWordsPerSentence.toFixed(1)}</strong></div>
                                <div>Avg syllables/word: <strong>${analytics.avgSyllablesPerWord.toFixed(1)}</strong></div>
                                <div>Lexical diversity: <strong>${analytics.lexicalDiversity.toFixed(1)}%</strong></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="analytics-section">
                    <h4><i class="fas fa-clock"></i> Reading Time Estimates</h4>
                    <div class="reading-time-grid">
                        <div class="reading-speed">
                            <span class="speed-label">Slow Reader (150 wpm)</span>
                            <span class="speed-time">${Math.ceil(analytics.words / 150)} minutes</span>
                        </div>
                        <div class="reading-speed primary">
                            <span class="speed-label">Average Reader (200 wpm)</span>
                            <span class="speed-time">${Math.ceil(analytics.words / 200)} minutes</span>
                        </div>
                        <div class="reading-speed">
                            <span class="speed-label">Fast Reader (250 wpm)</span>
                            <span class="speed-time">${Math.ceil(analytics.words / 250)} minutes</span>
                        </div>
                        <div class="reading-speed">
                            <span class="speed-label">Speed Reader (300 wpm)</span>
                            <span class="speed-time">${Math.ceil(analytics.words / 300)} minutes</span>
                        </div>
                    </div>
                </div>
                
                <div class="analytics-section">
                    <h4><i class="fas fa-language"></i> Language Analysis</h4>
                    <div class="language-stats">
                        <div class="language-item">
                            <span>Most common word length:</span>
                            <strong>${analytics.mostCommonWordLength} characters</strong>
                        </div>
                        <div class="language-item">
                            <span>Longest word:</span>
                            <strong>"${analytics.longestWord}" (${analytics.longestWord.length} chars)</strong>
                        </div>
                        <div class="language-item">
                            <span>Average paragraph length:</span>
                            <strong>${analytics.avgWordsPerParagraph.toFixed(1)} words</strong>
                        </div>
                    </div>
                </div>
                
                <div class="analytics-section">
                    <h4><i class="fas fa-list-ol"></i> Top 10 Most Frequent Words</h4>
                    <div class="word-frequency">
                        ${analytics.topWords.slice(0, 10).map(([word, count], index) => `
                            <div class="word-item">
                                <span class="word-rank">#${index + 1}</span>
                                <span class="word">${word}</span>
                                <span class="count">${count} times</span>
                                <div class="word-bar">
                                    <div class="word-bar-fill" style="width: ${(count / analytics.topWords[0][1]) * 100}%"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="analytics-actions">
                    <button class="btn btn-secondary" onclick="ui.exportAnalytics()">
                        <i class="fas fa-download"></i> Export Report
                    </button>
                </div>
            </div>
        `;
        
        this.showModal('Comprehensive Text Analysis', analyticsHTML, [
            { label: 'Close', class: 'btn-primary', action: () => this.hideModal() }
        ]);
    }

    exportAnalytics() {
        const text = this.elements.editor.value;
        const analytics = TextAnalyzer.analyze(text);
        
        const report = {
            title: 'textMan Analytics Report',
            generated: new Date().toISOString(),
            textPreview: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
            statistics: analytics,
            metadata: {
                app: APP_NAME,
                version: APP_VERSION
            }
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `textman-analytics-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('Analytics report exported', 'success');
    }

    // ===== Auto-save =====
    startAutoSave() {
        if (this.autoSaveTimer) return;
        
        this.autoSaveTimer = setInterval(() => {
            if (this.state.currentText !== this.elements.editor.value) {
                this.state.currentText = this.elements.editor.value;
                if (this.state.saveToStorage()) {
                    this.updateStatus('Auto-saved', 'success', 2000);
                    
                    // Update auto-save indicator
                    const indicator = this.elements.autoSaveIndicator.querySelector('i');
                    indicator.classList.add('pulse');
                    setTimeout(() => indicator.classList.remove('pulse'), 1000);
                }
            }
        }, this.state.settings.autoSaveInterval);
    }

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    // ===== Keyboard Shortcuts =====
    handleGlobalKeyboard(event) {
        const ctrl = event.ctrlKey || event.metaKey;
        
        // Don't handle if focus is in an input field (except main editor)
        if (event.target.tagName === 'INPUT' && event.target !== this.elements.editor) {
            return;
        }
        
        if (ctrl) {
            switch (event.key.toLowerCase()) {
                case 's':
                    event.preventDefault();
                    this.saveText();
                    break;
                case 'f':
                    event.preventDefault();
                    this.showSearch();
                    break;
                case 'h':
                    if (event.shiftKey) {
                        event.preventDefault();
                        this.showSearch();
                    }
                    break;
                case 'z':
                    if (!event.shiftKey && event.target === this.elements.editor) {
                        event.preventDefault();
                        this.undo();
                    }
                    break;
                case 'y':
                    if (event.target === this.elements.editor) {
                        event.preventDefault();
                        this.redo();
                    }
                    break;
                case ',':
                    event.preventDefault();
                    this.showSettings();
                    break;
            }
        } else if (event.key === 'Escape') {
            if (!this.elements.modalBackdrop.hidden) {
                this.hideModal();
            } else if (!this.elements.searchOverlay.hidden) {
                this.hideSearch();
            } else if (!this.elements.contextMenu.hidden) {
                this.hideContextMenu();
            }
        } else if (event.key === 'F11') {
            event.preventDefault();
            this.toggleFullscreen();
        } else if (event.altKey) {
            switch (event.key) {
                case '1':
                    event.preventDefault();
                    this.toggleSidebar('left');
                    break;
                case '2':
                    event.preventDefault();
                    this.toggleSidebar('right');
                    break;
            }
        }
    }

    handleBeforeUnload(event) {
        // Save current state
        this.state.currentText = this.elements.editor.value;
        this.state.saveToStorage();
        
        // Warn if there are unsaved changes
        if (this.state.lastSaved < Date.now() - 60000 && this.elements.editor.value.trim()) {
            event.preventDefault();
            event.returnValue = 'You may have unsaved changes. Are you sure you want to leave?';
        }
    }

    handleResize() {
        // Adjust UI for mobile if needed
        if (window.innerWidth < 768) {
            // Auto-collapse sidebars on mobile
            if (!this.elements.leftSidebar.classList.contains('collapsed')) {
                this.toggleSidebar('left');
            }
            if (!this.elements.rightSidebar.classList.contains('collapsed')) {
                this.toggleSidebar('right');
            }
        }
    }

    // ===== Utility Methods =====
    formatRelativeTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return date.toLocaleDateString();
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    hideLoadingScreen() {
        this.elements.loadingScreen.classList.add('hide');
        this.elements.app.classList.add('loaded');
        
        // Set initial text and update UI
        this.elements.editor.value = this.state.currentText;
        this.updateStats();
        this.updateMiniAnalytics();
        this.updateButtonStates();
        
        // Remove loading screen from DOM after animation
        setTimeout(() => {
            this.elements.loadingScreen.remove();
        }, 500);
        
        // Focus editor
        this.elements.editor.focus();
    }
}

// ===== Text Analyzer =====
class TextAnalyzer {
    static analyze(text) {
        if (!text.trim()) {
            return this.getEmptyAnalysis();
        }
        
        const characters = text.length;
        const charactersNoSpaces = text.replace(/\s/g, '').length;
        const wordsArray = text.trim().split(/\s+/).filter(Boolean);
        const words = wordsArray.length;
        const sentences = this.countSentences(text);
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length;
        const syllables = this.countSyllables(text);
        
        const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;
        const avgSyllablesPerWord = words > 0 ? syllables / words : 0;
        const avgWordsPerParagraph = paragraphs > 0 ? words / paragraphs : 0;
        
        // Unique words and lexical diversity
        const uniqueWordsSet = new Set(wordsArray.map(w => w.toLowerCase()));
        const uniqueWords = uniqueWordsSet.size;
        const lexicalDiversity = words > 0 ? (uniqueWords / words) * 100 : 0;
        
        // Word length analysis
        const wordLengths = wordsArray.map(w => w.length);
        const avgWordLength = wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length || 0;
        const wordLengthFreq = {};
        wordLengths.forEach(len => {
            wordLengthFreq[len] = (wordLengthFreq[len] || 0) + 1;
        });
        const mostCommonWordLength = Object.entries(wordLengthFreq)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 0;
        
        // Find longest word
        const longestWord = wordsArray.reduce((a, b) => a.length > b.length ? a : b, '');
        
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
            charactersNoSpaces,
            words,
            uniqueWords,
            sentences,
            paragraphs,
            syllables,
            avgWordsPerSentence,
            avgSyllablesPerWord,
            avgWordsPerParagraph,
            avgWordLength: avgWordLength.toFixed(1),
            mostCommonWordLength: parseInt(mostCommonWordLength),
            longestWord,
            lexicalDiversity,
            fleschScore: Math.max(0, Math.min(100, fleschScore)),
            fleschKincaid: Math.max(0, fleschKincaid),
            readability,
            topWords
        };
    }
    
    static getEmptyAnalysis() {
        return {
            characters: 0,
            charactersNoSpaces: 0,
            words: 0,
            uniqueWords: 0,
            sentences: 0,
            paragraphs: 0,
            syllables: 0,
            avgWordsPerSentence: 0,
            avgSyllablesPerWord: 0,
            avgWordsPerParagraph: 0,
            avgWordLength: 0,
            mostCommonWordLength: 0,
            longestWord: '',
            lexicalDiversity: 0,
            fleschScore: 0,
            fleschKincaid: 0,
            readability: { score: 0, level: 'N/A', description: 'No text to analyze', class: 'easy' },
            topWords: []
        };
    }
    
    static countSentences(text) {
        // Count sentences ending with ., !, ?, or ellipsis
        const sentences = text.match(/[.!?…]+[\s\n]/g) || [];
        // Add 1 if text doesn't end with punctuation but has content
        const lastChar = text.trim().slice(-1);
        if (text.trim() && !['.', '!', '?', '…'].includes(lastChar)) {
            return sentences.length + 1;
        }
        return sentences.length;
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
        
        // Special cases
        if (word.length <= 3) return 1;
        
        // Remove silent e
        word = word.replace(/e$/, '');
        
        // Count vowel groups
        const vowelGroups = word.match(/[aeiouy]+/g) || [];
        count = vowelGroups.length;
        
        // Adjust for special patterns
        if (word.match(/[^aeiou]le$/)) count++;
        if (word.match(/[^aeiou]les$/)) count++;
        
        // Ensure at least one syllable
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
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
            'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
            'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
            'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they', 'it'
        ]);
        
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

// ===== Additional Styles =====
const additionalStyles = `
<style>
/* Additional styles for dynamic elements */
.history-item, .saved-item {
    padding: 12px;
    margin-bottom: 8px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
    transition: all var(--transition-base);
}

.history-item:hover, .saved-item:hover {
    border-color: var(--color-primary);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
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

.history-preview, .saved-preview {
    font-size: 0.8rem;
    color: var(--text-secondary);
    margin-bottom: 8px;
    line-height: 1.4;
    max-height: 2.8em;
    overflow: hidden;
    text-overflow: ellipsis;
}

.saved-item.favorite {
    border-color: #f59e0b;
    background: linear-gradient(135deg, var(--bg-tertiary), rgba(245, 158, 11, 0.05));
}

.saved-actions {
    display: flex;
    gap: 4px;
}

.icon-btn-sm {
    width: 28px;
    height: 28px;
    padding: 0;
    font-size: 0.75rem;
}

.modal-input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: 0.875rem;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    background: var(--bg-primary);
    color: var(--text-primary);
    transition: all var(--transition-base);
}

.modal-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-alpha);
}

.modal-input.error {
    border-color: var(--color-danger);
    animation: shake var(--transition-base);
}

.settings-container {
    max-height: 60vh;
    overflow-y: auto;
}

.settings-section {
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--border-color);
}

.settings-section:last-child {
    border-bottom: none;
}

.settings-section h4 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
}

.settings-section h4 i {
    color: var(--color-primary);
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
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    transition: all var(--transition-base);
}

.settings-option:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-alpha);
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
    padding: 4px 0;
}

.settings-checkbox input[type="checkbox"] {
    accent-color: var(--color-primary);
}

.settings-field {
    margin-bottom: 16px;
}

.settings-field label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: var(--text-secondary);
}

.settings-range {
    width: 100%;
    margin-bottom: 8px;
    accent-color: var(--color-primary);
}

.data-info {
    background: var(--bg-tertiary);
    padding: 12px;
    border-radius: var(--radius-md);
    margin-bottom: 16px;
    font-size: 0.875rem;
}

.data-info p {
    margin: 4px 0;
    color: var(--text-secondary);
}

.danger-zone {
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid var(--color-danger);
}

.danger-zone h5 {
    color: var(--color-danger);
    margin-bottom: 12px;
}

.analytics-report {
    max-height: 70vh;
    overflow-y: auto;
}

.analytics-section {
    margin-bottom: 32px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--border-color);
}

.analytics-section:last-child {
    border-bottom: none;
}

.analytics-section h4 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
}

.analytics-section h4 i {
    color: var(--color-primary);
}

.analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
}

.analytics-stat {
    background: var(--bg-tertiary);
    padding: 16px;
    border-radius: var(--radius-md);
    text-align: center;
    border: 1px solid var(--border-color);
    transition: all var(--transition-base);
}

.analytics-stat:hover {
    border-color: var(--color-primary);
    transform: translateY(-2px);
}

.stat-label {
    display: block;
    font-size: 0.75rem;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
}

.stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-primary);
}

.readability-score {
    display: flex;
    gap: 24px;
    align-items: center;
}

.score-circle {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
}

.score-circle.very-easy { background: #10b981; }
.score-circle.easy { background: #34d399; }
.score-circle.fairly-easy { background: #fbbf24; }
.score-circle.standard { background: #f59e0b; }
.score-circle.fairly-difficult { background: #f97316; }
.score-circle.difficult { background: #ef4444; }
.score-circle.very-difficult { background: #dc2626; }

.score-details h5 {
    font-size: 1.25rem;
    margin-bottom: 8px;
    color: var(--text-primary);
}

.score-details p {
    margin-bottom: 12px;
    color: var(--text-secondary);
}

.score-breakdown {
    font-size: 0.875rem;
    color: var(--text-secondary);
    line-height: 1.6;
}

.score-breakdown div {
    margin: 4px 0;
}

.reading-time-grid {
    display: grid;
    gap: 8px;
}

.reading-speed {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-color);
    transition: all var(--transition-base);
}

.reading-speed.primary {
    background: var(--color-primary-alpha);
    border-color: var(--color-primary);
}

.reading-speed:hover {
    border-color: var(--color-primary);
    transform: translateX(4px);
}

.speed-label {
    color: var(--text-secondary);
    font-weight: 500;
}

.speed-time {
    font-weight: 600;
    color: var(--color-primary);
}

.language-stats {
    display: grid;
    gap: 12px;
}

.language-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-sm);
}

.word-frequency {
    display: grid;
    gap: 8px;
}

.word-item {
    display: grid;
    grid-template-columns: 40px 1fr 80px;
    gap: 12px;
    align-items: center;
    padding: 8px 12px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-sm);
    transition: all var(--transition-base);
}

.word-item:hover {
    background: var(--bg-hover);
    transform: translateX(4px);
}

.word-rank {
    font-weight: 600;
    color: var(--text-muted);
}

.word {
    font-weight: 500;
    color: var(--text-primary);
}

.count {
    text-align: right;
    color: var(--text-tertiary);
    font-size: 0.875rem;
}

.word-bar {
    grid-column: 1 / -1;
    height: 4px;
    background: var(--bg-secondary);
    border-radius: 2px;
    overflow: hidden;
}

.word-bar-fill {
    height: 100%;
    background: var(--color-primary);
    transition: width var(--transition-base);
}

.analytics-actions {
    margin-top: 24px;
    display: flex;
    justify-content: center;
}

/* Toast animations */
.toast {
    animation: slideIn var(--transition-base) ease-out;
}

.toast.show {
    transform: translateX(0);
}

.toast.hide {
    animation: slideOut var(--transition-base) ease-out;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    to {
        transform: translateX(110%);
        opacity: 0;
    }
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-8px); }
    75% { transform: translateX(8px); }
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}

/* Loading progress animation */
.loading-progress {
    transition: width 0.3s ease;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .analytics-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .readability-score {
        flex-direction: column;
        text-align: center;
    }
    
    .settings-options {
        flex-direction: column;
    }
    
    .word-item {
        grid-template-columns: 30px 1fr 60px;
        font-size: 0.875rem;
    }
}

/* Fullscreen adjustments */
.app:-webkit-full-screen {
    width: 100%;
    height: 100%;
}

.app:fullscreen {
    width: 100%;
    height: 100%;
}

/* Print styles for analytics report */
@media print {
    .analytics-actions,
    .modal-header,
    .modal-footer {
        display: none !important;
    }
    
    .analytics-report {
        max-height: none !important;
        overflow: visible !important;
    }
    
    .analytics-section {
        page-break-inside: avoid;
    }
}
</style>`;

// ===== Initialize Application =====
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Add additional styles to document
        document.head.insertAdjacentHTML('beforeend', additionalStyles);
        
        // Create application instances
        const state = new AppState();
        const ui = new UIManager(state);
        
        // Make UI manager globally accessible for onclick handlers
        window.ui = ui;
        
        // Load saved data
        state.loadFromStorage();
        
        // Initialize UI
        await ui.init();
        
        // Log successful initialization
        console.log(`${APP_NAME} v${APP_VERSION} initialized successfully`);
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        
        // Show error state
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = 'Failed to load textMan. Please refresh the page.';
            loadingText.style.color = '#ef4444';
        }
    }
});

// ===== Service Worker Registration (Optional) =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Service worker registration failed, app will still work without offline support
        });
    });
}
