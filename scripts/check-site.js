#!/usr/bin/env node

/**
 * Site checker for CI: validates the built site (_site) for
 * - internal links that resolve to nothing (404s at deploy time)
 * - images/srcset entries pointing at files that don't exist
 * - <img> tags missing alt attributes
 * - covers/art referenced from the JSON data (rendered client-side,
 *   invisible to the HTML scan) and their thumbs
 * - jukebox page stubs matching _data/music.json ids both ways
 *
 * Usage: node scripts/check-site.js _site
 */

const fs = require('fs');
const path = require('path');

const siteDir = path.resolve(process.argv[2] || '_site');
if (!fs.existsSync(siteDir)) {
  console.error(`Site directory not found: ${siteDir}`);
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

// Does an internal URL path resolve to a file in _site?
function resolves(urlPath) {
  const clean = decodeURIComponent(urlPath.split('#')[0].split('?')[0]);
  if (!clean || clean === '/') return true;
  const rel = clean.replace(/^\//, '');
  const direct = path.join(siteDir, rel);
  if (fs.existsSync(direct)) return true;
  // pretty URLs: /foo/ or /foo -> /foo/index.html
  if (fs.existsSync(path.join(direct, 'index.html'))) return true;
  if (fs.existsSync(direct + '.html')) return true;
  return false;
}

const errors = [];
const htmlFiles = walk(siteDir);

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const relFile = path.relative(siteDir, file);

  // href/src attributes
  for (const m of html.matchAll(/(?:href|src|poster)="([^"]*)"/g)) {
    const url = m[1];
    if (!url.startsWith('/') || url.startsWith('//')) continue; // internal root-relative only
    if (!resolves(url)) errors.push(`${relFile}: broken ${url}`);
  }

  // srcset entries
  for (const m of html.matchAll(/srcset="([^"]*)"/g)) {
    for (const part of m[1].split(',')) {
      const url = part.trim().split(/\s+/)[0];
      if (!url || !url.startsWith('/') || url.startsWith('//')) continue;
      if (!resolves(url)) errors.push(`${relFile}: broken srcset ${url}`);
    }
  }

  // img alt attributes
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt="/.test(m[0])) {
      const src = (m[0].match(/\ssrc="([^"]*)"/) || [, '?'])[1];
      errors.push(`${relFile}: <img> missing alt (src=${src})`);
    }
  }
}

// Data-driven assets: the book/music lists render client-side from JSON,
// so the HTML scan above never sees their image paths.
const repoRoot = path.join(__dirname, '..');
const thumbPath = p => p.replace(/^(\/images\/(?:books|music)\/)/, '$1thumbs/').replace(/\.jpe?g$/i, '.webp');
const books = JSON.parse(fs.readFileSync(path.join(repoRoot, '_data/books.json'), 'utf8'));
for (const b of books) {
  if (!resolves(b.cover)) errors.push(`books.json: missing cover ${b.cover} (${b.id})`);
  else if (!resolves(thumbPath(b.cover))) errors.push(`books.json: missing thumb ${thumbPath(b.cover)} (${b.id})`);
}
const songs = JSON.parse(fs.readFileSync(path.join(repoRoot, '_data/music.json'), 'utf8'));
for (const s of songs) {
  if (!s.art) continue;
  if (!resolves(s.art)) errors.push(`music.json: missing art ${s.art} (${s.id})`);
  else if (!resolves(thumbPath(s.art))) errors.push(`music.json: missing thumb ${thumbPath(s.art)} (${s.id})`);
}

// Jukebox page stubs must match music.json ids both ways: a forgotten
// `npm run jukebox:pages` would otherwise ship 404 song links silently.
const songIds = new Set(songs.map(s => s.id));
for (const s of songs) {
  if (!fs.existsSync(path.join(siteDir, 'jukebox', s.id, 'index.html'))) {
    errors.push(`jukebox: no page for song "${s.id}" — run npm run jukebox:pages`);
  }
}
const albumsPath = path.join(repoRoot, '_data/albums.json');
const albums = fs.existsSync(albumsPath) ? JSON.parse(fs.readFileSync(albumsPath, 'utf8')) : [];
const albumIds = new Set(albums.map(a => a.id));
for (const a of albums) {
  if (!fs.existsSync(path.join(siteDir, 'jukebox', 'albums', a.id, 'index.html'))) {
    errors.push(`jukebox: no page for album "${a.id}" — run npm run jukebox:pages`);
  }
  if (a.art && !resolves(a.art)) errors.push(`albums.json: missing art ${a.art} (${a.id})`);
}
const jukeboxDir = path.join(siteDir, 'jukebox');
if (fs.existsSync(jukeboxDir)) {
  for (const entry of fs.readdirSync(jukeboxDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'albums') {
      for (const sub of fs.readdirSync(path.join(jukeboxDir, 'albums'), { withFileTypes: true })) {
        if (sub.isDirectory() && !albumIds.has(sub.name)) {
          errors.push(`jukebox: stale album page /jukebox/albums/${sub.name}/ not in albums.json`);
        }
      }
      continue;
    }
    if (!songIds.has(entry.name)) {
      errors.push(`jukebox: stale page /jukebox/${entry.name}/ has no song in music.json`);
    }
  }
}

console.log(`Checked ${htmlFiles.length} pages, ${books.length} book covers, ${songs.length} songs.`);
if (errors.length) {
  console.error(`\n${errors.length} problem(s) found:`);
  for (const e of [...new Set(errors)]) console.error(`  ${e}`);
  process.exit(1);
}
console.log('No broken internal links, missing images/thumbs, missing alt attributes, or jukebox drift.');
