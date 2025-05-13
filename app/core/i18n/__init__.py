"""
textMan | i18n Package
------------------
Internationalization and localization support for textMan.
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, Optional

# Default language
DEFAULT_LANGUAGE = "en"

class I18n:
    """Internationalization support for textMan."""
    
    def __init__(self, language: str = DEFAULT_LANGUAGE):
        """Initialize the internationalization support.
        
        Args:
            language: Language code to use (e.g., 'en', 'es', 'fr')
        """
        self.language = language
        self.translations: Dict[str, Dict[str, str]] = {}
        self._load_translations()
    
    def _load_translations(self) -> None:
        """Load all available translation files."""
        # Get base directory for translations
        base_dir = Path(__file__).parent / "translations"
        
        # Ensure the directory exists
        if not base_dir.exists():
            os.makedirs(base_dir, exist_ok=True)
        
        # Load all translation files
        for file_path in base_dir.glob("*.json"):
            lang_code = file_path.stem
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    self.translations[lang_code] = json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                print(f"Error loading translation file {file_path}: {e}")
        
        # If the current language doesn't have a translation file, use default
        if self.language not in self.translations:
            self.language = DEFAULT_LANGUAGE
    
    def get_available_languages(self) -> Dict[str, str]:
        """Get a dictionary of available languages.
        
        Returns:
            Dictionary mapping language codes to language names.
        """
        languages = {}
        for lang_code in self.translations.keys():
            # Get the language name from the translation file if available
            lang_name = self.translations[lang_code].get("language_name", lang_code)
            languages[lang_code] = lang_name
        return languages
    
    def set_language(self, language: str) -> bool:
        """Set the current language.
        
        Args:
            language: Language code to use
            
        Returns:
            True if language was set successfully, False otherwise
        """
        if language in self.translations:
            self.language = language
            return True
        return False
    
    def translate(self, key: str, **kwargs) -> str:
        """Translate a key to the current language.
        
        Args:
            key: Translation key
            **kwargs: Format arguments for the translation string
            
        Returns:
            Translated string, or the key itself if not found
        """
        # Try to get translation for current language
        translation = self.translations.get(self.language, {}).get(key)
        
        # Fall back to default language if not found
        if translation is None and self.language != DEFAULT_LANGUAGE:
            translation = self.translations.get(DEFAULT_LANGUAGE, {}).get(key)
        
        # Use the key itself as a last resort
        if translation is None:
            return key
        
        # Apply format arguments if provided
        if kwargs:
            try:
                return translation.format(**kwargs)
            except KeyError:
                # Return unformatted translation if format fails
                return translation
        
        return translation
    
    def __call__(self, key: str, **kwargs) -> str:
        """Shorthand for translate method.
        
        Args:
            key: Translation key
            **kwargs: Format arguments for the translation string
            
        Returns:
            Translated string
        """
        return self.translate(key, **kwargs)


# Create a singleton instance
_i18n_instance = None

def get_i18n(language: Optional[str] = None) -> I18n:
    """Get the I18n instance.
    
    Args:
        language: Optional language to set
        
    Returns:
        I18n instance
    """
    global _i18n_instance
    if _i18n_instance is None:
        _i18n_instance = I18n(language or DEFAULT_LANGUAGE)
    elif language is not None:
        _i18n_instance.set_language(language)
    return _i18n_instance

# Convenience method for translation
def _(key: str, **kwargs) -> str:
    """Translate a key to the current language.
    
    Args:
        key: Translation key
        **kwargs: Format arguments for the translation string
        
    Returns:
        Translated string
    """
    return get_i18n().translate(key, **kwargs)
