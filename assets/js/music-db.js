// Music DB (Jukebox): grid/list views, filtering, and release-style song modal
(function() {
    const dataEl = document.getElementById('music-data');
    const listEl = document.getElementById('music-list');
    if (!dataEl || !listEl) return; // Not on the jukebox

    const songUrl = id => `/jukebox/${id}/`;

    // Phosphor icon paths (viewBox 0 0 256 256) — only the ones actually rendered
    const ICONS = {
        waveform: "M56,96v64a8,8,0,0,1-16,0V96a8,8,0,0,1,16,0ZM88,24a8,8,0,0,0-8,8V224a8,8,0,0,0,16,0V32A8,8,0,0,0,88,24Zm40,32a8,8,0,0,0-8,8V192a8,8,0,0,0,16,0V64A8,8,0,0,0,128,56Zm40,32a8,8,0,0,0-8,8v64a8,8,0,0,0,16,0V96A8,8,0,0,0,168,88Zm40-16a8,8,0,0,0-8,8v96a8,8,0,0,0,16,0V80A8,8,0,0,0,208,72Z",
        thumbsUp: "M234,80.12A24,24,0,0,0,216,72H160V56a40,40,0,0,0-40-40,8,8,0,0,0-7.16,4.42L75.06,96H32a16,16,0,0,0-16,16v88a16,16,0,0,0,16,16H204a24,24,0,0,0,23.82-21l12-96A24,24,0,0,0,234,80.12ZM32,112H72v88H32ZM223.94,97l-12,96a8,8,0,0,1-7.94,7H88V105.89l36.71-73.43A24,24,0,0,1,144,56V80a8,8,0,0,0,8,8h64a8,8,0,0,1,7.94,9Z"
    };

    const songs = JSON.parse(dataEl.textContent);
    const countEl = document.getElementById('music-count');
    const genreEl = document.getElementById('music-genre');
    const langEl = document.getElementById('music-language');
    const sortEl = document.getElementById('music-sort');
    const recEl = document.getElementById('music-rec');

    function icon(name, cls) {
        return `<svg class="music-icon ${cls || ''}" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false"><path d="${ICONS[name]}"/></svg>`;
    }

    const maxRating = s => Math.max(...s.listens.map(l => l.rating));

    function fillSelect(el, values) {
        [...new Set(values)].sort().forEach(v => {
            const opt = document.createElement('option');
            opt.value = v;
            opt.textContent = v;
            el.appendChild(opt);
        });
    }
    fillSelect(genreEl, songs.map(s => s.genre));
    fillSelect(langEl, songs.map(s => s.language));

    function esc(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Star glyphs with a visually half-filled star: 4.5 -> four stars + half
    function stars(rating) {
        const full = '★'.repeat(Math.floor(rating));
        const half = rating % 1 >= 0.25 ? '<span class="music-star-half">★</span>' : '';
        return `<span class="music-stars" role="img" aria-label="Rated ${rating} out of 5">${full}${half}</span>`;
    }

    function initials(title) {
        return title.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    }

    function disc(song, cls) {
        return `<span class="music-disc ${cls || ''}" aria-hidden="true"><span class="music-disc-label">${esc(initials(song.title))}</span></span>`;
    }

    // Album art with the vinyl disc as fallback. Table rows render at 44px,
    // so they get the small WebP thumb, not the 400px art.
    function art(song, cls) {
        if (song.art) {
            const thumb = song.art.replace('/images/music/', '/images/music/thumbs/').replace(/\.jpg$/, '.webp');
            return `<img class="music-art ${cls || ''}" src="${thumb}" alt="" loading="lazy" width="132" height="132">`;
        }
        return disc(song, cls);
    }

    // List rows show the double-D icon alone; song pages keep the full lockup
    function dolbyMark(cls) {
        return `<svg class="music-dolby ${cls || ''}" role="img" aria-label="Dolby Atmos"><use href="#dolby-icon-mark"/></svg>`;
    }

    function rowFlags(s) {
        let out = '';
        if (s.recommend) out += `<span class="music-flag" title="Recommended">${icon('thumbsUp')}<span class="visually-hidden">Recommended</span></span>`;
        if (s.listens.some(l => l.hiFi)) out += `<span class="music-flag" title="Felt hi-fi: sounds great on a high-fidelity setup">${icon('waveform')}<span class="visually-hidden">Hi-Fi</span></span>`;
        if (s.listens.some(l => l.dolbyAtmos)) out += `<span class="music-flag" title="Dolby Atmos">${dolbyMark('music-dolby-sm')}</span>`;
        return out;
    }

    function filteredSongs() {
        const genre = genreEl.value, lang = langEl.value;
        const recOnly = recEl.checked;

        let filtered = songs.filter(s => {
            if (genre && s.genre !== genre) return false;
            if (lang && s.language !== lang) return false;
            if (recOnly && !s.recommend) return false;
            return true;
        });

        const sort = sortEl.value;
        if (sort === 'rating') filtered.sort((a, b) => maxRating(b) - maxRating(a));
        else if (sort === 'title') filtered.sort((a, b) => a.title.localeCompare(b.title));
        else if (sort === 'year') filtered.sort((a, b) => b.year - a.year);
        else filtered.sort((a, b) => a.serial - b.serial);
        return filtered;
    }

    function renderList(filtered) {
        listEl.innerHTML = filtered.map(s => `
            <tr class="music-row" data-id="${s.id}">
                <td class="music-td-song">
                    <a class="music-row-btn" href="${songUrl(s.id)}">
                        ${art(s, 'music-art-mini')}
                        <span class="music-song-text">
                            <span class="music-song-title">${esc(s.title)}</span>
                            <span class="music-song-artist">${esc(s.artist)}</span>
                        </span>
                    </a>
                </td>
                <td class="music-td-album">${esc(s.album)}</td>
                <td class="music-td-language">${esc(s.language)}</td>
                <td class="music-td-rating">${stars(maxRating(s))}</td>
                <td class="music-td-flags"><span class="music-row-flags">${rowFlags(s)}</span></td>
            </tr>`).join('');
    }

    function renderEmpty() {
        listEl.innerHTML = `
            <tr class="music-empty-row"><td colspan="5">
                <p class="empty-state">No songs match. <button type="button" class="empty-reset">Show everything</button></p>
            </td></tr>`;
        listEl.querySelector('.empty-reset').addEventListener('click', () => {
            genreEl.value = '';
            langEl.value = '';
            recEl.checked = false;
            sortEl.value = 'serial';
            render();
        });
    }

    // On the standalone /jukebox/ page, filters live in the URL hash so a
    // filtered view can be shared; the homepage tab keeps its #jukebox hash.
    const panel = listEl.closest('.tab-content');
    const standalone = !panel;

    function syncHash() {
        if (!standalone) return;
        const p = new URLSearchParams();
        if (genreEl.value) p.set('genre', genreEl.value);
        if (langEl.value) p.set('lang', langEl.value);
        if (recEl.checked) p.set('rec', '1');
        if (sortEl.value !== 'serial') p.set('sort', sortEl.value);
        const s = p.toString();
        history.replaceState(null, '', s ? `#${s}` : window.location.pathname);
    }

    function readHash() {
        if (!standalone || window.location.hash.length < 2) return;
        const p = new URLSearchParams(window.location.hash.slice(1));
        if (p.get('genre')) genreEl.value = p.get('genre');
        if (p.get('lang')) langEl.value = p.get('lang');
        if (p.get('rec')) recEl.checked = true;
        if (p.get('sort')) sortEl.value = p.get('sort');
    }

    function render() {
        const filtered = filteredSongs();
        countEl.textContent = `${filtered.length} of ${songs.length} songs`;
        if (filtered.length) renderList(filtered);
        else renderEmpty();
        syncHash();
    }

    // Whole table row is clickable (the title link handles keyboard access)
    listEl.addEventListener('click', e => {
        if (e.target.closest('a')) return;
        const row = e.target.closest('.music-row');
        if (row) window.location.href = songUrl(row.dataset.id);
    });

    [genreEl, langEl, sortEl, recEl].forEach(el => el.addEventListener('change', render));

    // Legacy deep links: /jukebox/#song-id redirects to the song page.
    // This MUST run before any hash reading/syncing rewrites the URL.
    const linked = songs.find(s => `#${s.id}` === window.location.hash);
    if (linked) {
        window.location.replace(songUrl(linked.id));
        return;
    }

    const hasHashFilters = standalone && window.location.hash.length > 1;
    readHash();

    if (panel && !panel.classList.contains('active')) {
        // Homepage: the table lives in a hidden tab panel; defer the first
        // render until the tab is actually opened.
        panel.addEventListener('tab-shown', render, { once: true });
    } else if (standalone && !hasHashFilters) {
        // /jukebox/ ships server-rendered rows in default order; leave them
        // in place and only re-render when a filter changes.
    } else {
        render();
    }
})();
