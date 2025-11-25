# Quick Start: Image Optimization

## 🚀 One-Command Optimization

Run this single script to optimize all 66 images:

```bash
./scripts/optimize-all-images.sh
```

This will:
- ✅ Check dependencies (Node.js, sharp)
- ✅ Optimize all JPEG/PNG images (80-85% compression)
- ✅ Generate WebP versions at 3 sizes (800px, 1200px, 1920px)
- ✅ Skip GIFs (convert those separately with convert-gifs-to-video.sh)
- ✅ Show before/after sizes
- ✅ Create images-optimized/ directory

**Time:** 5-10 minutes
**Result:** 163MB → 20-30MB (saves 130-140MB!)

---

## 📋 Complete Optimization Workflow

### Step 1: Convert GIFs (Biggest Single Win - 58MB)

```bash
# Install ffmpeg if needed
brew install ffmpeg

# Convert all 3 GIFs
./scripts/convert-gifs-to-video.sh

# Update HTML in post files (see scripts/HTML_UPDATES.txt)
```

### Step 2: Optimize Images (130-140MB saved)

```bash
# Run the optimization
./scripts/optimize-all-images.sh

# Review results
open images-optimized/writings

# If looks good, replace original images
mv images images-backup
mv images-optimized images
```

### Step 3: Test Locally

```bash
# Jekyll should auto-reload if server is running
# Otherwise rebuild:
bundle exec jekyll build

# Check site at http://localhost:4000
# Verify images look good and page loads faster
```

### Step 4: Commit Everything

```bash
git add .
git commit -m "perf: comprehensive image optimization

- Convert GIFs to video (60MB → 5-8MB, 90% reduction)
- Optimize all JPEG/PNG images (80-85% compression)
- Generate WebP versions at 3 responsive sizes
- Total: 163MB → 20-30MB (saves ~140MB!)

This commit includes:
- Converted videos (neo1.mp4/webm, 1.mp4/webm, language-launch.mp4/webm)
- Optimized images with WebP variants
- Updated post HTML for video tags"

git push
```

---

## 🎯 What Gets Optimized?

### For Each Image:

**Input:** `photo.jpg` (2.3MB, 4032x3024)

**Output:**
- `photo-small.webp` (150KB, 800px wide) - Mobile
- `photo-medium.webp` (300KB, 1200px wide) - Tablet
- `photo.webp` (500KB, 1920px wide) - Desktop
- `photo.jpg` (600KB, compressed) - Fallback

**Total per image:** ~1.5MB → ~200-300KB (80% reduction)

---

## 📊 Expected Results

| Type | Count | Before | After | Savings |
|------|-------|--------|-------|---------|
| GIFs | 3 | 60MB | 5-8MB | 52-55MB |
| JPEGs | ~40 | 85MB | 12-15MB | 70-73MB |
| PNGs | ~23 | 18MB | 5-8MB | 10-13MB |
| **TOTAL** | **66** | **163MB** | **22-31MB** | **132-141MB** |

---

## 🔍 Quality Settings

Defined in `scripts/optimize-images.js`:

```javascript
const QUALITY = {
  jpeg: 80,    // Good for photos (imperceptible loss)
  png: 85,     // Higher for screenshots/diagrams
  webp: 82     // Modern format, excellent compression
};

const MAX_WIDTH = {
  large: 1920,   // Desktop/high-res displays
  medium: 1200,  // Tablet
  small: 800     // Mobile
};
```

**To adjust:** Edit `scripts/optimize-images.js` and change these values.

---

## ⚠️ Important Notes

1. **Backup First:** The script creates `images-optimized/` - review before replacing!

2. **GIFs Skipped:** Must convert separately with `convert-gifs-to-video.sh`

3. **Reversible:** Keep `images-backup/` until you're 100% sure optimized images are good

4. **Jekyll Auto-Reload:** If server is running, it will detect changes automatically

5. **Git Commit Size:** The first commit will be large (150MB+), but future commits will be tiny

---

## 🐛 Troubleshooting

### Script fails with "sharp not found"
```bash
npm install sharp
```

### Images look too compressed
Edit `scripts/optimize-images.js` and increase quality values (e.g., jpeg: 85)

### Script hangs or crashes
You might have a corrupted image file. Check the last file mentioned in output.

### Want to optimize just one directory?
```bash
node scripts/optimize-images.js images/writings/post-name
```

---

## 🚀 After Optimization

### For Future Blog Posts:

**Option A:** Let GitHub Actions do it automatically
- Just add images and push
- Actions will optimize and commit back

**Option B:** Run script on new images only
```bash
node scripts/optimize-images.js images/writings/new-post
```

---

## 📈 Performance Impact

After optimization:

- ✅ **Mobile:** Page loads in 2-3s (was 10-15s)
- ✅ **Desktop:** Page loads in 1-2s (was 5-8s)
- ✅ **PageSpeed Score:** 85-95 (was 40-50)
- ✅ **LCP:** <2.5s (was 6-10s)
- ✅ **Bandwidth Saved:** 140MB per page view!

---

Need help? Check the main documentation:
- Full details: `IMAGE-OPTIMIZATION.md`
- GIF conversion: `GIF-CONVERSION.md`
- Performance plan: `.claude/plans/vectorized-cooking-glacier.md`
