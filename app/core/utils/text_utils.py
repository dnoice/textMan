
"""
TextMan Text Utilities
---------------------
Utility functions for text processing and analysis.
"""

import re
from typing import List, Dict, Any


def count_words(text: str) -> List[str]:
    """Count words in text.
    
    Args:
        text: The text to analyze.
        
    Returns:
        List of words found in the text.
    """
    # Use a more sophisticated regex to handle hyphenated words and contractions
    word_pattern = r'[A-Za-z]+(?:[-\''][A-Za-z]+)*'
    words = re.findall(word_pattern, text)
    return words


def count_sentences(text: str) -> int:
    """Count sentences in text.
    
    Args:
        text: The text to analyze.
        
    Returns:
        Number of sentences in the text.
    """
    # Basic sentence splitting - handles common end-of-sentence markers
    # This is a simplification; a more sophisticated NLP approach would be better
    sentence_pattern = r'[.!?]+[\s\n]+|[.!?]+$'
    sentences = re.split(sentence_pattern, text)
    # Filter out empty strings
    sentences = [s for s in sentences if s.strip()]
    return len(sentences)


def extract_keywords(text: str, count: int = 10) -> List[Dict[str, Any]]:
    """Extract the most common keywords from text.
    
    Args:
        text: The text to analyze.
        count: Maximum number of keywords to return.
        
    Returns:
        List of keyword dictionaries with 'word' and 'count' keys.
    """
    # Get all words
    words = count_words(text.lower())
    
    # Filter out common stop words (a very basic list)
    stop_words = {
        'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'with', 'by', 'about', 'as', 'of', 'that', 'this', 'it', 'from', 'is',
        'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
        'do', 'does', 'did', 'i', 'you', 'he', 'she', 'we', 'they'
    }
    
    filtered_words = [w for w in words if w.lower() not in stop_words and len(w) > 1]
    
    # Count word frequencies
    word_counts = {}
    for word in filtered_words:
        word_counts[word] = word_counts.get(word, 0) + 1
    
    # Sort by frequency
    keywords = [{'word': word, 'count': count} 
                for word, count in sorted(word_counts.items(), 
                                         key=lambda x: x[1], 
                                         reverse=True)]
    
    return keywords[:count]


def calculate_readability(text: str) -> Dict[str, float]:
    """Calculate readability metrics for text.
    
    Args:
        text: The text to analyze.
        
    Returns:
        Dictionary of readability metrics.
    """
    words = count_words(text)
    word_count = len(words)
    
    # If text is empty or contains no words, return zeros
    if word_count == 0:
        return {
            'flesch_reading_ease': 0.0,
            'flesch_kincaid_grade': 0.0,
            'avg_words_per_sentence': 0.0
        }
    
    sentence_count = count_sentences(text)
    # Prevent division by zero
    sentence_count = max(1, sentence_count)
    
    # Count syllables (basic approximation)
    syllable_count = 0
    for word in words:
        word = word.lower()
        # Count vowel groups as syllables
        vowels = "aeiouy"
        count = 0
        prev_is_vowel = False
        
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_is_vowel:
                count += 1
            prev_is_vowel = is_vowel
        
        # Words should have at least one syllable
        syllable_count += max(1, count)
    
    # Calculate metrics
    avg_words_per_sentence = word_count / sentence_count
    avg_syllables_per_word = syllable_count / word_count
    
    # Flesch Reading Ease
    flesch_reading_ease = 206.835 - (1.015 * avg_words_per_sentence) - (84.6 * avg_syllables_per_word)
    # Bound the score between 0 and 100
    flesch_reading_ease = max(0, min(100, flesch_reading_ease))
    
    # Flesch-Kincaid Grade Level
    flesch_kincaid_grade = (0.39 * avg_words_per_sentence) + (11.8 * avg_syllables_per_word) - 15.59
    # Bound the grade level to reasonable values
    flesch_kincaid_grade = max(0, min(18, flesch_kincaid_grade))
    
    return {
        'flesch_reading_ease': flesch_reading_ease,
        'flesch_kincaid_grade': flesch_kincaid_grade,
        'avg_words_per_sentence': avg_words_per_sentence
    }
