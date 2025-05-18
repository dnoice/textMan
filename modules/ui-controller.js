// UIController module - Handles UI interactions and state
export class UIController {
  constructor(editor, textProcessor, settings, toast) {
    this.editor = editor;
    this.textProcessor = textProcessor;
    this.settings = settings;
    this.toast = toast;
    
    // UI elements
    this.drawer = document.getElementById('function-drawer');
    this.searchReplacePanel = document.getElementById('search-replace-panel');
    this.prefixSuffixPanel = document.getElementById('prefix-suffix-panel');
    this.filterPanel = document.getElementById('filter-panel');
    this.settingsModal = document.getElementById('settings-modal');
    
    // Track current active drawer panel
    this.activePanel = null;
  }
  
  // Initialize UI components
  initUI() {
    // Apply current settings
    this.settings.applySettings();
    
    // Update settings form values
    this.updateSettingsForm();
    
    // Initialize any responsive UI elements
    this.initResponsiveUI();
    
    // Setup initial drawer panels (hide all)
    this.hideAllPanels();
  }
  
  // Toggle function drawer visibility with specified panel
  toggleDrawer(buttonId) {
    // Determine which panel to show based on button ID
    let targetPanel;
    switch (buttonId) {
      case 'search-replace-btn':
        targetPanel = this.searchReplacePanel;
        break;
      case 'prefix-suffix-btn':
        targetPanel = this.prefixSuffixPanel;
        break;
      case 'filter-btn':
        targetPanel = this.filterPanel;
        break;
      default:
        return;
    }
    
    // Get all toolbar buttons
    const toolbarButtons = document.querySelectorAll('.toolbar-btn');
    
    // If drawer is already open with the target panel, close it
    if (
      !this.drawer.classList.contains('closed') && 
      this.activePanel === targetPanel
    ) {
      this.drawer.classList.add('closed');
      this.activePanel = null;
      
      // Remove active class from all buttons
      toolbarButtons.forEach(btn => {
        btn.classList.remove('active');
      });
      
      return;
    }
    
    // Otherwise, show the drawer with the target panel
    this.hideAllPanels();
    this.drawer.classList.remove('closed');
    targetPanel.classList.add('active');
    this.activePanel = targetPanel;
    
    // Set active class on the clicked button, remove from others
    toolbarButtons.forEach(btn => {
      if (btn.id === buttonId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Focus the first input in the panel
    const firstInput = targetPanel.querySelector('input');
    if (firstInput) {
      setTimeout(() => {
        firstInput.focus();
      }, 300); // Delay to allow for the animation to complete
    }
  }
  
  // Hide all drawer panels
  hideAllPanels() {
    this.searchReplacePanel.classList.remove('active');
    this.prefixSuffixPanel.classList.remove('active');
    this.filterPanel.classList.remove('active');
  }
  
  // Initialize responsive UI elements
  initResponsiveUI() {
    // Add a menu toggle button for mobile
    if (window.innerWidth <= 768) {
      this.addMobileMenuToggle();
    }
    
    // Listen for window resize events
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Handle initial page load for responsive elements
    this.updateResponsiveElements();
  }
  
  // Add a toggle button for the mobile sidebar
  addMobileMenuToggle() {
    // Create toggle button if it doesn't exist
    if (!document.querySelector('.sidebar-toggle')) {
      const toggleButton = document.createElement('button');
      toggleButton.className = 'sidebar-toggle';
      toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
      toggleButton.setAttribute('aria-label', 'Toggle menu');
      
      // Add event listener
      toggleButton.addEventListener('click', () => {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('show');
      });
      
      // Add to document
      document.body.appendChild(toggleButton);
    }
  }
  
  // Handle window resize
  handleResize() {
    this.updateResponsiveElements();
    
    // Add or remove mobile menu toggle
    if (window.innerWidth <= 768) {
      this.addMobileMenuToggle();
    } else {
      const toggleButton = document.querySelector('.sidebar-toggle');
      if (toggleButton) {
        toggleButton.remove();
      }
      
      // Ensure sidebar is visible on larger screens
      const sidebar = document.querySelector('.sidebar');
      sidebar.classList.remove('show');
    }
  }
  
  // Update responsive elements based on window size
  updateResponsiveElements() {
    // Adjust text stats layout
    const textStats = document.querySelector('.text-stats');
    if (textStats) {
      if (window.innerWidth < 600) {
        textStats.style.flexWrap = 'nowrap';
        textStats.style.overflowX = 'auto';
      } else {
        textStats.style.flexWrap = 'wrap';
        textStats.style.overflowX = 'visible';
      }
    }
  }
  
  // Open settings modal
  openSettingsModal() {
    this.updateSettingsForm();
    this.settingsModal.classList.add('show');
  }
  
  // Close settings modal
  closeSettingsModal() {
    this.settingsModal.classList.remove('show');
  }
  
  // Update settings form with current values
  updateSettingsForm() {
    // Theme selector
    const themeSelector = document.getElementById('theme-selector');
    themeSelector.value = this.settings.getSetting('theme');
    
    // Accent color
    const accentColor = document.getElementById('accent-color');
    accentColor.value = this.settings.getSetting('accentColor');
    
    // Font size
    const fontSize = document.getElementById('font-size');
    fontSize.value = this.settings.getSetting('fontSize');
    
    // Font family
    const fontFamily = document.getElementById('font-family');
    fontFamily.value = this.settings.getSetting('fontFamily');
    
    // Checkboxes
    document.getElementById('auto-save').checked = this.settings.getSetting('autoSave');
    document.getElementById('real-time-stats').checked = this.settings.getSetting('realTimeStats');
    
    // Update theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('i');
    
    if (this.settings.getSetting('theme') === 'dark') {
      themeIcon.className = 'fas fa-moon';
      themeToggle.innerHTML = `<i class="fas fa-moon"></i> Dark Mode`;
    } else {
      themeIcon.className = 'fas fa-sun';
      themeToggle.innerHTML = `<i class="fas fa-sun"></i> Light Mode`;
    }
  }
}
