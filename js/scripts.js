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
