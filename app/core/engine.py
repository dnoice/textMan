"""
TextMan Core Engine
------------------
The central component of the TextMan application responsible for:
1. Managing text content
2. Handling the plugin system
3. Managing application state (undo/redo)
4. Providing core text manipulation operations
5. Coordinating between UI and plugins
"""

import importlib
import inspect
import logging
import pkgutil
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple, Union, Callable

from app.core.config.settings import Settings
from app.core.models.plugin import Plugin, PluginCategory
from app.core.utils.text_utils import count_words, count_sentences
from app.core.exceptions.plugin_exceptions import PluginError, PluginNotFoundError


class TextEngine:
    """Core engine for the TextMan application.
    
    The TextEngine is responsible for managing text content, handling plugins,
    managing application state, and providing core text manipulation operations.
    """
    
    def __init__(self, settings: Optional[Settings] = None):
        """Initialize the TextEngine.
        
        Args:
            settings: Application settings. If not provided, default settings are used.
        """
        self.settings = settings or Settings()
        self.logger = logging.getLogger(__name__)
        
        # Text content
        self._text = ""
        self._filepath = None
        self._modified = False
        
        # Undo/redo stacks
        self._undo_stack = []
        self._redo_stack = []
        self._max_history = self.settings.max_history
        
        # Plugin system
        self._plugins = {}
        self._plugin_search_paths = [
            Path(__file__).parent.parent / "plugins"
        ]
        
        self.logger.info("TextEngine initialized")
    
    # Text Management Methods
    # -----------------------
    
    @property
    def text(self) -> str:
        """Get the current text content."""
        return self._text
    
    @text.setter
    def text(self, value: str) -> None:
        """Set the text content and save state for undo.
        
        Args:
            value: The new text content.
        """
        # Save current state for undo
        self._push_undo_state()
        
        # Update text
        self._text = value
        self._modified = True
        self._redo_stack.clear()  # Clear redo stack on text change
    
    @property
    def filepath(self) -> Optional[Path]:
        """Get the current file path."""
        return self._filepath
    
    @property
    def modified(self) -> bool:
        """Check if the text has been modified since last save."""
        return self._modified
    
    def load_file(self, filepath: Union[str, Path], encoding: str = 'utf-8') -> str:
        """Load text from a file.
        
        Args:
            filepath: Path to the file to load.
            encoding: Character encoding to use.
            
        Returns:
            The loaded text content.
            
        Raises:
            FileNotFoundError: If the file does not exist.
            IOError: If there's an error reading the file.
        """
        filepath = Path(filepath).expanduser().resolve()
        
        if not filepath.exists():
            raise FileNotFoundError(f"File not found: {filepath}")
        
        try:
            with open(filepath, 'r', encoding=encoding) as f:
                content = f.read()
            
            # Update text (and save to undo stack)
            self.text = content
            self._filepath = filepath
            self._modified = False
            
            self.logger.info(f"Loaded file: {filepath}")
            return content
        
        except Exception as e:
            self.logger.error(f"Error loading file: {e}")
            raise
    
    def save_file(self, filepath: Optional[Union[str, Path]] = None, 
                  encoding: str = 'utf-8') -> Path:
        """Save text to a file.
        
        Args:
            filepath: Path to save to. If None, uses the current filepath.
            encoding: Character encoding to use.
            
        Returns:
            The path where the file was saved.
            
        Raises:
            ValueError: If no filepath is provided and no current filepath exists.
            IOError: If there's an error writing to the file.
        """
        if filepath is None:
            if self._filepath is None:
                raise ValueError("No filepath provided and no current filepath exists")
            filepath = self._filepath
        else:
            filepath = Path(filepath).expanduser().resolve()
        
        try:
            with open(filepath, 'w', encoding=encoding) as f:
                f.write(self._text)
            
            self._filepath = filepath
            self._modified = False
            self.logger.info(f"Saved file: {filepath}")
            return filepath
        
        except Exception as e:
            self.logger.error(f"Error saving file: {e}")
            raise
    
    # State Management Methods
    # -----------------------
    
    def _push_undo_state(self) -> None:
        """Save the current state to the undo stack."""
        if not self._undo_stack or self._undo_stack[-1] != self._text:
            self._undo_stack.append(self._text)
            
            # Limit undo history size
            if len(self._undo_stack) > self._max_history:
                self._undo_stack.pop(0)
    
    def undo(self) -> Optional[str]:
        """Undo the last operation.
        
        Returns:
            The restored text state, or None if no undo state is available.
        """
        if len(self._undo_stack) > 0:
            # Save current state to redo stack
            self._redo_stack.append(self._text)
            
            # Restore previous state
            self._text = self._undo_stack.pop()
            self._modified = True
            
            self.logger.debug("Undo operation performed")
            return self._text
        
        self.logger.debug("Nothing to undo")
        return None
    
    def redo(self) -> Optional[str]:
        """Redo the last undone operation.
        
        Returns:
            The restored text state, or None if no redo state is available.
        """
        if self._redo_stack:
            # Save current state to undo stack
            self._undo_stack.append(self._text)
            
            # Restore redo state
            self._text = self._redo_stack.pop()
            self._modified = True
            
            self.logger.debug("Redo operation performed")
            return self._text
        
        self.logger.debug("Nothing to redo")
        return None
    
    def can_undo(self) -> bool:
        """Check if undo is available."""
        return len(self._undo_stack) > 0
    
    def can_redo(self) -> bool:
        """Check if redo is available."""
        return len(self._redo_stack) > 0
    
    # Plugin Management Methods
    # ------------------------
    
    def load_plugins(self, additional_path: Optional[Union[str, Path]] = None) -> int:
        """Load plugins from the standard plugin directories.
        
        Args:
            additional_path: Optional additional path to search for plugins.
            
        Returns:
            The number of plugins loaded.
        """
        # Add additional path if provided
        if additional_path:
            path = Path(additional_path).expanduser().resolve()
            if path.exists() and path.is_dir():
                self._plugin_search_paths.append(path)
        
        # Discover and load plugins
        loaded_count = 0
        
        for search_path in self._plugin_search_paths:
            if not search_path.exists():
                self.logger.warning(f"Plugin search path does not exist: {search_path}")
                continue
            
            # Convert Path to string for pkgutil
            search_path_str = str(search_path)
            
            # Ensure the path is in sys.path for importing
            if search_path_str not in sys.path:
                sys.path.insert(0, search_path_str)
            
            # Walk through all packages in the search path
            for _, name, is_pkg in pkgutil.iter_modules([search_path_str]):
                if not is_pkg:
                    continue  # Skip non-package modules
                
                try:
                    # Import the package
                    module = importlib.import_module(name)
                    
                    # Look for Plugin subclasses in the module
                    for item_name, item in inspect.getmembers(module):
                        if (inspect.isclass(item) and 
                            issubclass(item, Plugin) and 
                            item is not Plugin):
                            
                            # Create an instance of the plugin
                            plugin = item()
                            
                            # Register the plugin
                            self.register_plugin(plugin)
                            loaded_count += 1
                
                except Exception as e:
                    self.logger.error(f"Error loading plugin package {name}: {e}")
        
        self.logger.info(f"Loaded {loaded_count} plugins")
        return loaded_count
    
    def register_plugin(self, plugin: Plugin) -> None:
        """Register a plugin with the engine.
        
        Args:
            plugin: The plugin instance to register.
            
        Raises:
            ValueError: If a plugin with the same name is already registered.
        """
        if plugin.name in self._plugins:
            raise ValueError(f"Plugin '{plugin.name}' is already registered")
        
        self._plugins[plugin.name] = plugin
        self.logger.info(f"Registered plugin: {plugin.name} (category: {plugin.category.name})")
    
    def get_plugin(self, name: str) -> Optional[Plugin]:
        """Get a plugin by name.
        
        Args:
            name: The name of the plugin to get.
            
        Returns:
            The plugin instance, or None if not found.
        """
        return self._plugins.get(name)
    
    def list_plugins(self, details: bool = False) -> Union[List[str], Dict[str, List[Dict[str, Any]]]]:
        """List all registered plugins.
        
        Args:
            details: If True, return detailed information about each plugin.
            
        Returns:
            If details is False: List of plugin names.
            If details is True: Dict mapping categories to lists of plugin details.
        """
        if not details:
            return list(self._plugins.keys())
        
        # Group plugins by category
        categorized_plugins = {}
        
        for plugin in self._plugins.values():
            category = plugin.category.name
            
            if category not in categorized_plugins:
                categorized_plugins[category] = []
            
            categorized_plugins[category].append({
                "name": plugin.name,
                "description": plugin.description,
                "version": plugin.version,
                "enabled": plugin.enabled,
                "author": getattr(plugin, "author", "Unknown")
            })
        
        return categorized_plugins
    
    def enable_plugin(self, name: str) -> None:
        """Enable a plugin.
        
        Args:
            name: The name of the plugin to enable.
            
        Raises:
            PluginNotFoundError: If the plugin is not found.
        """
        plugin = self.get_plugin(name)
        if plugin is None:
            raise PluginNotFoundError(f"Plugin not found: {name}")
        
        plugin.enabled = True
        self.logger.info(f"Enabled plugin: {name}")
    
    def disable_plugin(self, name: str) -> None:
        """Disable a plugin.
        
        Args:
            name: The name of the plugin to disable.
            
        Raises:
            PluginNotFoundError: If the plugin is not found.
        """
        plugin = self.get_plugin(name)
        if plugin is None:
            raise PluginNotFoundError(f"Plugin not found: {name}")
        
        plugin.enabled = False
        self.logger.info(f"Disabled plugin: {name}")
    
    def apply_plugin(self, name: str, *args, **kwargs) -> str:
        """Apply a plugin to the current text.
        
        Args:
            name: The name of the plugin to apply.
            *args: Positional arguments to pass to the plugin.
            **kwargs: Keyword arguments to pass to the plugin.
            
        Returns:
            The resulting text after applying the plugin.
            
        Raises:
            PluginNotFoundError: If the plugin is not found.
            PluginError: If the plugin is disabled or encounters an error.
        """
        plugin = self.get_plugin(name)
        if plugin is None:
            raise PluginNotFoundError(f"Plugin not found: {name}")
        
        if not plugin.enabled:
            raise PluginError(f"Plugin '{name}' is disabled")
        
        try:
            result = plugin.process(self._text, *args, **kwargs)
            
            # Update text (and save to undo stack)
            self.text = result
            
            self.logger.info(f"Applied plugin: {name}")
            return result
        
        except Exception as e:
            self.logger.error(f"Error applying plugin '{name}': {e}")
            raise PluginError(f"Error applying plugin '{name}': {e}")
    
    # Text Analysis Methods
    # --------------------
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get statistics about the current text.
        
        Returns:
            A dictionary of text statistics.
        """
        if not self._text:
            return {
                "characters": 0,
                "characters_no_spaces": 0,
                "words": 0,
                "sentences": 0,
                "lines": 0,
                "paragraphs": 0,
                "avg_word_length": 0,
                "reading_time_minutes": 0
            }
        
        # Count characters
        chars = len(self._text)
        chars_no_spaces = len(self._text.replace(" ", ""))
        
        # Count words using regex
        words = count_words(self._text)
        word_count = len(words)
        
        # Count sentences
        sentence_count = count_sentences(self._text)
        
        # Count lines and paragraphs
        lines = self._text.splitlines()
        line_count = len(lines)
        paragraph_count = len([p for p in self._text.split('\n\n') if p.strip()])
        
        # Calculate average word length
        avg_word_length = sum(len(word) for word in words) / word_count if word_count > 0 else 0
        
        # Estimate reading time (assuming 200 words per minute)
        reading_time = word_count / 200
        
        return {
            "characters": chars,
            "characters_no_spaces": chars_no_spaces,
            "words": word_count,
            "sentences": sentence_count,
            "lines": line_count,
            "paragraphs": paragraph_count,
            "avg_word_length": avg_word_length,
            "reading_time_minutes": reading_time
        }
    
    # Core Text Operations
    # -------------------
    
    def to_uppercase(self) -> str:
        """Convert text to uppercase.
        
        Returns:
            The resulting uppercase text.
        """
        self.text = self._text.upper()
        return self._text
    
    def to_lowercase(self) -> str:
        """Convert text to lowercase.
        
        Returns:
            The resulting lowercase text.
        """
        self.text = self._text.lower()
        return self._text
    
    def capitalize_words(self) -> str:
        """Capitalize each word in the text.
        
        Returns:
            The resulting text with capitalized words.
        """
        self.text = ' '.join(word.capitalize() for word in self._text.split())
        return self._text
    
    def sort_lines(self, reverse: bool = False) -> str:
        """Sort lines alphabetically.
        
        Args:
            reverse: If True, sort in descending order.
            
        Returns:
            The resulting text with sorted lines.
        """
        lines = self._text.splitlines()
        sorted_lines = sorted(lines, reverse=reverse)
        self.text = '\n'.join(sorted_lines)
        return self._text
    
    def remove_duplicates(self) -> str:
        """Remove duplicate lines.
        
        Returns:
            The resulting text with duplicate lines removed.
        """
        lines = self._text.splitlines()
        unique_lines = []
        
        for line in lines:
            if line not in unique_lines:
                unique_lines.append(line)
        
        self.text = '\n'.join(unique_lines)
        return self._text
    
    def find_replace(self, find: str, replace: str, case_sensitive: bool = True) -> str:
        """Find and replace text.
        
        Args:
            find: The text to find.
            replace: The text to replace it with.
            case_sensitive: Whether to perform a case-sensitive search.
            
        Returns:
            The resulting text after replacement.
        """
        if case_sensitive:
            result = self._text.replace(find, replace)
        else:
            result = re.sub(re.escape(find), replace, self._text, flags=re.IGNORECASE)
        
        self.text = result
        return self._text
    
    def trim_whitespace(self) -> str:
        """Trim whitespace from the beginning and end of each line.
        
        Returns:
            The resulting text with trimmed lines.
        """
        lines = self._text.splitlines()
        trimmed_lines = [line.strip() for line in lines]
        self.text = '\n'.join(trimmed_lines)
        return self._text
    
    def execute_command(self, command: str) -> str:
        """Execute a textman command string.
        
        This allows for programmatic execution of commands in a format similar
        to the terminal UI, but from any interface.
        
        Args:
            command: The command string to execute.
            
        Returns:
            The result of the command execution.
            
        Raises:
            ValueError: If the command is not recognized.
        """
        # Split the command into parts
        parts = command.split(maxsplit=1)
        if not parts:
            raise ValueError("Empty command")
        
        cmd = parts[0].lower()
        args = parts[1] if len(parts) > 1 else ""
        
        # Map commands to methods
        command_map = {
            "uppercase": self.to_uppercase,
            "lowercase": self.to_lowercase,
            "capitalize": self.capitalize_words,
            "sort": self.sort_lines,
            "sort_reverse": lambda: self.sort_lines(reverse=True),
            "unique": self.remove_duplicates,
            "trim": self.trim_whitespace,
            "replace": lambda: self._execute_replace(args),
            "plugin": lambda: self._execute_plugin(args),
            "stats": lambda: self._format_stats(),
        }
        
        if cmd not in command_map:
            raise ValueError(f"Unknown command: {cmd}")
        
        # Execute the command
        return command_map[cmd]()
    
    def _execute_replace(self, args: str) -> str:
        """Helper method to execute a replace command."""
        # Parse arguments
        parts = args.split(maxsplit=1)
        if len(parts) < 2:
            raise ValueError("Replace command requires 'find' and 'replace' arguments")
        
        find, replace = parts
        return self.find_replace(find, replace)
    
    def _execute_plugin(self, args: str) -> str:
        """Helper method to execute a plugin command."""
        # Parse arguments
        parts = args.split(maxsplit=1)
        if not parts:
            raise ValueError("Plugin command requires a plugin name")
        
        plugin_name = parts[0]
        plugin_args = parts[1] if len(parts) > 1 else ""
        
        # Parse plugin arguments (basic key=value format)
        kwargs = {}
        if plugin_args:
            for arg in plugin_args.split():
                if '=' in arg:
                    key, value = arg.split('=', 1)
                    kwargs[key] = value
        
        return self.apply_plugin(plugin_name, **kwargs)
    
    def _format_stats(self) -> str:
        """Format text statistics as a string."""
        stats = self.get_statistics()
        
        lines = [
            "Text Statistics:",
            f"Characters: {stats['characters']}",
            f"Characters (no spaces): {stats['characters_no_spaces']}",
            f"Words: {stats['words']}",
            f"Sentences: {stats['sentences']}",
            f"Lines: {stats['lines']}",
            f"Paragraphs: {stats['paragraphs']}",
            f"Average word length: {stats['avg_word_length']:.2f}",
            f"Reading time: {stats['reading_time_minutes']:.2f} minutes"
        ]
        
        return '\n'.join(lines)