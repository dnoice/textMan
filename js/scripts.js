// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, collection, query, addDoc, getDocs, serverTimestamp, orderBy, limit, writeBatch } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";

// --- ENHANCED TEXTMAN APPLICATION ---

// Global state object
const appState = {
    currentText: '',
    undoStack: [],
    redoStack: [],
    autoSaveEnabled: true,
    userId: null,
    db: null,
    auth: null,
    appId: typeof __app_id !== 'undefined' ? __app_id : 'default-app-id',
    firebaseConfig: typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null,
    initialAuthToken: typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null,
    isAuthReady: false,
    listeners: [],
    tooltips: new Map(),
};

const elements = {}; // DOM element cache

// --- Firestore Path Helpers ---
const FIRESTORE_PATHS = {
    userData: (userId) => `artifacts/${appState.appId}/users/${userId}/appData/userData`,
    savedTexts: (userId) => `artifacts/${appState.appId}/users/${userId}/savedTexts`,
    history: (userId) => `artifacts/${appState.appId}/users/${userId}/history`,
};

/**
 * Caches frequently accessed DOM elements
 */
function cacheDOMElements() {
    Object.assign(elements, {
        textArea: document.getElementById('mainTextArea'),
        charCount: document.getElementById('charCount'), 
        wordCount: document.getElementById('wordCount'), 
        lineCount: document.getElementById('lineCount'),
        readTimeStat: document.getElementById('readTimeStat'),
        statusMessage: document.getElementById('statusMessage'),
        leftSidebarContent: document.querySelector('#leftSidebar .sidebar-content'),
        rightSidebarContent: document.getElementById('rightSidebarContent'),
        quickActionsContainer: document.getElementById('quickActions'),
        btnUndo: document.getElementById('btnUndo'), 
        btnRedo: document.getElementById('btnRedo'), 
        btnCopy: document.getElementById('btnCopy'), 
        btnClear: document.getElementById('btnClear'),
        themeToggle: document.getElementById('themeToggle'), 
        autoSaveStatus: document.getElementById('autoSaveStatus'),
        btnHelp: document.getElementById('btnHelp'), 
        btnShortcuts: document.getElementById('btnShortcuts'), 
        btnSettings: document.getElementById('btnSettings'),
        modalContainer: document.getElementById('modalContainer'), 
        modalTitle: document.getElementById('modalTitle'),
        modalContent: document.getElementById('modalContent'), 
        modalActions: document.getElementById('modalActions'), 
        modalClose: document.getElementById('modalClose'),
        userIdDisplay: document.getElementById('userIdDisplay'),
        userIdValue: document.getElementById('userIdValue'),
    });
}

/**
 * Initializes the application
 */
async function init() {
    cacheDOMElements();
    setLogLevel('error');

    if (!appState.firebaseConfig) {
        console.error("Firebase configuration is missing!");
        showStatus("Error: Firebase not configured. Data will not be saved.", 10000, 'error');
        setupEventListeners();
        renderSidebarSections();
        loadQuickActionOrderFromDefaults();
        updateAllStats();
        initializeTooltips();
        return;
    }

    try {
        const firebaseApp = initializeApp(appState.firebaseConfig);
        appState.auth = getAuth(firebaseApp);
        appState.db = getFirestore(firebaseApp);

        onAuthStateChanged(appState.auth, async (user) => {
            if (user) {
                appState.userId = user.uid;
                appState.isAuthReady = true;
                console.log("User authenticated:", appState.userId);
                elements.userIdValue.textContent = appState.userId.substring(0, 8) + '...';
                elements.userIdDisplay.classList.remove('hidden');
                await loadDataFromFirestore();
            } else {
                console.log("No user signed in, attempting sign-in...");
                if (appState.initialAuthToken) {
                    try {
                        await signInWithCustomToken(appState.auth, appState.initialAuthToken);
                        console.log("Signed in with custom token.");
                    } catch (error) {
                        console.error("Error signing in with custom token, trying anonymous:", error);
                        await signInAnonymously(appState.auth);
                        console.log("Signed in anonymously after custom token failure.");
                    }
                } else {
                    await signInAnonymously(appState.auth);
                    console.log("Signed in anonymously.");
                }
            }
            
            setupEventListeners();
            renderSidebarSections();
            updateAllStats();
            initializeTooltips();
            showStatus('Ready', 2000, 'success');
        });

    } catch (e) {
        console.error('Error initializing Firebase:', e);
        showStatus('Error: Firebase initialization failed. Data will not be saved.', 10000, 'error');
        setupEventListeners();
        renderSidebarSections();
        loadQuickActionOrderFromDefaults();
        updateAllStats();
        initializeTooltips();
    }
}

/**
 * Loads user data from Firestore
 */
async function loadDataFromFirestore() {
    if (!appState.userId || !appState.db) return;
    console.log("Loading data from Firestore for user:", appState.userId);

    appState.listeners.forEach(unsubscribe => unsubscribe());
    appState.listeners = [];

    const userDocRef = doc(appState.db, FIRESTORE_PATHS.userData(appState.userId));

    const unsubUserData = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            console.log("User data loaded/updated:", data);
            elements.textArea.value = data.currentText || '';
            appState.currentText = elements.textArea.value;
            
            appState.autoSaveEnabled = typeof data.autoSaveEnabled === 'boolean' ? data.autoSaveEnabled : true;
            elements.autoSaveStatus.innerHTML = `<i class="fas fa-save fa-fw"></i> Auto-save: ${appState.autoSaveEnabled ? 'On' : 'Off'}`;
            
            loadTheme(data.theme || 'dark');
            loadUIStateFromData(data);
            loadQuickActionOrder(data.quickActionOrder || defaultQuickActions.map(qa => qa.action));

        } else {
            console.log("No user data document found, initializing with defaults.");
            elements.textArea.value = '';
            appState.currentText = '';
            loadTheme('dark');
            loadUIStateFromData({});
            loadQuickActionOrderFromDefaults();
            saveCurrentTextToFirestore(true);
            saveUIStateToFirestore();
        }
        updateAllStats();
    }, (error) => {
        console.error("Error listening to user data:", error);
        showStatus("Error loading user data.", 5000, 'error');
    });
    appState.listeners.push(unsubUserData);

    const savedTextsQuery = query(collection(appState.db, FIRESTORE_PATHS.savedTexts(appState.userId)), orderBy("createdAt", "desc"), limit(50));
    const unsubSavedTexts = onSnapshot(savedTextsQuery, (querySnapshot) => {
        const savedTexts = [];
        querySnapshot.forEach((doc) => {
            savedTexts.push({ id: doc.id, ...doc.data() });
        });
        console.log("Saved texts loaded/updated:", savedTexts.length);
        updateSavedTextsUI(savedTexts);
    }, (error) => {
        console.error("Error listening to saved texts:", error);
        showStatus("Error loading saved texts.", 5000, 'error');
    });
    appState.listeners.push(unsubSavedTexts);

    const historyQuery = query(collection(appState.db, FIRESTORE_PATHS.history(appState.userId)), orderBy("createdAt", "desc"), limit(20));
    const unsubHistory = onSnapshot(historyQuery, (querySnapshot) => {
        const historyItems = [];
        querySnapshot.forEach((doc) => {
            historyItems.push({ id: doc.id, ...doc.data() });
        });
        console.log("History loaded/updated:", historyItems.length);
        updateHistoryUI(historyItems);
    }, (error) => {
        console.error("Error listening to history:", error);
        showStatus("Error loading history.", 5000, 'error');
    });
    appState.listeners.push(unsubHistory);
}

/**
 * Saves current text to Firestore with debouncing
 */
const saveCurrentTextToFirestore = debounce(async function(forceSave = false) {
    if (!appState.userId || !appState.db || (!appState.autoSaveEnabled && !forceSave)) return;
    
    console.log("Attempting to save current text to Firestore.");
    try {
        const userDocRef = doc(appState.db, FIRESTORE_PATHS.userData(appState.userId));
        await setDoc(userDocRef, { 
            currentText: elements.textArea.value,
            lastUpdated: serverTimestamp() 
        }, { merge: true });
        console.log("Current text saved to Firestore.");
    } catch (e) {
        console.error('Error saving current text to Firestore:', e);
        showStatus('Error: Could not save text.', 5000, 'error');
    }
}, 1000);

/**
 * Saves UI state to Firestore
 */
async function saveUIStateToFirestore() {
    if (!appState.userId || !appState.db) return;
    console.log("Saving UI state to Firestore.");

    const currentQuickActionOrder = [...elements.quickActionsContainer.children].map(item => item.dataset.action);

    const uiStateData = {
        theme: document.documentElement.getAttribute('data-theme'),
        autoSaveEnabled: appState.autoSaveEnabled,
        uiState: {
            leftSidebarExpanded: !document.getElementById('leftSidebar').classList.contains('collapsed'),
            rightSidebarExpanded: !document.getElementById('rightSidebar').classList.contains('collapsed'),
            sections: {},
        },
        quickActionOrder: currentQuickActionOrder,
        lastUpdated: serverTimestamp()
    };

    document.querySelectorAll('.sidebar-section').forEach(section => {
        const sectionId = section.id.replace('section-', '');
        uiStateData.uiState.sections[sectionId] = !section.classList.contains('collapsed');
    });
    
    try {
        const userDocRef = doc(appState.db, FIRESTORE_PATHS.userData(appState.userId));
        await setDoc(userDocRef, uiStateData, { merge: true });
        console.log("UI state saved to Firestore.");
    } catch (e) {
        console.error('Error saving UI state to Firestore:', e);
        showStatus('Error: Could not save UI settings.', 5000, 'error');
    }
}

/**
 * Sets up all event listeners
 */
function setupEventListeners() {
    elements.textArea.addEventListener('input', handleTextInput);
    elements.textArea.addEventListener('keydown', handleKeyDown);
    elements.btnUndo.addEventListener('click', undo); 
    elements.btnRedo.addEventListener('click', redo);
    elements.btnCopy.addEventListener('click', copyText);
    elements.btnClear.addEventListener('click', () => showModal('Confirm Clear', 'Are you sure you want to clear all text? This action can be undone.',
        [{ text: 'Cancel', class: 'btn-secondary', callback: hideModal }, 
         { text: 'Clear All', class: 'btn-primary btn-delete', callback: () => { clearText(); hideModal(); } }]));
    
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.btnHelp.addEventListener('click', showHelp); 
    elements.btnShortcuts.addEventListener('click', showShortcuts); 
    elements.btnSettings.addEventListener('click', showSettingsModal);
    
    elements.modalContainer.addEventListener('click', (e) => { 
        if (e.target === elements.modalContainer) hideModal(); 
    });
    elements.modalClose.addEventListener('click', hideModal);
    
    document.querySelectorAll('.sidebar').forEach(sidebar => 
        sidebar.addEventListener('click', handleSidebarClicks));
    
    // Global keyboard shortcuts
    document.addEventListener('keydown', handleGlobalKeyDown);
    
    setupDragAndDropForQuickActions();
}

/**
 * Handles global keyboard shortcuts
 */
function handleGlobalKeyDown(e) {
    // Alt+1 for left sidebar, Alt+2 for right sidebar
    if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === '1') {
            e.preventDefault();
            toggleSidebar('left');
        } else if (e.key === '2') {
            e.preventDefault();
            toggleSidebar('right');
        }
    }
}

/**
 * Handles clicks within sidebars
 */
function handleSidebarClicks(e) {
    const target = e.target;
    const sectionHeader = target.closest('.section-header');
    const toolBtn = target.closest('.tool-btn');
    const fileInputBtn = target.closest('#fileInputBtn');
    const saveBtn = target.closest('#saveCurrentTextBtn');
    const restoreBtn = target.closest('.btn-restore-history');
    const loadBtn = target.closest('.btn-load-saved');
    const deleteSavedBtn = target.closest('.btn-delete-saved');
    const templateBtn = target.closest('[data-template]');
    const collapseSidebarBtn = target.closest('[data-action="collapse-sidebar"]');
    
    if (sectionHeader) toggleSection(sectionHeader.parentElement);
    if (toolBtn) handleToolClick(toolBtn);
    if (fileInputBtn) document.getElementById('fileInput').click();
    if (saveBtn) saveCurrentTextAsSnippet();
    if (restoreBtn) restoreFromHistory(restoreBtn.dataset.id);
    if (loadBtn) loadSavedText(loadBtn.dataset.id);
    if (templateBtn) applyTemplate(templateBtn.dataset.template);
    if (collapseSidebarBtn) {
        const sidebarId = collapseSidebarBtn.dataset.sidebarTarget;
        toggleSidebar(sidebarId.includes('left') ? 'left' : 'right');
    }
    if (deleteSavedBtn) {
        const id = deleteSavedBtn.dataset.id;
        showModal('Confirm Deletion', 'Are you sure you want to delete this saved text snippet?', [
            { text: 'Cancel', class: 'btn-secondary', callback: hideModal },
            { text: 'Delete', class: 'btn-primary btn-delete', callback: () => { deleteSavedTextSnippet(id); hideModal(); } }
        ]);
    }
}

/**
 * Handles tool button clicks
 */
function handleToolClick(button) {
    const type = button.dataset.transform || button.dataset.format || button.dataset.manipulate || button.dataset.export;
    if (button.dataset.transform) applyTransformation(type);
    if (button.dataset.format) applyFormatting(type);
    if (button.dataset.manipulate) applyManipulation(type);
    if (button.dataset.export) exportText(type);
}

/**
 * Handles text input changes
 */
function handleTextInput() {
    const newText = elements.textArea.value;
    if (appState.currentText !== newText) {
        appState.undoStack.push(appState.currentText);
        if (appState.undoStack.length > 50) appState.undoStack.shift();
        appState.redoStack = [];
        appState.currentText = newText;
    }
    updateAllStats();
    saveCurrentTextToFirestore();
}

/**
 * Handles keyboard shortcuts
 */
function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { 
        e.preventDefault(); 
        undo(); 
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { 
        e.preventDefault(); 
        redo(); 
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { 
        e.preventDefault(); 
        saveCurrentTextAsSnippet(); 
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') { 
        e.preventDefault(); 
        const findInput = document.getElementById('findInput');
        if (findInput) {
            findInput.focus();
            document.getElementById('section-findReplace')?.classList.remove('collapsed');
        }
    }
}

// Undo/Redo functions
function undo() {
    if (appState.undoStack.length > 0) {
        appState.redoStack.push(elements.textArea.value);
        elements.textArea.value = appState.undoStack.pop();
        appState.currentText = elements.textArea.value;
        updateAllStats(); 
        saveCurrentTextToFirestore();
        showStatus('Undo applied', 1500, 'success');
    } else {
        showStatus('Nothing to undo', 2000, 'warning');
    }
}

function redo() {
    if (appState.redoStack.length > 0) {
        appState.undoStack.push(elements.textArea.value);
        elements.textArea.value = appState.redoStack.pop();
        appState.currentText = elements.textArea.value;
        updateAllStats();
        saveCurrentTextToFirestore();
        showStatus('Redo applied', 1500, 'success');
    } else {
        showStatus('Nothing to redo', 2000, 'warning');
    }
}

function copyText() {
    if (elements.textArea.value) {
        navigator.clipboard.writeText(elements.textArea.value)
            .then(() => showStatus('Copied to clipboard', 2000, 'success'))
            .catch(() => {
                // Fallback method
                const tempTextArea = document.createElement('textarea');
                tempTextArea.value = elements.textArea.value;
                document.body.appendChild(tempTextArea);
                tempTextArea.select();
                try {
                    document.execCommand('copy');
                    showStatus('Copied to clipboard', 2000, 'success');
                } catch (err) {
                    showStatus('Failed to copy', 3000, 'error');
                    console.error('Copy failed:', err);
                }
                document.body.removeChild(tempTextArea);
            });
    } else {
        showStatus('Nothing to copy', 2000, 'warning');
    }
}

function clearText() {
    if (elements.textArea.value === '') return;
    addTextToHistory('Clear Text', elements.textArea.value);
    elements.textArea.value = ''; 
    handleTextInput();
    showStatus('Text cleared', 2000, 'success');
}

/**
 * Enhanced save text snippet function with better UX
 */
async function saveCurrentTextAsSnippet() {
    if (!appState.userId || !appState.db) {
        showStatus('Cannot save: Not connected to database.', 3000, 'error');
        return;
    }
    const text = elements.textArea.value.trim();
    if (!text) { 
        showStatus('No text to save', 2000, 'warning'); 
        return; 
    }

    showModal('Save Text Snippet', 
        `<div class="space-y-3">
            <label for="saveTitleInput" class="block text-sm font-medium" style="color: var(--text-secondary)">Enter a title for your snippet:</label>
            <input type="text" id="saveTitleInput" class="form-input" placeholder="My important document..." maxlength="100">
            <p class="text-xs" style="color: var(--text-muted)">
                <i class="fas fa-info-circle"></i> 
                This will save ${text.length.toLocaleString()} characters to your snippets library.
            </p>
        </div>`,
        [
            { text: 'Cancel', class: 'btn-secondary', callback: hideModal }, 
            { text: 'Save Snippet', class: 'btn-primary', callback: async () => {
                const titleInput = document.getElementById('saveTitleInput');
                const title = titleInput.value.trim();
                if (title) {
                    try {
                        const savedTextsColRef = collection(appState.db, FIRESTORE_PATHS.savedTexts(appState.userId));
                        await addDoc(savedTextsColRef, { 
                            title, 
                            text, 
                            createdAt: serverTimestamp(),
                            dateString: new Date().toLocaleString(),
                            wordCount: text.trim().split(/\s+/).filter(Boolean).length,
                            charCount: text.length
                        });
                        showStatus(`Snippet "${title}" saved successfully!`, 3000, 'success'); 
                        hideModal();
                    } catch (e) {
                        console.error("Error saving text snippet:", e);
                        showStatus('Error saving snippet.', 3000, 'error');
                    }
                } else {
                    showStatus('Title cannot be empty.', 2000, 'warning');
                    titleInput.focus();
                }
            }}
        ], 
        () => { 
            const titleInput = document.getElementById('saveTitleInput');
            titleInput.focus();
            titleInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const saveBtn = document.querySelector('.modal-actions .btn-primary');
                    if (saveBtn) saveBtn.click();
                }
            });
        }
    );
}

/**
 * Enhanced statistics update
 */
function updateAllStats() {
    const text = elements.textArea.value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    const lines = text ? text.split('\n').length : 0;
    const sentences = (text.match(/[.!?…]+(\s|$)/g) || []).length;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length;
    const WPM = 200; 
    const readTime = Math.max(1, Math.ceil(words / WPM));

    elements.charCount.innerHTML = `<i class="fas fa-text-width fa-fw"></i> ${chars.toLocaleString()}`;
    elements.wordCount.innerHTML = `<i class="fas fa-font fa-fw"></i> ${words.toLocaleString()}`;
    elements.lineCount.innerHTML = `<i class="fas fa-list fa-fw"></i> ${lines.toLocaleString()}`;
    elements.readTimeStat.innerHTML = `<i class="fas fa-clock fa-fw"></i> ${readTime} min`;

    // Update button states
    elements.btnUndo.disabled = appState.undoStack.length === 0;
    elements.btnRedo.disabled = appState.redoStack.length === 0;
    elements.btnCopy.disabled = chars === 0;
    elements.btnClear.disabled = chars === 0;
}

/**
 * Enhanced text analysis and reporting
 */
function generateReport() {
    const text = elements.textArea.value;
    if (!text.trim()) {
        showStatus('No text to analyze', 2000, 'warning');
        return;
    }
    
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const sentences = (text.match(/[.!?…]+(\s|$)/g) || []).length;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length;
    const lines = text.split('\n').length;
    
    // Advanced analytics
    const avgWordsPerSentence = sentences > 0 ? (wordCount / sentences).toFixed(1) : 0;
    const avgCharsPerWord = wordCount > 0 ? (charsNoSpaces / wordCount).toFixed(1) : 0;
    const avgSentencesPerParagraph = paragraphs > 0 ? (sentences / paragraphs).toFixed(1) : 0;
    
    // Reading time estimates
    const readingTime200 = Math.max(1, Math.ceil(wordCount / 200)); // Average reader
    const readingTime250 = Math.max(1, Math.ceil(wordCount / 250)); // Fast reader
    const readingTime150 = Math.max(1, Math.ceil(wordCount / 150)); // Slow reader
    
    // Word frequency analysis (top 5 words)
    const wordFreq = {};
    words.forEach(word => {
        const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
        if (cleanWord.length > 3) { // Only count words longer than 3 characters
            wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
        }
    });
    
    const topWords = Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([word, count]) => `${word} (${count})`)
        .join(', ') || 'None found';

    // Readability metrics (simplified)
    const avgSentenceLength = wordCount / Math.max(sentences, 1);
    let readabilityLevel = 'Graduate';
    if (avgSentenceLength < 15) readabilityLevel = 'Easy';
    else if (avgSentenceLength < 20) readabilityLevel = 'Medium';
    else if (avgSentenceLength < 25) readabilityLevel = 'Hard';

    const content = `
        <div class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-3">
                    <h4 class="font-semibold text-green-500 border-b border-green-500/30 pb-1">Basic Counts</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between"><span>Characters:</span><strong>${chars.toLocaleString()}</strong></div>
                        <div class="flex justify-between"><span>Characters (no spaces):</span><strong>${charsNoSpaces.toLocaleString()}</strong></div>
                        <div class="flex justify-between"><span>Words:</span><strong>${wordCount.toLocaleString()}</strong></div>
                        <div class="flex justify-between"><span>Sentences:</span><strong>${sentences.toLocaleString()}</strong></div>
                        <div class="flex justify-between"><span>Paragraphs:</span><strong>${paragraphs.toLocaleString()}</strong></div>
                        <div class="flex justify-between"><span>Lines:</span><strong>${lines.toLocaleString()}</strong></div>
                    </div>
                </div>
                
                <div class="space-y-3">
                    <h4 class="font-semibold text-blue-500 border-b border-blue-500/30 pb-1">Reading Time</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between"><span>Slow (150 WPM):</span><strong>${readingTime150} min</strong></div>
                        <div class="flex justify-between"><span>Average (200 WPM):</span><strong>${readingTime200} min</strong></div>
                        <div class="flex justify-between"><span>Fast (250 WPM):</span><strong>${readingTime250} min</strong></div>
                    </div>
                </div>
            </div>
            
            <div class="space-y-3">
                <h4 class="font-semibold text-purple-500 border-b border-purple-500/30 pb-1">Advanced Metrics</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="flex justify-between"><span>Avg. words per sentence:</span><strong>${avgWordsPerSentence}</strong></div>
                    <div class="flex justify-between"><span>Avg. chars per word:</span><strong>${avgCharsPerWord}</strong></div>
                    <div class="flex justify-between"><span>Avg. sentences per paragraph:</span><strong>${avgSentencesPerParagraph}</strong></div>
                    <div class="flex justify-between"><span>Readability level:</span><strong>${readabilityLevel}</strong></div>
                </div>
            </div>
            
            <div class="space-y-3">
                <h4 class="font-semibold text-orange-500 border-b border-orange-500/30 pb-1">Word Analysis</h4>
                <div class="text-sm">
                    <div class="flex flex-col gap-1">
                        <span class="font-medium">Most frequent words (4+ chars):</span>
                        <span class="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">${topWords}</span>
                    </div>
                </div>
            </div>
            
            <div class="text-xs text-center pt-4 border-t border-gray-200 dark:border-gray-700" style="color: var(--text-muted)">
                <i class="fas fa-info-circle"></i> Analysis generated on ${new Date().toLocaleString()}
            </div>
        </div>`;
    
    showModal('📊 Comprehensive Text Analysis', content, 
        [{ text: 'Close', class: 'btn-primary', callback: hideModal }]);
}

// History management
async function addTextToHistory(action, textSnapshot) {
    if (!appState.userId || !appState.db || !textSnapshot.trim()) return;
    
    try {
        const historyColRef = collection(appState.db, FIRESTORE_PATHS.history(appState.userId));
        await addDoc(historyColRef, {
            action,
            textSnapshot: textSnapshot.substring(0, 5000),
            createdAt: serverTimestamp(),
            dateString: new Date().toLocaleString(),
            wordCount: textSnapshot.trim().split(/\s+/).filter(Boolean).length,
            charCount: textSnapshot.length
        });
        pruneHistory(); 
    } catch (e) {
        console.error("Error adding to history:", e);
    }
}

async function pruneHistory() {
    if (!appState.userId || !appState.db) return;
    const historyColRef = collection(appState.db, FIRESTORE_PATHS.history(appState.userId));
    const q = query(historyColRef, orderBy("createdAt", "desc"));

    try {
        const snapshot = await getDocs(q);
        if (snapshot.docs.length > 20) {
            const batch = writeBatch(appState.db);
            snapshot.docs.slice(20).forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            console.log("Old history items pruned.");
        }
    } catch (error) {
        console.error("Error pruning history:", error);
    }
}

// UI update functions
function updateHistoryUI(historyItems = []) {
    const container = document.getElementById('historyList');
    if (!container) return;
    container.innerHTML = historyItems.length === 0 
        ? `<div class="text-center p-6 text-sm" style="color:var(--text-muted)">
            <i class="fas fa-history text-3xl opacity-30 mb-3 block"></i>
            <p class="font-medium">No history yet</p>
            <p class="text-xs mt-1">Your text changes will appear here</p>
           </div>`
        : historyItems.map(item => `
            <div class="p-3 mb-2 rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-gray-800" style="background:var(--bg-tertiary); border: 1px solid var(--border-primary)">
                <div class="flex justify-between items-start mb-2">
                    <div class="font-medium text-sm">${item.action}</div>
                    <button class="btn btn-secondary text-xs px-2 py-1 btn-restore-history hover:bg-green-500 hover:text-white transition-colors" data-id="${item.id}" title="Restore this version">
                        <i class="fas fa-undo mr-1"></i>Restore
                    </button>
                </div>
                <div class="text-xs grid grid-cols-3 gap-2 mb-2" style="color:var(--text-muted)">
                    <span><i class="fas fa-font"></i> ${item.wordCount || 0} words</span>
                    <span><i class="fas fa-text-width"></i> ${item.charCount || 0} chars</span>
                    <span><i class="fas fa-clock"></i> ${item.dateString || new Date(item.createdAt?.toDate()).toLocaleString()}</span>
                </div>
                <div class="text-xs p-2 rounded" style="background:var(--bg-hover); color:var(--text-muted); max-height: 40px; overflow: hidden;">
                    ${(item.textSnapshot || '').substring(0, 100)}${(item.textSnapshot || '').length > 100 ? '...' : ''}
                </div>
            </div>`).join('');
}

function updateSavedTextsUI(savedTexts = []) {
    const container = document.getElementById('savedList');
    if (!container) return;
    container.innerHTML = savedTexts.length === 0 
        ? `<div class="text-center p-6 text-sm" style="color:var(--text-muted)">
            <i class="fas fa-bookmark text-3xl opacity-30 mb-3 block"></i>
            <p class="font-medium">No saved snippets</p>
            <p class="text-xs mt-1">Save important text for later use</p>
           </div>`
        : savedTexts.map(item => `
            <div class="p-3 mb-2 rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-gray-800" style="background:var(--bg-tertiary); border: 1px solid var(--border-primary)">
                <div class="flex justify-between items-start mb-2">
                    <div class="font-medium text-sm truncate pr-2" title="${item.title}">${item.title}</div>
                    <div class="flex gap-1 flex-shrink-0">
                        <button class="btn btn-secondary text-xs px-2 py-1 btn-load-saved hover:bg-blue-500 hover:text-white transition-colors" data-id="${item.id}" title="Load this snippet">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-secondary btn-delete-saved text-xs px-2 py-1 hover:bg-red-500 hover:text-white transition-colors" data-id="${item.id}" title="Delete this snippet">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="text-xs grid grid-cols-3 gap-2" style="color:var(--text-muted)">
                    <span><i class="fas fa-font"></i> ${item.wordCount || 0} words</span>
                    <span><i class="fas fa-text-width"></i> ${item.charCount || 0} chars</span>
                    <span><i class="fas fa-clock"></i> ${item.dateString || new Date(item.createdAt?.toDate()).toLocaleString()}</span>
                </div>
            </div>`).join('');
}

// Restore and load functions
async function restoreFromHistory(historyItemId) {
    if (!appState.userId || !appState.db) return;
    try {
        const historyDocRef = doc(appState.db, FIRESTORE_PATHS.history(appState.userId), historyItemId);
        const docSnap = await getDoc(historyDocRef);
        if (docSnap.exists()) {
            const item = docSnap.data();
            addTextToHistory('Before Restore from History', elements.textArea.value);
            elements.textArea.value = item.textSnapshot; 
            handleTextInput();
            showStatus(`Restored from history: ${item.action}`, 3000, 'success'); 
        } else {
            showStatus('History item not found.', 3000, 'error');
        }
    } catch (e) {
        console.error("Error restoring from history:", e);
        showStatus('Error restoring history.', 3000, 'error');
    }
}

async function loadSavedText(savedTextId) {
    if (!appState.userId || !appState.db) return;
    try {
        const savedTextDocRef = doc(appState.db, FIRESTORE_PATHS.savedTexts(appState.userId), savedTextId);
        const docSnap = await getDoc(savedTextDocRef);
        if (docSnap.exists()) {
            const item = docSnap.data();
            addTextToHistory('Load Saved Text', elements.textArea.value);
            elements.textArea.value = item.text; 
            handleTextInput(); 
            showStatus(`Loaded: "${item.title}"`, 3000, 'success'); 
        } else {
            showStatus('Saved text not found.', 3000, 'error');
        }
    } catch (e) {
        console.error("Error loading saved text:", e);
        showStatus('Error loading saved text.', 3000, 'error');
    }
}

async function deleteSavedTextSnippet(savedTextId) {
    if (!appState.userId || !appState.db) return;
    try {
        const savedTextDocRef = doc(appState.db, FIRESTORE_PATHS.savedTexts(appState.userId), savedTextId);
        await deleteDoc(savedTextDocRef);
        showStatus('Deleted saved text snippet', 2000, 'success');
    } catch (e) {
        console.error("Error deleting saved text snippet:", e);
        showStatus('Error deleting snippet.', 3000, 'error');
    }
}

/**
 * Enhanced status message system with types
 */
let statusTimeout;
function showStatus(message, duration = 3000, type = 'info') {
    clearTimeout(statusTimeout);
    elements.statusMessage.textContent = message;
    
    // Remove all type classes first
    elements.statusMessage.classList.remove('success', 'error', 'warning');
    
    // Add the appropriate type class
    if (type !== 'info') {
        elements.statusMessage.classList.add(type);
    }
    
    elements.statusMessage.classList.remove('opacity-0');
    elements.statusMessage.classList.add('opacity-100');
    
    statusTimeout = setTimeout(() => {
        elements.statusMessage.classList.remove('opacity-100');
        elements.statusMessage.classList.add('opacity-0');
        setTimeout(() => {
            elements.statusMessage.classList.remove('success', 'error', 'warning');
        }, 300);
    }, duration);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Enhanced modal with better UX
 */
function showModal(title, content, buttons = [], onOpen = null) {
    elements.modalTitle.textContent = title; 
    elements.modalContent.innerHTML = content; 
    elements.modalActions.innerHTML = '';
    buttons.forEach(btnInfo => { 
        const button = document.createElement('button'); 
        button.textContent = btnInfo.text; 
        button.className = `btn ${btnInfo.class || 'btn-secondary'}`;
        button.onclick = btnInfo.callback; 
        elements.modalActions.appendChild(button); 
    });
    
    elements.modalContainer.hidden = false; 
    document.body.style.overflow = 'hidden';
    
    requestAnimationFrame(() => {
        elements.modalContainer.classList.add('visible');
        const primaryBtn = elements.modalActions.querySelector('.btn-primary');
        const firstBtn = elements.modalActions.querySelector('button:not([disabled])');
        const focusTarget = primaryBtn || firstBtn || elements.modalClose;
        if (focusTarget) focusTarget.focus();
        
        if (onOpen) onOpen();
    });
    
    // Add escape key listener
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            hideModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

function hideModal() {
    elements.modalContainer.classList.remove('visible');
    setTimeout(() => { 
        elements.modalContainer.hidden = true; 
        document.body.style.overflow = ''; 
    }, 300);
}

// --- Enhanced UI State Management ---

function renderSidebarSections() {
    const leftSidebarSections = [
        { id: 'history', title: 'History', icon: 'fa-history', content: '<div id="historyList" class="max-h-80 overflow-y-auto"></div>' },
        { id: 'templates', title: 'Templates', icon: 'fa-file-alt', content: getTemplatesHTML() },
        { id: 'saved', title: 'Saved Texts', icon: 'fa-bookmark', content: '<div id="savedList" class="max-h-80 overflow-y-auto"></div><button id="saveCurrentTextBtn" class="btn btn-primary w-full mt-3 compact-btn"><i class="fas fa-save fa-fw"></i> Save Current Text</button>' }
    ];
    
    const rightSidebarSections = [
        { id: 'quickAnalysis', title: 'Quick Analysis', icon: 'fa-chart-bar', content: getQuickAnalysisHTML() },
        { id: 'case', title: 'Case Transform', icon: 'fa-font', content: getCaseToolsHTML() },
        { id: 'findReplace', title: 'Find & Replace', icon: 'fa-search', content: getFindReplaceHTML() },
        { id: 'ops', title: 'Text Operations', icon: 'fa-edit', content: getOpsToolsHTML() },
        { id: 'encode', title: 'Encode/Decode', icon: 'fa-shield-alt', content: getEncodeToolsHTML() },
        { id: 'importExport', title: 'Import / Export', icon: 'fa-file-import', content: getImportExportHTML() }
    ];
    
    const defaultSectionStates = {};
    [...leftSidebarSections, ...rightSidebarSections].forEach(s => defaultSectionStates[s.id] = true);

    const currentSectionStates = window.uiStateSnapshot?.sections || defaultSectionStates;

    elements.leftSidebarContent.innerHTML = leftSidebarSections.map(s => 
        createSectionHTML(s, currentSectionStates[s.id] !== false)).join('');
    elements.rightSidebarContent.innerHTML = rightSidebarSections.map(s => 
        createSectionHTML(s, currentSectionStates[s.id] !== false)).join('');
    
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.addEventListener('change', handleFileImport);

    const findReplaceBtn = document.querySelector('[data-find-replace]');
    if (findReplaceBtn) findReplaceBtn.addEventListener('click', () => findAndReplace(false));
    
    const findReplaceAllBtn = document.querySelector('[data-find-replace-all]');
    if (findReplaceAllBtn) findReplaceAllBtn.addEventListener('click', () => findAndReplace(true));
}

function createSectionHTML({id, title, icon, content}, isExpanded) {
    return `
        <section class="sidebar-section ${isExpanded ? '' : 'collapsed'}" id="section-${id}">
            <h3 class="section-header" role="button" aria-expanded="${isExpanded}" aria-controls="content-${id}" tabindex="0">
                <span class="flex items-center gap-2 font-semibold text-sm">
                    <i class="fas ${icon} fa-fw text-green-500 w-4"></i> ${title}
                </span>
                <i class="fas fa-chevron-down fa-fw transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}"></i>
            </h3>
            <div id="content-${id}" class="section-content">${content}</div>
        </section>`;
}

/**
 * Enhanced theme toggle with smooth transitions
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Add transition class
    document.body.style.transition = 'all 0.3s ease';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    elements.themeToggle.querySelector('i').className = `fas fa-fw theme-icon ${newTheme === 'dark' ? 'fa-moon' : 'fa-sun'}`;
    
    // Remove transition after completion
    setTimeout(() => {
        document.body.style.transition = '';
    }, 300);
    
    saveUIStateToFirestore();
    showStatus(`Switched to ${newTheme} theme`, 1500, 'success');
}

function loadTheme(themePreference) {
    const theme = themePreference || 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    elements.themeToggle.querySelector('i').className = `fas fa-fw theme-icon ${theme === 'dark' ? 'fa-moon' : 'fa-sun'}`;
}

/**
 * Enhanced sidebar toggle with animations
 */
function toggleSidebar(side) {
    const sidebarEl = document.getElementById(side + 'Sidebar');
    const isCurrentlyExpanded = !sidebarEl.classList.contains('collapsed');
    
    sidebarEl.classList.toggle('collapsed', isCurrentlyExpanded);
    
    // Update the collapse button text and icon
    const collapseBtn = sidebarEl.querySelector('.sidebar-collapse-btn');
    const icon = collapseBtn.querySelector('i');
    const hint = collapseBtn.querySelector('.collapse-hint');
    
    if (side === 'left') {
        icon.className = `fas fa-fw ${!isCurrentlyExpanded ? 'fa-chevron-right' : 'fa-chevron-left'}`;
        hint.textContent = !isCurrentlyExpanded ? 'Show' : 'Hide';
        collapseBtn.setAttribute('title', `${!isCurrentlyExpanded ? 'Show' : 'Hide'} workspace panel (Alt+1)`);
        collapseBtn.setAttribute('aria-label', `${!isCurrentlyExpanded ? 'Show' : 'Hide'} workspace panel`);
    } else {
        icon.className = `fas fa-fw ${!isCurrentlyExpanded ? 'fa-chevron-left' : 'fa-chevron-right'}`;
        hint.textContent = !isCurrentlyExpanded ? 'Show' : 'Hide';
        collapseBtn.setAttribute('title', `${!isCurrentlyExpanded ? 'Show' : 'Hide'} tools panel (Alt+2)`);
        collapseBtn.setAttribute('aria-label', `${!isCurrentlyExpanded ? 'Show' : 'Hide'} tools panel`);
    }
    
    saveUIStateToFirestore();
    showStatus(`${side.charAt(0).toUpperCase() + side.slice(1)} panel ${!isCurrentlyExpanded ? 'hidden' : 'shown'}`, 1500, 'success');
}

function toggleSection(sectionElement) {
    const isCurrentlyExpanded = !sectionElement.classList.contains('collapsed');
    sectionElement.classList.toggle('collapsed', isCurrentlyExpanded);
    
    const header = sectionElement.querySelector('.section-header');
    header.setAttribute('aria-expanded', !isCurrentlyExpanded);
    
    const chevron = header.querySelector('.fa-chevron-down');
    chevron.classList.toggle('-rotate-90', isCurrentlyExpanded);
    
    saveUIStateToFirestore();
}

function loadUIStateFromData(uiStateData = {}) {
    window.uiStateSnapshot = uiStateData.uiState || {};

    const leftSidebar = document.getElementById('leftSidebar');
    const rightSidebar = document.getElementById('rightSidebar');

    // Handle left sidebar state
    if (uiStateData.uiState?.leftSidebarExpanded === false) {
        leftSidebar.classList.add('collapsed');
        const leftCollapseBtn = leftSidebar.querySelector('.sidebar-collapse-btn');
        if (leftCollapseBtn) {
            const icon = leftCollapseBtn.querySelector('i');
            const hint = leftCollapseBtn.querySelector('.collapse-hint');
            icon.className = 'fas fa-fw fa-chevron-right';
            hint.textContent = 'Show';
            leftCollapseBtn.setAttribute('title', 'Show workspace panel (Alt+1)');
            leftCollapseBtn.setAttribute('aria-label', 'Show workspace panel');
        }
    } else {
        leftSidebar.classList.remove('collapsed');
        const leftCollapseBtn = leftSidebar.querySelector('.sidebar-collapse-btn');
        if (leftCollapseBtn) {
            const icon = leftCollapseBtn.querySelector('i');
            const hint = leftCollapseBtn.querySelector('.collapse-hint');
            icon.className = 'fas fa-fw fa-chevron-left';
            hint.textContent = 'Hide';
            leftCollapseBtn.setAttribute('title', 'Hide workspace panel (Alt+1)');
            leftCollapseBtn.setAttribute('aria-label', 'Hide workspace panel');
        }
    }

    // Handle right sidebar state
    if (uiStateData.uiState?.rightSidebarExpanded === false) {
        rightSidebar.classList.add('collapsed');
        const rightCollapseBtn = rightSidebar.querySelector('.sidebar-collapse-btn');
        if (rightCollapseBtn) {
            const icon = rightCollapseBtn.querySelector('i');
            const hint = rightCollapseBtn.querySelector('.collapse-hint');
            icon.className = 'fas fa-fw fa-chevron-left';
            hint.textContent = 'Show';
            rightCollapseBtn.setAttribute('title', 'Show tools panel (Alt+2)');
            rightCollapseBtn.setAttribute('aria-label', 'Show tools panel');
        }
    } else {
        rightSidebar.classList.remove('collapsed');
        const rightCollapseBtn = rightSidebar.querySelector('.sidebar-collapse-btn');
        if (rightCollapseBtn) {
            const icon = rightCollapseBtn.querySelector('i');
            const hint = rightCollapseBtn.querySelector('.collapse-hint');
            icon.className = 'fas fa-fw fa-chevron-right';
            hint.textContent = 'Hide';
            rightCollapseBtn.setAttribute('title', 'Hide tools panel (Alt+2)');
            rightCollapseBtn.setAttribute('aria-label', 'Hide tools panel');
        }
    }
}

// --- Enhanced Quick Actions ---
const defaultQuickActions = [
    { action: 'uppercase', label: 'Uppercase', icon: 'fa-font' },
    { action: 'lowercase', label: 'Lowercase', icon: 'fa-text-height' },
    { action: 'word-count-quick', label: 'Full Report', icon: 'fa-chart-bar' },
    { action: 'find-replace-quick', label: 'Find/Replace', icon: 'fa-search-plus' },
];

function renderQuickActions(order) {
    elements.quickActionsContainer.innerHTML = '';
    order.forEach(actionKey => {
        const actionConfig = defaultQuickActions.find(qa => qa.action === actionKey);
        if (actionConfig) {
            const item = document.createElement('div');
            item.className = 'quick-action-item';
            item.draggable = true;
            item.dataset.action = actionConfig.action;
            item.tabIndex = 0;
            item.role = 'button';
            item.setAttribute('aria-label', actionConfig.label);
            item.innerHTML = `<button class="btn btn-secondary text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5" tabindex="-1">
                <i class="fas ${actionConfig.icon} fa-fw"></i>
                <span class="hidden md:inline ml-1.5">${actionConfig.label}</span>
            </button>`;
            item.addEventListener('click', () => handleQuickActionClick(actionConfig.action));
            elements.quickActionsContainer.appendChild(item);
        }
    });
}

function handleQuickActionClick(action) {
    switch(action) {
        case 'uppercase': 
            applyTransformation('uppercase'); 
            break;
        case 'lowercase': 
            applyTransformation('lowercase'); 
            break;
        case 'find-replace-quick': 
            document.getElementById('section-findReplace')?.classList.remove('collapsed');
            setTimeout(() => document.getElementById('findInput')?.focus(), 100);
            showStatus('Find/Replace opened', 1500, 'success');
            break;
        case 'word-count-quick': 
            generateReport();
            break;
        default: 
            console.warn('Unknown quick action:', action);
    }
}

function setupDragAndDropForQuickActions() {
    let draggedElement = null;
    
    elements.quickActionsContainer.addEventListener('dragstart', e => { 
        if (e.target.classList.contains('quick-action-item')) { 
            draggedElement = e.target; 
            setTimeout(() => e.target.setAttribute('data-dragging', 'true'), 0); 
        } 
    });
    
    elements.quickActionsContainer.addEventListener('dragend', () => { 
        if (draggedElement) { 
            draggedElement.setAttribute('data-dragging', 'false'); 
            draggedElement = null; 
            saveUIStateToFirestore();
        } 
    });
    
    elements.quickActionsContainer.addEventListener('dragover', e => { 
        e.preventDefault(); 
        const target = e.target.closest('.quick-action-item'); 
        if (target && draggedElement && target !== draggedElement) { 
            const rect = target.getBoundingClientRect(); 
            const next = (e.clientX - rect.left) / rect.width > 0.5; 
            elements.quickActionsContainer.insertBefore(draggedElement, next ? target.nextSibling : target); 
        } 
    });
    
    elements.quickActionsContainer.addEventListener('keydown', e => {
        if(!['ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(e.key)) return;
        const currentItem = document.activeElement;
        if (!currentItem || !currentItem.classList.contains('quick-action-item')) return;
        
        e.preventDefault();
        if (e.key === 'Enter' || e.key === ' ') { 
            const isGrabbed = currentItem.getAttribute('aria-grabbed') === 'true'; 
            currentItem.setAttribute('aria-grabbed', String(!isGrabbed)); 
            if (isGrabbed) saveUIStateToFirestore(); 
        } else if (currentItem.getAttribute('aria-grabbed') === 'true') {
            if (e.key === 'ArrowRight' && currentItem.nextElementSibling) {
                currentItem.parentNode.insertBefore(currentItem, currentItem.nextElementSibling.nextSibling);
            } else if (e.key === 'ArrowLeft' && currentItem.previousElementSibling) {
                currentItem.parentNode.insertBefore(currentItem, currentItem.previousElementSibling);
            }
            currentItem.focus();
        }
    });
}

function loadQuickActionOrder(order) {
    const validOrder = order && Array.isArray(order) && order.length > 0 
        ? order 
        : defaultQuickActions.map(qa => qa.action);
    renderQuickActions(validOrder);
}

function loadQuickActionOrderFromDefaults() {
    renderQuickActions(defaultQuickActions.map(qa => qa.action));
}

// --- Enhanced Text Transformation Functions ---
function applyTransformation(type) {
    const text = elements.textArea.value; 
    if (!text && type !== 'add-line-numbers') { 
        showStatus('No text to transform', 2000, 'warning'); 
        return; 
    }
    addTextToHistory(`Transform: ${type}`, text); 
    let transformed = text;
    const fns = {
        uppercase: s => s.toUpperCase(), 
        lowercase: s => s.toLowerCase(),
        title: s => s.replace(/\b\w/g, l => l.toUpperCase()),
        sentence: s => s.toLowerCase().replace(/(^\s*\w|[.!?…]\s*\w)/g, c => c.toUpperCase()),
        camel: s => s.replace(/[\s_-]+(.)?/g, (_, c) => c ? c.toUpperCase() : '').replace(/^(.)/, c => c.toLowerCase()),
        pascal: s => s.replace(/[\s_-]+(.)?/g, (_, c) => c ? c.toUpperCase() : '').replace(/^(.)/, c => c.toUpperCase()),
        snake: s => s.replace(/([A-Z])/g, "_$1").replace(/[\s-]+/g, '_').toLowerCase().replace(/^_+|_+$/g, ''),
        kebab: s => s.replace(/([A-Z])/g, "-$1").replace(/[\s_]+/g, '-').toLowerCase().replace(/^-+|-+$/g, ''),
    };
    if(fns[type]) transformed = fns[type](text);
    elements.textArea.value = transformed; 
    handleTextInput(); 
    showStatus(`Applied ${type} case`, 2000, 'success');
}

function applyFormatting(type) {
    const text = elements.textArea.value; 
    if (!text && type !== 'add-line-numbers') { 
        showStatus('No text to format', 2000, 'warning'); 
        return; 
    }
    addTextToHistory(`Format: ${type}`, text); 
    let formatted = text;
    const fns = {
        'trim': s => s.trim(), 
        'remove-extra-spaces': s => s.replace(/\s+/g, ' ').trim(),
        'remove-line-breaks': s => s.replace(/\r?\n/g, ' ').trim(),
        'add-line-numbers': s => s.split('\n').map((l, i) => `${(i+1).toString().padStart(s.split('\n').length.toString().length, '0')}: ${l}`).join('\n'),
        'remove-empty-lines': s => s.split('\n').filter(l => l.trim()).join('\n'),
        'sort-lines': s => s.split('\n').sort((a, b) => a.localeCompare(b)).join('\n'),
        'reverse-lines': s => s.split('\n').reverse().join('\n'),
        'shuffle-lines': s => { 
            const l=s.split('\n'); 
            for(let i=l.length-1;i>0;i--){
                const j=Math.floor(Math.random()*(i+1));
                [l[i],l[j]]=[l[j],l[i]];
            } 
            return l.join('\n'); 
        },
        'remove-duplicates': s => [...new Set(s.split('\n'))].join('\n'),
    };
    if(fns[type]) formatted = fns[type](text);
    elements.textArea.value = formatted; 
    handleTextInput(); 
    showStatus(`Formatted: ${type.replace(/-/g, ' ')}`, 2000, 'success');
}

function applyManipulation(type) {
    const text = elements.textArea.value; 
    if (!text) { 
        showStatus('No text to manipulate', 2000, 'warning'); 
        return; 
    }
    let manipulated = text;
    try {
        addTextToHistory(`Manipulate: ${type}`, text);
        const fns = {
            'reverse': s => s.split('').reverse().join(''),
            'rot13': s => s.replace(/[a-zA-Z]/g, c => String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() < 'n' ? 13 : -13))),
            'base64-encode': s => btoa(unescape(encodeURIComponent(s))),
            'base64-decode': s => decodeURIComponent(escape(atob(s))),
            'url-encode': s => encodeURIComponent(s), 
            'url-decode': s => decodeURIComponent(s),
            'html-encode': s => { 
                const d=document.createElement('div'); 
                d.textContent=s; 
                return d.innerHTML; 
            },
            'html-decode': s => { 
                const d=document.createElement('div'); 
                d.innerHTML=s; 
                return d.textContent; 
            },
            'extract-emails': s => (s.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []).join('\n') || 'No emails found',
            'extract-urls': s => (s.match(/https?:\/\/[^\s$.?#].[^\s]*/g) || []).join('\n') || 'No URLs found',
        };
        if(fns[type]) manipulated = fns[type](text);
        elements.textArea.value = manipulated; 
        handleTextInput(); 
        showStatus(`Applied: ${type.replace(/-/g, ' ')}`, 2000, 'success');
    } catch (e) { 
        showStatus(`Error with ${type}: ${e.message}`, 5000, 'error'); 
        console.error(`Error in ${type}:`, e);
    }
}

function findAndReplace(isReplaceAll) {
    const findInput = document.getElementById('findInput'); 
    const replaceInput = document.getElementById('replaceInput');
    if (!findInput || !replaceInput) {
        showStatus("Find/Replace inputs not found.", 3000, 'error');
        return;
    }

    const findText = findInput.value; 
    if (!findText) { 
        showStatus('Enter text to find', 2000, 'warning'); 
        return; 
    }
    const replaceText = replaceInput.value; 
    const text = elements.textArea.value;
    const useRegex = document.getElementById('useRegex')?.checked || false; 
    const caseSensitive = document.getElementById('caseSensitive')?.checked || false;
    
    try {
        const flags = (isReplaceAll ? 'g' : '') + (caseSensitive ? '' : 'i');
        const pattern = useRegex ? new RegExp(findText, flags) : new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
        
        let matchCount = 0;
        const newText = text.replace(pattern, (match) => {
            matchCount++;
            return replaceText;
        });

        if (matchCount === 0) { 
            showStatus('No matches found', 2000, 'warning'); 
            return; 
        }
        
        addTextToHistory(isReplaceAll ? 'Replace All' : 'Replace', text);
        elements.textArea.value = newText; 
        handleTextInput(); 
        showStatus(`Replaced ${matchCount} occurrence(s)`, 3000, 'success');
    } catch(e) { 
        showStatus(`Invalid Regex: ${e.message}`, 5000, 'error'); 
        console.error("Regex error:", e);
    }
}

// File handling
function handleFileImport(e) {
    const file = e.target.files[0]; 
    if (!file) return; 
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showStatus('File too large. Maximum size is 5MB.', 3000, 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => { 
        addTextToHistory('Import File', elements.textArea.value); 
        elements.textArea.value = event.target.result; 
        handleTextInput(); 
        showStatus(`Imported ${file.name} (${file.size.toLocaleString()} bytes)`, 3000, 'success'); 
    };
    reader.onerror = () => showStatus('Failed to read file', 5000, 'error'); 
    reader.readAsText(file); 
    e.target.value = '';
}

function exportText(format) {
    const text = elements.textArea.value; 
    if (!text) { 
        showStatus('No text to export', 2000, 'warning'); 
        return; 
    }
    if (format === 'pdf') { 
        exportPDF(); 
        return; 
    }
    
    let content, mimeType, filename; 
    const date = new Date().toISOString().slice(0,10);
    const stats = {
        chars: text.length,
        words: text.trim().split(/\s+/).filter(Boolean).length,
        lines: text.split('\n').length,
        exported: new Date().toISOString()
    };
    
    switch (format) {
        case 'txt': 
            content = text; 
            mimeType = 'text/plain'; 
            filename = `textman-export-${date}.txt`; 
            break;
        case 'json': 
            content = JSON.stringify({ text, metadata: stats }, null, 2); 
            mimeType = 'application/json'; 
            filename = `textman-export-${date}.json`; 
            break;
        case 'csv': 
            content = `"text","characters","words","lines","exported"\n"${text.replace(/"/g, '""')}","${stats.chars}","${stats.words}","${stats.lines}","${stats.exported}"`; 
            mimeType = 'text/csv'; 
            filename = `textman-export-${date}.csv`; 
            break;
        default: 
            showStatus('Unknown export format', 3000, 'error'); 
            return;
    }
    
    const blob = new Blob([content], { type: mimeType }); 
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = filename; 
    document.body.appendChild(a);
    a.click(); 
    document.body.removeChild(a);
    URL.revokeObjectURL(url); 
    showStatus(`Exported as ${format.toUpperCase()} (${blob.size.toLocaleString()} bytes)`, 3000, 'success');
}

function exportPDF() {
    const text = elements.textArea.value; 
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        showStatus('Popup blocked. Please allow popups for PDF export.', 5000, 'error');
        return;
    }
    
    const stats = {
        chars: text.length,
        words: text.trim().split(/\s+/).filter(Boolean).length,
        lines: text.split('\n').length,
    };
    
    printWindow.document.write(`
        <html>
        <head>
            <title>textMan Export - ${new Date().toLocaleDateString()}</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
                .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                .stats { background: #f5f5f5; padding: 10px; border-radius: 5px; margin-bottom: 20px; font-size: 0.9em; }
                .content { white-space: pre-wrap; word-wrap: break-word; font-family: 'Courier New', monospace; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>textMan Document Export</h1>
                <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
            <div class="stats">
                <strong>Document Statistics:</strong> 
                ${stats.chars.toLocaleString()} characters, 
                ${stats.words.toLocaleString()} words, 
                ${stats.lines.toLocaleString()} lines
            </div>
            <div class="content">${text.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
        </body>
        </html>`);
    printWindow.document.close(); 
    printWindow.onload = () => { 
        try { 
            printWindow.print(); 
            showStatus('PDF export initiated', 2000, 'success');
        } catch(e) { 
            console.error("Print failed", e); 
            showStatus("PDF generation failed. Try printing manually.", 5000, 'error');
        } 
    }
}

// --- Enhanced Modals ---
function showHelp() { 
    const content = `
        <div class="space-y-6">
            <div class="text-center">
                <i class="fas fa-rocket text-4xl text-green-500 mb-3"></i>
                <p class="text-lg font-medium">Welcome to textMan!</p>
                <p class="text-sm" style="color: var(--text-muted)">Your comprehensive text manipulation toolkit</p>
            </div>
            
            <div class="space-y-4">
                <div class="border-l-4 border-green-500 pl-4">
                    <h4 class="font-semibold text-green-500 mb-2">🏢 Workspace (Left Panel)</h4>
                    <ul class="text-sm space-y-1" style="color: var(--text-secondary)">
                        <li><strong>History:</strong> Track and restore previous text versions</li>
                        <li><strong>Templates:</strong> Quick access to common document formats</li>
                        <li><strong>Saved Texts:</strong> Store and organize important snippets</li>
                    </ul>
                </div>
                
                <div class="border-l-4 border-blue-500 pl-4">
                    <h4 class="font-semibold text-blue-500 mb-2">🛠️ Tools (Right Panel)</h4>
                    <ul class="text-sm space-y-1" style="color: var(--text-secondary)">
                        <li><strong>Quick Analysis:</strong> Comprehensive text statistics and insights</li>
                        <li><strong>Case Transform:</strong> Change text casing (upper, lower, camel, etc.)</li>
                        <li><strong>Find & Replace:</strong> Search and replace with regex support</li>
                        <li><strong>Text Operations:</strong> Format, sort, and manipulate text lines</li>
                        <li><strong>Encode/Decode:</strong> Base64, URL, HTML encoding and more</li>
                        <li><strong>Import/Export:</strong> Load files and save in various formats</li>
                    </ul>
                </div>
                
                <div class="border-l-4 border-purple-500 pl-4">
                    <h4 class="font-semibold text-purple-500 mb-2">⚡ Quick Actions Bar</h4>
                    <p class="text-sm" style="color: var(--text-secondary)">
                        Central toolbar with your most-used functions. Drag to reorder and customize your workflow.
                    </p>
                </div>
                
                <div class="border-l-4 border-orange-500 pl-4">
                    <h4 class="font-semibold text-orange-500 mb-2">💡 Pro Tips</h4>
                    <ul class="text-sm space-y-1" style="color: var(--text-secondary)">
                        <li>• Use <kbd class="px-1 py-0.5 rounded text-xs bg-gray-200 dark:bg-gray-700">Alt+1</kbd> and <kbd class="px-1 py-0.5 rounded text-xs bg-gray-200 dark:bg-gray-700">Alt+2</kbd> to toggle panels</li>
                        <li>• Auto-save keeps your work safe as you type</li>
                        <li>• All data syncs across your devices when signed in</li>
                        <li>• Use Ctrl+F to quickly open Find & Replace</li>
                    </ul>
                </div>
            </div>
            
            <div class="text-center pt-4 border-t" style="border-color: var(--border-primary)">
                <p class="text-xs" style="color: var(--text-muted)">
                    <i class="fas fa-heart text-red-500"></i> 
                    Built with care for writers, developers, and content creators
                </p>
            </div>
        </div>`;
    
    showModal('📚 Help & Guide', content, [{ text: 'Got it!', class: 'btn-primary', callback: hideModal }]);
}

function showShortcuts() { 
    const content = `
        <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 class="font-semibold text-green-500 mb-3 border-b border-green-500/30 pb-1">⌨️ Text Editing</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between items-center">
                            <span>Undo</span>
                            <kbd class="kbd">Ctrl + Z</kbd>
                        </div>
                        <div class="flex justify-between items-center">
                            <span>Redo</span>
                            <kbd class="kbd">Ctrl + Y</kbd>
                        </div>
                        <div class="flex justify-between items-center">
                            <span>Save Snippet</span>
                            <kbd class="kbd">Ctrl + S</kbd>
                        </div>
                        <div class="flex justify-between items-center">
                            <span>Find & Replace</span>
                            <kbd class="kbd">Ctrl + F</kbd>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-semibold text-blue-500 mb-3 border-b border-blue-500/30 pb-1">🎛️ Interface</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between items-center">
                            <span>Toggle Workspace</span>
                            <kbd class="kbd">Alt + 1</kbd>
                        </div>
                        <div class="flex justify-between items-center">
                            <span>Toggle Tools</span>
                            <kbd class="kbd">Alt + 2</kbd>
                        </div>
                        <div class="flex justify-between items-center">
                            <span>Close Modal</span>
                            <kbd class="kbd">Escape</kbd>
                        </div>
                        <div class="flex justify-between items-center">
                            <span>Submit Form</span>
                            <kbd class="kbd">Enter</kbd>
                        </div>
                    </div>
                </div>
            </div>
            
            <div>
                <h4 class="font-semibold text-purple-500 mb-3 border-b border-purple-500/30 pb-1">🚀 Quick Actions</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span>Uppercase</span>
                            <span class="text-xs px-2 py-1 rounded" style="background: var(--bg-tertiary)">Quick Action</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span>Lowercase</span>
                            <span class="text-xs px-2 py-1 rounded" style="background: var(--bg-tertiary)">Quick Action</span>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="flex justify-between items-center">
                            <span>Full Report</span>
                            <span class="text-xs px-2 py-1 rounded" style="background: var(--bg-tertiary)">Quick Action</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <span>Find/Replace</span>
                            <span class="text-xs px-2 py-1 rounded" style="background: var(--bg-tertiary)">Quick Action</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <div class="flex items-start gap-3">
                    <i class="fas fa-lightbulb text-yellow-500 mt-0.5"></i>
                    <div>
                        <h5 class="font-medium text-yellow-800 dark:text-yellow-200">Power User Tips</h5>
                        <ul class="text-xs mt-2 space-y-1 text-yellow-700 dark:text-yellow-300">
                            <li>• Drag quick action buttons to reorder them</li>
                            <li>• Use keyboard navigation in dialogs for faster workflow</li>
                            <li>• Press Enter in input fields to submit forms quickly</li>
                            <li>• Collapse unused panels to focus on your text</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            .kbd {
                display: inline-block;
                padding: 0.25rem 0.5rem;
                font-size: 0.75rem;
                font-family: ui-monospace, monospace;
                background: var(--bg-tertiary);
                border: 1px solid var(--border-secondary);
                border-radius: 0.25rem;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            }
        </style>`;
    
    showModal('⌨️ Keyboard Shortcuts', content, [{ text: 'Close', class: 'btn-primary', callback: hideModal }]);
}

function showSettingsModal() {
    const autoSaveChecked = appState.autoSaveEnabled ? 'checked' : '';
    const currentTheme = document.documentElement.getAttribute('data-theme');
    
    const content = `
        <div class="space-y-6">
            <div class="space-y-4">
                <h4 class="font-semibold text-green-500 border-b border-green-500/30 pb-1">⚙️ Application Settings</h4>
                
                <label class="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800" style="border-color: var(--border-primary)">
                    <div class="flex items-center gap-3">
                        <i class="fas fa-save text-blue-500"></i>
                        <div>
                            <div class="font-medium">Auto-save</div>
                            <div class="text-xs" style="color: var(--text-muted)">Automatically save your work as you type</div>
                        </div>
                    </div>
                    <input type="checkbox" id="autoSaveToggle" class="form-checkbox" ${autoSaveChecked}>
                </label>
                
                <div class="p-3 rounded-lg border" style="border-color: var(--border-primary); background: var(--bg-tertiary)">
                    <div class="flex items-center gap-3 mb-2">
                        <i class="fas fa-palette text-purple-500"></i>
                        <div class="font-medium">Theme</div>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <button class="theme-option ${currentTheme === 'dark' ? 'active' : ''}" data-theme="dark">
                            <i class="fas fa-moon"></i> Dark
                        </button>
                        <button class="theme-option ${currentTheme === 'light' ? 'active' : ''}" data-theme="light">
                            <i class="fas fa-sun"></i> Light
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="space-y-3">
                <h4 class="font-semibold text-blue-500 border-b border-blue-500/30 pb-1">👤 Account Information</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="font-medium">User ID:</span>
                        <div class="text-xs mt-1 font-mono p-2 rounded" style="background: var(--bg-hover); word-break: break-all;">
                            ${appState.userId || 'Not available'}
                        </div>
                    </div>
                    <div>
                        <span class="font-medium">Status:</span>
                        <div class="text-xs mt-1">
                            <span class="inline-flex items-center gap-1 px-2 py-1 rounded" style="background: var(--success-light); color: var(--success)">
                                <i class="fas fa-check-circle"></i> Connected
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="text-center pt-4 border-t" style="border-color: var(--border-primary)">
                <p class="text-xs" style="color: var(--text-muted)">
                    Settings are automatically saved and synced across your devices
                </p>
            </div>
        </div>
        
        <style>
            .theme-option {
                padding: 0.5rem 1rem;
                border: 1px solid var(--border-secondary);
                border-radius: 0.5rem;
                background: var(--bg-primary);
                color: var(--text-secondary);
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                font-size: 0.875rem;
            }
            .theme-option:hover {
                border-color: var(--accent-primary);
                color: var(--accent-primary);
            }
            .theme-option.active {
                background: var(--accent-primary);
                border-color: var(--accent-primary);
                color: white;
            }
        </style>`;
        
    showModal('⚙️ Settings', content, [
        { text: 'Close', class: 'btn-secondary', callback: hideModal },
        { text: 'Save Settings', class: 'btn-primary', callback: () => {
            const newAutoSaveStatus = document.getElementById('autoSaveToggle').checked;
            if (newAutoSaveStatus !== appState.autoSaveEnabled) {
                appState.autoSaveEnabled = newAutoSaveStatus;
                elements.autoSaveStatus.innerHTML = `<i class="fas fa-save fa-fw"></i> Auto-save: ${appState.autoSaveEnabled ? 'On' : 'Off'}`;
                saveUIStateToFirestore();
                showStatus(`Auto-save turned ${appState.autoSaveEnabled ? 'On' : 'Off'}`, 2000, 'success');
            }
            hideModal();
        }}
    ], () => {
        // Theme switching
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const selectedTheme = btn.dataset.theme;
                if (selectedTheme !== document.documentElement.getAttribute('data-theme')) {
                    document.documentElement.setAttribute('data-theme', selectedTheme);
                    elements.themeToggle.querySelector('i').className = `fas fa-fw theme-icon ${selectedTheme === 'dark' ? 'fa-moon' : 'fa-sun'}`;
                    
                    document.querySelectorAll('.theme-option').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    saveUIStateToFirestore();
                    showStatus(`Switched to ${selectedTheme} theme`, 1500, 'success');
                }
            });
        });
    });
}

// --- Enhanced Templates with More Comprehensive Content ---
const templates = { 
    'Email': { 
        icon: 'fa-envelope', 
        content: `Subject: [Your Subject Here]

Dear [Recipient Name],

I hope this email finds you well. I am writing to [briefly state your purpose].

[Main body of your message - provide context, details, and any necessary information]

[If requesting action]: I would appreciate it if you could [specific request] by [deadline if applicable].

Please let me know if you need any additional information or have any questions.

Thank you for your time and consideration.

Best regards,
[Your Name]
[Your Title]
[Your Contact Information]`
    }, 
    'Meeting Notes': { 
        icon: 'fa-users', 
        content: `Meeting Notes
===========

📅 Date: [Date]
🕐 Time: [Start Time] - [End Time]
📍 Location: [Location/Virtual Link]
✍️ Recorded by: [Your Name]

Attendees:
----------
• [Name 1] - [Title/Role]
• [Name 2] - [Title/Role]
• [Name 3] - [Title/Role]

Agenda:
-------
1. [Topic 1]
2. [Topic 2]
3. [Topic 3]

Discussion Points:
------------------
🔹 [Key discussion point 1]
   • [Detail or decision]
   • [Follow-up needed]

🔹 [Key discussion point 2]
   • [Detail or decision]
   • [Follow-up needed]

Decisions Made:
---------------
✅ [Decision 1]
✅ [Decision 2]
✅ [Decision 3]

Action Items:
-------------
📋 [Task/Action] - Assigned to: [Name] - Due: [Date]
📋 [Task/Action] - Assigned to: [Name] - Due: [Date]
📋 [Task/Action] - Assigned to: [Name] - Due: [Date]

Next Meeting:
-------------
📅 Date: [Next meeting date]
🕐 Time: [Time]
📝 Agenda Preview: [Brief overview]

Additional Notes:
-----------------
[Any other relevant information, concerns, or observations]`
    },
    'Project Plan': {
        icon: 'fa-tasks',
        content: `Project Plan: [Project Name]
==============================

📊 Project Overview:
--------------------
🎯 Objective: [Clear project goal]
📅 Start Date: [Date]
📅 Target Completion: [Date]
👥 Team Size: [Number] members
💰 Budget: [Amount if applicable]

🎯 Goals & Objectives:
----------------------
• Primary Goal: [Main objective]
• Secondary Goals:
  - [Goal 1]
  - [Goal 2]
  - [Goal 3]

👥 Team & Responsibilities:
---------------------------
🏆 Project Manager: [Name]
👩‍💻 Lead Developer: [Name]
🎨 Designer: [Name]
🧪 QA Lead: [Name]
📊 Stakeholder: [Name]

📋 Project Phases:
------------------

Phase 1: Planning & Research
📅 Duration: [Timeframe]
📝 Deliverables:
• [Deliverable 1]
• [Deliverable 2]

Phase 2: Development
📅 Duration: [Timeframe]
📝 Deliverables:
• [Deliverable 1]
• [Deliverable 2]

Phase 3: Testing & Review
📅 Duration: [Timeframe]
📝 Deliverables:
• [Deliverable 1]
• [Deliverable 2]

Phase 4: Launch & Deployment
📅 Duration: [Timeframe]
📝 Deliverables:
• [Deliverable 1]
• [Deliverable 2]

⚠️ Risk Assessment:
-------------------
🔴 High Risk: [Risk description] - Mitigation: [Strategy]
🟡 Medium Risk: [Risk description] - Mitigation: [Strategy]
🟢 Low Risk: [Risk description] - Mitigation: [Strategy]

📊 Success Metrics:
-------------------
• [Metric 1]: [Target value]
• [Metric 2]: [Target value]
• [Metric 3]: [Target value]

📞 Communication Plan:
----------------------
• Daily Standups: [Time/Day]
• Weekly Reviews: [Time/Day]
• Monthly Reports: [Schedule]
• Stakeholder Updates: [Frequency]

💡 Additional Notes:
--------------------
[Any other relevant project information, constraints, or considerations]`
    },
    'Blog Post': {
        icon: 'fa-blog',
        content: `[Blog Post Title]
================

📝 Meta Description: [Brief description for SEO - 150-160 characters]
🏷️ Tags: [tag1], [tag2], [tag3]
📅 Published: [Date]
✍️ Author: [Your Name]

Introduction
------------
[Hook your readers with an engaging opening paragraph. Present the problem or question your post will address.]

[Brief overview of what readers will learn or gain from this post.]

Main Content
------------

### [Subheading 1]
[Detailed content for this section. Use clear, concise language and provide value to your readers.]

Key points:
• [Point 1]
• [Point 2]
• [Point 3]

### [Subheading 2]
[Continue with more detailed content. Include examples, case studies, or practical tips.]

> "Include relevant quotes or important callouts in blockquotes."

### [Subheading 3]
[Additional content sections as needed. Keep paragraphs short and scannable.]

📊 Quick Tips:
--------------
✅ [Actionable tip 1]
✅ [Actionable tip 2]
✅ [Actionable tip 3]
✅ [Actionable tip 4]

Conclusion
----------
[Summarize the key takeaways from your post. Reinforce the main message and provide a clear call-to-action.]

What's your experience with [topic]? Share your thoughts in the comments below!

---

📚 Related Resources:
• [Link/Resource 1]
• [Link/Resource 2]
• [Link/Resource 3]

#[hashtag1] #[hashtag2] #[hashtag3]`
    },
    'Resume': {
        icon: 'fa-file-alt',
        content: `[Your Full Name]
================

📧 Email: [your.email@example.com]
📱 Phone: [Your Phone Number]
🌐 LinkedIn: [Your LinkedIn Profile]
🏠 Location: [City, State]
💼 Portfolio: [Your Website/Portfolio URL]

Professional Summary
--------------------
[2-3 sentences describing your professional background, key skills, and career objectives. Tailor this to the specific role you're applying for.]

Core Competencies
-----------------
• [Skill 1] • [Skill 2] • [Skill 3]
• [Skill 4] • [Skill 5] • [Skill 6]
• [Skill 7] • [Skill 8] • [Skill 9]

Professional Experience
-----------------------

**[Job Title]** | [Company Name] | [Start Date] - [End Date]
• [Achievement/responsibility with quantifiable results]
• [Achievement/responsibility with quantifiable results]
• [Achievement/responsibility with quantifiable results]
• [Achievement/responsibility with quantifiable results]

**[Job Title]** | [Company Name] | [Start Date] - [End Date]
• [Achievement/responsibility with quantifiable results]
• [Achievement/responsibility with quantifiable results]
• [Achievement/responsibility with quantifiable results]

**[Job Title]** | [Company Name] | [Start Date] - [End Date]
• [Achievement/responsibility with quantifiable results]
• [Achievement/responsibility with quantifiable results]
• [Achievement/responsibility with quantifiable results]

Education
---------
**[Degree Type]** in [Field of Study]
[University Name] | [Graduation Year]
• [Relevant coursework, honors, or achievements]

Certifications & Training
-------------------------
• [Certification Name] | [Issuing Organization] | [Year]
• [Certification Name] | [Issuing Organization] | [Year]
• [Training/Course Name] | [Year]

Projects & Achievements
-----------------------
**[Project Name]** | [Year]
• [Brief description and your role]
• [Key technologies/skills used]
• [Results or impact]

**[Achievement/Award]** | [Year]
• [Description of achievement and its significance]

Languages
---------
• [Language]: [Proficiency Level]
• [Language]: [Proficiency Level]

Volunteer Experience
--------------------
**[Role]** | [Organization] | [Dates]
• [Description of volunteer work and impact]

---
References available upon request`
    },
    'Technical Documentation': {
        icon: 'fa-code',
        content: `# [Project/API Name] Documentation

## Overview
Brief description of what this project/API does and its main purpose.

**Version:** 1.0.0  
**Last Updated:** [Date]  
**Maintained by:** [Team/Author Name]

## Table of Contents
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Installation

### Prerequisites
- [Requirement 1] (version X.X or higher)
- [Requirement 2]
- [Requirement 3]

### Quick Start
\`\`\`bash
# Clone the repository
git clone [repository-url]

# Navigate to directory
cd [project-directory]

# Install dependencies
npm install

# Start the application
npm start
\`\`\`

## Configuration

### Environment Variables
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| \`API_KEY\` | Your API key | - | Yes |
| \`PORT\` | Port number | 3000 | No |
| \`DEBUG\` | Enable debug mode | false | No |

### Configuration File
Create a \`config.json\` file in the root directory:

\`\`\`json
{
  "apiKey": "your-api-key",
  "baseUrl": "https://api.example.com",
  "timeout": 5000
}
\`\`\`

## Usage

### Basic Usage
\`\`\`javascript
const [ProjectName] = require('[package-name]');

const client = new [ProjectName]({
  apiKey: 'your-api-key'
});

// Basic example
const result = await client.getData();
console.log(result);
\`\`\`

### Advanced Usage
\`\`\`javascript
// More complex example
const options = {
  filter: 'active',
  limit: 10,
  sort: 'created_at'
};

const data = await client.query(options);
\`\`\`

## API Reference

### \`getData(options)\`
Retrieves data based on specified criteria.

**Parameters:**
- \`options\` (Object, optional)
  - \`filter\` (String): Filter criteria
  - \`limit\` (Number): Maximum results (default: 100)
  - \`offset\` (Number): Results offset (default: 0)

**Returns:** Promise<Array> - Array of data objects

**Example:**
\`\`\`javascript
const data = await client.getData({
  filter: 'status:active',
  limit: 50
});
\`\`\`

### \`createItem(data)\`
Creates a new item.

**Parameters:**
- \`data\` (Object, required)
  - \`name\` (String): Item name
  - \`description\` (String, optional): Item description

**Returns:** Promise<Object> - Created item object

## Examples

### Example 1: Basic Data Retrieval
\`\`\`javascript
// Fetch all active items
const activeItems = await client.getData({
  filter: 'status:active'
});

console.log(\`Found \${activeItems.length} active items\`);
\`\`\`

### Example 2: Error Handling
\`\`\`javascript
try {
  const result = await client.createItem({
    name: 'New Item',
    description: 'This is a new item'
  });
  console.log('Item created:', result.id);
} catch (error) {
  console.error('Error creating item:', error.message);
}
\`\`\`

## Troubleshooting

### Common Issues

**Error: "API key not provided"**
- Make sure you've set the \`API_KEY\` environment variable
- Verify the API key is correct and active

**Error: "Connection timeout"**
- Check your internet connection
- Verify the API endpoint is accessible
- Consider increasing the timeout value

**Error: "Rate limit exceeded"**
- Implement retry logic with exponential backoff
- Consider upgrading your API plan

### Debug Mode
Enable debug mode to see detailed logs:

\`\`\`bash
DEBUG=true npm start
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature-name\`
3. Commit changes: \`git commit -m 'Add feature'\`
4. Push to branch: \`git push origin feature-name\`
5. Submit a pull request

### Development Setup
\`\`\`bash
# Install development dependencies
npm install --dev

# Run tests
npm test

# Run linting
npm run lint
\`\`\`

## License
[License Type] - see [LICENSE](LICENSE) file for details.

## Support
- 📧 Email: [support-email]
- 💬 Discord: [discord-link]
- 🐛 Issues: [github-issues-link]
- 📖 Wiki: [wiki-link]`
    }
};

// --- HTML Content Generators ---
function getTemplatesHTML() { 
    return `<div class="space-y-2">${Object.keys(templates).map(k => 
        `<button class="tool-btn btn w-full text-left" data-template="${k}">
            <i class="fas ${templates[k].icon} fa-fw text-blue-500"></i>
            <span class="ml-2 font-medium">${k}</span>
        </button>`).join('')}</div>`; 
}

function getQuickAnalysisHTML() {
    return `<div class="space-y-3">
        <button class="btn btn-primary w-full compact-btn" onclick="generateReport()">
            <i class="fas fa-chart-line fa-fw"></i> Generate Full Report
        </button>
        <div class="text-xs text-center" style="color: var(--text-muted)">
            <i class="fas fa-info-circle"></i> 
            Get comprehensive text analysis including readability scores, word frequency, and reading time estimates
        </div>
    </div>`;
}

function getCaseToolsHTML() { 
    const textCases = [
        { id: 'uppercase', name: 'UPPERCASE', icon: 'fa-text-width' },
        { id: 'lowercase', name: 'lowercase', icon: 'fa-text-height' },
        { id: 'title', name: 'Title Case', icon: 'fa-heading' },
        { id: 'sentence', name: 'Sentence case', icon: 'fa-paragraph' }
    ];
    
    const progCases = [
        { id: 'camel', name: 'camelCase', icon: 'fa-code' },
        { id: 'pascal', name: 'PascalCase', icon: 'fa-code' },
        { id: 'snake', name: 'snake_case', icon: 'fa-code' },
        { id: 'kebab', name: 'kebab-case', icon: 'fa-code' }
    ];
    
    return `<div class="space-y-4">
        <div>
            <h4 class="text-sm font-semibold mb-2 text-green-500">Text Cases</h4>
            <div class="grid grid-cols-2 gap-2">
                ${textCases.map(t => `
                    <button class="tool-btn btn text-xs p-2" data-transform="${t.id}" title="Convert to ${t.name}">
                        <i class="fas ${t.icon} fa-fw"></i>
                        <span class="ml-1">${t.name}</span>
                    </button>
                `).join('')}
            </div>
        </div>
        <div>
            <h4 class="text-sm font-semibold mb-2 text-blue-500">Programming Cases</h4>
            <div class="grid grid-cols-2 gap-2">
                ${progCases.map(t => `
                    <button class="tool-btn btn text-xs p-2" data-transform="${t.id}" title="Convert to ${t.name}">
                        <i class="fas ${t.icon} fa-fw"></i>
                        <span class="ml-1">${t.name}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    </div>`; 
}

function getFindReplaceHTML() { 
    return `<div class="space-y-4">
        <div>
            <label for="findInput" class="block text-sm font-medium mb-1" style="color:var(--text-secondary)">Find:</label>
            <input type="text" id="findInput" class="form-input text-sm" placeholder="Enter text to find...">
        </div>
        <div>
            <label for="replaceInput" class="block text-sm font-medium mb-1" style="color:var(--text-secondary)">Replace with:</label>
            <input type="text" id="replaceInput" class="form-input text-sm" placeholder="Enter replacement text...">
        </div>
        <div class="space-y-2">
            <label class="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                <input type="checkbox" id="caseSensitive" class="form-checkbox">
                <span>Case Sensitive</span>
            </label>
            <label class="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded">
                <input type="checkbox" id="useRegex" class="form-checkbox">
                <span>Use Regular Expressions</span>
            </label>
        </div>
        <div class="grid grid-cols-2 gap-2">
            <button class="btn btn-primary compact-btn" data-find-replace title="Replace first occurrence">
                <i class="fas fa-search fa-fw"></i> Replace
            </button>
            <button class="btn btn-primary compact-btn" data-find-replace-all title="Replace all occurrences">
                <i class="fas fa-search-plus fa-fw"></i> All
            </button>
        </div>
        <div class="text-xs text-center" style="color: var(--text-muted)">
            <i class="fas fa-info-circle"></i> 
            Use Ctrl+F to quickly focus the find field
        </div>
    </div>`; 
}

function getOpsToolsHTML() { 
    const operations = [
        { id: 'trim', name: 'Trim Whitespace', icon: 'fa-cut' },
        { id: 'remove-extra-spaces', name: 'Remove Extra Spaces', icon: 'fa-compress-arrows-alt' },
        { id: 'remove-line-breaks', name: 'Remove Line Breaks', icon: 'fa-align-left' },
        { id: 'remove-empty-lines', name: 'Remove Empty Lines', icon: 'fa-filter' },
        { id: 'add-line-numbers', name: 'Add Line Numbers', icon: 'fa-list-ol' },
        { id: 'sort-lines', name: 'Sort Lines A-Z', icon: 'fa-sort-alpha-down' },
        { id: 'reverse-lines', name: 'Reverse Line Order', icon: 'fa-exchange-alt' },
        { id: 'shuffle-lines', name: 'Shuffle Lines', icon: 'fa-random' },
        { id: 'remove-duplicates', name: 'Remove Duplicate Lines', icon: 'fa-clone' }
    ];
    
    return `<div class="space-y-2">
        ${operations.map(op => `
            <button class="tool-btn btn w-full text-left" data-format="${op.id}" title="${op.name}">
                <i class="fas ${op.icon} fa-fw text-purple-500"></i>
                <span class="ml-2">${op.name}</span>
            </button>
        `).join('')}
    </div>`; 
}

function getEncodeToolsHTML() { 
    const encoders = [
        { id: 'reverse', name: 'Reverse Text', icon: 'fa-undo' },
        { id: 'rot13', name: 'ROT13 Cipher', icon: 'fa-user-secret' },
        { id: 'base64-encode', name: 'Base64 Encode', icon: 'fa-lock' },
        { id: 'base64-decode', name: 'Base64 Decode', icon: 'fa-unlock' },
        { id: 'url-encode', name: 'URL Encode', icon: 'fa-link' },
        { id: 'url-decode', name: 'URL Decode', icon: 'fa-unlink' },
        { id: 'html-encode', name: 'HTML Encode', icon: 'fa-code' },
        { id: 'html-decode', name: 'HTML Decode', icon: 'fa-file-code' },
        { id: 'extract-emails', name: 'Extract Email Addresses', icon: 'fa-at' },
        { id: 'extract-urls', name: 'Extract URLs', icon: 'fa-globe' }
    ];
    
    return `<div class="space-y-2">
        ${encoders.map(enc => `
            <button class="tool-btn btn w-full text-left" data-manipulate="${enc.id}" title="${enc.name}">
                <i class="fas ${enc.icon} fa-fw text-orange-500"></i>
                <span class="ml-2">${enc.name}</span>
            </button>
        `).join('')}
    </div>`; 
}

function getImportExportHTML() { 
    const exportFormats = [
        { id: 'txt', name: 'Plain Text', icon: 'fa-file-alt' },
        { id: 'json', name: 'JSON', icon: 'fa-file-code' },
        { id: 'csv', name: 'CSV', icon: 'fa-file-csv' },
        { id: 'pdf', name: 'PDF', icon: 'fa-file-pdf' }
    ];
    
    return `<div class="space-y-4">
        <div>
            <input type="file" id="fileInput" hidden accept=".txt,.csv,.json,.md,.html">
            <button id="fileInputBtn" class="btn btn-secondary w-full compact-btn">
                <i class="fas fa-upload fa-fw"></i> Import Text File
            </button>
            <div class="text-xs mt-1 text-center" style="color: var(--text-muted)">
                Supports: .txt, .csv, .json, .md, .html (max 5MB)
            </div>
        </div>
        
        <div>
            <h4 class="text-sm font-semibold mb-2" style="color: var(--text-secondary)">Export As:</h4>
            <div class="grid grid-cols-2 gap-2">
                ${exportFormats.map(fmt => `
                    <button class="export-btn" data-export="${fmt.id}" title="Export as ${fmt.name}">
                        <i class="fas ${fmt.icon} fa-fw text-lg text-green-500"></i>
                        <span class="text-xs">${fmt.name}</span>
                    </button>
                `).join('')}
            </div>
        </div>
    </div>`; 
}

function applyTemplate(templateName) { 
    if (templates[templateName]) { 
        addTextToHistory('Apply Template', elements.textArea.value); 
        elements.textArea.value = templates[templateName].content; 
        handleTextInput(); 
        showStatus(`Applied ${templateName} template`, 2000, 'success'); 
    } 
}

/**
 * Simple, reliable tooltip system
 */
function initializeTooltips() {
    // Remove any existing tooltip elements
    document.querySelectorAll('.simple-tooltip').forEach(el => el.remove());
    
    // Create a single tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'simple-tooltip';
    tooltip.style.cssText = `
        position: fixed;
        z-index: 9999;
        background: var(--bg-tertiary);
        color: var(--text-primary);
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 500;
        border: 1px solid var(--border-secondary);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        backdrop-filter: blur(8px);
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transform: translateY(4px);
        transition: opacity 0.2s ease, transform 0.2s ease;
        max-width: 200px;
        word-wrap: break-word;
        white-space: normal;
        text-align: center;
    `;
    document.body.appendChild(tooltip);
    
    let activeElement = null;
    let showTimeout = null;
    let hideTimeout = null;
    
    // Find all elements with title attributes and set up tooltips
    function setupTooltips() {
        document.querySelectorAll('[title]').forEach(element => {
            const title = element.getAttribute('title');
            if (!title || !title.trim()) return;
            
            // Store original title and remove it
            element.setAttribute('data-tooltip', title);
            element.removeAttribute('title');
            
            // Mouse events
            element.addEventListener('mouseenter', () => showTooltip(element, title));
            element.addEventListener('mouseleave', hideTooltip);
            
            // Focus events for keyboard navigation
            element.addEventListener('focus', () => showTooltip(element, title));
            element.addEventListener('blur', hideTooltip);
        });
    }
    
    function showTooltip(element, text) {
        clearTimeout(hideTimeout);
        activeElement = element;
        
        showTimeout = setTimeout(() => {
            if (activeElement !== element) return;
            
            tooltip.textContent = text;
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateY(0)';
            
            // Position tooltip
            const rect = element.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            
            let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
            let top = rect.top - tooltipRect.height - 8;
            
            // Keep within viewport
            const margin = 8;
            if (left < margin) left = margin;
            if (left + tooltipRect.width > window.innerWidth - margin) {
                left = window.innerWidth - tooltipRect.width - margin;
            }
            
            // If would be above viewport, show below
            if (top < margin) {
                top = rect.bottom + 8;
            }
            
            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
        }, 500); // 500ms delay for less sporadic behavior
    }
    
    function hideTooltip() {
        clearTimeout(showTimeout);
        activeElement = null;
        
        hideTimeout = setTimeout(() => {
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateY(4px)';
        }, 100);
    }
    
    // Hide on scroll, resize, or click
    document.addEventListener('scroll', hideTooltip, { passive: true });
    window.addEventListener('resize', hideTooltip);
    document.addEventListener('click', hideTooltip);
    
    // Initial setup
    setupTooltips();
    
    // Re-setup when DOM changes (for dynamically added elements)
    const observer = new MutationObserver((mutations) => {
        let shouldResetup = false;
        mutations.forEach(mutation => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        if (node.hasAttribute('title') || node.querySelector('[title]')) {
                            shouldResetup = true;
                        }
                    }
                });
            }
        });
        if (shouldResetup) {
            setTimeout(setupTooltips, 100); // Small delay to ensure DOM is stable
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Cleanup function
    window.cleanupTooltips = () => {
        observer.disconnect();
        clearTimeout(showTimeout);
        clearTimeout(hideTimeout);
        tooltip.remove();
    };
}

// Start the application
document.addEventListener('DOMContentLoaded', init);
