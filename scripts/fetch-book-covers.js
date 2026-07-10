#!/usr/bin/env node
// Downloads missing book covers (source URLs in _data/book-sources.json),
// upgrading the thumbnail URL to a larger size, resizing to 240px wide,
// and emitting the 120px WebP thumb the reading log uses.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { makeThumb, THUMB_WIDTHS } = require('./generate-cover-thumbs');

const books = JSON.parse(fs.readFileSync(path.join(__dirname, '../_data/books.json'), 'utf8'));
const sources = JSON.parse(fs.readFileSync(path.join(__dirname, '../_data/book-sources.json'), 'utf8'));
const outDir = path.join(__dirname, '../images/books');
fs.mkdirSync(outDir, { recursive: true });

const bigUrl = u => u.replace(/\._S[XY]\d+_\./, '._SY475_.');

(async () => {
    let ok = 0, skip = 0, fail = 0;
    for (const b of books) {
        const dest = path.join(outDir, `${b.id}.jpg`);
        if (fs.existsSync(dest)) { skip++; continue; }
        const source = sources[b.id];
        if (!source) { fail++; console.log('no source:', b.id); continue; }
        try {
            let res = await fetch(bigUrl(source));
            if (!res.ok) res = await fetch(source); // fall back to the thumbnail
            const buf = Buffer.from(await res.arrayBuffer());
            await sharp(buf).resize(240, null, { withoutEnlargement: false }).jpeg({ quality: 80, mozjpeg: true }).toFile(dest);
            await makeThumb(dest, THUMB_WIDTHS.books);
            ok++;
        } catch (e) {
            fail++;
            console.log('FAIL', b.id, e.message);
        }
        await new Promise(r => setTimeout(r, 150));
    }
    console.log(`covers: ${ok} downloaded, ${skip} existing, ${fail} failed`);
    if (skip) console.log('run `node scripts/generate-cover-thumbs.js` if any existing covers lack thumbs');
})();
