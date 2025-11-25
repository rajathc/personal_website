# Image Optimization Guide

This guide explains how to optimize images for your Jekyll blog using the automated script and GitHub Actions.

## 🚀 Quick Start

### One-Time Setup (First Time)

```bash
# Install Node.js dependencies
npm install

# Run optimization on all existing images
npm run optimize

# Review the results in images-optimized/
# Then replace original images:
mv images images-backup
mv images-optimized images

# Commit the changes
git add images/ package.json package-lock.json
git commit -m "Optimize all blog images"
git push
```

**Expected Results:**
- 163MB → 20-30MB (80-85% reduction)
- WebP versions created at 3 sizes (800px, 1200px, 1920px)
- Original formats compressed as fallback

---

## 🤖 GitHub Actions (Automatic)

Once you push the workflow file, GitHub Actions will **automatically optimize images** whenever you add new ones!

### How It Works:

1. You add new images to `images/writings/new-post/`
2. Commit and push: `git add images/ && git push`
3. GitHub Actions automatically:
   - Detects new images
   - Optimizes them (WebP + compression)
   - Commits back to your repo

### Manual Trigger:

You can also trigger optimization manually:

1. Go to your GitHub repo
2. Click **Actions** tab
3. Select **Optimize Images** workflow
4. Click **Run workflow** button

---

## 📁 For New Blog Posts

### Option A: Let GitHub Actions Handle It (Recommended)

```bash
# Just add your images and push
cp ~/Downloads/new-photo.jpg images/writings/new-post/
git add images/
git commit -m "Add images for new post"
git push

# GitHub Actions will optimize automatically!
```

### Option B: Optimize Locally Before Pushing

```bash
# Add your new images
cp ~/Downloads/*.jpg images/writings/new-post/

# Run optimization
npm run optimize

# Replace with optimized versions
mv images images-backup
mv images-optimized images

# Push optimized images
git add images/
git commit -m "Add optimized images for new post"
git push
```

---

## 🎥 GIF Files

**Important:** The script skips GIFs because they need special handling.

See **[GIF-CONVERSION.md](./GIF-CONVERSION.md)** for detailed instructions on converting GIFs to video (90% size reduction!).

Quick version:
```bash
# Install ffmpeg
brew install ffmpeg

# Convert GIF to video
ffmpeg -i animation.gif -movflags faststart -pix_fmt yuv420p animation.mp4
ffmpeg -i animation.gif -c:v libvpx-vp9 -b:v 0 -crf 30 animation.webm

# Replace in HTML:
<video autoplay loop muted playsinline>
  <source src="animation.webm" type="video/webm">
  <source src="animation.mp4" type="video/mp4">
</video>
```

---

## 📊 What Gets Optimized?

For each image, the script creates:

### WebP Versions (Modern Format):
- `image.webp` - Full size (max 1920px)
- `image-medium.webp` - Tablet size (max 1200px)
- `image-small.webp` - Mobile size (max 800px)

### Original Format (Fallback):
- `image.jpg` - Compressed original (for older browsers)

### Quality Settings:
- JPEG: 80% quality (good for photos)
- PNG: 85% quality (good for screenshots)
- WebP: 82% quality (balanced)

---

## 🖼️ Using Responsive Images in Posts

After optimization, update your HTML to use responsive images:

### Create `_includes/responsive-image.html`:

```liquid
{% assign base_path = include.src | remove: '.jpg' | remove: '.jpeg' | remove: '.png' %}
{% assign loading = include.loading | default: 'lazy' %}

<div class="image-container">
  <picture>
    <source
      type="image/webp"
      srcset="{{ base_path }}-small.webp 800w,
              {{ base_path }}-medium.webp 1200w,
              {{ base_path }}.webp 1920w"
      sizes="(max-width: 800px) 100vw, (max-width: 1200px) 90vw, 1200px">

    <img
      src="{{ include.src }}"
      alt="{{ include.alt }}"
      class="blog-image"
      loading="{{ loading }}"
      decoding="async">
  </picture>

  {% if include.caption %}
    <p class="caption">{{ include.caption }}</p>
  {% endif %}
</div>
```

### Use in your posts:

```liquid
{% include responsive-image.html
  src="/images/writings/post-name/photo.jpg"
  alt="Description"
  caption="Photo caption"
  loading="lazy"
%}
```

**First image in post:** Use `loading="eager"` (above the fold)

---

## 🔧 Troubleshooting

### Script fails with "sharp not found"
```bash
npm install sharp
```

### GitHub Action not running
- Check that workflow file is in `.github/workflows/`
- Verify you pushed to the correct branch (usually `main`)
- Check Actions tab for error messages

### Images look too compressed
Edit `scripts/optimize-images.js` and increase quality values:
```javascript
const QUALITY = {
  jpeg: 85,  // Increase from 80
  png: 90,   // Increase from 85
  webp: 87   // Increase from 82
};
```

### Images still too large
Lower the max width values:
```javascript
const MAX_WIDTH = {
  large: 1600,  // Reduce from 1920
  medium: 1000, // Reduce from 1200
  small: 600    // Reduce from 800
};
```

---

## 📈 Expected Results

### Current State:
- **Total size:** 163MB (66 images)
- **Largest files:** 2 GIFs (60MB), photos (1-3MB each)

### After Optimization:
- **Total size:** 20-30MB (80-85% reduction)
- **WebP savings:** 30-40% smaller than JPEG
- **Responsive sizes:** Mobile users get 800px not 4032px
- **Lazy loading:** Only loads images as user scrolls

### Performance Impact:
- **LCP improvement:** 5-8 seconds faster
- **Page load:** 60-80% reduction in initial load time
- **PageSpeed score:** 30-50 → 85-95 (target)

---

## 📝 Checklist for New Posts

- [ ] Add images to `images/writings/post-name/`
- [ ] If you have GIFs, convert them to video first
- [ ] Push to GitHub (Actions will optimize automatically)
- [ ] OR run `npm run optimize` locally
- [ ] Use `{% include responsive-image.html %}` in post HTML
- [ ] Set first image to `loading="eager"`, rest to `loading="lazy"`
- [ ] Test locally: `bundle exec jekyll serve`
- [ ] Check image quality and file sizes
- [ ] Commit and deploy!

---

## 🎯 Pro Tips

1. **Name images descriptively:** `hyderabad-charminar.jpg` not `IMG_1234.jpg`
2. **Don't add huge images:** Resize to max 4000px before adding
3. **Use JPEG for photos, PNG for screenshots/diagrams**
4. **Add alt text for accessibility**
5. **GIFs → Video always** (90% savings!)
6. **First image eager, rest lazy** (for better LCP)

---

## 📚 More Information

- Script source: `scripts/optimize-images.js`
- GitHub workflow: `.github/workflows/optimize-images.yml`
- GIF conversion: `GIF-CONVERSION.md`
- Performance plan: `.claude/plans/vectorized-cooking-glacier.md`
