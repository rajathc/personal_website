// Table of Contents drawer functionality
(function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const tocDrawer = document.getElementById('toc-drawer');
    const tocClose = document.querySelector('.toc-close');
    const tocOverlay = document.querySelector('.toc-overlay');

    if (!menuToggle || !tocDrawer) return; // Not on a post page

    // Generate TOC from post content headings
    function generateTOC() {
        const postContent = document.querySelector('.post-content');
        if (!postContent) return;

        const headings = postContent.querySelectorAll('h2, h3');
        if (headings.length === 0) return;

        const tocNav = document.querySelector('.toc-nav');
        const ul = document.createElement('ul');

        headings.forEach((heading, index) => {
            // Add ID to heading if it doesn't have one
            if (!heading.id) {
                heading.id = `heading-${index}`;
            }

            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${heading.id}`;
            a.textContent = heading.textContent;
            a.addEventListener('click', function(e) {
                e.preventDefault();
                heading.scrollIntoView({ behavior: 'smooth' });
                closeDrawer();
            });

            li.appendChild(a);
            ul.appendChild(li);
        });

        tocNav.appendChild(ul);
    }

    function openDrawer() {
        tocDrawer.classList.add('open');
        document.body.style.overflow = 'hidden';
        // Switch icons
        const closedIcon = document.querySelector('.menu-closed-icon');
        const openIcon = document.querySelector('.menu-open-icon');
        if (closedIcon && openIcon) {
            closedIcon.style.display = 'none';
            openIcon.style.display = 'block';
        }
    }

    function closeDrawer() {
        tocDrawer.classList.remove('open');
        document.body.style.overflow = '';
        // Switch icons back
        const closedIcon = document.querySelector('.menu-closed-icon');
        const openIcon = document.querySelector('.menu-open-icon');
        if (closedIcon && openIcon) {
            closedIcon.style.display = 'block';
            openIcon.style.display = 'none';
        }
    }

    // Event listeners
    menuToggle.addEventListener('click', openDrawer);
    tocClose.addEventListener('click', closeDrawer);
    tocOverlay.addEventListener('click', closeDrawer);

    // Generate TOC on page load
    generateTOC();
})();
