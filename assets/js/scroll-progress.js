// Scroll progress indicator
(function() {
    // Only show on post pages
    const postContent = document.querySelector('.post-content');
    if (!postContent) return;

    // Create progress bar element
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);

    // Update progress on scroll
    function updateProgress() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrolled = window.scrollY;
        const progress = (scrolled / documentHeight) * 100;

        progressBar.style.width = `${Math.min(progress, 100)}%`;
    }

    // Add scroll event listener
    window.addEventListener('scroll', updateProgress, { passive: true });

    // Initial update
    updateProgress();
})();
