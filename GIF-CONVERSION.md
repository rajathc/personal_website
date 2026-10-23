# GIF to Video Conversion

The site ships no GIFs. Animations are served as `<video>` (WebM + MP4) with a JPEG
poster, which is a fraction of the size. Use this guide when a new post needs one.

History: the two animations in `07-back-to-writing` started as GIFs (`neo1.gif`, 46MB;
`language-launch.gif`, 3.8MB). They were first converted at full resolution, so
`neo1` shipped as a 3840x2160 video (14MB WebM) for a slot 800px wide. Re-encoded with
a width cap, they are now:

| Clip | Size | WebM | MP4 |
|------|------|------|-----|
| `neo1` | 1600x900 | 595KB | 714KB |
| `language-launch` | 800x800 | 337KB | 549KB |

**Always cap the width.** The content column is 800px, so 1600px (2x) is the most a
clip ever needs; a square clip that displays at most 800px wide can stop at 800px.

## 1. Install ffmpeg

```bash
brew install ffmpeg
```

## 2. Convert

```bash
scripts/convert-gifs-to-video.sh images/writings/<post>/clip.gif
MAX_WIDTH=800 scripts/convert-gifs-to-video.sh images/writings/<post>/square.gif
```

Paths can be relative to the repo root or to the current directory. For each GIF the
script writes, next to it:

- `clip.mp4`: H.264, CRF 24, preset slow, yuv420p, faststart, no audio
- `clip.webm`: VP9, CRF 36, no audio
- `clip-poster.jpg`: the first frame

Each is scaled to at most `MAX_WIDTH` (default 1600) and never upscaled. The script
prints the `width` and `height` to put on the `<video>`.

### Doing it by hand

The same encodes, if you need to tune one (for example, `neo1`'s brushed metal smeared
at VP9 CRF 36, so its WebM was made at CRF 32):

```bash
SCALE="scale='trunc(min(1600,iw)/2)*2':-2:flags=lanczos"

ffmpeg -i clip.gif -vf "$SCALE" -an -c:v libx264 -crf 24 -preset slow \
  -pix_fmt yuv420p -movflags +faststart clip.mp4

ffmpeg -i clip.gif -vf "$SCALE" -an -c:v libvpx-vp9 -b:v 0 -crf 32 -row-mt 1 \
  -pix_fmt yuv420p clip.webm

ffmpeg -i clip.gif -vf "$SCALE" -frames:v 1 -q:v 3 clip-poster.jpg
```

## 3. Markup

```html
<div class="image-container">
    <video class="blog-image" width="1600" height="900" poster="/images/writings/<post>/clip-poster.jpg" aria-label="Plain description of what the animation shows" autoplay loop muted playsinline>
        <source src="/images/writings/<post>/clip.webm" type="video/webm">
        <source src="/images/writings/<post>/clip.mp4" type="video/mp4">
    </video>
    <p class="caption">Caption</p>
</div>
```

- `width` and `height` reserve the space before the video loads.
- `poster` shows while it loads, and stays when the video is paused.
- `aria-label` describes the animation, since a video has no `alt`.
- `muted` and `playsinline` are required for autoplay on phones.
- `toc-drawer.js` adds native controls to autoplaying post videos, and pauses them
  for readers with `prefers-reduced-motion: reduce`, so the markup doesn't need
  `controls`.

## 4. Check and clean up

```bash
bundle exec jekyll serve
```

Check that the clip plays, loops and looks sharp, then delete the GIF. Don't commit
GIFs: `npm run optimize` and the Optimize Images Action skip them, and nothing on the
site should point at one.

## Troubleshooting

- **No autoplay on a phone**: check that `muted` and `playsinline` are present. Low
  power mode on iOS also blocks autoplay; the poster shows instead.
- **Looks smeared or blocky**: lower the CRF (for example 32 for WebM, 22 for MP4).
- **Still too large**: lower `MAX_WIDTH`, or raise the CRF a little.
