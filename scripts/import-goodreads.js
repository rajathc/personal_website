#!/usr/bin/env node
// Converts saved Goodreads shelf pages (HTML) into _data/books.json
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

const books = [];
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
        books.push({
            id: grId.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, ''),
            title: seriesM ? seriesM[1] : rawTitle,
            series: seriesM ? seriesM[2] : '',
            author: authorM ? flipAuthor(unescape(authorM[1])) : '',
            rating: ratingM ? parseInt(ratingM[1], 10) : 0,
            dateRead: dateM ? isoDate(dateM[1].trim()) : null,
            goodreads: `https://www.goodreads.com${titleM[2]}`,
            cover: `/images/books/${grId.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '')}.jpg`,
            coverSource: coverM ? coverM[1] : null,
        });
    }
}

// de-dup by id (re-imports)
const seen = new Set();
const unique = books.filter(b => !seen.has(b.id) && seen.add(b.id));
const out = path.join(__dirname, '../_data/books.json');
fs.writeFileSync(out, JSON.stringify(unique, null, 1) + '\n');
console.log(`wrote ${unique.length} books to _data/books.json`);
console.log('next: node scripts/fetch-book-covers.js  # downloads any missing covers');
