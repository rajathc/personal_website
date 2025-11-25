# GIF to Video Conversion Guide

Your blog has 3 GIF files totaling **63MB**. Converting them to video will save **55-58MB** (90% reduction) while maintaining the same autoplay loop behavior.

## Why Convert?

- ✅ **90% smaller** file size (46MB → 3-5MB)
- ✅ **Same behavior** (autoplay, loop, no controls)
- ✅ **Better quality** (no 256-color GIF limitation)
- ✅ **Faster loading** (3-5 seconds instead of 15+ seconds)

## GIF Files to Convert

1. `images/writings/07-back-to-writing/neo1.gif` - **46MB**
2. `images/writings/04-product-hunt/1.gif` - **14MB**
3. `images/writings/07-back-to-writing/language-launch.gif` - **3.8MB**

---

## Step 1: Install ffmpeg

### macOS:
```bash
brew install ffmpeg
```

### Windows:
Download from https://ffmpeg.org/download.html

### Linux:
```bash
sudo apt-get install ffmpeg  # Ubuntu/Debian
sudo yum install ffmpeg      # CentOS/RHEL
```

---

## Step 2: Convert Each GIF

Run these commands from your project root:

### Convert neo1.gif (46MB → 3-5MB)

```bash
cd images/writings/07-back-to-writing

# Generate MP4 (best browser support)
ffmpeg -i neo1.gif \
  -movflags faststart \
  -pix_fmt yuv420p \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
  neo1.mp4

# Generate WebM (better compression)
ffmpeg -i neo1.gif \
  -c:v libvpx-vp9 -b:v 0 -crf 30 \
  neo1.webm
```

### Convert 1.gif (14MB → 1-2MB)

```bash
cd images/writings/04-product-hunt

ffmpeg -i 1.gif \
  -movflags faststart \
  -pix_fmt yuv420p \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
  1.mp4

ffmpeg -i 1.gif \
  -c:v libvpx-vp9 -b:v 0 -crf 30 \
  1.webm
```

### Convert language-launch.gif (3.8MB → 400-600KB)

```bash
cd images/writings/07-back-to-writing

ffmpeg -i language-launch.gif \
  -movflags faststart \
  -pix_fmt yuv420p \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
  language-launch.mp4

ffmpeg -i language-launch.gif \
  -c:v libvpx-vp9 -b:v 0 -crf 30 \
  language-launch.webm
```

---

## Step 3: Update HTML in Post Files

### File 1: `_posts/2024-12-28-back-to-writing.html`

Find the `neo1.gif` reference and replace:

**Before:**
```html
<img src="/images/writings/07-back-to-writing/neo1.gif" alt="...">
```

**After:**
```html
<video autoplay loop muted playsinline style="max-width: 100%; height: auto; border-radius: 8px;">
  <source src="/images/writings/07-back-to-writing/neo1.webm" type="video/webm">
  <source src="/images/writings/07-back-to-writing/neo1.mp4" type="video/mp4">
  <img src="/images/writings/07-back-to-writing/neo1.gif" alt="..." loading="lazy">
</video>
```

Do the same for `language-launch.gif` in the same file.

### File 2: `_posts/2024-08-06-product-hunt.html`

Find the `1.gif` reference and replace:

**Before:**
```html
<img src="/images/writings/04-product-hunt/1.gif" alt="...">
```

**After:**
```html
<video autoplay loop muted playsinline style="max-width: 100%; height: auto; border-radius: 8px;">
  <source src="/images/writings/04-product-hunt/1.webm" type="video/webm">
  <source src="/images/writings/04-product-hunt/1.mp4" type="video/mp4">
  <img src="/images/writings/04-product-hunt/1.gif" alt="..." loading="lazy">
</video>
```

---

## Step 4: Test Locally

```bash
bundle exec jekyll serve
```

Open http://localhost:4000 and verify:
- Videos autoplay and loop
- No playback controls visible
- Looks identical to the original GIFs
- Page loads much faster

---

## Step 5: (Optional) Remove Original GIFs

After verifying videos work correctly:

```bash
# Delete original GIF files to save space
rm images/writings/07-back-to-writing/neo1.gif
rm images/writings/04-product-hunt/1.gif
rm images/writings/07-back-to-writing/language-launch.gif
```

---

## Video Tag Attributes Explained

- **`autoplay`** - Starts playing immediately (like GIF)
- **`loop`** - Repeats infinitely (like GIF)
- **`muted`** - Required for autoplay to work (GIFs have no sound)
- **`playsinline`** - Plays inline on iOS (doesn't go fullscreen)
- **Fallback `<img>`** - Shows GIF if browser doesn't support video

---

## Browser Support

✅ **Works on 99.9% of browsers:**
- Chrome, Firefox, Safari, Edge (all versions from 2015+)
- Mobile Safari, Chrome Mobile, Samsung Internet
- Even works on older browsers via fallback GIF

---

## Troubleshooting

### Video doesn't autoplay on mobile?
- Make sure `muted` attribute is present
- Check `playsinline` attribute exists
- Some mobile browsers block autoplay on cellular data (use WiFi for testing)

### Video looks pixelated?
- Original GIF quality might be low
- Try lowering `-crf` value (e.g., `-crf 25` for higher quality)

### Video file still too large?
- Increase `-crf` value (e.g., `-crf 35` for smaller file)
- Check video dimensions (might be unnecessarily large)

---

## Expected Results

| File | Original GIF | MP4 | WebM | Savings |
|------|-------------|-----|------|---------|
| neo1.gif | 46MB | ~4MB | ~3MB | 91% |
| 1.gif | 14MB | ~1.5MB | ~1MB | 92% |
| language-launch.gif | 3.8MB | ~500KB | ~400KB | 89% |

**Total savings: ~58MB (91% reduction)**

---

## Questions?

- Videos autoplay just like GIFs - users won't notice any difference
- This is the #1 highest-impact optimization you can do
- Takes only 10 minutes, saves 58MB instantly
