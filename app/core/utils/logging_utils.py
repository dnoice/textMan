"""
TextMan Logging Utilities
------------------------
Configure logging for the TextMan application.
"""

import logging
import os
import sys
from pathlib import Path
from typing import Optional


def setup_logging(log_level: str = "INFO", 
                  log_file: Optional[str] = None,
                  log_format: Optional[str] = None) -> None:
    """Set up logging configuration.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional file path to write logs to
        log_format: Optional custom log format
    """
    # Convert string log level to logging constant
    numeric_level = getattr(logging, log_level.upper(), None)
    if not isinstance(numeric_level, int):
        raise ValueError(f"Invalid log level: {log_level}")
    
    # Default log format
    if log_format is None:
        log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Basic configuration
    handlers = []
    
    # Always add console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(logging.Formatter(log_format))
    handlers.append(console_handler)
    
    # Add file handler if specified
    if log_file:
        log_path = Path(log_file).expanduser().resolve()
        # Ensure directory exists
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        file_handler = logging.FileHandler(log_path, encoding='utf-8')
        file_handler.setFormatter(logging.Formatter(log_format))
        handlers.append(file_handler)
    
    # Configure root logger
    logging.basicConfig(
        level=numeric_level,
        format=log_format,
        handlers=handlers
    )
    
    # Set log level for specific libraries
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("chardet").setLevel(logging.WARNING)
    
    logging.info(f"Logging initialized with level: {log_level}")


def get_logger(name: str, level: Optional[str] = None) -> logging.Logger:
    """Get a logger with the given name.
    
    Args:
        name: Name of the logger
        level: Optional level to set (overrides the root logger level)
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    
    if level:
        numeric_level = getattr(logging, level.upper(), None)
        if isinstance(numeric_level, int):
            logger.setLevel(numeric_level)
    
    return logger
