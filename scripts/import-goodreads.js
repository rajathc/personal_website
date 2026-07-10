#!/usr/bin/env node
// Converts saved Goodreads shelf pages (HTML) into _data/books.json,
// MERGING with the existing data so manual curation survives re-imports:
//   - ids in scripts/goodreads-overrides.json "exclude" are dropped
//   - existing entries missing from the export (manual additions,
//     the "status": "reading" book) are kept
//   - existing nonzero ratings win over a zero scraped rating
//   - extra fields on existing entries (favorite, status, ...) are preserved
// Cover source URLs go to _data/book-sources.json (build-time only, never
// shipped to the browser).
// Usage: node scripts/import-goodreads.js <shelf-page.html> [more.html...]
const fs = require('fs');
const path = require('path');

const files = process.argv.slice(2);
if (!files.length) {
    console.error('Usage: node scripts/import-goodreads.js <saved-shelf-page.html> [...]');
    process.exit(1);
}

const unescape = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const flipAuthor = a => {
    const m = a.match(/^([^,]+),\s*(.+)$/);
    return m ? `${m[2]} ${m[1]}`.replace(/\s+\*$/, '') : a;
};
const MONTHS = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
const isoDate = d => {
    const m = (d || '').match(/^(\w{3})\s+(\d{1,2}),\s+(\d{4})$/);
    if (m) return `${m[3]}-${MONTHS[m[1]]}-${String(m[2]).padStart(2, '0')}`;
    const y = (d || '').match(/^(\w{3})?\s*(\d{4})$/); // "2017" or "Sep 2017"
    if (y) return y[1] ? `${y[2]}-${MONTHS[y[1]]}-01` : `${y[2]}-01-01`;
    return null;
};

const dataDir = path.join(__dirname, '../_data');
const booksFile = path.join(dataDir, 'books.json');
const sourcesFile = path.join(dataDir, 'book-sources.json');
const overrides = JSON.parse(fs.readFileSync(path.join(__dirname, 'goodreads-overrides.json'), 'utf8'));
const exclude = new Set(overrides.exclude || []);
const existing = fs.existsSync(booksFile) ? JSON.parse(fs.readFileSync(booksFile, 'utf8')) : [];
const existingById = new Map(existing.map(b => [b.id, b]));
const sources = fs.existsSync(sourcesFile) ? JSON.parse(fs.readFileSync(sourcesFile, 'utf8')) : {};

const scraped = [];
for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    const rows = content.match(/<tr id="review_\d+" class="bookalike review">[\s\S]*?<\/tr>/g) || [];
    for (const row of rows) {
        const field = name => (row.match(new RegExp(`<td class="field ${name}">([\\s\\S]*?)</td>`)) || [])[1] || '';
        const titleM = field('title').match(/<a title="([^"]*)" href="(\/book\/show\/[^"?]*)/);
        const authorM = field('author').match(/<a href="\/author\/show\/[^"]*">([^<]*)<\/a>/);
        const coverM = field('cover').match(/src="([^"]*)"/);
        const ratingM = field('rating').match(/data-rating="(\d)"/);
        const dateM = row.match(/<span class="date_read_value">([^<]*)<\/span>/);
        if (!titleM) continue;
        const rawTitle = unescape(titleM[1]);
        const seriesM = rawTitle.match(/^(.*?)\s*\(([^)]+,\s*#[\d.]+[^)]*)\)$/);
        const grId = titleM[2].replace('/book/show/', '');
        const id = grId.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '');
        scraped.push({
            id,
            title: seriesM ? seriesM[1] : rawTitle,
            series: seriesM ? seriesM[2] : '',
            author: authorM ? flipAuthor(unescape(authorM[1])) : '',
            rating: ratingM ? parseInt(ratingM[1], 10) : 0,
            dateRead: dateM ? isoDate(dateM[1].trim()) : null,
            goodreads: `https://www.goodreads.com${titleM[2]}`,
            cover: `/images/books/${id}.jpg`,
            coverSource: coverM ? coverM[1] : null,
        });
    }
}

// de-dup by id (multi-page exports)
const seen = new Set();
const unique = scraped.filter(b => !seen.has(b.id) && seen.add(b.id));

const merged = [];
const scrapedIds = new Set();
let excluded = 0, updated = 0, added = 0;
for (const s of unique) {
    scrapedIds.add(s.id);
    if (exclude.has(s.id)) { excluded++; continue; }
    if (s.coverSource) sources[s.id] = s.coverSource;
    delete s.coverSource;
    const prev = existingById.get(s.id);
    if (prev) {
        // scraped values win, but a manual nonzero rating beats a scraped zero,
        // and extra manual fields (favorite, status, ...) survive
        if (!s.rating && prev.rating) s.rating = prev.rating;
        if (!s.dateRead && prev.dateRead) s.dateRead = prev.dateRead;
        merged.push({ ...prev, ...s });
        updated++;
    } else {
        merged.push(s);
        added++;
    }
}
// entries the export doesn't know about: manual additions + currently reading
const kept = existing.filter(b => !scrapedIds.has(b.id));
for (const b of kept) {
    if (b.coverSource) { sources[b.id] = b.coverSource; delete b.coverSource; }
    merged.push(b);
}

fs.writeFileSync(booksFile, JSON.stringify(merged, null, 1) + '\n');
fs.writeFileSync(sourcesFile, JSON.stringify(sources, null, 1) + '\n');
console.log(`wrote ${merged.length} books (${updated} from shelf, ${added} new, ${kept.length} kept manual, ${excluded} excluded) to _data/books.json`);
if (kept.length) kept.forEach(b => console.log('  kept manual:', b.title));
console.log('next: node scripts/fetch-book-covers.js  # downloads any missing covers + thumbs');
