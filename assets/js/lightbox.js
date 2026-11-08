// Post photos open full size: tapping one shows it on a dark screen with
// its caption, closed by the X, Escape, Android back, or a tap anywhere
(function() {
    // Pictures already wrapped in a link open their own full-size file, and
    // media-card covers are small thumbnails with nothing bigger behind them
    const pictures = Array.from(document.querySelectorAll('.post-content picture'))
        .filter((picture) => picture.querySelector('img') && !picture.closest('a, .media-card'));
    if (!pictures.length) return;

    // A double-tap sends two clicks: the second would close the photo the
    // first just opened, or reopen the one it just closed. Pointer clicks
    // that soon after either are ignored; keyboard clicks (detail 0) never are.
    const DOUBLE_TAP_MS = 350;

    let dialog, image, caption, closeButton;
    let trigger = null;
    let openedAt = 0;
    let closedAt = 0;

    function tooSoon(e, since) {
        return e.detail !== 0 && (e.detail > 1 || performance.now() - since < DOUBLE_TAP_MS);
    }

    function build() {
        dialog = document.createElement('dialog');
        dialog.className = 'lightbox';
        dialog.setAttribute('aria-label', 'Full-size image');
        // Focus target when opened by touch or mouse, so no focus ring
        // flashes on the close button
        dialog.tabIndex = -1;
        dialog.innerHTML =
            '<button type="button" class="lightbox-close" aria-label="Close full-size image">' +
                '<svg width="24" height="24" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true" focusable="false">' +
                    '<path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>' +
                '</svg>' +
            '</button>' +
            '<figure class="lightbox-figure">' +
                '<img class="lightbox-image" alt="" decoding="async">' +
                '<figcaption class="lightbox-caption"></figcaption>' +
            '</figure>';
        image = dialog.querySelector('.lightbox-image');
        caption = dialog.querySelector('.lightbox-caption');
        closeButton = dialog.querySelector('.lightbox-close');

        // A tap anywhere closes it, except on a caption link. The click that
        // ends a drag-select in the caption doesn't either, but the X always does.
        dialog.addEventListener('click', (e) => {
            if (e.target.closest('a') || tooSoon(e, openedAt)) return;
            if (!e.target.closest('.lightbox-close') && String(window.getSelection())) return;
            dialog.close();
        });
        // Fires for every way of closing: X, tap, Escape, Android back.
        // Focus goes back to the photo (Safari would otherwise drop it on
        // the page top); browsers only ring it after keyboard use.
        dialog.addEventListener('close', () => {
            // Chrome fires this a frame late, so a quick reopen can beat it
            if (dialog.open) return;
            closedAt = performance.now();
            document.body.style.overflow = '';
            image.removeAttribute('src');
            if (trigger) trigger.focus({ preventScroll: true });
            trigger = null;
        });

        document.body.appendChild(dialog);
    }

    function candidates(source) {
        return source.srcset.split(',').map((candidate) => {
            const [url, descriptor] = candidate.trim().split(/\s+/);
            return { url: new URL(url, document.baseURI).href, width: parseInt(descriptor, 10) || 0 };
        });
    }

    // The <source> the page is showing, so a phone gets the phone crop of
    // an art-directed image like the map. A lazy photo tapped before it
    // has loaded has no currentSrc yet, so take the one the browser would
    // pick: the first whose media matches. None means the <img> fallback.
    function pickedSource(img) {
        const sources = Array.from(img.closest('picture').querySelectorAll('source[srcset]'));
        if (img.currentSrc) {
            return sources.find((source) => candidates(source).some((c) => c.url === img.currentSrc));
        }
        return sources.find((source) => !source.media || window.matchMedia(source.media).matches);
    }

    // The biggest file in that source, with its width in pixels. The
    // original <img> file is already full size.
    function fullFile(img, source = pickedSource(img)) {
        if (!source) {
            return { url: img.currentSrc || img.src, width: parseInt(img.getAttribute('width'), 10) || 0 };
        }
        return candidates(source).reduce((a, b) => (b.width > a.width ? b : a));
    }

    function open(link, viaKeyboard) {
        if (!dialog) build();
        const img = link.querySelector('img');
        const source = pickedSource(img);
        const full = fullFile(img, source);
        trigger = link;

        // Show the copy already on screen straight away, then swap in the
        // biggest file once it has downloaded and decoded
        const shown = img.currentSrc;
        image.src = shown || full.url;
        image.alt = img.alt;
        // The shape of the file on screen (the map's phone crop is squarer
        // than its desktop one), else of the source the browser would pick
        const sized = (source && source.hasAttribute('width')) ? source : img;
        image.style.aspectRatio = img.naturalWidth
            ? `${img.naturalWidth} / ${img.naturalHeight}`
            : `${sized.getAttribute('width')} / ${sized.getAttribute('height')}`;
        // Never stretched past the file's own width, so small images stay sharp
        image.style.maxWidth = full.width ? `${full.width}px` : '';
        if (shown && full.url !== shown) {
            const loader = new Image();
            loader.src = full.url;
            loader.decode().then(() => {
                if (trigger === link) image.src = full.url;
            }).catch(() => {});
        }

        // Newer posts use figure and figcaption, older ones a
        // div.image-container with a p.caption
        const holder = link.closest('figure, .image-container, .image-container-portrait');
        const text = holder && holder.querySelector('figcaption, .caption');
        caption.replaceChildren(...(text ? Array.from(text.childNodes, (node) => node.cloneNode(true)) : []));

        dialog.showModal();
        openedAt = performance.now();
        document.body.style.overflow = 'hidden';
        // Keyboard users land on the X; everyone else on the dialog itself
        (viaKeyboard ? closeButton : dialog).focus();
    }

    pictures.forEach((picture) => {
        const img = picture.querySelector('img');
        // A link, not a button: Safari Reader and Firefox Reader View drop
        // buttons along with the photos inside them. A new-tab click opens
        // the file itself.
        const link = document.createElement('a');
        link.className = 'lightbox-trigger';
        link.href = fullFile(img).url;
        link.setAttribute('aria-haspopup', 'dialog');
        link.setAttribute('aria-label', img.alt ? `View full size: ${img.alt}` : 'View full size');
        picture.replaceWith(link);
        link.appendChild(picture);
        link.addEventListener('click', (e) => {
            if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            if (tooSoon(e, closedAt)) return;
            // A click from the Enter key has no pointer, so detail is 0
            open(link, e.detail === 0);
        });
    });
})();
