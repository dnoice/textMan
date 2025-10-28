/**
 * textMan v2 - Theme Manager
 * Handles light/dark theme switching
 */

const ThemeManager = {
    /**
     * Initialize theme from storage or system preference
     */
    init() {
        const savedTheme = Storage.load('theme');
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        this.setTheme(savedTheme || systemTheme);

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!Storage.load('theme')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    },

    /**
     * Set theme
     */
    setTheme(theme) {
        APP_STATE.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        Storage.save('theme', theme);
        this.updateThemeIcon();
    },

    /**
     * Toggle between light and dark theme
     */
    toggle() {
        const newTheme = APP_STATE.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        Toast.show('Theme Changed', `Switched to ${newTheme} mode`, 'success');
    },

    /**
     * Update theme toggle icon
     */
    updateThemeIcon() {
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.innerHTML = APP_STATE.theme === 'light'
                ? '<i class="fas fa-moon"></i>'
                : '<i class="fas fa-sun"></i>';
        }
    }
};
