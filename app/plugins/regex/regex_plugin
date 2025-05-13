
"""
textMan | regexTools Plugin
-------------------------
Plugin for regular expression operations.
"""

import re
from typing import Dict, List, Optional, Tuple, Any

from app.core.models.plugin import Plugin, PluginCategory


class RegexPlugin(Plugin):
    """Plugin for regular expression operations."""

    def __init__(self):
        """Initialize the regexTools plugin."""
        super().__init__(
            name="regex",
            description="Regular expression operations",
            version="1.0.0",
            category=PluginCategory.REGEX,
            author="textMan Team"
        )

    def process(self, text: str, *args, **kwargs) -> str:
        """Process the text using regular expressions.
        
        Args:
            text: The input text to process.
            *args: Positional arguments (not used).
            **kwargs: Keyword arguments including:
                - operation: The regex operation to perform.
                  Valid operations: 'replace', 'extract', 'match', 'split', 'highlight'
                - pattern: The regex pattern to use.
                - replacement: The replacement string (for 'replace' operation).
                - flags: Regex flags (e.g., 'i' for case-insensitive).
                - group: Capture group to extract (for 'extract' operation).
                - max_count: Maximum number of replacements or extractions.
                - join_char: Character to join results (for 'extract' and 'split').
                - highlight_format: Format for highlighting matches.
                
        Returns:
            The processed text.
            
        Raises:
            ValueError: If an invalid operation is specified or required parameters are missing.
        """
        # Get operation and required parameters
        operation = kwargs.get('operation', 'replace')
        pattern = kwargs.get('pattern')
        
        if not pattern:
            raise ValueError("A regex pattern must be provided")
        
        # Get flags
        flags = 0
        if 'i' in kwargs.get('flags', ''):
            flags |= re.IGNORECASE
        if 'm' in kwargs.get('flags', ''):
            flags |= re.MULTILINE
        if 's' in kwargs.get('flags', ''):
            flags |= re.DOTALL
        
        try:
            if operation == 'replace':
                return self._replace(text, pattern, flags, **kwargs)
            elif operation == 'extract':
                return self._extract(text, pattern, flags, **kwargs)
            elif operation == 'match':
                return self._match(text, pattern, flags, **kwargs)
            elif operation == 'split':
                return self._split(text, pattern, flags, **kwargs)
            elif operation == 'highlight':
                return self._highlight(text, pattern, flags, **kwargs)
            else:
                raise ValueError(f"Invalid regex operation: {operation}")
        except re.error as e:
            raise ValueError(f"Invalid regular expression pattern: {e}")
    
    def _replace(self, text: str, pattern: str, flags: int, **kwargs) -> str:
        """Replace text using regex pattern.
        
        Args:
            text: The input text.
            pattern: The regex pattern.
            flags: Regex flags.
            **kwargs: Additional arguments:
                - replacement: The replacement string.
                - max_count: Maximum number of replacements.
                
        Returns:
            Text with replacements.
            
        Examples:
            Replacing emails: "Contact us at info@example.com" -> "Contact us at [EMAIL]"
            Masking numbers: "My phone is 555-123-4567" -> "My phone is XXX-XXX-XXXX"
        """
        replacement = kwargs.get('replacement', '')
        max_count = kwargs.get('max_count', 0)  # 0 means replace all
        
        return re.sub(pattern, replacement, text, count=max_count, flags=flags)
    
    def _extract(self, text: str, pattern: str, flags: int, **kwargs) -> str:
        """Extract text using regex pattern.
        
        Args:
            text: The input text.
            pattern: The regex pattern.
            flags: Regex flags.
            **kwargs: Additional arguments:
                - group: Capture group to extract (default: 0, the entire match).
                - max_count: Maximum number of extractions.
                - join_char: Character to join results (default: newline).
                
        Returns:
            Extracted text.
            
        Examples:
            Extracting emails from textMan documentation: "Contact us at info@textMan.com and support@textMan.com"
            -> "info@textMan.com
                support@textMan.com"
        """
        group = kwargs.get('group', 0)
        max_count = kwargs.get('max_count', 0)  # 0 means extract all
        join_char = kwargs.get('join_char', '\n')
        
        matches = re.finditer(pattern, text, flags=flags)
        results = []
        
        for i, match in enumerate(matches):
            if max_count > 0 and i >= max_count:
                break
            
            try:
                results.append(match.group(group))
            except IndexError:
                # If the specified group doesn't exist, use the entire match
                results.append(match.group(0))
        
        return join_char.join(results)
    
    def _match(self, text: str, pattern: str, flags: int, **kwargs) -> str:
        """Check if text matches the pattern and return match information.
        
        Args:
            text: The input text.
            pattern: The regex pattern.
            flags: Regex flags.
            **kwargs: Additional arguments (not used).
                
        Returns:
            Match information.
            
        Examples:
            Finding textMan commands: 
            "textMan --execute uppercase --file example.txt" would find:
            1. Match at positions 0-7: 'textMan'
            2. Match at positions 9-18: '--execute'
            3. Match at positions 19-27: 'uppercase'
        """
        matches = list(re.finditer(pattern, text, flags=flags))
        
        if not matches:
            return "No matches found."
        
        result = f"Found {len(matches)} match(es):\n"
        
        for i, match in enumerate(matches[:10]):  # Limit to 10 matches for readability
            start, end = match.span()
            result += f"{i+1}. Match at positions {start}-{end}: '{match.group(0)}'\n"
            
            # Add group info if there are capture groups
            if len(match.groups()) > 0:
                for j, group in enumerate(match.groups(), 1):
                    result += f"   Group {j}: '{group}'\n"
        
        if len(matches) > 10:
            result += f"... and {len(matches) - 10} more.\n"
        
        return result.strip()
    
    def _split(self, text: str, pattern: str, flags: int, **kwargs) -> str:
        """Split text using regex pattern.
        
        Args:
            text: The input text.
            pattern: The regex pattern.
            flags: Regex flags.
            **kwargs: Additional arguments:
                - max_count: Maximum number of splits.
                - join_char: Character to join results for display.
                
        Returns:
            Split text.
            
        Examples:
            Splitting a textMan log file by timestamps:
            "2025-05-13 12:34:56 INFO Started textMan
             2025-05-13 12:35:01 DEBUG Loaded plugin: text_case"
             -> Split by timestamp pattern
        """
        max_count = kwargs.get('max_count', 0)  # 0 means split all
        join_char = kwargs.get('join_char', '\n')
        
        results = re.split(pattern, text, maxsplit=max_count, flags=flags)
        return join_char.join(results)
    
    def _highlight(self, text: str, pattern: str, flags: int, **kwargs) -> str:
        """Highlight matches in the text.
        
        Args:
            text: The input text.
            pattern: The regex pattern.
            flags: Regex flags.
            **kwargs: Additional arguments:
                - highlight_format: Format for highlighting (default: '**{}**' - markdown bold).
                
        Returns:
            Text with highlighted matches.
            
        Examples:
            Highlighting textMan commands: 
            "Using textMan to process your documents" -> "Using **textMan** to process your documents"
        """
        highlight_format = kwargs.get('highlight_format', '**{}**')
        
        def replacer(match):
            return highlight_format.format(match.group(0))
        
        return re.sub(pattern, replacer, text, flags=flags)
