#!/usr/bin/env node

/**
 * Image Optimization Script for Rajath.blog
 *
 * This script optimizes images for web by:
 * - Generating WebP versions at 3 responsive sizes (800px, 1200px, 1920px)
 * - Compressing original formats (JPEG, PNG)
 * - Maintaining directory structure
 * - Skipping GIFs (handle those separately with ffmpeg)
 *
 * Usage:
 *   npm install sharp
 *   node scripts/optimize-images.js
 *
 * Or optimize a specific directory:
 *   node scripts/optimize-images.js images/writings/new-post
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const IMAGES_DIR = path.join(__dirname, '../images/writings');
const OUTPUT_DIR = path.join(__dirname, '../images-optimized/writings');

const QUALITY = {
  jpeg: 80,    // Good balance for photos
  png: 85,     // Higher for screenshots/diagrams
  webp: 82     // Modern format, good compression
};

const MAX_WIDTH = {
  large: 1920,   // Desktop/high-res
  medium: 1200,  // Tablet
  small: 800     // Mobile
};

// Track statistics
const stats = {
  processed: 0,
  skipped: 0,
  errors: 0,
  originalSize: 0,
  optimizedSize: 0
};

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Optimize a single image
 */
async function optimizeImage(inputPath, outputDir) {
  const ext = path.extname(inputPath).toLowerCase();
  const basename = path.basename(inputPath, ext);
  const relativePath = path.relative(IMAGES_DIR, path.dirname(inputPath));

  // Skip GIFs - they need separate handling with ffmpeg
  if (ext === '.gif') {
    console.log(`⏭️  Skipping GIF: ${relativePath}/${basename}${ext}`);
    console.log('   → Convert GIFs to video using ffmpeg (see GIF-CONVERSION.md)');
    stats.skipped++;
    return;
  }

  // Skip non-image files
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) {
    stats.skipped++;
    return;
  }

  // Skip images that already have all generated WebP variants next to them.
  // This keeps the workflow idempotent: re-runs don't re-encode (and further
  // degrade) already-processed JPEGs, and don't churn ~460 binaries in git.
  // To force reprocessing (e.g. after replacing an image under the same
  // name), delete its .webp variants or run with FORCE_OPTIMIZE=1.
  if (!process.env.FORCE_OPTIMIZE) {
    const sourceDir = path.dirname(inputPath);
    const variantsExist = ['', '-medium', '-small'].every(suffix => {
      try {
        require('fs').accessSync(path.join(sourceDir, `${basename}${suffix}.webp`));
        return true;
      } catch {
        return false;
      }
    });
    if (variantsExist) {
      stats.skipped++;
      return;
    }
  }

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    const originalStats = await fs.stat(inputPath);

    console.log(`\n📸 Processing: ${relativePath}/${basename}${ext}`);
    console.log(`   Original: ${metadata.width}x${metadata.height} (${formatBytes(originalStats.size)})`);

    stats.originalSize += originalStats.size;

    // Generate WebP versions at different sizes
    const sizes = [
      { suffix: '', maxWidth: MAX_WIDTH.large },
      { suffix: '-medium', maxWidth: MAX_WIDTH.medium },
      { suffix: '-small', maxWidth: MAX_WIDTH.small }
    ];

    let webpTotalSize = 0;

    for (const size of sizes) {
      const shouldResize = metadata.width > size.maxWidth;
      const outputPath = path.join(
        outputDir,
        relativePath,
        `${basename}${size.suffix}.webp`
      );

      // Ensure output directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      const pipeline = sharp(inputPath);

      if (shouldResize) {
        pipeline.resize(size.maxWidth, null, {
          withoutEnlargement: true,
          fit: 'inside'
        });
      }

      await pipeline
        .webp({ quality: QUALITY.webp })
        .toFile(outputPath);

      const webpStats = await fs.stat(outputPath);
      webpTotalSize += webpStats.size;

      const widthLabel = shouldResize ? `${size.maxWidth}px` : `${metadata.width}px`;
      console.log(`   ✓ WebP${size.suffix}: ${widthLabel} (${formatBytes(webpStats.size)})`);
    }

    // Optimize original format as fallback
    const optimizedPath = path.join(outputDir, relativePath, `${basename}${ext}`);
    await fs.mkdir(path.dirname(optimizedPath), { recursive: true });

    // Downscale the original-format fallback too (not just the WebP variants),
    // so a high-resolution source doesn't ship as a multi-MB fallback.
    const fallbackPipeline = sharp(inputPath);
    if (metadata.width > MAX_WIDTH.large) {
      fallbackPipeline.resize(MAX_WIDTH.large, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }

    if (ext === '.jpg' || ext === '.jpeg') {
      await fallbackPipeline
        .jpeg({ quality: QUALITY.jpeg, mozjpeg: true })
        .toFile(optimizedPath);
    } else if (ext === '.png') {
      await fallbackPipeline
        .png({ quality: QUALITY.png, compressionLevel: 9 })
        .toFile(optimizedPath);
    }

    const optimizedStats = await fs.stat(optimizedPath);
    const savings = ((1 - optimizedStats.size / originalStats.size) * 100).toFixed(1);

    stats.optimizedSize += optimizedStats.size + webpTotalSize;
    stats.processed++;

    console.log(`   ✓ Optimized ${ext}: ${formatBytes(optimizedStats.size)} (${savings}% smaller)`);

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

  // Allow optimizing a specific directory via command line
  const targetDir = process.argv[2]
    ? path.resolve(process.argv[2])
    : IMAGES_DIR;

  const outputDir = process.argv[2]
    ? path.join(__dirname, '../images-optimized', path.relative(path.join(__dirname, '..'), targetDir))
    : OUTPUT_DIR;

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

  console.log(`\n Found ${imagePaths.length} images to process\n`);

  // Process each image
  for (const imagePath of imagePaths) {
    await optimizeImage(imagePath, outputDir);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('✅ Optimization Complete!\n');
  console.log(`📊 Statistics:`);
  console.log(`   Processed: ${stats.processed} images`);
  console.log(`   Skipped:   ${stats.skipped} files (GIFs, etc.)`);
  console.log(`   Errors:    ${stats.errors}`);
  console.log(`   Time:      ${duration}s`);
  console.log(`\n💾 Size Reduction:`);
  console.log(`   Original:  ${formatBytes(stats.originalSize)}`);
  console.log(`   Optimized: ${formatBytes(stats.optimizedSize)}`);
  const totalSavings = ((1 - stats.optimizedSize / stats.originalSize) * 100).toFixed(1);
  console.log(`   Savings:   ${totalSavings}% (${formatBytes(stats.originalSize - stats.optimizedSize)})`);

  console.log('\n' + '═'.repeat(60));
  console.log('\n📝 Next Steps:\n');
  console.log('1. Review outputs in images-optimized/, then merge them next to the originals:');
  console.log('   rsync -av images-optimized/writings/ images/writings/ && rm -rf images-optimized');
  console.log('   (The optimize-images GitHub Action does this automatically on push.)');
  console.log('2. Wrap new post images in <picture> with the WebP srcset + original fallback');
  console.log('   (copy an existing block from any post in _posts/).');
  console.log('3. Commit: git add images/ _posts/ && git commit -m "Optimize images"');
  console.log('\n' + '═'.repeat(60) + '\n');
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
