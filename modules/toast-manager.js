// ToastManager module - Handles toast notifications
export class ToastManager {
  constructor() {
    this.container = document.getElementById('toast-container');
    this.queue = [];
    this.isProcessing = false;
    this.defaultDuration = 3000; // 3 seconds
  }
  
  // Show a toast notification
  show(message, type = 'info', duration = this.defaultDuration) {
    // Add to queue
    this.queue.push({ message, type, duration });
    
    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processQueue();
    }
  }
  
  // Process the toast queue
  processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;
    const { message, type, duration } = this.queue.shift();
    this.createToast(message, type, duration);
  }
  
  // Create and display a toast notification
  createToast(message, type, duration) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Add icon based on type
    let icon;
    switch (type) {
      case 'success':
        icon = '<i class="fas fa-check-circle"></i>';
        break;
      case 'error':
        icon = '<i class="fas fa-times-circle"></i>';
        break;
      case 'warning':
        icon = '<i class="fas fa-exclamation-triangle"></i>';
        break;
      case 'info':
      default:
        icon = '<i class="fas fa-info-circle"></i>';
        break;
    }
    
    // Set toast content
    toast.innerHTML = `${icon} ${this.escapeHTML(message)}`;
    
    // Add to container
    this.container.appendChild(toast);
    
    // Remove after duration
    setTimeout(() => {
      // Add exit animation class
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      
      // Remove from DOM after animation
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
        
        // Process next toast in queue
        this.processQueue();
      }, 300); // Animation duration
    }, duration);
  }
  
  // Helper function to escape HTML and prevent XSS
  escapeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }
  
  // Clear all toasts
  clearAll() {
    // Clear queue
    this.queue = [];
    
    // Remove all toasts from container
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    
    this.isProcessing = false;
  }
  
  // Set default duration for toasts
  setDefaultDuration(duration) {
    this.defaultDuration = duration;
  }
}
