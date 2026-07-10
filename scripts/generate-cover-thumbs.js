#!/usr/bin/env node
// Generates the small WebP thumbs the list rows actually render:
//   images/books/<id>.jpg  -> images/books/thumbs/<id>.webp  (120px wide; rows show 34px)
//   images/music/<id>.jpg  -> images/music/thumbs/<id>.webp  (132px square; rows show 44px)
// Idempotent: skips thumbs that already exist (FORCE_THUMBS=1 to regenerate).
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const THUMB_WIDTHS = { books: 120, music: 132 };

async function makeThumb(srcPath, width) {
    const dir = path.join(path.dirname(srcPath), 'thumbs');
    fs.mkdirSync(dir, { recursive: true });
    const dest = path.join(dir, path.basename(srcPath).replace(/\.(jpe?g|png)$/i, '.webp'));
    if (fs.existsSync(dest) && !process.env.FORCE_THUMBS) return false;
    await sharp(srcPath).resize(width, null, { withoutEnlargement: false }).webp({ quality: 75 }).toFile(dest);
    return true;
}

async function run() {
    for (const [kind, width] of Object.entries(THUMB_WIDTHS)) {
        const dir = path.join(__dirname, `../images/${kind}`);
        if (!fs.existsSync(dir)) continue;
        let made = 0, skipped = 0;
        for (const f of fs.readdirSync(dir)) {
            if (!/\.(jpe?g|png)$/i.test(f)) continue;
            (await makeThumb(path.join(dir, f), width)) ? made++ : skipped++;
        }
        console.log(`${kind}: ${made} thumbs generated, ${skipped} already existed`);
    }
}

if (require.main === module) run();
module.exports = { makeThumb, THUMB_WIDTHS };
