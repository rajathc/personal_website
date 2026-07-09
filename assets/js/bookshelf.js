// Bookshelf: cover wall + reading log, filtering and sorting
(function() {
    const dataEl = document.getElementById('book-data');
    const wallEl = document.getElementById('book-wall');
    const logEl = document.getElementById('book-log');
    if (!dataEl || !wallEl || !logEl) return; // Not on the bookshelf

    const books = JSON.parse(dataEl.textContent).filter(b => b.status !== 'reading');
    const countEl = document.getElementById('book-count');
    const searchEl = document.getElementById('book-search');
    const ratingEl = document.getElementById('book-rating');
    const sortEl = document.getElementById('book-sort');
    const viewWallBtn = document.getElementById('book-view-wall');
    const viewLogBtn = document.getElementById('book-view-log');

    let view = 'wall';
    try { view = localStorage.getItem('bookshelf-view') || 'wall'; } catch (e) {}

    function esc(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function stars(rating) {
        if (!rating) return '<span class="book-unrated">unrated</span>';
        return `<span class="music-stars" role="img" aria-label="Rated ${rating} out of 5">${'★'.repeat(rating)}</span>`;
    }

    function formatDate(iso) {
        if (!iso) return '';
        const d = new Date(iso + 'T00:00:00');
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }

    function filtered() {
        const q = searchEl.value.trim().toLowerCase();
        const minRating = ratingEl.value;
        let out = books.filter(b => {
            if (q && !`${b.title} ${b.author} ${b.series}`.toLowerCase().includes(q)) return false;
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

    function cover(b, lazy) {
        const title = b.series ? `${b.title} (${b.series})` : b.title;
        return `<img class="book-cover" src="${b.cover}" alt="Cover of ${esc(title)}" loading="${lazy ? 'lazy' : 'eager'}" width="240" height="360">`;
    }

    function renderWall(list) {
        wallEl.innerHTML = list.map((b, i) => `
            <li class="book-tile">
                <a href="${b.goodreads}" target="_blank" rel="noopener" title="${esc(b.title)} — ${esc(b.author)}">
                    ${cover(b, i > 11)}
                    <span class="book-tile-meta">${stars(b.rating)}</span>
                    <span class="visually-hidden">${esc(b.title)} by ${esc(b.author)}</span>
                </a>
            </li>`).join('');
    }

    function renderLog(list) {
        // Group by year read; undated books at the end
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
                <h2 class="book-year-title">${year}</h2>
                ${groups.get(year).map(b => `
                <a class="book-log-row" href="${b.goodreads}" target="_blank" rel="noopener">
                    ${cover(b, true)}
                    <span class="book-log-text">
                        <span class="book-log-title">${esc(b.title)}${b.series ? ` <span class="book-log-series">(${esc(b.series)})</span>` : ''}</span>
                        <span class="book-log-author">${esc(b.author)}</span>
                    </span>
                    <span class="book-log-side">
                        ${stars(b.rating)}
                        ${b.dateRead ? `<span class="book-log-date">${formatDate(b.dateRead)}</span>` : ''}
                    </span>
                </a>`).join('')}
            </section>`).join('');
    }

    function render() {
        const list = filtered();
        const fives = list.filter(b => b.rating === 5).length;
        countEl.textContent = `${list.length} of ${books.length} books · ${fives} five-star${fives === 1 ? '' : 's'}`;
        if (view === 'wall') { renderWall(list); logEl.innerHTML = ''; }
        else { renderLog(list); wallEl.innerHTML = ''; }
        wallEl.hidden = view !== 'wall';
        logEl.hidden = view !== 'log';
        viewWallBtn.setAttribute('aria-pressed', view === 'wall');
        viewLogBtn.setAttribute('aria-pressed', view === 'log');
    }

    function setView(v) {
        view = v;
        try { localStorage.setItem('bookshelf-view', v); } catch (e) {}
        render();
    }
    viewWallBtn.addEventListener('click', () => setView('wall'));
    viewLogBtn.addEventListener('click', () => setView('log'));

    [searchEl, ratingEl, sortEl].forEach(el =>
        el.addEventListener(el === searchEl ? 'input' : 'change', render));

    render();
})();
