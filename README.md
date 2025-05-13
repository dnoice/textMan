<p align="center">
  <img src="resources/assets/images/textMan_banner_image.png" alt="textMan Banner Image" width="400" />
</p>

# textMan: Advanced Text Manipulation Tool

> **textMan** bridges the gap between simple editors and complex IDEs, empowering everyone—from casual tweakers to power users—to wield text transformations with ease and intelligence.

## 📋 Table of Contents

- [🎯 Vision & Philosophy](#-vision--philosophy)  
- [✨ Key Features](#-key-features)  
- [🏗️ Architecture](#️-architecture)  
- [⚙️ Installation](#️-installation)  
- [🚀 Quick Start](#-quick-start)  
- [🔌 Plugin System](#-plugin-system)  
- [🛣️ Roadmap](#️-roadmap)  
- [👥 Contributing](#-contributing)  
- [🌐 Community](#-community)  
- [📄 License](#-license)  

## 🎯 Vision & Philosophy

> ### Core Philosophy
> 
> - 🔌 **Extensibility First**: Plugin‑based for limitless growth
> - 🖥️ **Interface Flexibility**: Terminal • Web • Desktop
> - ⚖️ **Progressive Complexity**: Easy for basics, powerful for pros
> - 🧠 **Text Intelligence**: Context‑aware, structure‑savvy processing

textMan aims to be a comprehensive, extensible text manipulation tool that empowers users to efficiently process, analyze, and transform text through multiple interfaces. Whether you're cleaning data, formatting code, or analyzing documents, textMan provides both simple commands for basic tasks and advanced functionality for complex operations.

## ✨ Key Features

- 📝 **Basic Text Operations**: 
  - ✅ Case conversion (uppercase, lowercase, title case)
  - ✅ Line manipulation (sort, deduplicate, trim)
  - ✅ Text statistics (character/word counts, reading time)
  - ✅ Undo/redo functionality

- 🔍 **Advanced Pattern Processing**: 
  - ✅ Regular expression search and replace
  - ✅ Pattern extraction and highlighting
  - ✅ Line filtering based on content

- 📊 **Text Formatting**: 
  - ✅ Indentation management
  - ✅ Line numbering
  - ✅ Text wrapping
  - ✅ Text alignment (left, center, right, justify)

- 🔠 **Case Transformations**:
  - ✅ Snake case, camel case, kebab case
  - ✅ Sentence case
  - ✅ Toggle and invert case

- 🔄 **Interface Options**:
  - ✅ Rich interactive terminal UI
  - 🔄 Web interface (in progress)
  - 🔄 Desktop application (planned)

- 🧰 **Plugin Ecosystem**:
  - ✅ Text manipulation plugins
  - ✅ Regex tools
  - ✅ Formatting utilities
  - 🔄 More specialized plugins coming soon

## 🏗️ Architecture

<p align="center">
  <img src="resources/assets/architecture.png" alt="Architecture Diagram" width="600" />
</p>

<details>
  <summary><strong>Layer Breakdown</strong></summary>

```
User Interfaces
 ├─ Terminal (✅ Implemented)
 ├─ Web (🔄 Planned)
 └─ Desktop (🔄 Planned)
     │
Core Engine (✅ Implemented)
 ├─ Text Manager
 ├─ State Manager (undo/redo)
 └─ Configuration
     │
Plugin System (✅ Implemented)
 ├─ Text (✅ Basic plugins available)
 ├─ Regex (✅ Core functionality available)
 ├─ NLP (🔄 Planned)
 ├─ Code (🔄 Planned)
 └─ Data (🔄 Planned)
```
</details>

## ⚙️ Installation

<details>
  <summary><strong>Requirements</strong></summary>

- Python **3.8+**  
- Dependencies managed through requirements.txt:
  - click: Command line interface creation
  - rich: Terminal formatting and display
  - regex: Enhanced regular expression support
  - pydantic: Data validation and settings management
  - (Additional packages for specific plugins)
</details>

```bash
# Clone the repository
git clone https://github.com/dnoice/textMan.git
cd textMan

# Create & activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install development version (editable)
pip install -e .
```

## 🚀 Quick Start

1. **Launch Terminal UI**  

   ```bash
   python main.py --terminal
   # Or use the test script for a quick demo
   python tests/terminal_ui_test.py
   ```

2. **Basic Text Processing**  

   ```bash
   # Case conversion
   echo "Hello World" | python main.py --execute uppercase
   # Output: HELLO WORLD
   
   # Sort lines alphabetically
   cat myfile.txt | python main.py --execute sort > sorted.txt
   
   # Remove duplicate lines
   python main.py --file input.txt --output unique.txt --execute unique
   ```

3. **Using Terminal Interface Commands**  

   Once in the terminal UI, you can use these commands:
   
   ```
   help              - Show available commands
   show              - Display the current text
   load <filepath>   - Load a file
   save [filepath]   - Save current text to a file
   
   # Text operations
   uppercase         - Convert text to uppercase
   lowercase         - Convert text to lowercase
   capitalize        - Capitalize each word
   sort              - Sort lines alphabetically
   unique            - Remove duplicate lines
   trim              - Remove extra whitespace
   stats             - Show text statistics
   
   # Plugin execution
   plugin <name> [options] - Execute a plugin
   plugins           - List available plugins
   ```

4. **Using Plugins**

   ```bash
   # In terminal UI
   plugin text_case mode=snake     # Convert to snake_case
   plugin regex operation=extract pattern="\b\w+@\w+\.\w+\b"    # Extract emails
   plugin format operation=number  # Add line numbers
   
   # From command line
   python main.py --file input.txt --execute "plugin text_case mode=camel"
   ```

> 💡 **Tip:** Use `python main.py --list-plugins` to discover all installed plugins and their capabilities.

## 🔌 Plugin System

textMan features a powerful plugin system that allows you to extend its functionality.

### Available Plugins

1. **Text Case Plugin** (text_case)
   - Snake case conversion: `plugin text_case mode=snake`
   - Camel case conversion: `plugin text_case mode=camel`
   - Kebab case conversion: `plugin text_case mode=kebab`
   - Title case: `plugin text_case mode=title`
   - Sentence case: `plugin text_case mode=sentence`
   - Toggle case: `plugin text_case mode=toggle`
   - Invert text: `plugin text_case mode=invert`

2. **Regex Plugin** (regex)
   - Replace: `plugin regex operation=replace pattern="\d+" replacement="[NUM]"`
   - Extract: `plugin regex operation=extract pattern="[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-zA-Z]{2,}"`
   - Match: `plugin regex operation=match pattern="\b\w{5,}\b"`
   - Split: `plugin regex operation=split pattern="\s+"`
   - Highlight: `plugin regex operation=highlight pattern="\b\w+\b" highlight_format="[{}]"`

3. **Formatting Plugin** (format)
   - Indentation: `plugin format operation=indent indent_size=4`
   - Line numbering: `plugin format operation=number`
   - Text wrapping: `plugin format operation=wrap wrap_width=80`
   - Text alignment: `plugin format operation=align align=center width=50`
   - Add prefix/suffix: `plugin format operation=prefix prefix="- "`

### Creating Your Own Plugin

```python
from app.core.models.plugin import Plugin, PluginCategory

class MyPlugin(Plugin):
    """Custom plugin example."""
    
    def __init__(self):
        super().__init__(
            name="my_plugin",
            description="My custom plugin",
            version="1.0.0",
            category=PluginCategory.TEXT
        )
    
    def process(self, text: str, *args, **kwargs) -> str:
        """Process text with my custom logic."""
        # Your text processing code here
        return text.upper()  # Example: convert to uppercase
```

## 🛣️ Roadmap

<details>
  <summary><strong>Phase 1: Foundation (✅ In Progress)</strong></summary>

- [x] Create project structure
- [x] Implement core engine with basic text operations
- [x] Design plugin architecture
- [x] Develop state management (undo/redo)
- [x] Build command-line interface
- [x] Implement Terminal UI
- [x] Implement basic plugins:
  - [x] Text operations (case conversion, sorting)
  - [x] Regular expression tools
  - [x] Basic formatting features
- [ ] Add comprehensive unit tests
- [ ] Complete initial documentation
</details>

<details>
  <summary><strong>Phase 2: Core Capabilities (🔄 Next)</strong></summary>

- [ ] Expand text analysis capabilities:
  - [ ] Advanced readability metrics
  - [ ] Keyword extraction
  - [ ] Text summarization
- [ ] Implement multi-file handling:
  - [ ] Batch operations
  - [ ] Auto-save functionality
  - [ ] Session restoration
- [ ] Add diff and comparison tools:
  - [ ] Text difference highlighting
  - [ ] Merge capabilities
  - [ ] Version comparison
- [ ] Develop additional plugins:
  - [ ] Code formatting plugins
  - [ ] Data extraction plugins
  - [ ] Markdown/HTML conversion
</details>

<details>
  <summary><strong>Phase 3: Web Interface and Advanced Features</strong></summary>

- [ ] Implement web interface:
  - [ ] RESTful API
  - [ ] Interactive browser UI
  - [ ] Real-time collaboration
- [ ] Add advanced processing:
  - [ ] NLP capabilities (tokenization, named entity recognition)
  - [ ] Sentiment analysis
  - [ ] Advanced translation features
- [ ] Improve code-specific features:
  - [ ] Syntax highlighting for multiple languages
  - [ ] Code formatting
  - [ ] Linting integration
- [ ] Enhance data extraction:
  - [ ] Tabular data parsing
  - [ ] Extract structured information (emails, URLs, dates)
  - [ ] Convert between data formats
</details>

<details>
  <summary><strong>Phase 4: Expansion & Integration</strong></summary>

- [ ] Desktop GUI application
- [ ] Integration capabilities:
  - [ ] API hooks for external applications
  - [ ] Cloud storage support
  - [ ] Version control integration
- [ ] Document features:
  - [ ] Template system
  - [ ] Markdown processing
  - [ ] Document generation
- [ ] Localization support:
  - [ ] Multi-language interfaces
  - [ ] Translation assistance
  - [ ] Locale-specific text processing
</details>

See our [Project Board](https://github.com/dnoice/textMan/projects) for detailed development status.

## 👥 Contributing

> **We ❤️ contributions!** Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. **Fork & Branch**  
   Fork the repository and create a feature branch  
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Develop & Test**  
   Write your code and include tests  
   ```bash
   # Run tests
   pytest
   
   # Check code style
   black .
   flake8
   ```

3. **Submit PR**  
   Push your changes and create a pull request  
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Review Process**  
   Wait for code review and address any feedback

## 🌐 Community

- [**GitHub Discussions**](https://github.com/dnoice/textMan/discussions) - Ask questions and share ideas
- [**Discord**](https://discord.gg/textman) - Join our community chat
- [**Twitter**](https://twitter.com/textmanproject) - Follow for updates
- [**Documentation**](https://textman.readthedocs.io/) - Comprehensive guides and API reference

We welcome contributions of all kinds - whether you're fixing bugs, improving documentation, or suggesting new features, your input is valuable!

## 📄 License

Released under the **CC0 1.0 Universal License**. See [LICENSE](LICENSE) for details.

<p align="center">
  Made with 💡 and 🔤 by the textMan Team  
  
  Lead Developer: Dennis 'dnoice' Smaltz
</p>
