"""
textMan Terminal UI
------------------
Interactive command-line interface for the textMan application.

This module provides a rich terminal interface with:
- Command history and autocompletion
- Syntax highlighting
- Visual text display
- Interactive command execution
- Plugin management
- Internationalization support
"""

import os
import re
import shlex
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union, Callable

# Rich imports for terminal UI
from rich.console import Console
from rich.highlighter import RegexHighlighter
from rich.prompt import Prompt, Confirm
from rich.panel import Panel
from rich.syntax import Syntax
from rich.table import Table
from rich.text import Text
from rich.theme import Theme
from rich.markdown import Markdown

# TextMan imports
from app.core.engine import TextEngine
from app.core.models.plugin import Plugin, PluginCategory
from app.core.exceptions.plugin_exceptions import PluginError, PluginNotFoundError
from app.core.i18n import get_i18n, _


class CommandHighlighter(RegexHighlighter):
    """Syntax highlighter for TextMan commands."""
    
    base_style = "textman.command."
    highlights = [
        r"(?P<command>^[a-z_]+)\b",  # Command
        r"(?P<option>--[a-z\-]+)\b",  # Options
        r"(?P<param>-[a-z])\b",       # Short params
        r"(?P<string>[\"'].*?[\"'])", # Strings
        r"(?P<number>\b\d+\b)",       # Numbers
    ]


class TerminalUI:
    """Interactive terminal UI for TextMan."""
    
    def __init__(self, engine: TextEngine):
        """Initialize the terminal UI.
        
        Args:
            engine: The TextEngine instance to use.
        """
        self.engine = engine
        self.history = []
        self.history_index = 0
        self.max_history = 100
        
        # Set up i18n
        self.i18n = get_i18n()
        
        # Set up rich console
        self.theme = Theme({
            "textman.command.command": "bold cyan",
            "textman.command.option": "yellow",
            "textman.command.param": "yellow",
            "textman.command.string": "green",
            "textman.command.number": "blue",
            "textman.highlight": "bold yellow",
            "textman.error": "bold red",
            "textman.warning": "bold yellow",
            "textman.success": "bold green",
            "textman.info": "bold blue",
        })
        
        self.console = Console(theme=self.theme)
        self.highlighter = CommandHighlighter()
        
        # Command mapping
        self.commands = {
            "help": self.cmd_help,
            "exit": self.cmd_exit,
            "quit": self.cmd_exit,
            "load": self.cmd_load,
            "save": self.cmd_save,
            "show": self.cmd_show,
            "stats": self.cmd_stats,
            "undo": self.cmd_undo,
            "redo": self.cmd_redo,
            "uppercase": self.cmd_uppercase,
            "lowercase": self.cmd_lowercase,
            "capitalize": self.cmd_capitalize,
            "sort": self.cmd_sort,
            "unique": self.cmd_unique,
            "trim": self.cmd_trim,
            "replace": self.cmd_replace,
            "plugin": self.cmd_plugin,
            "plugins": self.cmd_list_plugins,
            "clear": self.cmd_clear,
            "language": self.cmd_language,  # New language command
        }
    
    def run(self) -> None:
        """Run the terminal UI main loop."""
        self.show_welcome()
        
        while True:
            try:
                command = self.prompt_command()
                if not command:
                    continue
                
                self.execute_command(command)
                
            except KeyboardInterrupt:
                self.console.print(f"\n[textman.warning]{_('operation_interrupted')}[/]")
                continue
                
            except Exception as e:
                self.console.print(f"[textman.error]{_('error', error=str(e))}[/]")
    
    def show_welcome(self) -> None:
        """Show the welcome message."""
        self.console.print(Panel.fit(
            f"[bold yellow]TextMan[/bold yellow] - {_('welcome_message')}\n"
            f"{_('help_message')}",
            title="Welcome",
            border_style="blue",
        ))
    
    def prompt_command(self) -> str:
        """Prompt for a command with auto-completion.
        
        Returns:
            The entered command.
        """
        try:
            command = Prompt.ask("[bold cyan]textMan>[/bold cyan] ")
            
            # Add to history
            if command and (not self.history or command != self.history[-1]):
                self.history.append(command)
                if len(self.history) > self.max_history:
                    self.history.pop(0)
            
            return command
            
        except (KeyboardInterrupt, EOFError):
            raise KeyboardInterrupt
    
    def execute_command(self, command_str: str) -> None:
        """Execute a command.
        
        Args:
            command_str: The command string to execute.
        """
        # Split the command into parts while respecting quotes
        try:
            parts = shlex.split(command_str)
        except ValueError as e:
            self.console.print(f"[textman.error]{_('error_invalid_command', command=str(e))}[/]")
            return
        
        if not parts:
            return
        
        cmd = parts[0].lower()
        args = parts[1:]
        
        if cmd in self.commands:
            try:
                self.commands[cmd](*args)
            except TypeError as e:
                self.console.print(f"[textman.error]{_('error_invalid_args', error=str(e))}[/]")
                self.console.print(f"[textman.info]{_('command_'+cmd, default='')}[/]")
            except Exception as e:
                self.console.print(f"[textman.error]{_('error_command_execution', error=str(e))}[/]")
        else:
            self.console.print(f"[textman.error]{_('error_invalid_command', command=cmd)}[/]")
            self.console.print(f"{_('help_message')}")
    
    # Command implementations
    # -----------------------
    
    def cmd_help(self, command: Optional[str] = None) -> None:
        """Show help for commands.
        
        Args:
            command: Optional specific command to show help for.
        """
        if command:
            if command in self.commands:
                self.console.print(f"[bold cyan]{command}[/bold cyan]: {_('command_'+command, default='No help available')}")
            else:
                self.console.print(f"[textman.error]{_('error_invalid_command', command=command)}[/]")
            return
        
        table = Table(title=_("available_commands"))
        table.add_column(_("command"), style="cyan")
        table.add_column(_("description"))
        
        for cmd in sorted(self.commands.keys()):
            help_text = _('command_'+cmd, default=cmd)
            table.add_row(cmd, help_text)
        
        self.console.print(table)
    
    def cmd_exit(self) -> None:
        """Exit the application."""
        if self.engine.modified:
            if Confirm.ask(_("confirm_save_on_exit")):
                self.cmd_save()
        
        self.console.print(f"[textman.info]{_('exit_message')}[/]")
        sys.exit(0)
    
    def cmd_load(self, filepath: str, encoding: str = "utf-8") -> None:
        """Load text from a file.
        
        Args:
            filepath: Path to the file to load.
            encoding: Character encoding to use.
        """
        try:
            filepath = Path(filepath).expanduser().resolve()
            text = self.engine.load_file(filepath, encoding)
            
            self.console.print(f"[textman.success]{_('file_loaded', filepath=filepath)}[/]")
            self.console.print(f"[textman.info]{len(text)} {_('characters_loaded')}[/]")
            
        except FileNotFoundError:
            self.console.print(f"[textman.error]{_('error_file_not_found', filepath=filepath)}[/]")
        except Exception as e:
            self.console.print(f"[textman.error]{_('error_loading_file', error=str(e))}[/]")
    
    def cmd_save(self, filepath: Optional[str] = None, encoding: str = "utf-8") -> None:
        """Save text to a file.
        
        Args:
            filepath: Path to save to. If None, uses the current filepath.
            encoding: Character encoding to use.
        """
        try:
            if filepath is None and self.engine.filepath is None:
                filepath = Prompt.ask(_("prompt_enter_filepath"))
            
            saved_path = self.engine.save_file(filepath, encoding)
            self.console.print(f"[textman.success]{_('file_saved', filepath=saved_path)}[/]")
            
        except ValueError as e:
            self.console.print(f"[textman.error]{_('error', error=str(e))}[/]")
        except Exception as e:
            self.console.print(f"[textman.error]{_('error_saving_file', error=str(e))}[/]")
    
    def cmd_show(self, *args) -> None:
        """Display the current text.
        
        Args:
            *args: Optional arguments for display options.
        """
        # Parse arguments
        show_lines = "--lines" in args
        syntax_lang = None
        
        for i, arg in enumerate(args):
            if arg == "--syntax" and i + 1 < len(args):
                syntax_lang = args[i + 1]
        
        text = self.engine.text
        
        if not text:
            self.console.print(f"[textman.info]{_('no_text')}[/]")
            return
        
        # Show text with syntax highlighting if specified
        if syntax_lang:
            syntax = Syntax(text, syntax_lang, line_numbers=show_lines)
            self.console.print(syntax)
        else:
            # Show plain text with optional line numbers
            if show_lines:
                lines = text.splitlines()
                for i, line in enumerate(lines, 1):
                    self.console.print(f"[dim]{i:4}[/dim] {line}")
            else:
                self.console.print(text)
    
    def cmd_stats(self) -> None:
        """Show text statistics."""
        stats = self.engine.get_statistics()
        
        table = Table(title=_("text_statistics"))
        table.add_column(_("metric"), style="cyan")
        table.add_column(_("value"))
        
        table.add_row(_("stats_characters"), str(stats["characters"]))
        table.add_row(_("stats_characters_no_spaces"), str(stats["characters_no_spaces"]))
        table.add_row(_("stats_words"), str(stats["words"]))
        table.add_row(_("stats_sentences"), str(stats["sentences"]))
        table.add_row(_("stats_lines"), str(stats["lines"]))
        table.add_row(_("stats_paragraphs"), str(stats["paragraphs"]))
        table.add_row(_("stats_avg_word_length"), f"{stats['avg_word_length']:.2f}")
        table.add_row(_("stats_reading_time"), f"{stats['reading_time_minutes']:.2f} {_('minutes')}")
        
        self.console.print(table)
    
    def cmd_undo(self) -> None:
        """Undo the last operation."""
        text = self.engine.undo()
        
        if text is not None:
            self.console.print(f"[textman.success]{_('undo_success')}[/]")
        else:
            self.console.print(f"[textman.warning]{_('nothing_to_undo')}[/]")
    
    def cmd_redo(self) -> None:
        """Redo the last undone operation."""
        text = self.engine.redo()
        
        if text is not None:
            self.console.print(f"[textman.success]{_('redo_success')}[/]")
        else:
            self.console.print(f"[textman.warning]{_('nothing_to_redo')}[/]")
    
    def cmd_uppercase(self) -> None:
        """Convert text to uppercase."""
        self.engine.to_uppercase()
        self.console.print(f"[textman.success]{_('text_converted_uppercase')}[/]")
    
    def cmd_lowercase(self) -> None:
        """Convert text to lowercase."""
        self.engine.to_lowercase()
        self.console.print(f"[textman.success]{_('text_converted_lowercase')}[/]")
    
    def cmd_capitalize(self) -> None:
        """Capitalize each word in the text."""
        self.engine.capitalize_words()
        self.console.print(f"[textman.success]{_('words_capitalized')}[/]")
    
    def cmd_sort(self, *args) -> None:
        """Sort lines alphabetically.
        
        Args:
            *args: Optional arguments for sorting options.
        """
        reverse = "--reverse" in args
        
        self.engine.sort_lines(reverse=reverse)
        
        if reverse:
            self.console.print(f"[textman.success]{_('lines_sorted_reverse')}[/]")
        else:
            self.console.print(f"[textman.success]{_('lines_sorted')}[/]")
    
    def cmd_unique(self) -> None:
        """Remove duplicate lines."""
        self.engine.remove_duplicates()
        self.console.print(f"[textman.success]{_('duplicate_lines_removed')}[/]")
    
    def cmd_trim(self) -> None:
        """Trim whitespace from the beginning and end of each line."""
        self.engine.trim_whitespace()
        self.console.print(f"[textman.success]{_('whitespace_trimmed')}[/]")
    
    def cmd_replace(self, find: str, replace: str, *args) -> None:
        """Find and replace text.
        
        Args:
            find: The text to find.
            replace: The text to replace it with.
            *args: Optional arguments for replacement options.
        """
        case_sensitive = "--ignore-case" not in args
        
        self.engine.find_replace(find, replace, case_sensitive=case_sensitive)
        self.console.print(f"[textman.success]{_('text_replaced', find=find, replace=replace)}[/]")
    
    def cmd_plugin(self, name: str, *args) -> None:
        """Execute a plugin.
        
        Args:
            name: The name of the plugin to execute.
            *args: Arguments to pass to the plugin.
        """
        kwargs = {}
        
        # Parse plugin arguments (key=value pairs)
        for arg in args:
            if "=" in arg:
                key, value = arg.split("=", 1)
                kwargs[key] = value
        
        try:
            result = self.engine.apply_plugin(name, **kwargs)
            self.console.print(f"[textman.success]{_('plugin_executed', name=name)}[/]")
            
        except PluginNotFoundError:
            self.console.print(f"[textman.error]{_('plugin_not_found', name=name)}[/]")
            
        except PluginError as e:
            self.console.print(f"[textman.error]{_('plugin_error', error=str(e))}[/]")
    
    def cmd_list_plugins(self, *args) -> None:
        """List available plugins.
        
        Args:
            *args: Optional arguments for display options.
        """
        show_details = "--details" in args
        
        plugins = self.engine.list_plugins(details=show_details)
        
        if not plugins:
            self.console.print(f"[textman.info]{_('no_plugins_available')}[/]")
            return
        
        if show_details:
            # Show detailed plugin information by category
            for category, plugin_list in plugins.items():
                self.console.print(f"\n[bold]{category} {_('plugins')}[/bold]")
                
                table = Table(show_header=True)
                table.add_column(_("name"), style="cyan")
                table.add_column(_("description"))
                table.add_column(_("version"))
                table.add_column(_("status"))
                
                for plugin in plugin_list:
                    status = "[green]" + _("enabled") + "[/]" if plugin.get("enabled", False) else "[red]" + _("disabled") + "[/]"
                    table.add_row(
                        plugin["name"],
                        plugin["description"],
                        plugin["version"],
                        status
                    )
                
                self.console.print(table)
        else:
            # Show simple list of plugin names
            self.console.print(f"[bold]{_('available_plugins')}[/bold]")
            
            table = Table(show_header=False)
            table.add_column(_("name"), style="cyan")
            
            for plugin_name in plugins:
                table.add_row(plugin_name)
            
            self.console.print(table)
    
    def cmd_clear(self) -> None:
        """Clear the screen."""
        self.console.clear()
    
    def cmd_language(self, language_code: Optional[str] = None) -> None:
        """Change the interface language or show available languages.
        
        Args:
            language_code: Optional language code to set
        """
        if language_code is None:
            # Show available languages
            languages = self.i18n.get_available_languages()
            
            self.console.print(f"[bold]{_('available_languages')}[/bold]")
            
            table = Table(show_header=False)
            table.add_column(_("code"), style="cyan")
            table.add_column(_("name"))
            
            current_language = self.i18n.language
            
            for code, name in languages.items():
                if code == current_language:
                    table.add_row(f"{code} [bold yellow]({_('current')})[/bold yellow]", name)
                else:
                    table.add_row(code, name)
            
            self.console.print(table)
            self.console.print(f"\n{_('current_language', language=languages.get(current_language, current_language))}")
        else:
            # Set language
            if self.i18n.set_language(language_code):
                self.console.print(f"[textman.success]{_('language_changed', language=language_code)}[/]")
            else:
                self.console.print(f"[textman.error]{_('language_not_available', language=language_code)}[/]")
                
                # Show available languages
                languages = self.i18n.get_available_languages()
                self.console.print(f"\n{_('available_languages')}")
                for code, name in languages.items():
                    self.console.print(f"  [cyan]{code}[/cyan]: {name}")
