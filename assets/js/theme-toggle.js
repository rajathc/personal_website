// Theme toggle functionality
(function() {
    const themeToggleButtons = document.querySelectorAll('.theme-toggle');

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
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
})();
