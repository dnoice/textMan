/**
 * textMan v2 - Utility Functions
 * Common utility functions used throughout the application
 */

const Utils = {
    /**
     * Debounce function to limit function calls
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Sanitize HTML to prevent XSS
     */
    sanitizeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    },

    /**
     * Escape HTML entities
     */
    escapeHTML(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };
        return text.replace(/[&<>"'/]/g, (char) => map[char]);
    },

    /**
     * Check storage quota
     */
    async checkStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                const percentUsed = (estimate.usage / estimate.quota) * 100;
                return {
                    usage: estimate.usage,
                    quota: estimate.quota,
                    percentUsed: percentUsed.toFixed(2),
                    available: estimate.quota - estimate.usage
                };
            } catch (error) {
                console.error('Storage quota check failed:', error);
                return null;
            }
        }
        return null;
    },

    /**
     * Format bytes to human readable
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },

    /**
     * Validate file size
     */
    validateFileSize(file) {
        return file.size <= APP_CONFIG.maxFileSize;
    },

    /**
     * Safely add event listener to element by ID
     * Returns true if successful, false if element not found
     */
    addEventListenerById(elementId, eventType, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(eventType, handler);
            return true;
        }
        console.warn(`Element with ID '${elementId}' not found`);
        return false;
    }
};
