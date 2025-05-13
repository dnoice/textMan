"""
textMan | i18n Package
------------------
Internationalization and localization support for textMan.

This module provides the core functionality for loading, managing, and accessing
translations throughout the application. It implements a singleton pattern to ensure
consistent language state across different components.

Key components:
- I18n class: Manages translations and language selection
- get_i18n(): Returns the singleton I18n instance
- _(): Convenience function for translating strings
"""

import json
import os
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List, Set

# Default language to use when a selected language isn't available
DEFAULT_LANGUAGE = "en"

class I18n:
    """Internationalization support for textMan.
    
    This class manages translation files, language selection, and string translation.
    It handles loading translations from JSON files, falling back to the default language
    when translations are missing, and formatting strings with placeholders.
    """
    
    def __init__(self, language: str = DEFAULT_LANGUAGE):
        """Initialize the internationalization support.
        
        Args:
            language: Language code to use (e.g., 'en', 'es', 'fr')
        """
        self.logger = logging.getLogger(__name__)
        self.language = language
        self.translations: Dict[str, Dict[str, str]] = {}
        self._load_translations()
    
    def _load_translations(self) -> None:
        """Load all available translation files.
        
        This method searches for JSON files in the translations directory and loads
        them into memory. Each file should be named with the language code (e.g., en.json)
        and contain key-value pairs where the key is the translation identifier and
        the value is the translated string.
        """
        # Get base directory for translations
        base_dir = Path(__file__).parent / "translations"
        
        # Ensure the directory exists
        if not base_dir.exists():
            os.makedirs(base_dir, exist_ok=True)
            self.logger.warning(f"Created translations directory: {base_dir}")
        
        # Load all translation files
        found_files = list(base_dir.glob("*.json"))
        if not found_files:
            self.logger.warning("No translation files found!")
        
        for file_path in found_files:
            lang_code = file_path.stem
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    self.translations[lang_code] = json.load(f)
                self.logger.debug(f"Loaded translation file: {file_path}")
            except (json.JSONDecodeError, IOError) as e:
                self.logger.error(f"Error loading translation file {file_path}: {e}")
        
        # If the current language doesn't have a translation file, use default
        if self.language not in self.translations:
            self.logger.warning(f"Translation for language '{self.language}' not found. Using default language '{DEFAULT_LANGUAGE}'.")
            self.language = DEFAULT_LANGUAGE
            
        # If the default language is not available, create an empty one
        if DEFAULT_LANGUAGE not in self.translations:
            self.logger.error(f"Default language '{DEFAULT_LANGUAGE}' translation not found!")
            self.translations[DEFAULT_LANGUAGE] = {}
    
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
            self.logger.info(f"Language set to: {language}")
            return True
        self.logger.warning(f"Language '{language}' not available")
        return False
    
    def translate(self, key: str, **kwargs) -> str:
        """Translate a key to the current language.
        
        This method looks up the key in the current language's translation dictionary.
        If the key is not found, it falls back to the default language. If it's still
        not found, it returns the key itself as a last resort.
        
        The method also supports string formatting with placeholders using the format()
        method. Any keyword arguments passed to this method will be used for formatting.
        
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
            if translation is not None:
                self.logger.debug(f"Key '{key}' not found in language '{self.language}', using '{DEFAULT_LANGUAGE}' fallback")
        
        # Use the key itself as a last resort
        if translation is None:
            self.logger.debug(f"Translation key not found: {key}")
            return key
        
        # Apply format arguments if provided
        if kwargs:
            try:
                return translation.format(**kwargs)
            except KeyError as e:
                # Return unformatted translation if format fails
                self.logger.warning(f"Format error for key '{key}': {e}")
                return translation
        
        return translation
    
    def missing_keys(self, reference_language: str = DEFAULT_LANGUAGE) -> Dict[str, List[str]]:
        """Find missing translation keys in all languages compared to a reference.
        
        This utility method helps identify which keys are missing in each language
        compared to a reference language (usually the default language). This is
        useful for ensuring translation completeness.
        
        Args:
            reference_language: The language to use as reference (default: DEFAULT_LANGUAGE)
            
        Returns:
            Dictionary mapping language codes to lists of missing keys
        """
        if reference_language not in self.translations:
            self.logger.error(f"Reference language '{reference_language}' not found!")
            return {}
            
        reference_keys = set(self.translations[reference_language].keys())
        missing = {}
        
        for lang_code, translations in self.translations.items():
            if lang_code == reference_language:
                continue
                
            lang_keys = set(translations.keys())
            missing_keys = list(reference_keys - lang_keys)
            
            if missing_keys:
                missing[lang_code] = missing_keys
                
        return missing
    
    def add_translation(self, language: str, key: str, value: str) -> bool:
        """Add or update a translation for a key in a specific language.
        
        This method allows programmatically adding or updating translations.
        It also saves the changes back to the translation file.
        
        Args:
            language: Language code
            key: Translation key
            value: Translated value
            
        Returns:
            True if successful, False otherwise
        """
        if language not in self.translations:
            self.translations[language] = {}
            
        self.translations[language][key] = value
        self.logger.debug(f"Added translation for language '{language}', key '{key}'")
        
        # Try to save the translation file
        try:
            self._save_translation_file(language)
            return True
        except Exception as e:
            self.logger.error(f"Failed to save translation for language '{language}': {e}")
            return False
    
    def _save_translation_file(self, language: str) -> None:
        """Save translations for a language to its file.
        
        Args:
            language: Language code
            
        Raises:
            IOError: If file cannot be written
            ValueError: If language not found in translations
        """
        if language not in self.translations:
            raise ValueError(f"Language '{language}' not found in translations")
            
        base_dir = Path(__file__).parent / "translations"
        file_path = base_dir / f"{language}.json"
        
        # Ensure directory exists
        base_dir.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(self.translations[language], f, indent=4, ensure_ascii=False)
        
        self.logger.debug(f"Saved translation file: {file_path}")
    
    def export_translation_template(self, output_path: Optional[str] = None) -> str:
        """Export a template file that can be used to create a new translation.
        
        This method creates a JSON file with all the keys from the default language,
        but with empty values. This can be used as a starting point for creating a
        new translation.
        
        Args:
            output_path: Path where the template should be saved. If None, a default
                        path will be used.
                        
        Returns:
            Path to the saved template file
        """
        if DEFAULT_LANGUAGE not in self.translations:
            raise ValueError(f"Default language '{DEFAULT_LANGUAGE}' not found")
            
        # Create a template with all keys but empty values
        template = {
            "language_name": "",
            "language_code": "",
        }
        
        for key in self.translations[DEFAULT_LANGUAGE]:
            if key not in ["language_name", "language_code"]:
                template[key] = ""
                
        # Determine output path
        if output_path is None:
            base_dir = Path(__file__).parent / "translations"
            output_path = str(base_dir / "template.json")
        
        # Save the template
        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(template, f, indent=4, ensure_ascii=False)
            
        self.logger.info(f"Exported translation template to: {output_file}")
        return str(output_file)
    
    def check_format_strings(self) -> Dict[str, Dict[str, List[str]]]:
        """Check for inconsistencies in format string placeholders across languages.
        
        This utility method helps identify format string placeholders that are present
        in one language but missing in another. This is important for preventing format
        string errors when switching languages.
        
        Returns:
            Dictionary mapping languages to dictionaries mapping keys to lists of missing placeholders
        """
        import re
        
        # Regular expression to find format string placeholders like {name}
        placeholder_pattern = re.compile(r'\{([^}]+)\}')
        
        # Collect placeholders for each key in each language
        placeholders = {}
        for lang, translations in self.translations.items():
            placeholders[lang] = {}
            for key, value in translations.items():
                if isinstance(value, str):
                    matches = placeholder_pattern.findall(value)
                    if matches:
                        placeholders[lang][key] = set(matches)
        
        # Find inconsistencies
        inconsistencies = {}
        for lang, keys in placeholders.items():
            inconsistencies[lang] = {}
            for key, lang_placeholders in keys.items():
                for other_lang, other_keys in placeholders.items():
                    if other_lang != lang and key in other_keys:
                        other_placeholders = other_keys[key]
                        missing = list(other_placeholders - lang_placeholders)
                        if missing:
                            if key not in inconsistencies[lang]:
                                inconsistencies[lang][key] = []
                            inconsistencies[lang][key].extend([
                                f"Missing placeholder '{p}' (present in {other_lang})"
                                for p in missing
                            ])
        
        # Filter out languages with no inconsistencies
        return {k: v for k, v in inconsistencies.items() if v}
    
    def __call__(self, key: str, **kwargs) -> str:
        """Shorthand for translate method.
        
        This allows the I18n instance to be called directly as a function.
        
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
    
    This function implements the singleton pattern, ensuring that only one
    I18n instance is created and used throughout the application. This is
    important for maintaining consistent language state.
    
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
    
    This is a convenience function that gets the I18n instance and calls
    its translate method. This makes it easy to use translations throughout
    the code without having to get the I18n instance explicitly.
    
    Usage:
        message = _("welcome_message")
        error = _("file_not_found", filepath=path)
    
    Args:
        key: Translation key
        **kwargs: Format arguments for the translation string
        
    Returns:
        Translated string
    """
    return get_i18n().translate(key, **kwargs)
