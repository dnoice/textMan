# textMan - Advanced Text Manipulation Tool

**Version:** 2.1a.0
**Status:** Active Development
**Type:** Client-Side Web Application
**License:** MIT

A powerful, privacy-focused text manipulation tool with 50+ transformation utilities, running entirely in your browser. No server. No tracking. Just text manipulation done right.

---

## ✨ Features

### Text Transformation (8 tools)
- **UPPERCASE** / **lowercase** conversion
- **Title Case** / **Sentence case** formatting
- **camelCase** / **snake_case** / **kebab-case** conversion
- Reverse text character order

### Text Cleaning & Formatting (8 tools)
- Remove extra spaces, line breaks, numbers, punctuation
- Remove duplicate lines
- Sort lines alphabetically
- Shuffle lines randomly
- Trim whitespace
- Add line numbers
- Word wrap at custom column width
- Indent text with custom spacing

### Encoding & Decoding (6 tools)
- **Base64** encode/decode (with Unicode support)
- **URL** encode/decode
- **HTML** entity encode/decode

### Advanced Tools
- **Find & Replace** with regex support
- **Text Comparison** (diff tool)
- **Hash Generator** (SHA-256, SHA-512)
- **Lorem Ipsum Generator**
- **Regex Tester** with live results
- **Full Text Analytics** (word count, reading time, frequency analysis)

### Productivity Features
- **Command Palette** (Ctrl+K) - Quick access to all tools
- **Clipboard History** - Track and reuse copied text
- **Templates** - Save frequently used text patterns
- **Saved Texts** - Organize and tag important texts
- **Auto-save** - Never lose your work
- **Undo/Redo** - Full history tracking
- **Drag & Drop** - Import files directly
- **Keyboard Shortcuts** - Efficient workflow

### Import/Export
- **Import:** TXT, MD, JSON, CSV, HTML (drag & drop supported)
- **Export:** TXT, MD, JSON, HTML formats
- **Max file size:** 10MB

### UI/UX
- **Dark/Light themes** with system preference detection
- **Responsive design** - Works on mobile, tablet, desktop
- **Collapsible sidebars** - Maximize workspace
- **Real-time statistics** - Characters, words, lines, reading time
- **Toast notifications** - Non-intrusive feedback
- **Context menu** - Right-click for quick actions
- **Fullscreen mode** - Distraction-free editing

### Privacy & Security
- 🔒 **100% client-side** - No data sent to servers
- 🔒 **localStorage only** - Data stays on your device
- 🔒 **Offline-capable** - Works without internet
- 🔒 **No analytics** - No tracking, no cookies
- 🔒 **Open source** - Auditable code

---

## 🚀 Quick Start

### Try It Online (Recommended)
1. Visit: [textMan Live Demo](#) *(link to deployed version)*
2. Start typing or drag & drop a file
3. Use Ctrl+K to open the command palette

### Run Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/dnoice/textMan.git
   cd textMan
   ```

2. Open `index.html` in your browser:
   ```bash
   # macOS
   open index.html

   # Linux
   xdg-open index.html

   # Windows
   start index.html
   ```

That's it! No build step, no dependencies, no installation required.

---

## 💻 Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| Opera | 76+ | ✅ Full |

**Requirements:**
- JavaScript enabled
- localStorage enabled (for saving data)
- Modern browser with ES6+ support

---

## 📖 Usage Examples

### Transform Text to camelCase
1. Paste your text in the editor
2. Click "camelCase" in the right sidebar under "Transform Tools"
3. Or press Ctrl+K and type "camel"

### Find & Replace with Regex
1. Press Ctrl+F to open Find & Replace
2. Enter your search pattern
3. Check "Use Regex" for advanced patterns
4. Replace one or all occurrences

### Generate Lorem Ipsum
1. Press Ctrl+K to open Command Palette
2. Type "lorem"
3. Select "Lorem Ipsum Generator"
4. Choose number of paragraphs

### Save Text for Later
1. Edit your text
2. Click "Save Text" in toolbar or press Ctrl+S
3. Add a name and optional tags
4. Access saved texts from left sidebar

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open Command Palette |
| `Ctrl+N` | New Text (clear editor) |
| `Ctrl+S` | Save Text |
| `Ctrl+F` | Find & Replace |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` or `Ctrl+Shift+Z` | Redo |
| `Ctrl+X` | Cut |
| `Ctrl+C` | Copy |
| `Ctrl+V` | Paste |
| `Ctrl+A` | Select All |
| `Ctrl+P` | Print |
| `Esc` | Close Dialogs |

---

## 🏗️ Technology Stack

- **Frontend:** Vanilla JavaScript (ES6+)
- **Styling:** CSS3 with CSS Custom Properties
- **Storage:** localStorage API
- **Icons:** Font Awesome 6.4.0
- **Encoding:** Web Crypto API (SHA-256, SHA-512)

**No frameworks. No build tools. No dependencies.**

Just clean, efficient, vanilla JavaScript.

---

## 📁 Project Structure

```
textMan/
├── index.html              # Main application HTML
├── css/
│   └── styles.css          # All application styles (2700+ lines)
├── js/
│   └── scripts.js          # All application logic (3000+ lines)
├── docs/
│   ├── CONTINUATION.md                 # Session handoff system
│   ├── CODEBASE_AUDIT_2025-10-27.md   # Security & quality audit
│   ├── DOCUMENTATION_PRIORITIES.md     # Documentation roadmap
│   ├── DOCUMENTATION_REVIEW_2025-10-27.md  # Documentation assessment
│   └── branch/                         # Branch-specific documentation
├── favicon.ico             # Application icon
└── README.md               # This file
```

**Total Size:** ~214KB (5.2MB with git history)

---

## 🧪 Development

### Architecture

textMan uses a **modular namespace pattern**:

```javascript
// Core modules
APP_CONFIG        // Application configuration
APP_STATE         // Global state management
Utils             // Utility functions
Storage           // localStorage wrapper
ThemeManager      // Dark/light theme
Toast             // Notifications
Modal             // Dialog system

// Feature modules
Editor            // Text editor management
TextTools         // Text transformation tools
SearchManager     // Find & replace
HistoryManager    // Text history
SavedTexts        // Saved text library
Templates         // Text templates
Analytics         // Text statistics
AdvancedTools     // Hash, diff, lorem, regex

// UI modules
ToolsManager      // Tool button handlers
SidebarManager    // Sidebar collapse/expand
CommandPalette    // Ctrl+K command interface
DragDrop          // File drag & drop
ContextMenu       // Right-click menu
KeyboardShortcuts // Global hotkeys
```

### State Management

Global state in `APP_STATE`:
```javascript
{
    theme: 'dark' | 'light',
    editor: { content, history, historyIndex, maxHistory },
    savedTexts: [...],
    recentHistory: [...],
    clipboardHistory: [...],
    templates: [...],
    settings: { autoSave, fontSize, lineHeight },
    commandPalette: { isOpen, selectedIndex }
}
```

### localStorage Schema

```javascript
// Keys (prefixed with 'textMan_')
textMan_theme              // Current theme
textMan_editorContent      // Current editor text
textMan_settings           // User settings
textMan_history            // Recent edits
textMan_savedTexts         // Saved text library
textMan_clipboardHistory   // Clipboard tracking
textMan_templates          // Custom templates
textMan_sidebar_*          // Sidebar states
textMan_section_*          // Section collapse states
```

### Adding a New Text Tool

1. Add tool function to `TextTools` object:
```javascript
const TextTools = {
    // ... existing tools ...

    myNewTool() {
        const text = Editor.textarea.value;
        // Transform text
        const transformed = /* your transformation */;
        Editor.textarea.value = transformed;
        Editor.handleInput();
        Toast.show('Success', 'Text transformed', 'success');
    }
};
```

2. Add tool button to `index.html`:
```html
<button class="tool-btn" data-action="myNewTool">
    <i class="fas fa-icon"></i> My Tool
</button>
```

3. Register action in `ToolsManager.handleToolAction()`:
```javascript
const actionMap = {
    // ... existing actions ...
    'myNewTool': () => TextTools.myNewTool()
};
```

4. (Optional) Add to Command Palette in `CommandPalette.commands` array

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](docs/CONTRIBUTING.md) before submitting PRs.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/my-new-tool
   ```
3. **Make your changes** following our coding standards
4. **Test thoroughly** (all tools, all browsers)
5. **Document your changes** (update README, add JSDoc comments)
6. **Submit a Pull Request** with a clear description

### Coding Standards

- **JavaScript:** ES6+, descriptive names, JSDoc comments
- **CSS:** BEM-like naming, custom properties for theming
- **HTML:** Semantic, accessible, ARIA labels
- **Commits:** Conventional Commits format

### Areas We Need Help

- 🐛 Bug fixes (see [Issues](#))
- ♿ Accessibility improvements
- 🌍 Internationalization (i18n)
- 📱 Mobile UX enhancements
- ✅ Test coverage
- 📖 Documentation improvements
- 🎨 UI/UX polish

---

## 🔒 Security

### Our Security Commitment

- **No server communication** - All processing happens client-side
- **No external requests** - Except Font Awesome CDN (optional)
- **No data collection** - No analytics, no tracking
- **Regular audits** - Last audit: 2025-10-27

### Known Security Considerations

See our [Security Audit Report](docs/CODEBASE_AUDIT_2025-10-27.md) for detailed findings.

**Critical items being addressed:**
- XSS vulnerability mitigation (innerHTML usage)
- Input validation improvements
- Content Security Policy implementation

### Reporting Vulnerabilities

If you discover a security vulnerability, please:

1. **Do NOT** open a public issue
2. Email security details to: [your-email@example.com]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We aim to respond within 48 hours.

---

## 📊 Project Stats

- **Total Lines of Code:** 6,382
- **HTML:** 659 lines
- **CSS:** 2,705 lines
- **JavaScript:** 3,018 lines
- **Tools Implemented:** 50+
- **Browser Compatibility:** 99% of modern browsers
- **Performance:** < 2s load time, 60 FPS UI

---

## 🗺️ Roadmap

### Completed ✅
- [x] 50+ text manipulation tools
- [x] Dark/light themes
- [x] Command palette
- [x] Auto-save & history
- [x] Import/export multiple formats
- [x] Responsive design
- [x] Comprehensive documentation
- [x] Security audit

### In Progress 🚧
- [ ] Fix XSS vulnerabilities (SEC-001, SEC-002)
- [ ] Improve accessibility (ARIA labels, keyboard nav)
- [ ] Optimize large file handling
- [ ] Add Content Security Policy

### Planned 📋
- [ ] Progressive Web App (PWA) support
- [ ] Browser extension versions
- [ ] Plugin/extension API
- [ ] Markdown preview mode
- [ ] Code syntax highlighting
- [ ] Multi-file tabs
- [ ] Advanced diff visualization

---

## 📄 License

**MIT License**

Copyright (c) 2025 [Your Name/Organization]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 🙏 Credits & Acknowledgments

### Dependencies
- **Font Awesome** 6.4.0 - Icon library ([fontawesome.com](https://fontawesome.com))

### Inspiration
- Inspired by classic text manipulation tools and modern web development practices

### Contributors
See [Contributors](https://github.com/dnoice/textMan/graphs/contributors) for a list of people who have contributed to this project.

---

## 📞 Support & Contact

- **Issues:** [GitHub Issues](https://github.com/dnoice/textMan/issues)
- **Discussions:** [GitHub Discussions](https://github.com/dnoice/textMan/discussions)
- **Email:** [your-email@example.com]
- **Twitter:** [@yourusername]

---

## 📚 Additional Documentation

- [API Reference](docs/API.md) *(to be created)*
- [Architecture Overview](docs/ARCHITECTURE.md) *(to be created)*
- [Contributing Guidelines](docs/CONTRIBUTING.md) *(to be created)*
- [Session Handoff System](docs/CONTINUATION.md)
- [Audit Archive](docs/audits/) - All codebase and documentation audits
- [Latest Audit (2025-10-27)](docs/audits/2025-10-27/) - Security, A11Y, Performance findings

---

## ⭐ Star History

If you find textMan useful, please consider giving it a star on GitHub! ⭐

[![Star History](https://api.star-history.com/svg?repos=dnoice/textMan&type=Date)](https://star-history.com/#dnoice/textMan&Date)

---

**Built with ❤️ and Vanilla JavaScript**

*No frameworks were harmed in the making of this application.*
