// SettingsManager module - Handles application settings
export class SettingsManager {
  constructor() {
    // Default settings
    this.defaultSettings = {
      theme: 'dark',
      accentColor: 'purple',
      fontSize: '14px',
      fontFamily: "'JetBrains Mono', monospace",
      autoSave: true,
      realTimeStats: true
    };
    
    // Current settings
    this.settings = { ...this.defaultSettings };
  }
  
  // Load settings from localStorage
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('textcraft-settings');
      
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        this.settings = { ...this.defaultSettings, ...parsedSettings };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      this.settings = { ...this.defaultSettings };
    }
    
    return this.settings;
  }
  
  // Save settings to localStorage
  saveSettings() {
    try {
      localStorage.setItem('textcraft-settings', JSON.stringify(this.settings));
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }
  
  // Get a specific setting
  getSetting(key) {
    return this.settings[key] !== undefined ? this.settings[key] : this.defaultSettings[key];
  }
  
  // Update a specific setting
  updateSetting(key, value) {
    this.settings[key] = value;
    this.saveSettings();
  }
  
  // Reset settings to defaults
  resetSettings() {
    this.settings = { ...this.defaultSettings };
    this.saveSettings();
  }
  
  // Apply current settings to the UI
  applySettings() {
    // Apply theme
    document.body.setAttribute('data-theme', this.settings.theme);
    
    // Apply accent color
    document.body.setAttribute('data-accent', this.settings.accentColor);
    
    // Apply font size to editor
    const editor = document.getElementById('text-editor');
    if (editor) {
      editor.style.fontSize = this.settings.fontSize;
      editor.style.fontFamily = this.settings.fontFamily;
    }
  }
  
  // Save settings from form values
  saveSettingsFromForm() {
    // Theme
    const theme = document.getElementById('theme-selector').value;
    this.settings.theme = theme;
    
    // Accent color
    const accentColor = document.getElementById('accent-color').value;
    this.settings.accentColor = accentColor;
    
    // Font size
    const fontSize = document.getElementById('font-size').value;
    this.settings.fontSize = fontSize;
    
    // Font family
    const fontFamily = document.getElementById('font-family').value;
    this.settings.fontFamily = fontFamily;
    
    // Checkboxes
    this.settings.autoSave = document.getElementById('auto-save').checked;
    this.settings.realTimeStats = document.getElementById('real-time-stats').checked;
    
    // Save to localStorage
    this.saveSettings();
  }
  
  // Export settings as JSON
  exportSettings() {
    return JSON.stringify(this.settings, null, 2);
  }
  
  // Import settings from JSON
  importSettings(jsonSettings) {
    try {
      const parsedSettings = JSON.parse(jsonSettings);
      this.settings = { ...this.defaultSettings, ...parsedSettings };
      this.saveSettings();
      this.applySettings();
      return true;
    } catch (error) {
      console.error('Error importing settings:', error);
      return false;
    }
  }
}
