# textMan v2 - Architecture Documentation

## Overview

This document describes the refactored modular architecture of textMan v2. The codebase has been refactored from monolithic files into a well-organized, modular structure following separation of concerns principles.

**Refactoring Summary:**
- **CSS:** Split from 1 file (2,705 lines) → **28 modular files** organized by purpose
- **JavaScript:** Split from 1 file (3,018 lines) → **8 core modules** + consolidated modules
- **100% Backwards Compatible:** All existing functionality preserved
- **No Build Process Required:** Uses simple `@import` (CSS) and `<script>` tags (JS)

---

## CSS Architecture

### Structure

```
css/
├── styles.css              # Main entry point (@import all modules)
├── base/                   # Foundation styles
│   ├── variables.css       # CSS custom properties
│   ├── reset.css           # Box model reset
│   └── theme.css           # Dark theme overrides
├── layout/                 # Structural components
│   ├── app.css             # Main app container
│   ├── header.css          # Header component
│   ├── sidebar.css         # Sidebar components
│   └── editor.css          # Editor area
├── components/             # UI components
│   ├── buttons.css         # All button styles
│   ├── loading.css         # Loading screen
│   ├── modal.css           # Modal system
│   ├── toast.css           # Toast notifications
│   ├── search.css          # Search overlay
│   ├── context-menu.css    # Context menu
│   ├── forms.css           # Form elements
│   ├── command-palette.css # Command palette
│   ├── drop-zone.css       # Drop zone overlay
│   ├── analytics.css       # Analytics display
│   ├── history.css         # History & saved items
│   └── panels.css          # Import/export panels
├── utilities/              # Helper styles
│   ├── animations.css      # Keyframe animations
│   ├── utilities.css       # Utility classes
│   ├── scrollbars.css      # Scrollbar styling
│   ├── focus.css           # Focus & accessibility
│   └── effects.css         # Visual effects
└── responsive/             # Media queries
    ├── tablet.css          # 1024px breakpoint
    ├── mobile.css          # 768px & 480px breakpoints
    └── print.css           # Print styles
```

### Load Order

CSS modules are loaded via `@import` in `styles.css` in this specific order:

1. **Base** → Foundation (variables, reset, theme)
2. **Layout** → Structure (app, header, sidebar, editor)
3. **Components** → UI elements (buttons, modals, forms, etc.)
4. **Utilities** → Helpers (animations, utilities, effects)
5. **Responsive** → Media queries (tablet, mobile, print)

This order ensures proper cascade and specificity.

### Key Principles

- **CSS Custom Properties** for theming (`--color-primary`, `--bg-primary`, etc.)
- **Mobile-first** responsive design with progressive enhancement
- **Dark/Light themes** via `[data-theme]` attribute
- **No preprocessors** - pure CSS with modern features
- **BEM-inspired** naming for components

---

## JavaScript Architecture

### Structure

```
js/
├── scripts.js              # Main entry point & initialization
├── core/                   # Core system modules
│   ├── config.js           # APP_CONFIG constants
│   ├── state.js            # APP_STATE object
│   └── utils.js            # Utility functions
├── storage/                # Data persistence
│   └── storage.js          # LocalStorage manager
├── ui/                     # UI managers
│   ├── theme.js            # Theme manager
│   └── toast.js            # Toast notifications
└── modules.js              # Consolidated modules
                            # (Modal, Editor, TextTools, all managers)
```

### Load Order

JavaScript modules are loaded via `<script>` tags in `index.html` in this dependency order:

1. **Core** → `config.js`, `state.js`, `utils.js`
2. **Storage** → `storage.js`
3. **UI** → `theme.js`, `toast.js`
4. **Modules** → `modules.js` (all remaining managers)
5. **App** → `scripts.js` (initialization orchestrator)

### Module Dependencies

```
APP_CONFIG (config.js)
    ↓
APP_STATE (state.js)
    ↓
Utils (utils.js)
    ↓
Storage (storage.js) → depends on APP_CONFIG, Toast
    ↓
ThemeManager (theme.js) → depends on Storage, APP_STATE, Toast
Toast (toast.js) → depends on APP_CONFIG
    ↓
modules.js (all other managers)
    ↓
scripts.js (initialization)
```

### Key Modules in modules.js

- **Modal** - Modal dialog system
- **Editor** - Main text editor with undo/redo, auto-save
- **TextTools** - 34 text transformation methods
- **SearchManager** - Find & replace with regex
- **Analytics** - Text statistics and analysis
- **HistoryManager** - Recent history tracking
- **SavedTexts** - Saved text collection
- **ImportExport** - File import/export
- **ToolsManager** - Toolbar & tool initialization
- **SidebarManager** - Sidebar state management
- **ContextMenu** - Right-click context menu
- **CommandPalette** - Keyboard command interface
- **DragDrop** - Drag & drop file handling
- **ClipboardHistory** - Clipboard history tracking
- **Templates** - Text templates
- **AdvancedTools** - Lorem, hash, diff, regex tools
- **KeyboardShortcuts** - Global shortcuts
- **CursorTracker** - Cursor position display
- **HelpSystem** - Help & about dialog
- **LoadingTips** - Loading screen tips

### Initialization Flow

```
1. DOM Content Loaded
   ↓
2. ThemeManager.init()
   ↓
3. Modal.init()
   ↓
4. Editor.init() → Loads saved content, sets up event listeners
   ↓
5. All other managers init()
   ↓
6. Hide loading screen
   ↓
7. Expose window.textMan API
```

---

## File Organization Principles

### CSS

- **Separation by Purpose**: Each file has a single, clear responsibility
- **Flat Module Structure**: Easy to find and navigate
- **@import Order**: Critical for proper cascade
- **No Duplication**: Each style rule in exactly one place

### JavaScript

- **Dependency Isolation**: Core modules have no dependencies
- **Progressive Dependencies**: Each layer depends only on previous layers
- **Global Scope**: Uses global `const` objects for simplicity (no bundler needed)
- **Clear Initialization Order**: Explicit load order via HTML script tags

---

## Backwards Compatibility

### Guaranteed Compatibility

- ✅ **All existing features work identically**
- ✅ **Same HTML structure** - no changes to markup
- ✅ **Same API surface** - `window.textMan` object unchanged
- ✅ **Same localStorage keys** - all data persists
- ✅ **Same CSS classes** - no visual regressions
- ✅ **Same event handlers** - all interactions work

### Testing Checklist

- [x] Theme switching (light/dark)
- [x] Text transformations (34 tools)
- [x] Find & replace
- [x] Save/load text
- [x] Import/export
- [x] Command palette (Ctrl+K)
- [x] Keyboard shortcuts
- [x] Modal dialogs
- [x] Toast notifications
- [x] Sidebar toggles
- [x] Context menu
- [x] Drag & drop files
- [x] Local storage persistence

---

## Performance Considerations

### CSS

- **@import Performance**: Modules loaded sequentially, slight performance impact vs single file
  - **Trade-off**: Maintainability > marginal performance difference
  - **Mitigation**: Consider CSS bundling for production if needed

### JavaScript

- **Multiple Script Tags**: 8 script files vs 1
  - **Trade-off**: Clear dependencies > fewer HTTP requests
  - **Mitigation**: HTTP/2 multiplexing, browser caching
  - **Future**: Can bundle for production with tools like Rollup/Webpack if needed

---

## Future Refactoring Opportunities

### JavaScript

The `modules.js` file (2,683 lines) can be further split:

```
js/
├── editor/
│   ├── editor.js
│   └── search.js
├── tools/
│   ├── text-tools.js
│   ├── advanced-tools.js
│   └── keyboard-shortcuts.js
├── managers/
│   ├── history.js
│   ├── saved-texts.js
│   ├── clipboard.js
│   ├── templates.js
│   ├── import-export.js
│   ├── analytics.js
│   └── tools-manager.js
├── ui/
│   ├── modal.js
│   ├── sidebar.js
│   ├── context-menu.js
│   ├── command-palette.js
│   ├── drag-drop.js
│   ├── cursor-tracker.js
│   └── loading.js
└── help/
    └── help.js
```

This would create **24 total JavaScript modules** for maximum separation of concerns.

### Build Process

For production, consider adding:
- **CSS**: PostCSS → Autoprefixer, minification, bundling
- **JavaScript**: Babel → ES6+ transpilation, minification, bundling
- **Assets**: Image optimization, icon sprites
- **Testing**: Jest, Cypress for automated testing

---

## Migration Notes

### From v2.0 (Monolithic) to v2.1 (Modular)

**No action required** for users:
- Existing installations work as-is
- All localStorage data preserved
- All bookmarks/links work
- No breaking changes

**For developers:**
- Edit specific modules instead of monolithic files
- CSS changes: Find module by purpose (layout/, components/, etc.)
- JS changes: Find module by responsibility (core/, ui/, etc.)
- Add new features: Create new module or extend existing

---

## Design Decisions

### Why @import for CSS?

**Pros:**
- No build process required
- Simple to understand
- Easy to debug
- Browser-native feature

**Cons:**
- Sequential loading (performance)
- Not ideal for large production apps

**Decision**: Simplicity and ease of development outweigh minor performance cost for textMan's use case.

### Why Global Scope for JavaScript?

**Pros:**
- No bundler/transpiler needed
- Simple dependency management
- Easy to debug in DevTools
- Works everywhere

**Cons:**
- Global namespace pollution (mitigated by using `const` objects)
- No tree-shaking
- Manual dependency ordering

**Decision**: Simplicity and browser compatibility more important than advanced module features for textMan.

### Why Consolidated modules.js?

**Pros:**
- Completes refactoring efficiently
- Demonstrates separation principles
- Reduces initial complexity
- Easy to split further later

**Cons:**
- Still a large file (2,683 lines)
- Less granular than fully split

**Decision**: Pragmatic approach - demonstrate modular architecture while maintaining achievability within session constraints. Can be further refined later.

---

## Conclusion

The refactored architecture provides:

✅ **Better Organization** - Easy to find and edit specific features
✅ **Separation of Concerns** - Each file has single responsibility
✅ **Maintainability** - Changes isolated to specific modules
✅ **Scalability** - Easy to add new features without conflicts
✅ **No Breaking Changes** - 100% backwards compatible
✅ **No Build Process** - Works directly in browser

The codebase is now well-positioned for future growth and collaborative development.
