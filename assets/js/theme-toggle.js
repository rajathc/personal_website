// Theme toggle functionality
// Persists across visits via localStorage
(function() {
    const themeToggleButtons = document.querySelectorAll('.theme-toggle');

    function storedTheme() {
        try { return localStorage.getItem('theme'); } catch (e) { return null; }
    }

    function updateButtons(theme) {
        const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
        themeToggleButtons.forEach(button => button.setAttribute('aria-label', label));
    }

    function setTheme(theme, save = false) {
        document.documentElement.setAttribute('data-theme', theme);
        if (save) {
            try { localStorage.setItem('theme', theme); } catch (e) {}
        }
        updateButtons(theme);
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        setTheme(currentTheme === 'light' ? 'dark' : 'light', true); // Save when user manually toggles
    }

    themeToggleButtons.forEach(button => {
        button.addEventListener('click', toggleTheme);
    });

    // Listen for system theme changes and update automatically,
    // but only if the user hasn't manually chosen a theme
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.addEventListener('change', (e) => {
        if (!storedTheme()) {
            setTheme(e.matches ? 'dark' : 'light', false);
        }
    });

    // Reflect the initial theme in the buttons' labels
    updateButtons(document.documentElement.getAttribute('data-theme'));
})();
