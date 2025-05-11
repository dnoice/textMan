"""
TextMan Plugin Model
-------------------
Defines the base class for all TextMan plugins.
"""

import enum
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class PluginCategory(enum.Enum):
    """Categories for TextMan plugins."""
    TEXT = "text"           # Basic text operations
    REGEX = "regex"         # Regular expression tools
    DIFF = "diff"           # Comparison tools
    CODE = "code"           # Code formatting/analysis
    DATA = "data"           # Data extraction/formatting
    NLP = "nlp"             # Natural language processing
    CONVERT = "convert"     # Format conversion
    SECURITY = "security"   # Text sanitization, encryption
    UTILITY = "utility"     # Miscellaneous utilities


class Plugin(ABC):
    """Base class for all TextMan plugins."""
    
    def __init__(self, 
                 name: str, 
                 description: str, 
                 version: str = "1.0.0",
                 category: PluginCategory = PluginCategory.UTILITY,
                 author: str = "Unknown"):
        """Initialize a plugin.
        
        Args:
            name: Unique name for the plugin.
            description: Short description of the plugin.
            version: Version string following semantic versioning.
            category: Category this plugin belongs to.
            author: Plugin author(s).
        """
        self.name = name
        self.description = description
        self.version = version
        self.category = category
        self.author = author
        self.enabled = True
    
    @abstractmethod
    def process(self, text: str, *args, **kwargs) -> str:
        """Process the text and return the result.
        
        This is the main method that must be implemented by all plugins.
        
        Args:
            text: The input text to process.
            *args: Additional positional arguments.
            **kwargs: Additional keyword arguments.
            
        Returns:
            The processed text.
        """
        pass
    
    def get_info(self) -> Dict[str, Any]:
        """Get information about the plugin.
        
        Returns:
            Dictionary containing plugin metadata.
        """
        return {
            "name": self.name,
            "description": self.description,
            "version": self.version,
            "category": self.category.name,
            "author": self.author,
            "enabled": self.enabled
        }
    
    def enable(self) -> None:
        """Enable the plugin."""
        self.enabled = True
    
    def disable(self) -> None:
        """Disable the plugin."""
        self.enabled = False
    
    def validate_args(self, *args, **kwargs) -> bool:
        """Validate the arguments for the plugin.
        
        Override this method to add validation for plugin arguments.
        
        Args:
            *args: Positional arguments to validate.
            **kwargs: Keyword arguments to validate.
            
        Returns:
            True if arguments are valid, False otherwise.
        """
        return True


class PluginOption:
    """Descriptor for plugin options with validation."""
    
    def __init__(self, 
                 name: str, 
                 description: str, 
                 option_type: type,
                 default: Any = None,
                 required: bool = False,
                 choices: Optional[List[Any]] = None):
        """Initialize a plugin option.
        
        Args:
            name: Name of the option.
            description: Description of the option.
            option_type: Expected type of the option.
            default: Default value if not provided.
            required: Whether the option is required.
            choices: List of valid choices for the option.
        """
        self.name = name
        self.description = description
        self.option_type = option_type
        self.default = default
        self.required = required
        self.choices = choices
    
    def validate(self, value: Any) -> bool:
        """Validate the option value.
        
        Args:
            value: Value to validate.
            
        Returns:
            True if the value is valid, False otherwise.
        """
        # Check if required
        if self.required and value is None:
            return False
        
        # Use default if value is None
        if value is None:
            return True
        
        # Check type
        if not isinstance(value, self.option_type):
            return False
        
        # Check choices
        if self.choices is not None and value not in self.choices:
            return False
        
        return True