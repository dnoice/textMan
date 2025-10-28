/**
 * textMan v2 - Local Storage Manager
 * Handles all localStorage operations
 */

const Storage = {
    /**
     * Save data to localStorage
     */
    save(key, data) {
        try {
            localStorage.setItem(`${APP_CONFIG.name}_${key}`, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Storage save error:', error);

            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                Toast?.show('Storage Full', 'Local storage is full. Consider exporting your data.', 'error');
            } else {
                Toast?.show('Storage Error', 'Failed to save data locally', 'error');
            }
            return false;
        }
    },

    /**
     * Load data from localStorage
     */
    load(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(`${APP_CONFIG.name}_${key}`);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage load error:', error);
            return defaultValue;
        }
    },

    /**
     * Remove item from localStorage
     */
    remove(key) {
        try {
            localStorage.removeItem(`${APP_CONFIG.name}_${key}`);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },

    /**
     * Clear all app data
     */
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(`${APP_CONFIG.name}_`)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
};
