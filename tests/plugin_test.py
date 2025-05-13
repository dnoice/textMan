"""
textMan | Plugin Test
------------------
Test script to demonstrate plugin functionality.
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
from app.plugins.text import TextCasePlugin, FormattingPlugin
from app.plugins.regex import RegexPlugin

def test_text_case_plugin():
    """Test the textCase plugin."""
    print("\n=== Testing textCase Plugin ===")
    
    # Create engine and register plugin
    engine = TextEngine()
    plugin = TextCasePlugin()
    engine.register_plugin(plugin)
    
    # Sample text
    sample_text = "Hello textMan. This is a Test String with Mixed Case."
    engine.text = sample_text
    
    print(f"Original text: {sample_text}")
    
    # Test different case transformations
    transformations = [
        ("snake", "Convert to snake_case"),
        ("camel", "Convert to camelCase"),
        ("kebab", "Convert to kebab-case"),
        ("title", "Convert to Title Case"),
        ("sentence", "Convert to Sentence case"),
        ("toggle", "Toggle case"),
        ("invert", "Invert text")
    ]
    
    for mode, description in transformations:
        print(f"\n{description}:")
        result = engine.apply_plugin("text_case", mode=mode)
        print(f"Result: {result}")
        
        # Reset text for next test
        engine.text = sample_text

def test_regex_plugin():
    """Test the regexTools plugin."""
    print("\n=== Testing regexTools Plugin ===")
    
    # Create engine and register plugin
    engine = TextEngine()
    plugin = RegexPlugin()
    engine.register_plugin(plugin)
    
    # Sample text
    sample_text = """Hello textMan! 
This is a sample text with some numbers like 123 and 456.
Contact me at example@textMan.com or call at 555-123-4567.
Visit https://www.textMan.com for more info."""
    engine.text = sample_text
    
    print(f"Original text:\n{sample_text}\n")
    
    # Test regex operations
    print("1. Replace all numbers with [NUM]:")
    result = engine.apply_plugin("regex", operation="replace", pattern=r"\d+", replacement="[NUM]")
    print(f"Result:\n{result}\n")
    
    # Reset text
    engine.text = sample_text
    
    print("2. Extract email addresses:")
    result = engine.apply_plugin("regex", operation="extract", pattern=r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
    print(f"Result:\n{result}\n")
    
    # Reset text
    engine.text = sample_text
    
    print("3. Highlight mentions of textMan:")
    result = engine.apply_plugin("regex", operation="highlight", 
                                pattern=r"\btextMan\b", 
                                highlight_format="<<{}>>")
    print(f"Result:\n{result}\n")

def test_formatting_plugin():
    """Test the formatText plugin."""
    print("\n=== Testing formatText Plugin ===")
    
    # Create engine and register plugin
    engine = TextEngine()
    plugin = FormattingPlugin()
    engine.register_plugin(plugin)
    
    # Sample text
    sample_text = """textMan: Advanced Text Manipulation Tool
It has multiple interfaces.
Some features are simple.
Others are much more advanced and might need additional plugins to work properly.

textMan bridges the gap between simple editors and complex IDEs."""
    engine.text = sample_text
    
    print(f"Original text:\n{sample_text}\n")
    
    # Test formatting operations
    print("1. Indent text:")
    result = engine.apply_plugin("format", operation="indent", indent_size=2)
    print(f"Result:\n{result}\n")
    
    # Reset text
    engine.text = sample_text
    
    print("2. Add line numbers:")
    result = engine.apply_plugin("format", operation="number", number_format="{:3d}| ")
    print(f"Result:\n{result}\n")
    
    # Reset text
    engine.text = sample_text
    
    print("3. Wrap text to width of 40:")
    result = engine.apply_plugin("format", operation="wrap", wrap_width=40)
    print(f"Result:\n{result}\n")
    
    # Reset text
    engine.text = sample_text
    
    print("4. Center align text (width 50):")
    result = engine.apply_plugin("format", operation="align", align="center", width=50)
    print(f"Result:\n{result}\n")

def main():
    """Run the plugin tests."""
    # Setup logging
    setup_logging(log_level="INFO")
    
    print("textMan Plugin Demonstration")
    print("===========================")
    
    try:
        test_text_case_plugin()
        test_regex_plugin()
        test_formatting_plugin()
    except Exception as e:
        logging.error(f"Test failed: {e}", exc_info=True)

if __name__ == "__main__":
    main()
