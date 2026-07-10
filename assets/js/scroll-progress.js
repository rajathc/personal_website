// Scroll progress indicator
(function() {
    // Only show on post pages
    const postContent = document.querySelector('.post-content');
    if (!postContent) return;

    // Create progress bar element
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);

    // Update progress on scroll. scaleX instead of width: transforms
    // composite on the GPU and never trigger layout.
    function updateProgress() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const progress = documentHeight > 0 ? window.scrollY / documentHeight : 0;

        progressBar.style.transform = `scaleX(${Math.min(progress, 1)})`;
    }

    // Add scroll event listener
    window.addEventListener('scroll', updateProgress, { passive: true });

    // Initial update
    updateProgress();
})();
