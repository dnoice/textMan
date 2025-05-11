"""
TextMan Settings Module
----------------------
Manages application settings from various sources:
- Environment variables
- Configuration files
- Command line arguments
"""

import os
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

# Import dotenv for environment variable handling
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is optional


class Settings:
    """Manages application settings from various sources."""
    
    def __init__(self):
        """Initialize settings with default values."""
        # File settings
        self.file: Optional[str] = None
        self.output: Optional[str] = None
        self.encoding: str = "utf-8"
        
        # Web server settings
        self.host: str = "127.0.0.1"
        self.port: int = 8080
        
        # Plugin settings
        self.plugin_dir: Optional[str] = None
        self.disable_plugins: List[str] = []
        self.enable_plugins: List[str] = []
        
        # Application settings
        self.max_history: int = 50
        self.auto_save: bool = False
        self.auto_save_interval: int = 5  # minutes
        self.theme: str = "default"
        
        # Action settings
        self.execute: Optional[str] = None
        
        # Load settings from environment variables
        self._load_from_env()
    
    def _load_from_env(self) -> None:
        """Load settings from environment variables."""
        # File settings
        if file_path := os.getenv("TEXTMAN_FILE"):
            self.file = file_path
        
        if output_path := os.getenv("TEXTMAN_OUTPUT"):
            self.output = output_path
        
        if encoding := os.getenv("TEXTMAN_ENCODING"):
            self.encoding = encoding
        
        # Web server settings
        if host := os.getenv("TEXTMAN_HOST"):
            self.host = host
        
        if port := os.getenv("TEXTMAN_PORT"):
            try:
                self.port = int(port)
            except ValueError:
                logging.warning(f"Invalid port number: {port}")
        
        # Plugin settings
        if plugin_dir := os.getenv("TEXTMAN_PLUGIN_DIR"):
            self.plugin_dir = plugin_dir
        
        if disable_plugins := os.getenv("TEXTMAN_DISABLE_PLUGINS"):
            self.disable_plugins = disable_plugins.split(",")
        
        if enable_plugins := os.getenv("TEXTMAN_ENABLE_PLUGINS"):
            self.enable_plugins = enable_plugins.split(",")
        
        # Application settings
        if max_history := os.getenv("TEXTMAN_MAX_HISTORY"):
            try:
                self.max_history = int(max_history)
            except ValueError:
                logging.warning(f"Invalid max history: {max_history}")
        
        if auto_save := os.getenv("TEXTMAN_AUTO_SAVE"):
            self.auto_save = auto_save.lower() in ("true", "1", "yes", "y")
        
        if auto_save_interval := os.getenv("TEXTMAN_AUTO_SAVE_INTERVAL"):
            try:
                self.auto_save_interval = int(auto_save_interval)
            except ValueError:
                logging.warning(f"Invalid auto save interval: {auto_save_interval}")
        
        if theme := os.getenv("TEXTMAN_THEME"):
            self.theme = theme
    
    def load_from_file(self, filepath: Union[str, Path]) -> None:
        """Load settings from a JSON or YAML configuration file.
        
        Args:
            filepath: Path to the configuration file.
            
        Raises:
            FileNotFoundError: If the file does not exist.
            ValueError: If the file format is not supported or is invalid.
        """
        filepath = Path(filepath).expanduser().resolve()
        
        if not filepath.exists():
            raise FileNotFoundError(f"Configuration file not found: {filepath}")
        
        # Determine file format from extension
        file_format = filepath.suffix.lower()
        
        if file_format == ".json":
            self._load_from_json(filepath)
        elif file_format in (".yaml", ".yml"):
            self._load_from_yaml(filepath)
        else:
            raise ValueError(f"Unsupported configuration file format: {file_format}")
    
    def _load_from_json(self, filepath: Path) -> None:
        """Load settings from a JSON file."""
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                config = json.load(f)
            
            # Update settings from config
            self._update_from_dict(config)
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in configuration file: {e}")
    
    def _load_from_yaml(self, filepath: Path) -> None:
        """Load settings from a YAML file."""
        try:
            import yaml
            with open(filepath, "r", encoding="utf-8") as f:
                config = yaml.safe_load(f)
            
            # Update settings from config
            self._update_from_dict(config)
            
        except ImportError:
            raise ImportError("PyYAML is required for YAML configuration files")
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML in configuration file: {e}")
    
    def _update_from_dict(self, config: Dict[str, Any]) -> None:
        """Update settings from a dictionary."""
        for key, value in config.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def update_from_args(self, args: Any) -> None:
        """Update settings from command line arguments.
        
        Args:
            args: Parsed command line arguments object.
        """
        # Update all settings from args if provided
        for key in vars(args):
            value = getattr(args, key)
            if value is not None and hasattr(self, key):
                setattr(self, key, value)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert settings to a dictionary.
        
        Returns:
            Dictionary representation of the settings.
        """
        return {
            key: value for key, value in vars(self).items()
            if not key.startswith("_")
        }
    
    def save_to_file(self, filepath: Union[str, Path], format: str = "json") -> None:
        """Save settings to a configuration file.
        
        Args:
            filepath: Path to save the configuration file.
            format: File format ('json' or 'yaml').
            
        Raises:
            ValueError: If the format is not supported.
        """
        filepath = Path(filepath).expanduser().resolve()
        
        # Ensure directory exists
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        # Get settings as dictionary
        config = self.to_dict()
        
        if format.lower() == "json":
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(config, f, indent=2)
        
        elif format.lower() in ("yaml", "yml"):
            try:
                import yaml
                with open(filepath, "w", encoding="utf-8") as f:
                    yaml.dump(config, f, default_flow_style=False)
            except ImportError:
                raise ImportError("PyYAML is required for YAML configuration files")
        
        else:
            raise ValueError(f"Unsupported configuration file format: {format}")