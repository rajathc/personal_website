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

// Cover bytes come from third-party CDNs. sharp picks its decoder from the
// content, not the URL or Content-Type, so only hand it real JPEG/PNG/WebP
// bytes, checked by their magic numbers. That keeps SVG, HEIF, TIFF and GIF
// payloads away from those loaders.
function imageType(buf) {
    if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
    if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
    if (buf.length >= 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'webp';
    return null;
}

async function fetchCover(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (!imageType(buf)) throw new Error(`not a JPEG/PNG/WebP file: ${url}`);
    return buf;
}

(async () => {
    let ok = 0, skip = 0, fail = 0;
    for (const b of books) {
        const dest = path.join(outDir, `${b.id}.jpg`);
        if (fs.existsSync(dest)) { skip++; continue; }
        const source = sources[b.id];
        if (!source) { fail++; console.log('no source:', b.id); continue; }
        try {
            let buf;
            try {
                buf = await fetchCover(bigUrl(source));
            } catch {
                buf = await fetchCover(source); // fall back to the thumbnail
            }
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
