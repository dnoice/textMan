#!/usr/bin/env python3
"""
textMan - Advanced Text Manipulation Tool
----------------------------------------
Main entry point for the textMan application.

This module provides the primary command-line interface and entry points
for different UI modes (terminal, web, desktop).
"""

import argparse
import logging
import os
import sys
from pathlib import Path
from typing import Optional, List, Dict, Any

# Set up base directory for imports
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Import textMan modules
try:
    from app.core.engine import TextEngine
    from app.core.config.settings import Settings
    from app.core.utils.logging_utils import setup_logging
    from app.core.i18n import get_i18n
except ImportError as e:
    print(f"Error importing TextMan modules: {e}")
    print("Make sure you've installed all required dependencies.")
    sys.exit(1)

def parse_arguments() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="TextMan - Advanced Text Manipulation Tool",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    
    # UI mode selection
    ui_group = parser.add_argument_group("UI Modes")
    ui_exclusive = ui_group.add_mutually_exclusive_group()
    ui_exclusive.add_argument(
        "--terminal", "-t", 
        action="store_true", 
        help="Run in terminal mode (default)"
    )
    ui_exclusive.add_argument(
        "--web", "-w", 
        action="store_true", 
        help="Run as web server"
    )
    ui_exclusive.add_argument(
        "--desktop", "-d", 
        action="store_true", 
        help="Run as desktop application"
    )
    
    # File options
    file_group = parser.add_argument_group("File Options")
    file_group.add_argument(
        "--file", "-f", 
        help="File to open and edit"
    )
    file_group.add_argument(
        "--output", "-o", 
        help="Output file for processed text"
    )
    file_group.add_argument(
        "--encoding", 
        default="utf-8",
        help="File encoding to use"
    )
    
    # Web server options
    web_group = parser.add_argument_group("Web Server Options")
    web_group.add_argument(
        "--host", 
        default="127.0.0.1",
        help="Host address for web server"
    )
    web_group.add_argument(
        "--port", "-p", 
        type=int, 
        default=8080,
        help="Port for web server"
    )
    
    # Plugin options
    plugin_group = parser.add_argument_group("Plugin Options")
    plugin_group.add_argument(
        "--plugin-dir",
        help="Additional directory to search for plugins"
    )
    plugin_group.add_argument(
        "--disable-plugins",
        nargs="+",
        help="List of plugins to disable"
    )
    plugin_group.add_argument(
        "--enable-plugins",
        nargs="+",
        help="List of plugins to enable (others will be disabled)"
    )
    
    # Configuration options
    config_group = parser.add_argument_group("Configuration Options")
    config_group.add_argument(
        "--config",
        help="Path to configuration file"
    )
    config_group.add_argument(
        "--log-level",
        choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"],
        default="INFO",
        help="Set the logging level"
    )
    
    # Language options
    language_group = parser.add_argument_group("Language Options")
    language_group.add_argument(
        "--language", "-l",
        help="Set the interface language (e.g., 'en', 'es', 'fr', 'de', 'zh')"
    )
    language_group.add_argument(
        "--list-languages",
        action="store_true",
        help="List available interface languages and exit"
    )
    
    # Action options
    action_group = parser.add_argument_group("Action Options")
    action_group.add_argument(
        "--list-plugins",
        action="store_true",
        help="List available plugins and exit"
    )
    action_group.add_argument(
        "--version", "-v",
        action="store_true",
        help="Show version information and exit"
    )
    action_group.add_argument(
        "--execute", "-e",
        help="Execute a single command and exit"
    )
    
    return parser.parse_args()

def load_settings(args: argparse.Namespace) -> Settings:
    """Load application settings from environment, config file, and CLI args."""
    settings = Settings()
    
    # Override with config file if provided
    if args.config:
        config_path = Path(args.config).expanduser().resolve()
        if config_path.exists():
            settings.load_from_file(config_path)
        else:
            logging.warning(f"Config file not found: {config_path}")
    
    # Override with command line arguments
    settings.update_from_args(args)
    
    return settings

def setup_engine(settings: Settings) -> TextEngine:
    """Initialize and configure the TextEngine."""
    engine = TextEngine(settings)
    
    # Load plugins from standard locations and additional directories
    engine.load_plugins()
    
    if settings.plugin_dir:
        engine.load_plugins(settings.plugin_dir)
    
    # Apply plugin filters
    if settings.disable_plugins:
        for plugin_name in settings.disable_plugins:
            engine.disable_plugin(plugin_name)
    
    if settings.enable_plugins:
        # Disable all plugins first
        for plugin_name in engine.list_plugins():
            engine.disable_plugin(plugin_name)
        # Then enable only specified ones
        for plugin_name in settings.enable_plugins:
            engine.enable_plugin(plugin_name)
    
    # Load initial file if specified
    if settings.file:
        file_path = Path(settings.file).expanduser().resolve()
        if file_path.exists():
            try:
                engine.load_file(file_path, settings.encoding)
                logging.info(f"Loaded file: {file_path}")
            except Exception as e:
                logging.error(f"Error loading file: {e}")
        else:
            logging.error(f"File not found: {file_path}")
    
    return engine

def run_terminal_mode(engine: TextEngine, settings: Settings) -> None:
    """Run the application in terminal mode."""
    try:
        from app.ui.terminal.cli import TerminalUI
        
        # Execute single command if specified
        if settings.execute:
            result = engine.execute_command(settings.execute)
            if settings.output:
                with open(settings.output, 'w', encoding=settings.encoding) as f:
                    f.write(result)
            else:
                print(result)
        else:
            # Interactive terminal mode
            terminal_ui = TerminalUI(engine)
            terminal_ui.run()
    except ImportError as e:
        logging.error(f"Terminal UI not available: {e}")
        sys.exit(1)

def run_web_mode(engine: TextEngine, settings: Settings) -> None:
    """Run the application as a web server."""
    try:
        from app.ui.web.server import WebServer
        
        logging.info(f"Starting web server on {settings.host}:{settings.port}")
        server = WebServer(engine, host=settings.host, port=settings.port)
        server.run()
    except ImportError as e:
        logging.error(f"Web server not available: {e}")
        logging.error("Make sure you've installed the web dependencies: fastapi, uvicorn, jinja2, aiofiles")
        sys.exit(1)

def run_desktop_mode(engine: TextEngine, settings: Settings) -> None:
    """Run the application as a desktop application."""
    try:
        from app.ui.desktop.app import DesktopApp
        
        app = DesktopApp(engine)
        app.run()
    except ImportError as e:
        logging.error(f"Desktop UI not available: {e}")
        logging.error("Make sure you've installed the GUI dependencies: PyQt6 or tkinter")
        sys.exit(1)

def show_version() -> None:
    """Display version information."""
    # Import version from a dedicated version module
    try:
        from app.core.config.version import VERSION, BUILD_DATE
        print(f"TextMan version {VERSION} (built on {BUILD_DATE})")
    except ImportError:
        print("TextMan version information not available")
    
    # Display Python version
    print(f"Python {sys.version}")
    
    # Display platform information
    import platform
    print(f"Running on {platform.platform()}")

def list_available_plugins(engine: TextEngine) -> None:
    """List all available plugins with their descriptions."""
    plugins = engine.list_plugins(details=True)
    
    if not plugins:
        print("No plugins available.")
        return
    
    print("Available Plugins:")
    print("=================")
    
    for category, plugin_list in plugins.items():
        print(f"\n{category}:")
        for plugin in plugin_list:
            status = "Enabled" if plugin.get("enabled", False) else "Disabled"
            print(f"  • {plugin['name']} (v{plugin['version']}) - {status}")
            print(f"    {plugin['description']}")

def list_available_languages() -> None:
    """List all available interface languages."""
    from app.core.i18n import get_i18n
    
    languages = get_i18n().get_available_languages()
    
    if not languages:
        print("No language files found.")
        return
    
    print("Available Languages:")
    print("===================")
    
    for code, name in languages.items():
        print(f"  • {code}: {name}")
    
    print(f"\nCurrent language: {get_i18n().language}")
    print("\nUse --language CODE to set the interface language.")

def main() -> int:
    """Main entry point for the application."""
    # Parse command line arguments
    args = parse_arguments()
    
    # Setup logging
    setup_logging(log_level=args.log_level)
    
    # Set language if specified
    if args.language:
        from app.core.i18n import get_i18n
        if not get_i18n().set_language(args.language):
            logging.error(f"Language '{args.language}' not available")
            list_available_languages()
            return 1
    
    # Handle special actions
    if args.version:
        show_version()
        return 0
    
    if args.list_languages:
        list_available_languages()
        return 0
    
    # Load settings
    settings = load_settings(args)
    
    # Initialize the engine
    engine = setup_engine(settings)
    
    if args.list_plugins:
        list_available_plugins(engine)
        return 0
    
    # Determine which UI mode to run
    if args.web:
        run_web_mode(engine, settings)
    elif args.desktop:
        run_desktop_mode(engine, settings)
    else:
        # Default to terminal mode
        run_terminal_mode(engine, settings)
    
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        logging.info("Operation interrupted by user")
        sys.exit(130)  # Standard UNIX exit code for SIGINT
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}", exc_info=True)
        sys.exit(1)
