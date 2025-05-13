# Contributing to textMan

Thank you for considering contributing to textMan! This document outlines the process and guidelines for contributing to make it easier for you to get involved.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone. Please be considerate of differing viewpoints and experiences, and focus on what is best for the community.

## How Can I Contribute?

### Reporting Bugs

Bugs are tracked as GitHub issues. Before creating a bug report, please check if the issue has already been reported. When creating a bug report, please include as much detail as possible:

- **Title**: Clear and descriptive
- **Steps to Reproduce**: Detailed steps
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Context**: OS, Python version, and any relevant configuration
- **Screenshots**: If applicable
- **Additional Information**: Any other relevant details

### Suggesting Features

Feature suggestions are also tracked as GitHub issues. Please provide:

- **Title**: Clear and descriptive
- **Use Case**: Why this feature would be useful
- **Description**: How you envision the feature working
- **Alternatives**: Any alternative solutions you've considered
- **Additional Context**: Any other relevant information

### Pull Requests

1. **Fork the Repository**
   - Create your own fork of the project

2. **Create a Branch**
   - Create a branch for your feature or bugfix
   - Use a descriptive name (e.g., `feature/case-conversion`, `fix/undo-stack-bug`)

3. **Make Your Changes**
   - Write clean, maintainable code
   - Follow the coding style and standards (PEP 8 for Python)
   - Include comments where necessary
   - Follow textMan's branding and style conventions

4. **Test Your Changes**
   - Add tests for new features
   - Ensure all tests pass
   - Run linting checks

5. **Document Your Changes**
   - Update the README.md if needed
   - Add/update documentation for new features
   - Update the CHANGELOG.md

6. **Submit a Pull Request**
   - Provide a clear description of the changes
   - Link any relevant issues
   - Be responsive to feedback and be willing to make changes if requested

## Development Setup

### Prerequisites

- Python 3.8 or higher
- Git

### Installation for Development

```bash
# Clone your fork
git clone https://github.com/yourusername/textMan.git
cd textMan

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install the package in development mode
pip install -e .
```

### Running Tests

```bash
# Run all tests
pytest

# Run specific tests
pytest tests/test_engine.py

# Run tests with coverage
pytest --cov=app
```

### Code Style

We use the following tools to maintain code quality:

- **Black**: Code formatter
- **isort**: Import sorter
- **flake8**: Linter
- **mypy**: Static type checker

```bash
# Format code
black .

# Sort imports
isort .

# Run linting
flake8

# Run type checking
mypy app
```

## Project Structure

```
textMan/
├── app/
│   ├── core/           # Core engine components
│   ├── plugins/        # Plugin implementations
│   └── ui/             # User interfaces
├── docs/               # Documentation
├── tests/              # Test suite
└── resources/          # Static resources
```

## Plugin Development

To create a new plugin:

1. Create a new Python file in the appropriate plugins subdirectory
2. Implement a class that inherits from `Plugin`
3. Implement the `process` method
4. Register your plugin with the engine

Example:

```python
"""
textMan | myPlugin Plugin
-----------------------
Description of what your plugin does.
"""

from app.core.models.plugin import Plugin, PluginCategory

class MyPlugin(Plugin):
    """Custom plugin for textMan."""
    
    def __init__(self):
        super().__init__(
            name="my_plugin",
            description="My amazing textMan plugin",
            version="1.0.0",
            category=PluginCategory.TEXT,
            author="Your Name"
        )
    
    def process(self, text: str, *args, **kwargs) -> str:
        # Your text processing logic here
        return text  # Return the processed text
```

## Branding Guidelines

When developing for textMan, please follow these branding guidelines:

1. **Name Format**: Always use "textMan" (lowercase 't', uppercase 'M')
2. **Plugin Naming**: Follow the format "textMan | pluginName Plugin"
3. **File Headers**: Include the plugin name in the docstring header
4. **Examples**: Use textMan-related examples in docstrings
5. **Plugin Classes**: Use CamelCase for class names (e.g., `TextCasePlugin`)
6. **Plugin Variables**: Use snake_case for variable names (e.g., `operation_mode`)

## Documentation

We use the following conventions:

- Google-style docstrings for Python code
- Markdown for general documentation
- Include examples where possible
- Always reference "textMan" correctly in documentation

## Release Process

1. Update version number in relevant files
2. Update CHANGELOG.md
3. Create a new GitHub release with tag matching the version
4. CI/CD will handle publishing to PyPI

## Thank You!

Your contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**!
