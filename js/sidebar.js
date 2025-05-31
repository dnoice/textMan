// Sidebar Management
const Sidebar = (function() {
  'use strict';
  
  let sidebar = null;
  let toggleBtn = null;
  let pinBtn = null;
  let searchInput = null;
  let isOpen = true;
  let isPinned = false;
  
  // Initialize sidebar
  function init() {
    sidebar = document.getElementById('toolsSidebar');
    toggleBtn = document.getElementById('sidebarToggle');
    pinBtn = document.getElementById('pinSidebar');
    searchInput = document.getElementById('toolSearch');
    
    if (!sidebar) {
      console.error('Sidebar not found');
      return;
    }
    
    // Load saved state
    loadSavedState();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize collapsible sections
    initializeCollapsibles();
    
    // Initialize tool search
    initializeSearch();
    
    // Subscribe to state changes
    subscribeToState();
  }
  
  // Setup event listeners
  function setupEventListeners() {
    // Toggle button
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggle);
    }
    
    // Pin button
    if (pinBtn) {
      pinBtn.addEventListener('click', togglePin);
    }
    
    // Auto-hide on small screens when clicking outside
    document.addEventListener('click', handleDocumentClick);
    
    // Handle window resize
    window.addEventListener('resize', Utils.function.debounce(handleResize, 250));
    
    // Quick action buttons
    document.querySelectorAll('.quick-btn, .quick-action-btn').forEach(btn => {
      btn.addEventListener('click', handleQuickAction);
    });
    
    // Tool buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
      btn.addEventListener('click', handleToolClick);
    });
  }
  
  // Initialize collapsible sections
  function initializeCollapsibles() {
    const sections = sidebar.querySelectorAll('.tool-section.collapsible');
    
    sections.forEach(section => {
      const toggle = section.querySelector('.section-toggle');
      const content = section.querySelector('.tool-content');
      const icon = toggle.querySelector('.toggle-icon');
      
      // Load saved state
      const sectionName = toggle.textContent.trim();
      const isCollapsed = Utils.storage.get(`section-${sectionName}-collapsed`);
      
      if (isCollapsed) {
        section.classList.add('collapsed');
        content.style.display = 'none';
        icon.classList.add('rotated');
      }
      
      // Toggle on click
      toggle.addEventListener('click', () => {
        const isCollapsing = !section.classList.contains('collapsed');
        
        if (isCollapsing) {
          // Collapse
          content.style.height = content.scrollHeight + 'px';
          content.offsetHeight; // Force reflow
          content.style.height = '0';
          icon.classList.add('rotated');
          
          setTimeout(() => {
            content.style.display = 'none';
            content.style.height = '';
            section.classList.add('collapsed');
          }, 200);
        } else {
          // Expand
          section.classList.remove('collapsed');
          content.style.display = 'block';
          content.style.height = '0';
          content.offsetHeight; // Force reflow
          content.style.height = content.scrollHeight + 'px';
          icon.classList.remove('rotated');
          
          setTimeout(() => {
            content.style.height = '';
          }, 200);
        }
        
        // Save state
        Utils.storage.set(`section-${sectionName}-collapsed`, isCollapsing);
      });
    });
  }
  
  // Initialize search functionality
  function initializeSearch() {
    if (!searchInput) return;
    
    searchInput.addEventListener('input', Utils.function.debounce((e) => {
      const query = e.target.value.toLowerCase().trim();
      filterTools(query);
    }, 300));
    
    // Clear search on Escape
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        filterTools('');
        searchInput.blur();
      }
    });
  }
  
  // Filter tools based on search query
  function filterTools(query) {
    const sections = sidebar.querySelectorAll('.tool-section');
    let hasResults = false;
    
    sections.forEach(section => {
      const buttons = section.querySelectorAll('.tool-btn, .quick-btn');
      let sectionHasMatch = false;
      
      buttons.forEach(btn => {
        const text = btn.textContent.toLowerCase();
        const tooltip = btn.getAttribute('title') || '';
        const matches = text.includes(query) || tooltip.toLowerCase().includes(query);
        
        btn.style.display = matches || !query ? '' : 'none';
        
        if (matches) {
          sectionHasMatch = true;
          hasResults = true;
        }
      });
      
      // Hide/show entire section
      if (!section.classList.contains('quick-actions')) {
        section.style.display = sectionHasMatch || !query ? '' : 'none';
        
        // Auto-expand collapsed sections with matches
        if (sectionHasMatch && query && section.classList.contains('collapsed')) {
          const toggle = section.querySelector('.section-toggle');
          if (toggle) toggle.click();
        }
      }
    });
    
    // Show no results message
    showNoResults(!hasResults && query);
  }
  
  // Show/hide no results message
  function showNoResults(show) {
    let noResults = sidebar.querySelector('.no-results');
    
    if (show && !noResults) {
      noResults = Utils.dom.createElement('div', {
        className: 'no-results',
        innerHTML: '<i class="fas fa-search"></i><p>No tools found</p>'
      });
      sidebar.querySelector('.sidebar-content').appendChild(noResults);
    } else if (!show && noResults) {
      noResults.remove();
    }
  }
  
  // Handle quick action button clicks
  function handleQuickAction(e) {
    const btn = e.currentTarget;
    const action = btn.dataset.action;
    
    if (!Editor.getContent() && action !== 'generateLorem') {
      ToastManager.show({
        message: 'No text to transform',
        type: 'warning'
      });
      return;
    }
    
    // Perform the action
    switch (action) {
      case 'lowercase':
        Transformations.toLowerCase();
        break;
      case 'uppercase':
        Transformations.toUpperCase();
        break;
      case 'titlecase':
        Transformations.toTitleCase();
        break;
      case 'removeSpaces':
        Transformations.removeExtraSpaces();
        break;
      case 'removeDuplicates':
        Transformations.removeDuplicates();
        break;
      case 'reverse':
        Transformations.reverseText();
        break;
    }
    
    // Animate button
    animateButton(btn);
  }
  
  // Handle tool button clicks
  function handleToolClick(e) {
    const btn = e.currentTarget;
    const btnId = btn.id;
    
    // Map button IDs to their functions
    const toolMap = {
      // Transform tools
      toLowerCaseButton: () => Transformations.toLowerCase(),
      toUpperCaseButton: () => Transformations.toUpperCase(),
      capitalizeWordsButton: () => Transformations.toTitleCase(),
      sentenceCaseButton: () => Transformations.toSentenceCase(),
      camelCaseButton: () => Transformations.toCamelCase(),
      snakeCaseButton: () => Transformations.toSnakeCase(),
      kebabCaseButton: () => Transformations.toKebabCase(),
      alternatingCaseButton: () => Transformations.toAlternatingCase(),
      invertCaseButton: () => Transformations.invertCase(),
      base64EncodeButton: () => Transformations.base64Encode(),
      base64DecodeButton: () => Transformations.base64Decode(),
      
      // Sort tools
      sortLinesAZButton: () => Transformations.sortLines('az'),
      sortLinesZAButton: () => Transformations.sortLines('za'),
      sortLinesShortestButton: () => Transformations.sortLines('shortest'),
      sortLinesLongestButton: () => Transformations.sortLines('longest'),
      sortNumericalButton: () => Transformations.sortLines('numerical'),
      shuffleLinesButton: () => Transformations.shuffleLines(),
      reverseTextButton: () => Transformations.reverseText(),
      reverseLinesButton: () => Transformations.reverseLines(),
      
      // Find & Replace
      findButton: () => FindReplace.find(),
      replaceButton: () => FindReplace.replaceAll(),
      replaceOneButton: () => FindReplace.replaceNext(),
      
      // Add/Remove tools
      addPrefixButton: () => Transformations.addPrefix(),
      addSuffixButton: () => Transformations.addSuffix(),
      wrapLinesButton: () => Transformations.wrapLines(),
      removeDuplicatesButton: () => Transformations.removeDuplicates(),
      removeEmptyLinesButton: () => Transformations.removeEmptyLines(),
      removeExtraSpacesButton: () => Transformations.removeExtraSpaces(),
      removeAllSpacesButton: () => Transformations.removeAllSpaces(),
      removeNumbersButton: () => Transformations.removeNumbers(),
      removePunctuationButton: () => Transformations.removePunctuation(),
      removeLineBreaksButton: () => Transformations.removeLineBreaks(),
      removeAccentsButton: () => Transformations.removeAccents(),
      
      // Filter tools
      keepLinesButton: () => Transformations.keepLines(),
      removeLinesButton: () => Transformations.removeLines(),
      extractUrlsButton: () => Transformations.extractUrls(),
      extractEmailsButton: () => Transformations.extractEmails(),
      extractNumbersButton: () => Transformations.extractNumbers(),
      
      // Advanced tools
      jsonFormatButton: () => AdvancedTools.formatJson(),
      jsonMinifyButton: () => AdvancedTools.minifyJson(),
      csvToTableButton: () => AdvancedTools.csvToTable(),
      markdownPreviewButton: () => AdvancedTools.markdownPreview(),
      generateLoremButton: () => AdvancedTools.generateLorem(),
      wordFrequencyButton: () => AdvancedTools.wordFrequency(),
      textDiffButton: () => AdvancedTools.textDiff()
    };
    
    const action = toolMap[btnId];
    if (action) {
      action();
      animateButton(btn);
    }
  }
  
  // Animate button click
  function animateButton(btn) {
    btn.classList.add('clicked');
    setTimeout(() => btn.classList.remove('clicked'), 300);
  }
  
  // Toggle sidebar
  function toggle() {
    isOpen = !isOpen;
    
    if (isOpen) {
      open();
    } else {
      close();
    }
    
    // Save state
    AppState.set('ui.sidebarOpen', isOpen);
    Utils.storage.set('sidebar-open', isOpen);
  }
  
  // Open sidebar
  function open() {
    isOpen = true;
    sidebar.classList.remove('collapsed', 'hidden');
    toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
    toggleBtn.setAttribute('aria-label', 'Close sidebar');
  }
  
  // Close sidebar
  function close() {
    isOpen = false;
    
    if (isPinned || window.innerWidth > 768) {
      sidebar.classList.add('collapsed');
      sidebar.classList.remove('hidden');
    } else {
      sidebar.classList.add('hidden');
      sidebar.classList.remove('collapsed');
    }
    
    toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
    toggleBtn.setAttribute('aria-label', 'Open sidebar');
  }
  
  // Toggle pin state
  function togglePin() {
    isPinned = !isPinned;
    
    sidebar.classList.toggle('pinned', isPinned);
    pinBtn.classList.toggle('active', isPinned);
    
    const icon = pinBtn.querySelector('i');
    icon.style.transform = isPinned ? 'rotate(45deg)' : 'rotate(0deg)';
    
    // Save state
    AppState.set('ui.sidebarPinned', isPinned);
    Utils.storage.set('sidebar-pinned', isPinned);
    
    // Show toast
    ToastManager.show({
      message: isPinned ? 'Sidebar pinned' : 'Sidebar unpinned',
      type: 'info',
      duration: 1500
    });
  }
  
  // Handle document clicks for auto-hide
  function handleDocumentClick(e) {
    if (window.innerWidth <= 768 && !isPinned && isOpen) {
      const isClickInside = sidebar.contains(e.target) || toggleBtn.contains(e.target);
      
      if (!isClickInside) {
        close();
      }
    }
  }
  
  // Handle window resize
  function handleResize() {
    if (window.innerWidth > 768) {
      sidebar.classList.remove('hidden');
      
      if (!isOpen && !sidebar.classList.contains('collapsed')) {
        sidebar.classList.add('collapsed');
      }
    } else if (!isOpen && !isPinned) {
      sidebar.classList.add('hidden');
      sidebar.classList.remove('collapsed');
    }
  }
  
  // Load saved state
  function loadSavedState() {
    isOpen = Utils.storage.get('sidebar-open') !== false;
    isPinned = Utils.storage.get('sidebar-pinned') || false;
    
    // Apply saved state
    if (!isOpen) {
      close();
    }
    
    if (isPinned) {
      sidebar.classList.add('pinned');
      pinBtn.classList.add('active');
      const icon = pinBtn.querySelector('i');
      icon.style.transform = 'rotate(45deg)';
    }
  }
  
  // Subscribe to state changes
  function subscribeToState() {
    AppState.subscribe('ui.sidebarOpen', (open) => {
      if (open !== isOpen) {
        toggle();
      }
    });
    
    AppState.subscribe('ui.sidebarPinned', (pinned) => {
      if (pinned !== isPinned) {
        togglePin();
      }
    });
  }
  
  // Public API
  return {
    init,
    toggle,
    open,
    close,
    togglePin,
    isOpen: () => isOpen,
    isPinned: () => isPinned
  };
})();