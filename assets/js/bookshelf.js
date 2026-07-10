// Bookshelf: cover wall + reading log, filtering and sorting
(function() {
    const dataEl = document.getElementById('book-data');
    const logEl = document.getElementById('book-log');
    if (!dataEl || !logEl) return; // Not on the bookshelf

    const books = JSON.parse(dataEl.textContent).filter(b => b.status !== 'reading');
    const countEl = document.getElementById('book-count');
    const ratingEl = document.getElementById('book-rating');
    const sortEl = document.getElementById('book-sort');
    function esc(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function stars(rating) {
        if (!rating) return '<span class="book-unrated">unrated</span>';
        return `<span class="music-stars" role="img" aria-label="Rated ${rating} out of 5">${'★'.repeat(rating)}</span>`;
    }

    function formatDate(iso, withYear) {
        if (!iso) return '';
        if (iso.length === 4) return withYear ? iso : ''; // year-only dates group under the year but show no day
        const d = new Date(iso + 'T00:00:00');
        return d.toLocaleDateString('en-GB', withYear
            ? { day: 'numeric', month: 'short', year: 'numeric' }
            : { day: 'numeric', month: 'short' });
    }

    function filtered() {
        const minRating = ratingEl.value;
        let out = books.filter(b => {
            if (minRating && b.rating !== parseInt(minRating, 10)) return false;
            return true;
        });
        const sort = sortEl.value;
        if (sort === 'rating') out.sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title));
        else if (sort === 'title') out.sort((a, b) => a.title.localeCompare(b.title));
        else if (sort === 'author') out.sort((a, b) => a.author.localeCompare(b.author) || a.title.localeCompare(b.title));
        else out.sort((a, b) => (b.dateRead || '0').localeCompare(a.dateRead || '0') || a.title.localeCompare(b.title));
        return out;
    }

    // Rows render at 34px, so they get the small WebP thumb, and alt is empty
    // because the row link already contains the title as text.
    function cover(b, lazy) {
        const thumb = b.cover.replace('/images/books/', '/images/books/thumbs/').replace(/\.jpg$/, '.webp');
        return `<img class="book-cover" src="${thumb}" alt="" loading="${lazy ? 'lazy' : 'eager'}" width="120" height="180">`;
    }

    function row(b, withYear) {
        const date = formatDate(b.dateRead, withYear);
        return `
                <a class="book-log-row" href="${b.goodreads}" target="_blank" rel="noopener">
                    ${cover(b, true)}
                    <span class="book-log-text">
                        <span class="book-log-title">${esc(b.title)}${b.series ? ` <span class="book-log-series">(${esc(b.series)})</span>` : ''}</span>
                        <span class="book-log-author">${esc(b.author)}</span>
                    </span>
                    <span class="book-log-side">
                        ${stars(b.rating)}
                        ${date ? `<span class="book-log-date">${date}</span>` : ''}
                    </span>
                    <span class="visually-hidden">(Goodreads, opens in new tab)</span>
                </a>`;
    }

    function renderLog(list, sort) {
        // The default (recently read) sort groups by year; the other sorts
        // are a flat list, with the year folded into the date chip instead
        if (sort && sort !== 'read') {
            logEl.innerHTML = `<section class="book-year">${list.map(b => row(b, true)).join('')}</section>`;
            return;
        }
        const groups = new Map();
        for (const b of list) {
            const key = b.dateRead ? b.dateRead.slice(0, 4) : 'Before I kept dates';
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(b);
        }
        const keys = [...groups.keys()].sort((a, b) => {
            if (a === 'Before I kept dates') return 1;
            if (b === 'Before I kept dates') return -1;
            return b.localeCompare(a);
        });
        logEl.innerHTML = keys.map(year => `
            <section class="book-year">
                <h2 class="book-year-title">${year} <span class="book-year-count">· ${groups.get(year).length} book${groups.get(year).length === 1 ? '' : 's'}</span></h2>
                ${groups.get(year).map(b => row(b, false)).join('')}
            </section>`).join('');
    }

    function renderEmpty() {
        logEl.innerHTML = `
            <p class="empty-state">Nothing on the shelf matches. <button type="button" class="empty-reset">Show everything</button></p>`;
        logEl.querySelector('.empty-reset').addEventListener('click', () => {
            ratingEl.value = '';
            sortEl.value = 'read';
            render();
        });
    }

    // On the standalone /bookshelf/ page, filters live in the URL hash so a
    // filtered view can be shared; the homepage tab keeps its #bookshelf hash.
    const panel = logEl.closest('.tab-content');
    const standalone = !panel;

    function syncHash() {
        if (!standalone) return;
        const p = new URLSearchParams();
        if (ratingEl.value) p.set('rating', ratingEl.value);
        if (sortEl.value !== 'read') p.set('sort', sortEl.value);
        const s = p.toString();
        history.replaceState(null, '', s ? `#${s}` : window.location.pathname);
    }

    if (standalone && window.location.hash.length > 1) {
        const p = new URLSearchParams(window.location.hash.slice(1));
        if (p.get('rating')) ratingEl.value = p.get('rating');
        if (p.get('sort')) sortEl.value = p.get('sort');
    }

    function render() {
        const list = filtered();
        const fives = list.filter(b => b.rating === 5).length;
        countEl.textContent = `${list.length} of ${books.length} books · ${fives} five-star${fives === 1 ? '' : 's'}`;
        if (list.length) renderLog(list, sortEl.value);
        else renderEmpty();
        syncHash();
    }

    [ratingEl, sortEl].forEach(el => el.addEventListener('change', render));

    // On the homepage this list lives in a hidden tab panel; building 178 rows
    // there at load costs real main-thread time, so defer to first activation.
    if (panel && !panel.classList.contains('active')) {
        panel.addEventListener('tab-shown', render, { once: true });
    } else {
        render();
    }
})();
