// UI Components Module
const UIComponents = (function() {
  'use strict';
  
  function init() {
    ToastManager.init();
    ContextMenu.init();
    ProgressBar.init();
  }
  
  return { init };
})();

// Toast Notification Manager
const ToastManager = (function() {
  'use strict';
  
  let container = null;
  let toasts = [];
  
  function init() {
    container = document.getElementById('toast-container');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(container);
    }
  }
  
  function show(options) {
    const defaults = {
      message: '',
      type: 'info', // info, success, warning, error
      duration: CONFIG.toast.duration,
      icon: null,
      action: null,
      actionText: 'Undo',
      position: CONFIG.toast.position
    };
    
    const settings = { ...defaults, ...options };
    
    // Create toast element
    const toast = createToastElement(settings);
    
    // Add to container
    container.appendChild(toast);
    
    // Add to tracking array
    toasts.push(toast);
    
    // Limit number of toasts
    if (toasts.length > CONFIG.toast.maxToasts) {
      remove(toasts[0]);
    }
    
    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
    
    // Auto-remove after duration
    if (settings.duration > 0) {
      setTimeout(() => remove(toast), settings.duration);
    }
    
    return toast;
  }
  
  function createToastElement(settings) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${settings.type}`;
    
    // Icon
    const icon = settings.icon || getDefaultIcon(settings.type);
    const iconHtml = icon ? `<i class="fas ${icon}"></i>` : '';
    
    // Action button
    const actionHtml = settings.action 
      ? `<button class="toast-action">${settings.actionText}</button>`
      : '';
    
    // Close button
    const closeHtml = '<button class="toast-close" aria-label="Close"><i class="fas fa-times"></i></button>';
    
    toast.innerHTML = `
      <div class="toast-content">
        ${iconHtml}
        <span class="toast-message">${settings.message}</span>
      </div>
      <div class="toast-actions">
        ${actionHtml}
        ${closeHtml}
      </div>
    `;
    
    // Event listeners
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => remove(toast));
    
    if (settings.action) {
      const actionBtn = toast.querySelector('.toast-action');
      actionBtn.addEventListener('click', () => {
        settings.action();
        remove(toast);
      });
    }
    
    return toast;
  }
  
  function getDefaultIcon(type) {
    const icons = {
      info: 'fa-info-circle',
      success: 'fa-check-circle',
      warning: 'fa-exclamation-triangle',
      error: 'fa-times-circle'
    };
    return icons[type] || 'fa-info-circle';
  }
  
  function remove(toast) {
    if (!toast || !container.contains(toast)) return;
    
    toast.classList.remove('show');
    toast.classList.add('hide');
    
    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
      const index = toasts.indexOf(toast);
      if (index > -1) {
        toasts.splice(index, 1);
      }
    }, 300);
  }
  
  function clear() {
    toasts.forEach(toast => remove(toast));
  }
  
  return {
    init,
    show,
    remove,
    clear
  };
})();

// Context Menu Manager
const ContextMenu = (function() {
  'use strict';
  
  let menu = null;
  let currentItems = [];
  
  function init() {
    menu = document.getElementById('contextMenu');
    
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'contextMenu';
      menu.className = 'context-menu';
      menu.style.display = 'none';
      document.body.appendChild(menu);
    }
    
    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target)) {
        hide();
      }
    });
    
    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hide();
      }
    });
  }
  
  function show(x, y, items) {
    if (!menu || !items || items.length === 0) return;
    
    currentItems = items;
    
    // Build menu content
    menu.innerHTML = '';
    
    items.forEach((item, index) => {
      if (item.separator) {
        const separator = document.createElement('div');
        separator.className = 'context-separator';
        menu.appendChild(separator);
        return;
      }
      
      const button = document.createElement('button');
      button.className = 'context-item';
      button.disabled = item.enabled === false;
      button.dataset.action = item.action;
      
      const iconHtml = item.icon ? `<i class="fas ${item.icon}"></i>` : '';
      button.innerHTML = `${iconHtml}${item.label}`;
      
      button.addEventListener('click', () => {
        handleAction(item.action);
        hide();
      });
      
      menu.appendChild(button);
    });
    
    // Position menu
    menu.style.display = 'block';
    
    // Get menu dimensions
    const menuRect = menu.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Adjust position to keep menu in viewport
    let finalX = x;
    let finalY = y;
    
    if (x + menuRect.width > windowWidth) {
      finalX = windowWidth - menuRect.width - 10;
    }
    
    if (y + menuRect.height > windowHeight) {
      finalY = windowHeight - menuRect.height - 10;
    }
    
    menu.style.left = `${finalX}px`;
    menu.style.top = `${finalY}px`;
    
    // Animate in
    menu.classList.add('show');
  }
  
  function hide() {
    if (!menu) return;
    
    menu.classList.remove('show');
    setTimeout(() => {
      menu.style.display = 'none';
    }, 200);
  }
  
  function handleAction(action) {
    switch (action) {
      case 'cut':
        document.execCommand('cut');
        break;
      case 'copy':
        document.execCommand('copy');
        break;
      case 'paste':
        navigator.clipboard.readText().then(text => {
          Editor.insertText(text);
        });
        break;
      case 'selectAll':
        Editor.selectAll();
        break;
      case 'transform':
        // Show transform menu
        showTransformMenu();
        break;
      default:
        console.log('Unknown context action:', action);
    }
  }
  
  function showTransformMenu() {
    // This would open a submenu or modal with transform options
    ToastManager.show({
      message: 'Transform menu coming soon!',
      type: 'info'
    });
  }
  
  return {
    init,
    show,
    hide
  };
})();

// Progress Bar Manager
const ProgressBar = (function() {
  'use strict';
  
  let progressBar = null;
  let progressFill = null;
  let isVisible = false;
  
  function init() {
    progressBar = document.getElementById('progressBar');
    
    if (progressBar) {
      progressFill = progressBar.querySelector('.progress-fill');
    }
  }
  
  function show(value = 0) {
    if (!progressBar) return;
    
    progressBar.style.display = 'block';
    isVisible = true;
    setProgress(value);
  }
  
  function hide() {
    if (!progressBar) return;
    
    progressBar.style.display = 'none';
    isVisible = false;
    setProgress(0);
  }
  
  function setProgress(value) {
    if (!progressFill) return;
    
    const clampedValue = Math.max(0, Math.min(100, value));
    progressFill.style.width = `${clampedValue}%`;
  }
  
  function increment(amount = 10) {
    if (!progressFill) return;
    
    const currentWidth = parseFloat(progressFill.style.width) || 0;
    setProgress(currentWidth + amount);
  }
  
  return {
    init,
    show,
    hide,
    setProgress,
    increment,
    isVisible: () => isVisible
  };
})();

// Modal Manager
const ModalManager = (function() {
  'use strict';
  
  const modals = new Map();
  let activeModal = null;
  
  function create(options) {
    const defaults = {
      id: `modal-${Date.now()}`,
      title: '',
      content: '',
      footer: '',
      size: 'medium', // small, medium, large
      closable: true,
      backdrop: true,
      keyboard: true,
      onShow: null,
      onHide: null
    };
    
    const settings = { ...defaults, ...options };
    
    // Create modal element
    const modal = document.createElement('div');
    modal.id = settings.id;
    modal.className = `modal modal-${settings.size}`;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', `${settings.id}-title`);
    
    // Build modal structure
    modal.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="${settings.id}-title" class="modal-title">${settings.title}</h3>
            ${settings.closable ? '<button class="modal-close" aria-label="Close"><i class="fas fa-times"></i></button>' : ''}
          </div>
          <div class="modal-body">
            ${settings.content}
          </div>
          ${settings.footer ? `<div class="modal-footer">${settings.footer}</div>` : ''}
        </div>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(modal);
    
    // Store modal
    modals.set(settings.id, { element: modal, settings });
    
    // Setup event listeners
    setupModalEvents(modal, settings);
    
    return {
      id: settings.id,
      show: () => show(settings.id),
      hide: () => hide(settings.id),
      destroy: () => destroy(settings.id),
      setContent: (content) => setContent(settings.id, content),
      getElement: () => modal
    };
  }
  
  function setupModalEvents(modal, settings) {
    // Close button
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => hide(settings.id));
    }
    
    // Backdrop click
    if (settings.backdrop && settings.closable) {
      const backdrop = modal.querySelector('.modal-backdrop');
      backdrop.addEventListener('click', () => hide(settings.id));
    }
    
    // Keyboard events
    if (settings.keyboard && settings.closable) {
      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeModal === settings.id) {
          hide(settings.id);
        }
      });
    }
  }
  
  function show(id) {
    const modalData = modals.get(id);
    if (!modalData) return;
    
    const { element, settings } = modalData;
    
    // Hide any active modal
    if (activeModal && activeModal !== id) {
      hide(activeModal);
    }
    
    // Show modal
    element.style.display = 'flex';
    document.body.classList.add('modal-open');
    activeModal = id;
    
    // Animate in
    requestAnimationFrame(() => {
      element.classList.add('show');
    });
    
    // Focus first focusable element
    const focusable = element.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) {
      focusable.focus();
    }
    
    // Callback
    if (settings.onShow) {
      settings.onShow();
    }
  }
  
  function hide(id) {
    const modalData = modals.get(id);
    if (!modalData) return;
    
    const { element, settings } = modalData;
    
    element.classList.remove('show');
    
    setTimeout(() => {
      element.style.display = 'none';
      document.body.classList.remove('modal-open');
      
      if (activeModal === id) {
        activeModal = null;
      }
      
      // Callback
      if (settings.onHide) {
        settings.onHide();
      }
    }, 300);
  }
  
  function destroy(id) {
    const modalData = modals.get(id);
    if (!modalData) return;
    
    hide(id);
    
    setTimeout(() => {
      modalData.element.remove();
      modals.delete(id);
    }, 300);
  }
  
  function setContent(id, content) {
    const modalData = modals.get(id);
    if (!modalData) return;
    
    const body = modalData.element.querySelector('.modal-body');
    if (body) {
      body.innerHTML = content;
    }
  }
  
  return {
    create,
    show,
    hide,
    destroy,
    setContent
  };
})();