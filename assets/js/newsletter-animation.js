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

    // The form itself posts to Buttondown in a new tab (target=_blank in
    // footer.html). Buttondown's docs say not to fetch() that endpoint:
    // readers sometimes have to pass a CAPTCHA or fix a typo on its page,
    // and an opaque no-cors response hid both. So this only points the
    // reader at that tab. The browser has already validated the address
    // before 'submit' fires. Nothing is hidden or disabled, so focus stays
    // on the field or button the reader used, and the form is still there
    // if they closed the tab and want to try again. The status element is
    // in the page and empty from load, so the new text is announced.
    const doneMsg = document.querySelector('.newsletter-done');
    if (!doneMsg) return;
    newsletterForm.addEventListener('submit', () => {
        doneMsg.textContent = 'Finish signing up in the new tab, then check your inbox to confirm. Talk soon.';
    });
})();
