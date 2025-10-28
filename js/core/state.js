/**
 * textMan v2 - Application State
 * Global application state management
 */

const APP_STATE = {
    theme: 'dark',
    editor: {
        content: '',
        history: [],
        historyIndex: -1,
        maxHistory: 100
    },
    savedTexts: [],
    recentHistory: [],
    clipboardHistory: [],
    templates: [],
    settings: {
        autoSave: true,
        fontSize: 16,
        lineHeight: 1.6
    },
    commandPalette: {
        isOpen: false,
        selectedIndex: 0
    }
};
