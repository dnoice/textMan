"""
textMan Terminal UI Test
----------------------
Simple script to test the Terminal UI implementation.
"""

import sys
import logging
from pathlib import Path

# Add the project root to the path for imports
project_root = Path(__file__).resolve().parent.parent
sys.path.append(str(project_root))

from app.core.engine import TextEngine
from app.core.config.settings import Settings
from app.core.utils.logging_utils import setup_logging
from app.ui.terminal.cli import TerminalUI

def main():
    """Run the Terminal UI test."""
    # Setup logging
    setup_logging(log_level="INFO")
    
    # Create engine with default settings
    settings = Settings()
    engine = TextEngine(settings)
    
    # Load some sample text if no file is specified
    if len(sys.argv) > 1:
        try:
            file_path = Path(sys.argv[1]).resolve()
            engine.load_file(file_path)
            logging.info(f"Loaded file: {file_path}")
        except Exception as e:
            logging.error(f"Error loading file: {e}")
            
            # Set some sample text as fallback
            engine.text = """# TextMan Sample Text

This is a sample text to demonstrate the TextMan terminal UI.

- You can try various commands like uppercase, lowercase, etc.
- Edit this text and see the changes in real-time
- Try the stats command to see text statistics

## Features

1. Rich syntax highlighting
2. Command history
3. Plugin support
4. Undo/redo functionality

Enjoy using TextMan!
"""
    else:
        # Set some sample text
        engine.text = """# TextMan Sample Text

This is a sample text to demonstrate the TextMan terminal UI.

- You can try various commands like uppercase, lowercase, etc.
- Edit this text and see the changes in real-time
- Try the stats command to see text statistics

## Features

1. Rich syntax highlighting
2. Command history
3. Plugin support
4. Undo/redo functionality

Enjoy using TextMan!
"""
    
    # Create and run the terminal UI
    terminal = TerminalUI(engine)
    terminal.run()

if __name__ == "__main__":
    main()
