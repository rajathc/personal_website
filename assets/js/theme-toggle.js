// Theme toggle functionality
// Always follows system preference with option to toggle temporarily
(function() {
    const themeToggleButtons = document.querySelectorAll('.theme-toggle');

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        // No localStorage - temporary only
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    }

    // Add click listeners to all theme toggle buttons
    themeToggleButtons.forEach(button => {
        button.addEventListener('click', toggleTheme);
    });

    // Listen for system theme changes and update automatically
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeQuery.addEventListener('change', (e) => {
        const newTheme = e.matches ? 'dark' : 'light';
        setTheme(newTheme);
    });
})();
