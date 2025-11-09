/**
 * textMan v2 - Main Application Entry Point
 * Modular JavaScript Architecture
 *
 * This file orchestrates the loading and initialization of all modules.
 * Modules are loaded via HTML <script> tags in dependency order.
 *
 * Load Order (defined in index.html):
 * 1. core/config.js       - Application configuration
 * 2. core/state.js        - Global state management
 * 3. core/utils.js        - Utility functions
 * 4. storage/storage.js   - LocalStorage manager
 * 5. ui/theme.js          - Theme manager
 * 6. ui/toast.js          - Toast notifications
 * 7. modules.js           - All remaining managers (Modal, Editor, TextTools, etc.)
 * 8. scripts.js (this file) - Initialization orchestrator
 */

// ============================================================================
// Application Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log(`%c🚀 textMan v${APP_CONFIG.version}`, 'font-size: 20px; font-weight: bold; color: #10b981;');
    console.log('%c[INIT] Starting initialization...', 'color: #10b981');

    // Show loading tips
    console.log('[INIT] Loading tips...');
    LoadingTips.init();

    // Initialize all modules
    console.log('[INIT] Initializing ThemeManager...');
    ThemeManager.init();
    console.log('[INIT] Initializing Modal...');
    Modal.init();
    console.log('[INIT] Initializing Editor...');
    Editor.init();
    console.log('[INIT] Initializing SearchManager...');
    SearchManager.init();
    console.log('[INIT] Initializing HistoryManager...');
    HistoryManager.init();
    console.log('[INIT] Initializing SavedTexts...');
    SavedTexts.init();
    console.log('[INIT] Initializing ImportExport...');
    ImportExport.init();
    console.log('[INIT] Initializing ToolsManager...');
    ToolsManager.init();
    console.log('[INIT] Initializing SidebarManager...');
    SidebarManager.init();
    console.log('[INIT] Restoring sidebar states...');
    SidebarManager.restoreStates(); // Restore saved sidebar/section states
    console.log('[INIT] Initializing ContextMenu...');
    ContextMenu.init();

    // Initialize new features
    console.log('[INIT] Initializing CommandPalette...');
    CommandPalette.init();
    console.log('[INIT] Initializing DragDrop...');
    DragDrop.init();
    console.log('[INIT] Initializing ClipboardHistory...');
    ClipboardHistory.init();
    console.log('[INIT] Initializing Templates...');
    Templates.init();
    console.log('[INIT] Initializing AdvancedTools...');
    AdvancedTools.init();
    console.log('[INIT] Initializing KeyboardShortcuts...');
    KeyboardShortcuts.init();
    console.log('[INIT] Initializing CursorTracker...');
    CursorTracker.init();
    console.log('[INIT] Initializing HelpSystem...');
    HelpSystem.init();

    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loadingScreen').style.display = 'none';
        console.log('[INIT] Loading screen hidden');
    }, 2000);

    console.log('%c✅ textMan initialized successfully!', 'color: #10b981; font-weight: bold');
    console.log('%c[DEBUG] Open your browser console (F12) to see initialization logs', 'color: #fbbf24');
});

// ============================================================================
// Expose Global API
// ============================================================================

window.textMan = {
    version: APP_CONFIG.version,
    Editor,
    TextTools,
    Modal,
    Toast,
    ThemeManager,
    Storage,
    Analytics,
    HistoryManager,
    SavedTexts,
    ImportExport,
    ToolsManager,
    SearchManager
};
