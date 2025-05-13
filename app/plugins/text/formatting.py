"""
textMan | formatText Plugin
-------------------------
Plugin for text formatting operations like indentation, wrapping, and alignment.
"""

import re
import textwrap
from typing import Dict, List, Optional, Tuple, Any

from app.core.models.plugin import Plugin, PluginCategory


class FormattingPlugin(Plugin):
    """Plugin for text formatting operations."""

    def __init__(self):
        """Initialize the formatText plugin."""
        super().__init__(
            name="format",
            description="Text formatting operations",
            version="1.0.0",
            category=PluginCategory.TEXT,
            author="textMan Team"
        )

    def process(self, text: str, *args, **kwargs) -> str:
        """Process the text with formatting operations.
        
        Args:
            text: The input text to format.
            *args: Positional arguments (not used).
            **kwargs: Keyword arguments including:
                - operation: The formatting operation to perform.
                  Valid operations: 'indent', 'dedent', 'wrap', 'align', 'number', 'prefix', 'suffix'
                - indent_str: String to use for indentation (default: spaces).
                - indent_size: Number of spaces for indentation.
                - wrap_width: Width to wrap text at.
                - align: Alignment type ('left', 'center', 'right', 'justify').
                - width: Width for alignment.
                - prefix: Prefix to add to each line.
                - suffix: Suffix to add to each line.
                - start_number: Starting number for line numbering.
                - number_format: Format for line numbers.
                
        Returns:
            The formatted text.
            
        Raises:
            ValueError: If an invalid operation is specified.
        """
        # Get operation
        operation = kwargs.get('operation', 'indent')
        
        if operation == 'indent':
            return self._indent(text, **kwargs)
        elif operation == 'dedent':
            return self._dedent(text, **kwargs)
        elif operation == 'wrap':
            return self._wrap(text, **kwargs)
        elif operation == 'align':
            return self._align(text, **kwargs)
        elif operation == 'number':
            return self._number_lines(text, **kwargs)
        elif operation == 'prefix':
            return self._add_prefix(text, **kwargs)
        elif operation == 'suffix':
            return self._add_suffix(text, **kwargs)
        else:
            raise ValueError(f"Invalid formatting operation: {operation}")
    
    def _indent(self, text: str, **kwargs) -> str:
        """Indent each line of text.
        
        Args:
            text: The input text.
            **kwargs: Additional arguments:
                - indent_str: String to use for indentation (default: spaces).
                - indent_size: Number of spaces for indentation (default: 4).
                - skip_blank: Whether to skip blank lines (default: True).
                
        Returns:
            Indented text.
            
        Examples:
            Adding code indentation to textMan documentation:
            "def process():" -> "    def process():"
        """
        indent_str = kwargs.get('indent_str', ' ')
        indent_size = kwargs.get('indent_size', 4)
        skip_blank = kwargs.get('skip_blank', True)
        
        indent = indent_str * indent_size
        lines = text.splitlines()
        
        result = []
        for line in lines:
            if skip_blank and not line.strip():
                result.append(line)
            else:
                result.append(f"{indent}{line}")
        
        return '\n'.join(result)
    
    def _dedent(self, text: str, **kwargs) -> str:
        """Remove indentation from each line of text.
        
        Args:
            text: The input text.
            **kwargs: Additional arguments:
                - all_lines: Whether to dedent all lines (default: True).
                
        Returns:
            Dedented text.
            
        Examples:
            Cleaning up textMan code examples:
            "    text = text.upper()" -> "text = text.upper()"
        """
        all_lines = kwargs.get('all_lines', True)
        
        if all_lines:
            # Use textwrap.dedent for consistent dedenting
            return textwrap.dedent(text)
        else:
            # Dedent each line independently
            lines = text.splitlines()
            result = []
            
            for line in lines:
                result.append(line.lstrip())
            
            return '\n'.join(result)
    
    def _wrap(self, text: str, **kwargs) -> str:
        """Wrap text to specified width.
        
        Args:
            text: The input text.
            **kwargs: Additional arguments:
                - wrap_width: Width to wrap text at (default: 80).
                - preserve_paragraphs: Whether to preserve paragraph breaks (default: True).
                
        Returns:
            Wrapped text.
            
        Examples:
            Formatting textMan documentation for readability:
            "textMan bridges the gap between simple editors and complex IDEs, empowering everyone—from casual tweakers to power users—to wield text transformations with ease and intelligence."
            -> Wrapped at 80 characters
        """
        wrap_width = kwargs.get('wrap_width', 80)
        preserve_paragraphs = kwargs.get('preserve_paragraphs', True)
        
        if preserve_paragraphs:
            # Split into paragraphs and wrap each independently
            paragraphs = re.split(r'\n\s*\n', text)
            result = []
            
            for paragraph in paragraphs:
                wrapped = textwrap.fill(paragraph, width=wrap_width)
                result.append(wrapped)
            
            return '\n\n'.join(result)
        else:
            # Treat the entire text as a single paragraph
            return textwrap.fill(text, width=wrap_width)
    
    def _align(self, text: str, **kwargs) -> str:
        """Align text.
        
        Args:
            text: The input text.
            **kwargs: Additional arguments:
                - align: Alignment type ('left', 'center', 'right', 'justify').
                - width: Width for alignment (default: 80).
                
        Returns:
            Aligned text.
            
        Examples:
            Centering textMan header:
            "textMan - Advanced Text Manipulation Tool" -> centered at width 50
        """
        align = kwargs.get('align', 'left')
        width = kwargs.get('width', 80)
        
        lines = text.splitlines()
        result = []
        
        for line in lines:
            if not line.strip():
                result.append(line)
                continue
                
            if align == 'left':
                result.append(line.ljust(width))
            elif align == 'right':
                result.append(line.rjust(width))
            elif align == 'center':
                result.append(line.center(width))
            elif align == 'justify':
                if len(line.strip()) < width and ' ' in line.strip():
                    words = line.split()
                    if len(words) == 1:
                        # Can't justify a single word
                        result.append(line.ljust(width))
                        continue
                        
                    spaces_needed = width - sum(len(word) for word in words)
                    spaces_between = spaces_needed // (len(words) - 1)
                    extra_spaces = spaces_needed % (len(words) - 1)
                    
                    justified = words[0]
                    for i in range(1, len(words)):
                        space_count = spaces_between + (1 if i <= extra_spaces else 0)
                        justified += ' ' * space_count + words[i]
                    
                    result.append(justified)
                else:
                    # If line is already wider than width or has no spaces, just use left alignment
                    result.append(line.ljust(width))
            else:
                raise ValueError(f"Invalid alignment type: {align}")
        
        return '\n'.join(result)
    
    def _number_lines(self, text: str, **kwargs) -> str:
        """Add line numbers to text.
        
        Args:
            text: The input text.
            **kwargs: Additional arguments:
                - start_number: Starting number (default: 1).
                - number_format: Format for line numbers (default: "{:4d} ").
                - empty_lines: Whether to number empty lines (default: True).
                
        Returns:
            Text with line numbers.
            
        Examples:
            Adding line numbers to textMan script:
            "import textMan
             text = get_text()
             result = textMan.process(text)"
             ->
             "1 import textMan
              2 text = get_text()
              3 result = textMan.process(text)"
        """
        start_number = kwargs.get('start_number', 1)
        number_format = kwargs.get('number_format', "{:4d} ")
        empty_lines = kwargs.get('empty_lines', True)
        
        lines = text.splitlines()
        result = []
        line_num = start_number
        
        for line in lines:
            if not empty_lines and not line.strip():
                result.append(' ' * len(number_format.format(0)) + line)
            else:
                result.append(number_format.format(line_num) + line)
                line_num += 1
        
        return '\n'.join(result)
    
    def _add_prefix(self, text: str, **kwargs) -> str:
        """Add prefix to each line.
        
        Args:
            text: The input text.
            **kwargs: Additional arguments:
                - prefix: Prefix to add (required).
                - skip_blank: Whether to skip blank lines (default: True).
                
        Returns:
            Text with prefix added to each line.
            
        Examples:
            Adding bullet points to textMan feature list:
            "Feature A
             Feature B"
             ->
             "• Feature A
              • Feature B"
        """
        prefix = kwargs.get('prefix', '')
        skip_blank = kwargs.get('skip_blank', True)
        
        lines = text.splitlines()
        result = []
        
        for line in lines:
            if skip_blank and not line.strip():
                result.append(line)
            else:
                result.append(f"{prefix}{line}")
        
        return '\n'.join(result)
    
    def _add_suffix(self, text: str, **kwargs) -> str:
        """Add suffix to each line.
        
        Args:
            text: The input text.
            **kwargs: Additional arguments:
                - suffix: Suffix to add (required).
                - skip_blank: Whether to skip blank lines (default: True).
                
        Returns:
            Text with suffix added to each line.
            
        Examples:
            Adding semicolons to end of textMan code lines:
            "var x = 10
             console.log(x)"
             ->
             "var x = 10;
              console.log(x);"
        """
        suffix = kwargs.get('suffix', '')
        skip_blank = kwargs.get('skip_blank', True)
        
        lines = text.splitlines()
        result = []
        
        for line in lines:
            if skip_blank and not line.strip():
                result.append(line)
            else:
                result.append(f"{line}{suffix}")
        
        return '\n'.join(result)
