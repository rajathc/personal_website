#!/usr/bin/env node

/**
 * Site checker for CI: validates the built site (_site) for
 * - internal links that resolve to nothing (404s at deploy time)
 * - images/srcset entries pointing at files that don't exist
 * - <img> tags missing alt attributes
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

console.log(`Checked ${htmlFiles.length} pages.`);
if (errors.length) {
  console.error(`\n${errors.length} problem(s) found:`);
  for (const e of [...new Set(errors)]) console.error(`  ${e}`);
  process.exit(1);
}
console.log('No broken internal links, missing images, or missing alt attributes.');
