# Image Optimization

Post images live in `images/writings/<NN-post-slug>/`. `scripts/optimize-images.js`
(Node + sharp, run with `npm run optimize`) compresses each new JPG/PNG and writes
WebP variants next to it. The Optimize Images GitHub Action runs the same script on
push as a safety net.

## Adding images to a post

```bash
# 1. Drop the originals into the post's folder
cp ~/Downloads/photo.jpg images/writings/13-new-post/

# 2. Optimize. Only images without WebP variants are processed; the results
#    land in images-optimized/writings/, mirroring images/writings/.
npm run optimize

# 3. Review images-optimized/, then merge it next to the originals
rsync -av images-optimized/writings/ images/writings/ && rm -rf images-optimized

# 4. Commit the post's folder
git add images/writings/13-new-post/
```

**Never `mv images-optimized images` (or swap the folders any other way).**
`images-optimized/` holds only the files processed in this run, so replacing
`images/` with it deletes every book cover and every older post image, and
`git add images/` stages those deletions.

You can limit a run to one folder:

```bash
node scripts/optimize-images.js images/writings/13-new-post
```

The output still mirrors `images/writings/`, so the same `rsync` merges it.

## What the script writes

For `photo.jpg` (or `.png`):

| File | Width | Used for |
|------|-------|----------|
| `photo.jpg` | at most 1920px | `<img>` fallback, compressed (JPEG q80 mozjpeg, PNG q85) |
| `photo.webp` | at most 1920px | `<picture>` srcset, 1920w |
| `photo-medium.webp` | at most 1200px | srcset, 1200w |
| `photo-small.webp` | at most 800px | srcset, 800w; also the post's `preview_image` |
| `photo-thumb.webp` | 360px | compact rows of the writings list (only matters for the `preview_image`) |

Details worth knowing:

- **Size guard.** Every WebP must come out strictly smaller than the fallback and
  than the next-larger variant. The script tries WebP q82 first, then near-lossless,
  lossless, q70 and q60 for PNGs (q75 and q72 for photos). If nothing fits it reuses
  the larger variant's bytes, or keeps the smallest attempt and warns.
- **Fallback kept as is** when re-encoding makes it bigger, or less than 5% smaller
  at the same size (re-encoding an already-optimized JPEG only loses quality).
- **Rotation.** Camera JPEGs with an EXIF orientation are auto-oriented, so they
  don't ship sideways.
- **Extension case** is kept (`IMG_0001.JPG` stays `IMG_0001.JPG`).
- **Skipped:** GIFs (convert them to video, see [GIF-CONVERSION.md](./GIF-CONVERSION.md)),
  share images `og-image.*` and video posters (`NAME-poster.*` next to a `NAME.mp4`
  or `NAME.webm`; final assets), and any image whose `.webp`, `-medium.webp` and
  `-small.webp` already exist. If such an image has no `-thumb.webp` yet, only the
  thumb is generated.
- The script exits non-zero if any file errors.

### Re-processing

- To redo one image (for example after replacing it under the same name), delete its
  `.webp` variants and run `npm run optimize` again.
- `FORCE_OPTIMIZE=1` ignores the skip check for everything in the target folder. Scope
  it to one folder: `FORCE_OPTIMIZE=1 node scripts/optimize-images.js images/writings/13-new-post`.
- `FIX_OVERSIZED=1 npm run optimize` re-encodes only the existing WebP variants that
  are not smaller than their fallback (images optimized before the size guard existed).
  Fallbacks are not touched. Merge with the same `rsync` command.

## Using the images in a post

Copy a `<picture>` block from an existing post. The WebP `<source>` lists the three
sizes; the original file is the `<img>` fallback with its real `width` and `height`:

```html
<figure class="image-container">
    <picture>
        <source type="image/webp" srcset="/images/writings/13-new-post/photo-small.webp 800w, /images/writings/13-new-post/photo-medium.webp 1200w, /images/writings/13-new-post/photo.webp 1920w" sizes="(max-width: 800px) 100vw, 800px">
        <img width="3000" height="2000" class="blog-image" src="/images/writings/13-new-post/photo.jpg" alt="Plain description of the image" loading="lazy" decoding="async"/>
    </picture>
    <figcaption class="caption">Caption</figcaption>
</figure>
```

- The first image of a post uses `fetchpriority="high"` instead of `loading="lazy"`.
  Every image after it must be `loading="lazy"` (CI checks this).
- An `<img>` under `/images/writings/` that has WebP variants must sit inside
  `<picture>` (CI checks this too).
- File names with spaces are written with `%20` in `src` and `srcset`.

## Post covers and share images

Front matter of each post:

```yaml
image: /images/writings/13-new-post/og-image.jpg            # social card
preview_image: /images/writings/13-new-post/feature-image-small.webp  # writings list
```

- `preview_image` points at the cover's `-small.webp`. The writings list shows the
  latest post as a full-width hero and the rest as compact rows, which load
  `NAME-thumb.webp` (360w). `npm run optimize` creates the thumb for new images.
- `og-image.jpg` is made by hand: a JPEG at exactly **1200x630**. For a cover with a
  title baked in, scale the whole cover to 630px tall and pad the sides with its
  background colour so no text is cut off. A photo can be centre-cropped. The script
  skips `og-image.*`, and CI can't see it (jekyll-seo-tag makes it an absolute URL),
  so check that the file exists before pushing.

## The GitHub Action

`.github/workflows/optimize-images.yml` runs on pushes that touch
`images/writings/**` JPG, JPEG, PNG or GIF files (any letter case), and can be run
by hand from the Actions tab. It runs the script, merges the output with the same
`rsync`, commits it with `[skip ci]` and then dispatches CI on the new commit, which
checks the site and deploys it.

It is a safety net, not the main path. If you push a post whose `<picture>` points
at WebP files that don't exist yet, CI fails on your commit and nothing deploys; the
bot's commit then goes through CI and deploys. Running `npm run optimize` before
pushing avoids the failed run.

The bot can't fix markup. A post image pushed as a bare `<img>` (no `<picture>`)
deploys, but once the bot adds its WebP variants, CI fails on every later push
until the image is wrapped in a `<picture>` block. Always use the `<picture>` block,
even before the variants exist.

## Troubleshooting

- **`Cannot find module 'sharp'`**: run `npm ci`.
- **The Action didn't run**: the path filter only covers `images/writings/`, and a
  commit message containing `[skip ci]` skips it.
- **An image looks too compressed**: the settings are `QUALITY` and `WEBP_ATTEMPTS`
  at the top of `scripts/optimize-images.js`. Delete that image's `.webp` variants
  and re-run after changing them.
