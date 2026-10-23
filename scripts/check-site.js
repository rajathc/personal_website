#!/usr/bin/env node

/**
 * Site checker for CI: validates the built site (_site) for
 * - internal links that resolve to nothing (404s at deploy time)
 * - images/srcset entries pointing at files that don't exist
 * - <img> tags missing alt attributes
 * - post images under /images/writings/ shipped as a bare <img> although
 *   WebP variants exist (they belong in <picture> with the WebP srcset)
 * - post images after the first one without loading="lazy"
 * - target="_blank" links without rel="noopener"
 * - covers/art referenced from the JSON data (rendered client-side,
 *   invisible to the HTML scan) and their thumbs
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

// Value of an attribute in a single tag string ("" for a bare attribute,
// null when absent). Handles double, single and unquoted values.
// A whole start tag, quote-aware so a '>' inside an attribute value
// (alt="Speed > quality") doesn't end the match early.
const tagPattern = name => new RegExp(`<${name}\\b(?:[^>"']|"[^"]*"|'[^']*')*>`, 'gi');

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}(?:\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+)))?(?=[\\s/>])`, 'i'));
  if (!m) return null;
  return m[1] ?? m[2] ?? m[3] ?? '';
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
  for (const m of html.matchAll(tagPattern('img'))) {
    if (!/\salt="/.test(m[0])) {
      const src = (m[0].match(/\ssrc="([^"]*)"/) || [, '?'])[1];
      errors.push(`${relFile}: <img> missing alt (src=${src})`);
    }
  }

  // Post images must ship as <picture> with the WebP srcset when the
  // optimizer generated WebP variants for them (CLAUDE.md convention).
  const pictureRanges = [];
  let openAt = -1;
  for (const m of html.matchAll(/<(\/?)picture\b[^>]*>/gi)) {
    if (!m[1]) openAt = m.index;
    else if (openAt !== -1) { pictureRanges.push([openAt, m.index]); openAt = -1; }
  }
  const insidePicture = i => pictureRanges.some(([a, b]) => i > a && i < b);
  for (const m of html.matchAll(tagPattern('img'))) {
    const src = attr(m[0], 'src');
    const variant = src && src.match(/^(\/images\/writings\/.+)\.(?:jpe?g|png)$/i);
    if (!variant || insidePicture(m.index)) continue;
    const webps = ['', '-medium', '-small'].map(s => `${variant[1]}${s}.webp`).filter(resolves);
    if (webps.length) {
      errors.push(`${relFile}: <img src=${src}> is not wrapped in <picture> although ${webps[0]} exists`);
    }
  }

  // Inside a post, every image after the first must be loading="lazy"
  // (the first one is the LCP candidate and carries fetchpriority="high").
  const contentAt = html.indexOf('<div class="post-content">');
  if (contentAt !== -1) {
    const endAt = html.indexOf('</article>', contentAt);
    const body = html.slice(contentAt, endAt === -1 ? undefined : endAt);
    const imgs = [...body.matchAll(tagPattern('img'))];
    for (const m of imgs.slice(1)) {
      if (!/^lazy$/i.test(attr(m[0], 'loading') || '')) {
        errors.push(`${relFile}: post image without loading="lazy" (src=${attr(m[0], 'src') || '?'})`);
      }
    }
  }

  // External links opened in a new tab must not hand the page window.opener.
  for (const m of html.matchAll(tagPattern('a'))) {
    if (!/^_blank$/i.test(attr(m[0], 'target') || '')) continue;
    const rel = (attr(m[0], 'rel') || '').toLowerCase().split(/\s+/);
    if (!rel.includes('noopener') && !rel.includes('noreferrer')) {
      errors.push(`${relFile}: target="_blank" link without rel="noopener" (href=${attr(m[0], 'href') || '?'})`);
    }
  }
}

// Feed entries are read on other origins, so every URL inside them must
// be absolute (feed.xml rewrites src/href/poster/srcset).
const feedFile = path.join(siteDir, 'feed.xml');
if (fs.existsSync(feedFile)) {
  const unescape = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  const absolute = u => /^(?:https?:|mailto:|data:)/i.test(u);
  for (const m of fs.readFileSync(feedFile, 'utf8').matchAll(/<content type="html">([\s\S]*?)<\/content>/g)) {
    const content = unescape(m[1]);
    for (const a of content.matchAll(/\s(?:src|href|poster)="([^"]*)"/g)) {
      if (!absolute(a[1])) errors.push(`feed.xml: relative URL ${a[1]}`);
    }
    for (const a of content.matchAll(/\ssrcset="([^"]*)"/g)) {
      for (const part of a[1].split(',')) {
        const url = part.trim().split(/\s+/)[0];
        if (url && !absolute(url)) errors.push(`feed.xml: relative srcset ${url}`);
      }
    }
  }
}

// Data-driven assets: the book list renders client-side from JSON,
// so the HTML scan above never sees their image paths.
const repoRoot = path.join(__dirname, '..');
const thumbPath = p => p.replace(/^(\/images\/(?:books)\/)/, '$1thumbs/').replace(/\.jpe?g$/i, '.webp');
const books = JSON.parse(fs.readFileSync(path.join(repoRoot, '_data/books.json'), 'utf8'));
for (const b of books) {
  if (!resolves(b.cover)) errors.push(`books.json: missing cover ${b.cover} (${b.id})`);
  else if (!resolves(thumbPath(b.cover))) errors.push(`books.json: missing thumb ${thumbPath(b.cover)} (${b.id})`);
}


console.log(`Checked ${htmlFiles.length} pages, ${books.length} book covers.`);
if (errors.length) {
  console.error(`\n${errors.length} problem(s) found:`);
  for (const e of [...new Set(errors)]) console.error(`  ${e}`);
  process.exit(1);
}
console.log('No broken internal links, missing images/thumbs, missing alt attributes, bare <img> with WebP variants, eager post images, or unsafe target="_blank" links.');
