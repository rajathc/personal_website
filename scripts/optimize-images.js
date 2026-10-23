#!/usr/bin/env node

/**
 * Image Optimization Script for Rajath.blog
 *
 * This script optimizes images for web by:
 * - Compressing original formats (JPEG, PNG) as the <img> fallback, capped at 1920px
 * - Generating WebP versions at 3 responsive sizes (800px, 1200px, 1920px)
 *   plus a 360px "-thumb" variant for post covers (a post's preview_image),
 *   used by the compact rows of the writings list
 * - Never shipping a WebP that is as big as (or bigger than) its fallback or
 *   the next-larger variant: such variants are re-encoded (near-lossless,
 *   lossless or lower quality) and the best fitting attempt is kept
 * - Maintaining directory structure
 * - Skipping GIFs (convert those with scripts/convert-gifs-to-video.sh), and
 *   share images (og-image.*) and video posters (*-poster.*), which are
 *   final assets
 *
 * Usage:
 *   npm install
 *   node scripts/optimize-images.js
 *
 * Or optimize a specific directory (must be inside images/writings):
 *   node scripts/optimize-images.js images/writings/new-post
 *
 * Already-optimized images are skipped. For those optimized before the WebP
 * size guard existed, FIX_OVERSIZED=1 re-encodes only the WebP variants that
 * are not smaller than their fallback (or the next-larger variant):
 *   FIX_OVERSIZED=1 node scripts/optimize-images.js
 *
 * Outputs go to images-optimized/writings/, mirroring images/writings/.
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const { accessSync, readdirSync, readFileSync } = require('fs');
const path = require('path');

// Configuration
const IMAGES_DIR = path.join(__dirname, '../images/writings');
const OUTPUT_DIR = path.join(__dirname, '../images-optimized/writings');
const POSTS_DIR = path.join(__dirname, '../_posts');

// Only post covers (a post's preview_image) are shown at thumbnail size in the
// writings list, so only they get a -thumb variant. Keys look like
// "12-instagram-bus/feature-image".
function loadCoverBases() {
  const bases = new Set();
  let files = [];
  try { files = readdirSync(POSTS_DIR); } catch { return bases; }
  for (const file of files) {
    if (!/\.(?:html|md|markdown)$/.test(file)) continue;
    const text = readFileSync(path.join(POSTS_DIR, file), 'utf8');
    const m = text.match(/^preview_image:\s*["']?\/images\/writings\/(.+?)-small\.webp["']?\s*$/m);
    if (m) bases.add(m[1]);
  }
  return bases;
}
const COVER_BASES = loadCoverBases();

const QUALITY = {
  jpeg: 80,    // Good balance for photos
  png: 85,     // Higher for screenshots/diagrams
  webp: 82     // Modern format, good compression
};

const MAX_WIDTH = {
  large: 1920,   // Desktop/high-res
  medium: 1200,  // Tablet
  small: 800,    // Mobile
  thumb: 360     // Compact rows in the writings list
};

// WebP encodes to try, in order of preference. The first one that comes out
// under budget wins (see encodeVariant).
const WEBP_ATTEMPTS = {
  // Unscaled screenshots and line art often beat their PNG only losslessly;
  // downscaled ones (anti-aliased edges) only at a lower lossy quality.
  png: [
    { quality: QUALITY.webp },
    { nearLossless: true, quality: 60, effort: 6 },
    { lossless: true, effort: 6 },
    { quality: 70 },
    { quality: 60 }
  ],
  // Grainy camera photos can beat mozjpeg only at a slightly lower quality.
  photo: [
    { quality: QUALITY.webp },
    { quality: 75 },
    { quality: 72 }
  ]
};

// Track statistics
const stats = {
  processed: 0,
  skippedExisting: 0,
  skippedGif: 0,
  skippedOther: 0,
  skippedAsset: 0,
  thumbsAdded: 0,
  reencoded: 0,
  reused: 0,
  fixed: 0,
  oversized: 0,
  errors: 0,
  originalSize: 0,
  fallbackSize: 0,
  webpSize: 0
};

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const sign = bytes < 0 ? '-' : '';
  const abs = Math.abs(bytes);
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(abs) / Math.log(k)), sizes.length - 1);
  return sign + parseFloat((abs / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function fileExists(p) {
  try {
    accessSync(p);
    return true;
  } catch {
    return false;
  }
}

async function sniffImageType(file) {
  const fh = await fs.open(file, 'r');
  try {
    const { buffer, bytesRead } = await fh.read(Buffer.alloc(8), 0, 8, 0);
    const b = buffer.subarray(0, bytesRead);
    if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg';
    if (b.length === 8 && b.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
    return null;
  } finally {
    await fh.close();
  }
}

function describeWebpOptions(opts) {
  if (opts.lossless) return 'lossless';
  if (opts.nearLossless) return `near-lossless q${opts.quality}`;
  return `q${opts.quality}`;
}

/**
 * Encode one WebP variant so it ends up strictly smaller than `budget` bytes
 * (the fallback, or the next-larger variant). Tries WEBP_ATTEMPTS in order;
 * if none fits, reuses the next-larger variant's bytes when those are
 * smaller (a sharper image for fewer bytes), else keeps the smallest attempt.
 * Returns { buf, opts, fits, reused } (plus `width` when reused).
 */
async function encodeVariant(inputPath, width, resize, isPng, budget, larger) {
  const attempts = isPng ? WEBP_ATTEMPTS.png : WEBP_ATTEMPTS.photo;
  let best = null;

  for (const opts of attempts) {
    const pipeline = sharp(inputPath).autoOrient();
    if (resize) {
      pipeline.resize(width, null, { withoutEnlargement: true, fit: 'inside' });
    }
    const buf = await pipeline.webp(opts).toBuffer();
    if (buf.length < budget) {
      return { buf, opts, fits: true, reused: false };
    }
    if (!best || buf.length < best.buf.length) {
      best = { buf, opts, fits: false, reused: false };
    }
  }

  if (larger && larger.buf.length < best.buf.length) {
    // The larger variant already passed (or failed) the fallback check; it
    // can't be under this budget, which includes its own size.
    return { ...larger, reused: true };
  }
  return best;
}

async function checkMagic(inputPath, ext, label) {
  // sharp picks its decoder from the file's content, not its extension, so
  // check the magic number: a mislabelled SVG/HEIF/TIFF never reaches it,
  // and a JPEG saved as .png isn't silently re-encoded as a huge PNG.
  const kind = await sniffImageType(inputPath);
  const expected = ext === '.png' ? 'png' : 'jpeg';
  if (kind !== expected) {
    console.error(`❌ ${label}: content is ${kind || 'not JPEG/PNG'}, but the extension says ${expected}. Fix the file or its extension.`);
    stats.errors++;
    return false;
  }
  return true;
}

/**
 * FIX_OVERSIZED=1 mode, for images optimized before the size guard existed:
 * leave the fallback and every compliant WebP alone, and re-encode only the
 * variants that are not smaller than the fallback / the next-larger variant.
 * The source is the committed fallback, so dimensions stay as they are.
 */
async function addMissingThumb(inputPath, basename, ext, relativePath, outputDir, label) {
  if (!(await checkMagic(inputPath, ext, label))) return;
  try {
    const rawMetadata = await sharp(inputPath).metadata();
    const metadata = { ...rawMetadata, ...(rawMetadata.autoOrient || {}) };
    const smallBuf = await fs.readFile(path.join(path.dirname(inputPath), `${basename}-small.webp`));
    const smallWidth = (await sharp(smallBuf).metadata()).width;
    const larger = { buf: smallBuf, width: smallWidth, fits: true, reused: false };
    const resize = metadata.width > MAX_WIDTH.thumb;
    const result = await encodeVariant(inputPath, MAX_WIDTH.thumb, resize, ext === '.png', smallBuf.length, larger);
    const targetDir = path.join(outputDir, relativePath);
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(path.join(targetDir, `${basename}-thumb.webp`), result.buf);
    stats.thumbsAdded++;
    console.log(`\n🖼  Added missing -thumb: ${label} (${formatBytes(result.buf.length)})`);
  } catch (err) {
    stats.errors++;
    console.error(`   ✗ Error adding -thumb for ${label}: ${err.message}`);
  }
}

async function fixOversizedVariants(inputPath, basename, ext, relativePath, outputDir, label) {
  if (!(await checkMagic(inputPath, ext, label))) return;
  try {
    const isPng = ext === '.png';
    const sourceDir = path.dirname(inputPath);
    const rawMetadata = await sharp(inputPath).metadata();
    const metadata = { ...rawMetadata, ...(rawMetadata.autoOrient || {}) };
    const fallbackSize = (await fs.stat(inputPath)).size;
    const suffixes = ['', '-medium', '-small', '-thumb']
      .filter(suffix => fileExists(path.join(sourceDir, `${basename}${suffix}.webp`)));

    let larger = null;
    let changed = 0;
    for (const suffix of suffixes) {
      const name = `${basename}${suffix}.webp`;
      const buf = await fs.readFile(path.join(sourceDir, name));
      const width = (await sharp(buf).metadata()).width;
      const budget = larger ? Math.min(fallbackSize, larger.buf.length) : fallbackSize;
      // A variant at the same width as the next-larger one (source narrower
      // than this cap) is the same image; it only has to beat the fallback.
      const sameAsLarger = larger && larger.width === width &&
        buf.length <= larger.buf.length && buf.length < fallbackSize;
      if (buf.length < budget || sameAsLarger) {
        larger = { buf, width, fits: buf.length < fallbackSize, reused: false };
        continue;
      }

      const result = await encodeVariant(inputPath, width, metadata.width > width, isPng, budget, larger);
      if (!result.reused) result.width = width;
      if (result.buf.length >= buf.length) {
        // Nothing better found; keep the committed file.
        console.log(`   ⚠️  ${path.join(relativePath, name)}: ${formatBytes(buf.length)} vs ${formatBytes(budget)} budget, no smaller encode found`);
        stats.oversized++;
        larger = { buf, width, fits: false, reused: false };
        continue;
      }
      const targetDir = path.join(outputDir, relativePath);
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(path.join(targetDir, name), result.buf);
      const how = result.reused ? 'copy of the next-larger variant' : describeWebpOptions(result.opts);
      console.log(`   ✓ ${path.join(relativePath, name)}: ${formatBytes(buf.length)} → ${formatBytes(result.buf.length)} (${how}; fallback ${formatBytes(fallbackSize)})`);
      if (!result.fits) stats.oversized++;
      changed++;
      larger = result;
    }
    if (changed) stats.fixed++;
    else stats.skippedExisting++;
  } catch (error) {
    console.error(`❌ Error checking ${inputPath}:`, error.message);
    stats.errors++;
  }
}

/**
 * Optimize a single image
 */
async function optimizeImage(inputPath, outputDir) {
  // Keep the original extension's case for the fallback file name, so the
  // optimized fallback overwrites the source (e.g. IMG_0001.JPG) on merge
  // instead of landing next to it as a second file.
  const origExt = path.extname(inputPath);
  const ext = origExt.toLowerCase();
  const basename = path.basename(inputPath, origExt);
  const relativePath = path.relative(IMAGES_DIR, path.dirname(inputPath));
  const isCover = COVER_BASES.has([...relativePath.split(path.sep), basename].join('/'));
  const label = path.join(relativePath, `${basename}${origExt}`);

  // Skip GIFs - they need separate handling with ffmpeg
  if (ext === '.gif') {
    console.log(`⏭️  Skipping GIF: ${label}`);
    console.log('   → Convert GIFs to video with scripts/convert-gifs-to-video.sh (see GIF-CONVERSION.md)');
    stats.skippedGif++;
    return;
  }

  // Skip non-image files
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
    stats.skippedOther++;
    return;
  }

  // Share images (og-image.jpg, exactly 1200x630) and video posters
  // (NAME-poster.jpg next to NAME.mp4/.webm) are final assets referenced
  // as-is, not post images: re-encoding them or adding WebP variants would
  // only churn git. A post image that merely ends in "-poster" is processed.
  const sourceDirForSkip = path.dirname(inputPath);
  const videoBase = basename.endsWith('-poster') ? basename.slice(0, -'-poster'.length) : null;
  const isVideoPoster = videoBase !== null && ['.mp4', '.webm'].some(v =>
    fileExists(path.join(sourceDirForSkip, `${videoBase}${v}`)));
  if (basename === 'og-image' || isVideoPoster) {
    stats.skippedAsset++;
    return;
  }

  // Skip images that already have all generated WebP variants next to them.
  // This keeps the workflow idempotent: re-runs don't re-encode (and further
  // degrade) already-processed JPEGs, and don't churn ~460 binaries in git.
  // The -thumb variant is deliberately not part of this check, so older
  // images without one are not all reprocessed. To force reprocessing (e.g.
  // after replacing an image under the same name, or to add a -thumb to an
  // older image), delete its .webp variants or run with FORCE_OPTIMIZE=1.
  if (!process.env.FORCE_OPTIMIZE) {
    const sourceDir = path.dirname(inputPath);
    const variantsExist = ['', '-medium', '-small'].every(suffix =>
      fileExists(path.join(sourceDir, `${basename}${suffix}.webp`))
    );
    if (variantsExist) {
      if (process.env.FIX_OVERSIZED) {
        await fixOversizedVariants(inputPath, basename, ext, relativePath, outputDir, label);
        return;
      }
      // Images optimized before the -thumb variant existed only need that
      // one file: the writings list asks for it once the post leaves the
      // hero slot, and check-site fails the build if it is missing.
      if (isCover && !fileExists(path.join(sourceDir, `${basename}-thumb.webp`))) {
        await addMissingThumb(inputPath, basename, ext, relativePath, outputDir, label);
        return;
      }
      stats.skippedExisting++;
      return;
    }
  }

  if (!(await checkMagic(inputPath, ext, label))) return;

  try {
    // Camera JPEGs often store pixels sideways plus an EXIF orientation tag.
    // sharp drops EXIF on output, so every pipeline auto-orients first and
    // all width decisions use the upright dimensions.
    const rawMetadata = await sharp(inputPath).metadata();
    const metadata = { ...rawMetadata, ...(rawMetadata.autoOrient || {}) };
    const originalStats = await fs.stat(inputPath);
    const isPng = ext === '.png';

    console.log(`\n📸 Processing: ${label}`);
    console.log(`   Original: ${metadata.width}x${metadata.height} (${formatBytes(originalStats.size)})`);

    const targetDir = path.join(outputDir, relativePath);
    await fs.mkdir(targetDir, { recursive: true });

    // 1. Optimize the original format as the <img> fallback. Downscale it too
    //    (not just the WebP variants), so a high-resolution source doesn't
    //    ship as a multi-MB fallback.
    const optimizedPath = path.join(targetDir, `${basename}${origExt}`);
    const fallbackPipeline = sharp(inputPath).autoOrient();
    if (metadata.width > MAX_WIDTH.large) {
      fallbackPipeline.resize(MAX_WIDTH.large, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }

    const fallbackBuf = isPng
      ? await fallbackPipeline.png({ quality: QUALITY.png, compressionLevel: 9 }).toBuffer()
      : await fallbackPipeline.jpeg({ quality: QUALITY.jpeg, mozjpeg: true }).toBuffer();

    // Keep the original file when re-encoding doesn't pay: when it comes out
    // bigger (downscaling flat PNG art adds anti-aliased colours that
    // compress worse; the width cap exists to save bytes), or, at the same
    // dimensions, less than 5% smaller (an already-optimized JPEG would only
    // lose quality). The largest WebP then matches the original's size.
    // (Never for a rotated original: its fallback must be the upright copy.)
    const rotated = (rawMetadata.orientation || 1) !== 1;
    const minGain = metadata.width > MAX_WIDTH.large ? 1 : 0.95;
    let fallbackSize;
    let keptOriginal = false;
    if (!rotated && fallbackBuf.length >= originalStats.size * minGain) {
      await fs.copyFile(inputPath, optimizedPath);
      fallbackSize = originalStats.size;
      keptOriginal = true;
      console.log(`   ✓ Kept original ${origExt}: ${formatBytes(fallbackSize)} (re-encoding saved too little)`);
    } else {
      await fs.writeFile(optimizedPath, fallbackBuf);
      fallbackSize = fallbackBuf.length;
      const savings = ((1 - fallbackSize / originalStats.size) * 100).toFixed(1);
      console.log(`   ✓ Optimized ${origExt}: ${formatBytes(fallbackSize)} (${savings}% smaller)`);
    }

    // 2. WebP variants, largest first. Each must come out strictly smaller
    //    than the fallback and than the next-larger variant: a WebP that is
    //    not smaller than the file it stands in for makes <picture> a loss.
    const largeWidth = keptOriginal ? metadata.width : MAX_WIDTH.large;
    const sizes = [
      { suffix: '', maxWidth: largeWidth },
      { suffix: '-medium', maxWidth: MAX_WIDTH.medium },
      { suffix: '-small', maxWidth: MAX_WIDTH.small },
      ...(isCover ? [{ suffix: '-thumb', maxWidth: MAX_WIDTH.thumb }] : [])
    ];
    const defaultOpts = (isPng ? WEBP_ATTEMPTS.png : WEBP_ATTEMPTS.photo)[0];

    let webpTotalSize = 0;
    let larger = null;

    for (const size of sizes) {
      const resize = metadata.width > size.maxWidth;
      const width = resize ? size.maxWidth : metadata.width;
      let result;
      if (larger && larger.width === width) {
        // Source is narrower than this variant's cap: same pixels as above.
        result = { ...larger, reused: true };
      } else {
        const budget = larger ? Math.min(fallbackSize, larger.buf.length) : fallbackSize;
        result = await encodeVariant(inputPath, size.maxWidth, resize, isPng, budget, larger);
        if (!result.reused) result.width = width;
      }

      const outputPath = path.join(targetDir, `${basename}${size.suffix}.webp`);
      await fs.writeFile(outputPath, result.buf);
      webpTotalSize += result.buf.length;

      let note = '';
      if (result.reused) {
        if (result.width !== width) {
          stats.reused++;
          note = ' [copy of the next-larger variant, which was smaller than any encode at this width]';
        }
      } else if (result.opts !== defaultOpts) {
        stats.reencoded++;
        note = ` [re-encoded ${describeWebpOptions(result.opts)}: q${QUALITY.webp} was not smaller]`;
      }
      if (!result.fits) {
        stats.oversized++;
        note += ` ⚠️  not smaller than the ${formatBytes(fallbackSize)} fallback`;
      }
      console.log(`   ✓ WebP${size.suffix}: ${result.width}px (${formatBytes(result.buf.length)})${note}`);

      larger = result;
    }

    stats.originalSize += originalStats.size;
    stats.fallbackSize += fallbackSize;
    stats.webpSize += webpTotalSize;
    stats.processed++;

  } catch (error) {
    console.error(`❌ Error processing ${inputPath}:`, error.message);
    stats.errors++;
  }
}

/**
 * Recursively walk directory and find all images
 */
async function walkDir(dir) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  const imagePaths = [];

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      imagePaths.push(...await walkDir(fullPath));
    } else if (/\.(jpg|jpeg|png|gif)$/i.test(file.name)) {
      imagePaths.push(fullPath);
    }
  }

  return imagePaths;
}

/**
 * Main function
 */
async function main() {
  console.log('🖼️  Image Optimization Script for Rajath.blog\n');
  console.log('═'.repeat(60));

  // Allow optimizing a specific directory via command line. Outputs always
  // mirror images/writings/ under images-optimized/writings/, so the merge
  // command below is the same either way.
  const targetDir = process.argv[2]
    ? path.resolve(process.argv[2])
    : IMAGES_DIR;
  const outputDir = OUTPUT_DIR;

  const relToImages = path.relative(IMAGES_DIR, targetDir);
  if (relToImages.startsWith('..') || path.isAbsolute(relToImages)) {
    console.error(`❌ Error: ${targetDir} is not inside ${IMAGES_DIR}`);
    process.exit(1);
  }

  console.log(`📁 Input:  ${targetDir}`);
  console.log(`📁 Output: ${outputDir}\n`);
  console.log('═'.repeat(60));

  // Check if input directory exists
  try {
    await fs.access(targetDir);
  } catch (error) {
    console.error(`❌ Error: Directory not found: ${targetDir}`);
    process.exit(1);
  }

  // Find all images
  const startTime = Date.now();
  const imagePaths = await walkDir(targetDir);

  console.log(`\n Found ${imagePaths.length} images (JPEG/PNG/GIF)\n`);

  // Process each image
  for (const imagePath of imagePaths) {
    await optimizeImage(imagePath, outputDir);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('✅ Optimization Complete!\n');
  console.log(`📊 Statistics:`);
  console.log(`   Processed:                ${stats.processed} images`);
  console.log(`   Skipped, already done:    ${stats.skippedExisting} (WebP variants exist)`);
  console.log(`   Skipped, GIF:             ${stats.skippedGif}`);
  console.log(`   Skipped, og/poster:       ${stats.skippedAsset} (og-image.*, video *-poster.*)`);
  console.log(`   Missing -thumb added:     ${stats.thumbsAdded}`);
  if (stats.skippedOther) {
    console.log(`   Skipped, other:           ${stats.skippedOther}`);
  }
  if (process.env.FIX_OVERSIZED) {
    console.log(`   Fixed oversized WebP:     ${stats.fixed} images`);
  }
  console.log(`   WebP re-encoded (guard):  ${stats.reencoded} variants`);
  if (stats.reused) {
    console.log(`   WebP copied from larger:  ${stats.reused} variants`);
  }
  if (stats.oversized) {
    console.log(`   ⚠️  WebP over budget:      ${stats.oversized} variants (kept the smallest attempt)`);
  }
  console.log(`   Errors:                   ${stats.errors}`);
  console.log(`   Time:                     ${duration}s`);

  if (stats.originalSize > 0) {
    const savings = ((1 - stats.fallbackSize / stats.originalSize) * 100).toFixed(1);
    console.log(`\n💾 Size:`);
    console.log(`   Fallbacks: ${formatBytes(stats.originalSize)} → ${formatBytes(stats.fallbackSize)} (${savings}% smaller)`);
    console.log(`   WebP:      ${formatBytes(stats.webpSize)} written across all variants`);
  } else {
    console.log('\n💾 Nothing new to optimize.');
  }

  if (stats.processed > 0 || stats.fixed > 0) {
    console.log('\n' + '═'.repeat(60));
    console.log('\n📝 Next Steps:\n');
    console.log('1. Review outputs in images-optimized/, then merge them next to the originals:');
    console.log('   rsync -av images-optimized/writings/ images/writings/ && rm -rf images-optimized');
    console.log('   (The optimize-images GitHub Action does this automatically on push.)');
    console.log('2. Wrap new post images in <picture> with the WebP srcset + original fallback');
    console.log('   (copy an existing block from any post in _posts/).');
    console.log('3. Commit: git add images/ _posts/ && git commit -m "Optimize images"');
  }
  console.log('\n' + '═'.repeat(60) + '\n');

  // Fail the run (and the optimize-images workflow) so a bad file is noticed.
  if (stats.errors > 0) process.exitCode = 1;
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
