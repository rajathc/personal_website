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
        let currentH2Li = null;
        let currentH3Ul = null;

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

            if (heading.tagName === 'H2') {
                // Add h2 to main list
                ul.appendChild(li);
                currentH2Li = li;
                currentH3Ul = null;
            } else if (heading.tagName === 'H3') {
                // Create nested list for h3 items if it doesn't exist
                if (!currentH3Ul) {
                    currentH3Ul = document.createElement('ul');
                    currentH3Ul.className = 'toc-h3-list';
                    if (currentH2Li) {
                        currentH2Li.appendChild(currentH3Ul);
                    } else {
                        // If no h2 parent, add to main list
                        ul.appendChild(li);
                        return;
                    }
                }
                currentH3Ul.appendChild(li);
            }
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
