#!/usr/bin/env node
// Generates one page stub per song in _data/music.json -> jukebox/<id>.html
// Run after adding songs: npm run jukebox:pages
const fs = require('fs');
const path = require('path');

const songs = JSON.parse(fs.readFileSync(path.join(__dirname, '../_data/music.json'), 'utf8'));
const outDir = path.join(__dirname, '../jukebox');
fs.mkdirSync(outDir, { recursive: true });

const yq = s => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

// Meta description: the summary in his voice first, then factual padding to
// land in the 110-160 char range search snippets want. Long summaries get
// clamped at a sentence boundary instead of padded.
function metaDescription(s) {
    const maxr = Math.max(...s.listens.map(l => l.rating));
    let d = s.summary.trim();
    if (!/[.!?…]$/.test(d)) d += '.';
    if (d.length > 160) {
        const cut = d.slice(0, 157);
        const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
        return end > 80 ? d.slice(0, end + 1) : cut + '…';
    }
    const art = /^[AEIOU]/i.test(s.genre) ? 'An' : 'A';
    const tails = [
        ` ${art} ${s.genre} song by ${s.artist} from ${s.album} (${s.year}), rated ${maxr} out of 5 in Rajath's jukebox.`,
        ` ${art} ${s.genre} song by ${s.artist} (${s.year}), rated ${maxr} out of 5 in Rajath's jukebox.`,
        ` Rated ${maxr} out of 5 in Rajath's jukebox.`,
    ];
    for (const tail of tails) {
        if ((d + tail).length <= 160) return d + tail;
    }
    return d;
}

let created = 0;
for (const s of songs) {
    const fm = [
        '---',
        'layout: song',
        `song_id: ${s.id}`,
        `title: ${yq(`${s.title} – ${s.artist}`)}`,
        `description: ${yq(metaDescription(s))}`,
        `image: ${s.art || '/images/og-default.png'}`,
        // Square album art crops badly as a summary_large_image banner;
        // jekyll-seo-tag reads page.twitter.card natively
        'twitter:',
        '  card: summary',
        `permalink: /jukebox/${s.id}/`,
        '---',
        ''
    ].join('\n');
    fs.writeFileSync(path.join(outDir, `${s.id}.html`), fm);
    created++;
}
console.log(`generated ${created} song pages in jukebox/`);
