// Music DB: filtering, sorting, and song detail modal
(function() {
    const dataEl = document.getElementById('music-data');
    const listEl = document.getElementById('music-list');
    if (!dataEl || !listEl) return; // Not on the music page

    // Phosphor icon paths (viewBox 0 0 256 256)
    const ICONS = {
        headphones: "M201.89,54.66A103.43,103.43,0,0,0,128.79,24H128A104,104,0,0,0,24,128v56a24,24,0,0,0,24,24H64a24,24,0,0,0,24-24V144a24,24,0,0,0-24-24H40.36A88,88,0,0,1,128,40h.67a87.71,87.71,0,0,1,87,80H192a24,24,0,0,0-24,24v40a24,24,0,0,0,24,24h16a24,24,0,0,0,24-24V128A103.41,103.41,0,0,0,201.89,54.66ZM64,136a8,8,0,0,1,8,8v40a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V136Zm152,48a8,8,0,0,1-8,8H192a8,8,0,0,1-8-8V144a8,8,0,0,1,8-8h24Z",
        deviceMobile: "M176,16H80A24,24,0,0,0,56,40V216a24,24,0,0,0,24,24h96a24,24,0,0,0,24-24V40A24,24,0,0,0,176,16ZM72,64H184V192H72Zm8-32h96a8,8,0,0,1,8,8v8H72V40A8,8,0,0,1,80,32Zm96,192H80a8,8,0,0,1-8-8v-8H184v8A8,8,0,0,1,176,224Z",
        laptop: "M232,168h-8V72a24,24,0,0,0-24-24H56A24,24,0,0,0,32,72v96H24a8,8,0,0,0-8,8v16a24,24,0,0,0,24,24H216a24,24,0,0,0,24-24V176A8,8,0,0,0,232,168ZM48,72a8,8,0,0,1,8-8H200a8,8,0,0,1,8,8v96H48ZM224,192a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8v-8H224ZM152,88a8,8,0,0,1-8,8H112a8,8,0,0,1,0-16h32A8,8,0,0,1,152,88Z",
        vinylRecord: "M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm0-144a56.06,56.06,0,0,0-56,56,8,8,0,0,1-16,0,72.08,72.08,0,0,1,72-72,8,8,0,0,1,0,16Zm72,56a72.08,72.08,0,0,1-72,72,8,8,0,0,1,0-16,56.06,56.06,0,0,0,56-56,8,8,0,0,1,16,0Zm-40,0a32,32,0,1,0-32,32A32,32,0,0,0,160,128Zm-48,0a16,16,0,1,1,16,16A16,16,0,0,1,112,128Z",
        musicNotes: "M212.92,17.69a8,8,0,0,0-6.86-1.45l-128,32A8,8,0,0,0,72,56V166.08A36,36,0,1,0,88,196V110.25l112-28v51.83A36,36,0,1,0,216,164V24A8,8,0,0,0,212.92,17.69ZM52,216a20,20,0,1,1,20-20A20,20,0,0,1,52,216ZM88,93.75V62.25l112-28v31.5ZM180,184a20,20,0,1,1,20-20A20,20,0,0,1,180,184Z",
        globeSimple: "M128,24h0A104,104,0,1,0,232,128,104.12,104.12,0,0,0,128,24Zm87.62,96H175.79C174,83.49,159.94,57.67,148.41,42.4A88.19,88.19,0,0,1,215.63,120ZM96.23,136h63.54c-2.31,41.61-22.23,67.11-31.77,77C118.45,203.1,98.54,177.6,96.23,136Zm0-16C98.54,78.39,118.46,52.89,128,43c9.55,9.93,29.46,35.43,31.77,77Zm11.36-77.6C96.06,57.67,82,83.49,80.21,120H40.37A88.19,88.19,0,0,1,107.59,42.4ZM40.37,136H80.21c1.82,36.51,15.85,62.33,27.38,77.6A88.19,88.19,0,0,1,40.37,136Zm108,77.6c11.53-15.27,25.56-41.09,27.38-77.6h39.84A88.19,88.19,0,0,1,148.41,213.6Z",
        tag: "M243.31,136,144,36.69A15.86,15.86,0,0,0,132.69,32H40a8,8,0,0,0-8,8v92.69A15.86,15.86,0,0,0,36.69,144L136,243.31a16,16,0,0,0,22.63,0l84.68-84.68a16,16,0,0,0,0-22.63Zm-96,96L48,132.69V48h84.69L232,147.31ZM96,84A12,12,0,1,1,84,72,12,12,0,0,1,96,84Z",
        waveform: "M56,96v64a8,8,0,0,1-16,0V96a8,8,0,0,1,16,0ZM88,24a8,8,0,0,0-8,8V224a8,8,0,0,0,16,0V32A8,8,0,0,0,88,24Zm40,32a8,8,0,0,0-8,8V192a8,8,0,0,0,16,0V64A8,8,0,0,0,128,56Zm40,32a8,8,0,0,0-8,8v64a8,8,0,0,0,16,0V96A8,8,0,0,0,168,88Zm40-16a8,8,0,0,0-8,8v96a8,8,0,0,0,16,0V80A8,8,0,0,0,208,72Z",
        calendarBlank: "M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z",
        thumbsUp: "M234,80.12A24,24,0,0,0,216,72H160V56a40,40,0,0,0-40-40,8,8,0,0,0-7.16,4.42L75.06,96H32a16,16,0,0,0-16,16v88a16,16,0,0,0,16,16H204a24,24,0,0,0,23.82-21l12-96A24,24,0,0,0,234,80.12ZM32,112H72v88H32ZM223.94,97l-12,96a8,8,0,0,1-7.94,7H88V105.89l36.71-73.43A24,24,0,0,1,144,56V80a8,8,0,0,0,8,8h64a8,8,0,0,1,7.94,9Z",
        magnifyingGlass: "M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z",
        user: "M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"
    };

    const songs = JSON.parse(dataEl.textContent);
    const countEl = document.getElementById('music-count');
    const searchEl = document.getElementById('music-search');
    const genreEl = document.getElementById('music-genre');
    const langEl = document.getElementById('music-language');
    const sortEl = document.getElementById('music-sort');
    const recEl = document.getElementById('music-rec');
    const modal = document.getElementById('music-modal');
    const modalBody = document.getElementById('music-modal-body');
    const modalClose = modal.querySelector('.music-modal-close');
    const modalOverlay = modal.querySelector('.music-modal-overlay');
    let lastFocused = null;

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

    // Star glyphs with a visually half-filled star: 4.5 -> ★★★★ + half
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

    // Album art with the vinyl disc as fallback
    function art(song, cls) {
        if (song.art) {
            return `<img class="music-art ${cls || ''}" src="${song.art}" alt="" loading="lazy" width="400" height="400">`;
        }
        return disc(song, cls === 'music-art-lg' ? 'music-disc-lg' : 'music-disc-mini');
    }

    function dolbyMark(cls) {
        return `<svg class="music-dolby ${cls || ''}" role="img" aria-label="Dolby Atmos"><use href="#dolby-atmos-mark"/></svg>`;
    }

    function rowFlags(s) {
        let out = '';
        if (s.recommend) out += `<span class="music-flag" title="Recommended">${icon('thumbsUp')}<span class="visually-hidden">Recommended</span></span>`;
        if (s.listens.some(l => l.hiFi)) out += `<span class="music-flag" title="Felt hi-fi: sounds great on a high-fidelity setup">${icon('waveform')}<span class="visually-hidden">Hi-Fi</span></span>`;
        if (s.listens.some(l => l.dolbyAtmos)) out += `<span class="music-flag" title="Dolby Atmos">${dolbyMark('music-dolby-sm')}</span>`;
        return out;
    }

    function render() {
        const q = searchEl.value.trim().toLowerCase();
        const genre = genreEl.value, lang = langEl.value;
        const recOnly = recEl.checked;

        let filtered = songs.filter(s => {
            if (q && !`${s.title} ${s.artist} ${s.album}`.toLowerCase().includes(q)) return false;
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

        countEl.textContent = `${filtered.length} of ${songs.length} songs`;
        listEl.innerHTML = filtered.map(s => `
            <tr class="music-row" data-id="${s.id}">
                <td class="music-td-song">
                    <button class="music-row-btn" data-id="${s.id}" aria-haspopup="dialog">
                        ${art(s)}
                        <span class="music-song-text">
                            <span class="music-song-title">${esc(s.title)}</span>
                            <span class="music-song-artist">${esc(s.artist)}</span>
                        </span>
                    </button>
                </td>
                <td class="music-td-album">${esc(s.album)}</td>
                <td class="music-td-language">${esc(s.language)}</td>
                <td class="music-td-rating">${stars(maxRating(s))}</td>
                <td class="music-td-flags"><span class="music-row-flags">${rowFlags(s)}</span></td>
            </tr>`).join('');
    }

    function formatDate(iso) {
        if (!iso) return '';
        const d = new Date(iso + 'T00:00:00');
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function sourceIcon(source) {
        return /macbook|laptop|mac\b/i.test(source) ? 'laptop' : 'deviceMobile';
    }

    // "16/44" -> "16-bit / 44.1 kHz"
    function formatBitRate(br) {
        const m = (br || '').match(/^(\d+)\/(\d+)$/);
        if (!m) return br || '';
        const khz = m[2] === '44' ? '44.1' : m[2];
        return `${m[1]}-bit / ${khz} kHz`;
    }

    // Discogs-style listens table: Setup | Quality | Date | Rating
    function listenTable(listens) {
        const rows = listens.map(l => {
            const quality = [];
            if (l.bitRate) quality.push(esc(formatBitRate(l.bitRate)));
            if (l.hiFi) quality.push('<span title="Felt hi-fi: sounds great on a high-fidelity setup">Hi-Fi</span>');
            if (l.dolbyAtmos) quality.push(dolbyMark());
            return `
                <tr>
                    <td class="music-lt-setup">
                        <span class="music-listen-chain">
                            <span class="music-listen-node">${icon(sourceIcon(l.source))}${esc(l.source)} <span class="music-listen-arrow" aria-hidden="true">→</span></span>
                            <span class="music-listen-node">${icon('headphones')}${esc(l.receiver)}</span>
                        </span>
                        ${quality.length ? `<span class="music-lt-quality">${quality.join(' · ')}</span>` : ''}
                    </td>
                    <td class="music-lt-date">${l.date ? esc(formatDate(l.date)) : ''}</td>
                    <td class="music-lt-rating">${stars(l.rating)}</td>
                </tr>`;
        }).join('');
        return `
            <table class="music-listen-table">
                <thead>
                    <tr><th>Setup</th><th>Date</th><th>Rating</th></tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>`;
    }

    function pointerList(pointers) {
        return `<ul class="music-pointers">${pointers.map(p =>
            `<li class="music-pointer music-pointer-${p.type}"><span class="music-pointer-sign" aria-hidden="true">${p.type === 'plus' ? '+' : '−'}</span>${esc(p.text)}</li>`
        ).join('')}</ul>`;
    }

    function openModal(song) {
        lastFocused = document.activeElement;
        modalBody.innerHTML = `
            <div class="music-modal-header">
                ${art(song, 'music-art-lg')}
                <div class="music-modal-headmeta">
                    <h2 class="music-modal-title" id="music-modal-title">${esc(song.title)}</h2>
                    <p class="music-modal-artist">${esc(song.artist)}</p>
                    <p class="music-modal-meta">${esc(song.album)} · ${song.year} · ${esc(song.genre)} · ${esc(song.language)}${song.composer ? `<br>Music by ${esc(song.composer)}` : ''}</p>
                    <p class="music-modal-rating">${stars(maxRating(song))}${song.recommend ? `<span class="music-modal-rec">${icon('thumbsUp')} Recommended</span>` : ''}</p>
                </div>
            </div>
            <div class="music-review">
                <p class="music-review-text">${esc(song.summary)}</p>
                ${pointerList(song.pointers)}
            </div>
            <h3 class="music-label">When I listened</h3>
            ${listenTable(song.listens)}`;
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        history.replaceState(null, '', `#${song.id}`);
        modalClose.focus();
    }

    function closeModal() {
        modal.hidden = true;
        document.body.style.overflow = '';
        history.replaceState(null, '', window.location.pathname);
        if (lastFocused) lastFocused.focus();
    }

    listEl.addEventListener('click', e => {
        const row = e.target.closest('.music-row');
        if (!row) return;
        const song = songs.find(s => s.id === row.dataset.id);
        if (song) openModal(song);
    });
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && !modal.hidden) closeModal();
    });

    [searchEl, genreEl, langEl, sortEl, recEl].forEach(el =>
        el.addEventListener(el === searchEl ? 'input' : 'change', render));

    render();

    // Deep link: /music/#song-id opens that song
    const linked = songs.find(s => `#${s.id}` === window.location.hash);
    if (linked) openModal(linked);
})();
