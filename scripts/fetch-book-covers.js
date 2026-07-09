#!/usr/bin/env node
// Downloads missing book covers from Goodreads (coverSource in _data/books.json),
// upgrading the thumbnail URL to a larger size and resizing to 240px wide.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const books = JSON.parse(fs.readFileSync(path.join(__dirname, '../_data/books.json'), 'utf8'));
const outDir = path.join(__dirname, '../images/books');
fs.mkdirSync(outDir, { recursive: true });

const bigUrl = u => u.replace(/\._S[XY]\d+_\./, '._SY475_.');

(async () => {
    let ok = 0, skip = 0, fail = 0;
    for (const b of books) {
        const dest = path.join(outDir, `${b.id}.jpg`);
        if (fs.existsSync(dest)) { skip++; continue; }
        if (!b.coverSource) { fail++; console.log('no source:', b.id); continue; }
        try {
            let res = await fetch(bigUrl(b.coverSource));
            if (!res.ok) res = await fetch(b.coverSource); // fall back to the thumbnail
            const buf = Buffer.from(await res.arrayBuffer());
            await sharp(buf).resize(240, null, { withoutEnlargement: false }).jpeg({ quality: 80, mozjpeg: true }).toFile(dest);
            ok++;
        } catch (e) {
            fail++;
            console.log('FAIL', b.id, e.message);
        }
        await new Promise(r => setTimeout(r, 150));
    }
    console.log(`covers: ${ok} downloaded, ${skip} existing, ${fail} failed`);
})();
