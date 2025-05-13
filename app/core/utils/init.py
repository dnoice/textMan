"""
textMan Utilities Package
-----------------------
Contains utility functions for the textMan application.
"""

from app.core.utils.text_utils import (
    count_words,
    count_sentences,
    extract_keywords,
    calculate_readability
)

__all__ = [
    'count_words',
    'count_sentences',
    'extract_keywords',
    'calculate_readability'
]
