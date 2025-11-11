// Theme toggle functionality
// Persists during session but resets on new visit
(function() {
    const themeToggleButtons = document.querySelectorAll('.theme-toggle');

    function setTheme(theme, saveToSession = false) {
        document.documentElement.setAttribute('data-theme', theme);
        if (saveToSession) {
            // Save to sessionStorage so it persists during navigation
            sessionStorage.setItem('theme', theme);
        }
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme, true); // Save to session when user manually toggles
    }

    // Add click listeners to all theme toggle buttons
    themeToggleButtons.forEach(button => {
        button.addEventListener('click', toggleTheme);
    });

    // Listen for system theme changes and update automatically
    // Only if user hasn't manually set a preference this session
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.addEventListener('change', (e) => {
        // Only auto-update if user hasn't manually chosen a theme this session
        if (!sessionStorage.getItem('theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            setTheme(newTheme, false);
        }
    });
})();
