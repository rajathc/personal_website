// Animate newsletter form border when footer comes into view
(function() {
    const footer = document.querySelector('.site-footer');
    const newsletterForm = document.querySelector('.newsletter-form');

    if (!footer || !newsletterForm) return;

    let hasAnimated = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Trigger animation when footer is visible and hasn't animated yet
            if (entry.isIntersecting && !hasAnimated) {
                hasAnimated = true;
                newsletterForm.classList.add('animate-border');

                // Remove class after animation completes (5 seconds)
                setTimeout(() => {
                    newsletterForm.classList.remove('animate-border');
                }, 5000);

                // Disconnect observer after first animation
                observer.disconnect();
            }
        });
    }, {
        threshold: 0.3 // Trigger when 30% of footer is visible
    });

    observer.observe(footer);

    // Submit inline instead of the old popup window: post to Buttondown's
    // embed endpoint and confirm right where the reader is standing.
    const doneMsg = document.querySelector('.newsletter-done');
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const button = newsletterForm.querySelector('button');
        button.disabled = true;
        fetch(newsletterForm.action, {
            method: 'POST',
            mode: 'no-cors', // opaque response; Buttondown still records the signup
            body: new FormData(newsletterForm),
        }).then(() => {
            newsletterForm.hidden = true;
            if (doneMsg) doneMsg.hidden = false;
        }).catch(() => {
            // Network failed: fall back to Buttondown's own page
            window.open('https://buttondown.com/rajath', '_blank', 'noopener');
            button.disabled = false;
        });
    });
})();
