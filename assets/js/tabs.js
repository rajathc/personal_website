// Tab switching functionality
(function() {
    const tabButtons = Array.from(document.querySelectorAll('.tab-button'));

    if (tabButtons.length === 0) return; // Not on a page with tabs

    function activateTab(button, updateHash = true) {
        const tabName = button.getAttribute('data-tab');

        tabButtons.forEach(btn => {
            const active = btn === button;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
            btn.setAttribute('tabindex', active ? '0' : '-1');
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        const targetTab = document.getElementById(`${tabName}-tab`);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // Keep the URL shareable (e.g. /#bookshelf) without adding history entries
        if (updateHash) {
            const url = tabName === 'writings'
                ? window.location.pathname + window.location.search
                : `#${tabName}`;
            history.replaceState(null, '', url);
        }
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => activateTab(button));

        // Left/Right arrow keys move between tabs (standard tablist behavior)
        button.addEventListener('keydown', (e) => {
            if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
            e.preventDefault();
            const i = tabButtons.indexOf(button);
            const next = e.key === 'ArrowRight'
                ? (i + 1) % tabButtons.length
                : (i - 1 + tabButtons.length) % tabButtons.length;
            tabButtons[next].focus();
            activateTab(tabButtons[next]);
        });
    });

    // Open the tab named in the URL hash (e.g. #bookshelf), else normalize the default
    const hashTab = tabButtons.find(btn => `#${btn.getAttribute('data-tab')}` === window.location.hash);
    const initial = hashTab || tabButtons.find(btn => btn.classList.contains('active')) || tabButtons[0];
    activateTab(initial, false);
})();
