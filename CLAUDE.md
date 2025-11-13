# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

textMan is a **vanilla JavaScript text manipulation tool** running entirely client-side. No frameworks, no build tools, no backend. The application features 50+ text transformation utilities and runs directly in the browser using pure ES6+ JavaScript, CSS3, and the localStorage API.

**Key characteristics:**
- **Zero build process** - Open `index.html` in a browser to run
- **100% client-side** - No server communication, all data stays in localStorage
- **No dependencies** - Except Font Awesome CDN for icons
- **Modular architecture** - Recently refactored from monolithic files

## Development Workflow

### Running the Application

```bash
# Simply open index.html in any modern browser
open index.html                    # macOS
xdg-open index.html               # Linux
start index.html                  # Windows

# Or use a simple HTTP server if needed
python3 -m http.server 8000       # Then visit http://localhost:8000
```

**There is no build step.** Changes to HTML/CSS/JS are immediately visible on browser refresh.

### Testing

There are no automated tests. Manual testing workflow:
1. Make changes to files
2. Refresh browser (Cmd+R / Ctrl+R)
3. Test functionality manually using browser DevTools

**Critical features to manually test after changes:**
- Theme switching (dark/light via header toggle)
- Text transformations (right sidebar tools)
- Find & Replace (Ctrl+F)
- Command Palette (Ctrl+K)
- Save/Load functionality
- Import/Export
- localStorage persistence (check Application tab in DevTools)

### Debugging

Open browser DevTools (F12). The application logs initialization steps to console:
```javascript
console.log(`🚀 textMan v${APP_CONFIG.version}`);
console.log('[INIT] Initializing ThemeManager...');
// ... etc
```

Access the global API in browser console:
```javascript
window.textMan.Editor.textarea.value = "test";
window.textMan.TextTools.toUpperCase();
window.textMan.Storage.load('editorContent');
```

## Architecture

### Module Loading System

The application uses a **modular namespace pattern** with explicit load order via `<script>` tags in `index.html`:

```
1. js/core/config.js       → APP_CONFIG (constants)
2. js/core/state.js        → APP_STATE (global state)
3. js/core/utils.js        → Utils (utility functions)
4. js/storage/storage.js   → Storage (localStorage wrapper)
5. js/ui/theme.js          → ThemeManager
6. js/ui/toast.js          → Toast (notifications)
7. js/modules.js           → All remaining managers (Modal, Editor, TextTools, etc.)
8. js/scripts.js           → Initialization orchestrator
```

**This order is critical.** Each module depends on modules loaded before it.

### Key Global Objects

All modules are exposed as global `const` objects:

**Core:**
- `APP_CONFIG` - Application constants (version, limits, etc.)
- `APP_STATE` - Global application state (theme, editor content, savedTexts, settings)
- `Utils` - Helper functions (formatDate, sanitizeHTML, debounce, etc.)
- `Storage` - localStorage wrapper with prefix handling

**UI Management:**
- `ThemeManager` - Dark/light theme switching
- `Toast` - Non-intrusive notifications
- `Modal` - Dialog system
- `SidebarManager` - Sidebar collapse/expand state

**Editor & Tools:**
- `Editor` - Main textarea with undo/redo, auto-save, stats
- `TextTools` - 34 text transformation methods (uppercase, base64, reverse, etc.)
- `SearchManager` - Find & replace with regex support
- `Analytics` - Text statistics (word count, reading time, frequency analysis)

**Data Management:**
- `HistoryManager` - Recent edit history
- `SavedTexts` - Saved text collection with tags
- `ClipboardHistory` - Clipboard tracking
- `Templates` - Text template library
- `ImportExport` - File import/export handlers

**User Interaction:**
- `ToolsManager` - Tool button click handlers
- `CommandPalette` - Ctrl+K command interface
- `ContextMenu` - Right-click menu
- `KeyboardShortcuts` - Global hotkey management
- `DragDrop` - File drag & drop handling
- `AdvancedTools` - Lorem, hash, diff, regex tools
- `HelpSystem` - Help dialog

### State Management

Global state lives in `APP_STATE` (js/core/state.js):
```javascript
{
    theme: 'dark' | 'light',
    editor: { content, history, historyIndex, maxHistory },
    savedTexts: [...],           // Array of saved text objects
    recentHistory: [...],         // Recent edit history
    clipboardHistory: [...],      // Recent clipboard items
    templates: [...],             // User-defined templates
    settings: {
        autoSave: true,
        fontSize: 16,
        lineHeight: 1.6,
        wordWrap: true
    },
    commandPalette: { isOpen, selectedIndex }
}
```

**Persistence:** Most state is synced to localStorage via the `Storage` module with the `textMan_` prefix.

### CSS Architecture

CSS is modular using `@import` in `css/styles.css`:

```
css/
├── base/          → variables.css, reset.css, theme.css
├── layout/        → app.css, header.css, sidebar.css, editor.css
├── components/    → buttons, modals, toast, search, command-palette, etc.
├── utilities/     → animations, utilities, effects, scrollbars
└── responsive/    → tablet, mobile, print
```

**Theming:** Uses CSS custom properties (`--color-primary`, `--bg-primary`, etc.) toggled via `[data-theme="dark|light"]` on `<html>`.

## Adding New Features

### Adding a Text Tool

1. **Add transformation function** to `TextTools` object in `js/modules.js`:
```javascript
const TextTools = {
    // ... existing tools ...

    myNewTool() {
        const text = Editor.textarea.value;
        const transformed = text.split('').reverse().join(''); // Example
        Editor.textarea.value = transformed;
        Editor.handleInput();  // Updates stats, triggers auto-save
        Toast.show('Success', 'Text transformed!', 'success');
    }
};
```

2. **Add button** to `index.html` in appropriate section:
```html
<button class="tool-btn" data-action="myNewTool">
    <i class="fas fa-sync-alt"></i> My Tool
</button>
```

3. **Register action** in `ToolsManager.handleToolAction()` in `js/modules.js`:
```javascript
const actionMap = {
    // ... existing actions ...
    'myNewTool': () => TextTools.myNewTool()
};
```

4. **(Optional)** Add to Command Palette in `CommandPalette.commands` array in `js/modules.js`:
```javascript
{
    name: 'My Tool',
    action: () => TextTools.myNewTool(),
    category: 'Transform',
    icon: 'sync-alt',
    keywords: ['my', 'tool', 'transform']
}
```

### Adding a New Manager Module

If adding complex functionality that doesn't fit existing modules:

1. Create new object in `js/modules.js` (or create new file in appropriate directory)
2. Implement `init()` method for setup
3. Call `MyNewManager.init()` in `js/scripts.js` DOMContentLoaded handler
4. Expose in `window.textMan` object if needed for debugging

### localStorage Schema

All keys use `textMan_` prefix:

```javascript
textMan_theme              // 'dark' | 'light'
textMan_editorContent      // Current editor text
textMan_settings           // JSON: { autoSave, fontSize, lineHeight, wordWrap }
textMan_history            // JSON: Array of recent text edits
textMan_savedTexts         // JSON: Array of { id, name, content, tags, date }
textMan_clipboardHistory   // JSON: Array of clipboard entries
textMan_templates          // JSON: Array of { id, name, content }
textMan_sidebar_*          // Boolean: Sidebar collapse states
textMan_section_*          // Boolean: Section collapse states
```

Use `Storage.save(key, value)` and `Storage.load(key, defaultValue)` - prefix is added automatically.

## Security Considerations

**Known vulnerabilities (from audit):**
- XSS via innerHTML usage in Modal, Toast, Analytics, SavedTexts, Templates
- Input validation needed for file imports
- No Content Security Policy

**When making changes:**
- Avoid `innerHTML` with user content - use `textContent` or `createElement` instead
- Sanitize HTML if `innerHTML` is unavoidable - use `Utils.sanitizeHTML()`
- Validate and sanitize file imports before processing
- Never execute user-provided code with `eval()` or `Function()`

**Example safe pattern:**
```javascript
// Bad
element.innerHTML = userInput;

// Good
element.textContent = userInput;

// If HTML is needed
element.innerHTML = Utils.sanitizeHTML(userInput);
```

## File Structure Reference

```
textMan/
├── index.html              # Main app entry point
├── manifest.json           # PWA manifest
├── css/
│   └── styles.css          # CSS entry (@import all modules)
├── js/
│   ├── scripts.js          # Initialization orchestrator
│   ├── modules.js          # Consolidated managers (~2,683 lines)
│   ├── core/               # Foundation (config, state, utils)
│   ├── storage/            # localStorage wrapper
│   └── ui/                 # Theme & toast managers
└── docs/
    ├── ARCHITECTURE.md     # Detailed architecture documentation
    ├── CONTINUATION.md     # Session handoff system
    └── audits/             # Security & quality audits
```

## Common Patterns

### Showing Toast Notifications
```javascript
Toast.show('Title', 'Message here', 'success');  // success | error | info | warning
```

### Opening Modals
```javascript
Modal.open('Title', '<p>Body HTML</p>', '<button>Footer button</button>');
Modal.close();
```

### Accessing Editor Content
```javascript
const text = Editor.textarea.value;
Editor.textarea.value = 'new text';
Editor.handleInput();  // Important: Updates stats and triggers saves
```

### Saving to localStorage
```javascript
Storage.save('myKey', { data: 'value' });  // Auto-prefixes with 'textMan_'
const data = Storage.load('myKey', defaultValue);
```

### Updating Stats Display
```javascript
Editor.updateStats();  // Recalculates and displays character/word/line counts
```

## Browser Compatibility

Target: Modern browsers with ES6+ support (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

**Required APIs:**
- ES6+ (arrow functions, const/let, template literals, destructuring)
- localStorage
- Web Crypto API (for SHA hashing)
- Font Awesome 6.5.1 CDN (only external dependency)

## Documentation

- `docs/ARCHITECTURE.md` - Detailed refactoring documentation
- `docs/CONTINUATION.md` - Session handoff system for context sharing
- `docs/audits/` - Security and quality audit reports
- `README.md` - User-facing documentation with feature list

## Version Information

Check `js/core/config.js` for current version:
```javascript
const APP_CONFIG = {
    version: '2.1a.0',
    // ...
};
```

Version is displayed in console on load and in Help dialog.
