
"""
textMan | textCase Plugin
-----------------------
Plugin for advanced case transformations beyond the core functionality.
"""

from app.core.models.plugin import Plugin, PluginCategory


class TextCasePlugin(Plugin):
    """Plugin for advanced text case transformations."""

    def __init__(self):
        """Initialize the textCase plugin."""
        super().__init__(
            name="text_case",
            description="Advanced text case transformations",
            version="1.0.0",
            category=PluginCategory.TEXT,
            author="textMan Team"
        )

    def process(self, text: str, *args, **kwargs) -> str:
        """Process the text with the specified case transformation.
        
        Args:
            text: The input text to transform.
            *args: Positional arguments (not used).
            **kwargs: Keyword arguments including:
                - mode: The transformation mode to apply.
                  Valid modes: 'snake', 'camel', 'kebab', 'title', 'sentence', 'toggle', 'invert'
                - preserve_acronyms: Whether to preserve acronyms in title case (default: False).
                
        Returns:
            The transformed text.
            
        Raises:
            ValueError: If an invalid mode is specified.
        """
        # Get transformation mode
        mode = kwargs.get('mode', 'title')
        
        if mode == 'snake':
            return self._to_snake_case(text)
        elif mode == 'camel':
            return self._to_camel_case(text)
        elif mode == 'kebab':
            return self._to_kebab_case(text)
        elif mode == 'title':
            preserve_acronyms = kwargs.get('preserve_acronyms', False)
            return self._to_title_case(text, preserve_acronyms)
        elif mode == 'sentence':
            return self._to_sentence_case(text)
        elif mode == 'toggle':
            return self._toggle_case(text)
        elif mode == 'invert':
            return self._invert_case(text)
        else:
            raise ValueError(f"Invalid case transformation mode: {mode}")
    
    def _to_snake_case(self, text: str) -> str:
        """Convert text to snake_case.
        
        Examples:
            "Hello Textman" -> "hello_textman"
            "camelCase" -> "camel_case"
            "kebab-case" -> "kebab_case"
        """
        # First normalize spaces and hyphens
        result = text.replace('-', ' ').replace('_', ' ')
        
        # Handle camelCase
        import re
        result = re.sub(r'([a-z])([A-Z])', r'\1 \2', result)
        
        # Convert to lowercase and replace spaces with underscores
        return result.lower().replace(' ', '_')
    
    def _to_camel_case(self, text: str) -> str:
        """Convert text to camelCase.
        
        Examples:
            "Hello Textman" -> "helloTextman"
            "snake_case" -> "snakeCase"
            "kebab-case" -> "kebabCase"
        """
        # First convert to snake_case
        snake = self._to_snake_case(text)
        
        # Then convert to camelCase
        components = snake.split('_')
        result = components[0].lower()
        
        for component in components[1:]:
            if component:
                result += component[0].upper() + component[1:].lower()
        
        return result
    
    def _to_kebab_case(self, text: str) -> str:
        """Convert text to kebab-case.
        
        Examples:
            "Hello Textman" -> "hello-textman"
            "camelCase" -> "camel-case"
            "snake_case" -> "snake-case"
        """
        # Convert to snake_case first, then replace underscores with hyphens
        return self._to_snake_case(text).replace('_', '-')
    
    def _to_title_case(self, text: str, preserve_acronyms: bool = False) -> str:
        """Convert text to Title Case.
        
        Args:
            text: The text to convert.
            preserve_acronyms: If True, preserves existing acronyms.
            
        Examples:
            "hello textman" -> "Hello Textman"
            "HELLO TEXTMAN" -> "Hello Textman" (or "HELLO Textman" with preserve_acronyms=True)
        """
        # Split by whitespace
        words = text.split()
        result = []
        
        for word in words:
            if not word:
                result.append(word)
                continue
                
            if preserve_acronyms and word.isupper() and len(word) > 1:
                # Preserve acronyms
                result.append(word)
            else:
                # Title case the word
                result.append(word[0].upper() + word[1:].lower())
        
        return ' '.join(result)
    
    def _to_sentence_case(self, text: str) -> str:
        """Convert text to Sentence case.
        
        Examples:
            "hello textman. another steller tool!" -> "Hello textman. Another steller tool!"
        """
        import re
        
        # Split text into sentences
        sentences = re.split(r'([.!?]\s+)', text)
        result = ""
        
        for i in range(0, len(sentences), 2):
            sentence = sentences[i]
            
            if not sentence:
                result += sentence
                continue
                
            # Capitalize first letter of sentence
            if len(sentence) > 0:
                sentence = sentence[0].upper() + sentence[1:].lower()
            
            result += sentence
            
            # Add punctuation and space if available
            if i + 1 < len(sentences):
                result += sentences[i + 1]
        
        return result
    
    def _toggle_case(self, text: str) -> str:
        """Toggle the case of each character.
        
        Examples:
            "Hello textMan" -> "hELLO TEXTmAN"
        """
        return ''.join(
            c.lower() if c.isupper() else c.upper()
            for c in text
        )
    
    def _invert_case(self, text: str) -> str:
        """Invert the text (reverse order).
        
        Examples:
            "Hello textMan" -> "naMtxet olleH"
        """
        return text[::-1]
