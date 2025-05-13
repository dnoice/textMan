"""
textMan | Plugins Package
----------------------
Contains all textMan plugins.
"""

from app.plugins.text import TextCasePlugin, FormattingPlugin
from app.plugins.regex import RegexPlugin

# Export all plugin classes
__all__ = [
    'TextCasePlugin',
    'FormattingPlugin',
    'RegexPlugin',
]
