#!/usr/bin/env node
// Generates one page stub per song in _data/music.json -> jukebox/<id>.html
// Run after adding songs: npm run jukebox:pages
const fs = require('fs');
const path = require('path');

const songs = JSON.parse(fs.readFileSync(path.join(__dirname, '../_data/music.json'), 'utf8'));
const outDir = path.join(__dirname, '../jukebox');
fs.mkdirSync(outDir, { recursive: true });

const yq = s => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

let created = 0;
for (const s of songs) {
    const fm = [
        '---',
        'layout: song',
        `song_id: ${s.id}`,
        `title: ${yq(`${s.title} – ${s.artist}`)}`,
        `description: ${yq(s.summary)}`,
        `image: ${s.art || '/images/og-default.png'}`,
        // Square album art crops badly as a summary_large_image banner
        'twitter_card: summary',
        `permalink: /jukebox/${s.id}/`,
        '---',
        ''
    ].join('\n');
    fs.writeFileSync(path.join(outDir, `${s.id}.html`), fm);
    created++;
}
console.log(`generated ${created} song pages in jukebox/`);
