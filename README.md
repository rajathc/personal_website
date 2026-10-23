# rajath.blog

My personal blog. Built with Jekyll, hosted at [rajath.blog](https://rajath.blog) on GitHub Pages.

If you like the theme, feel free to use it. Just swap out the content for your own.

## Local setup

Requires Ruby (see `.ruby-version`) and Node 20.9+.

```bash
# Ruby toolchain (once): install a modern Ruby via rbenv or brew, then
gem install bundler
bundle install

# Serve locally with live reload
bundle exec jekyll serve

# Node tooling (image optimization + JS/CSS minification)
npm ci
```

Note: the site is built for production by CI with GitHub's Pages builder
(`actions/jekyll-build-pages`, the `github-pages` gem, Jekyll 3.10), while the Gemfile
targets Jekyll 4.3 for local work. Minor rendering differences between local and
production are possible; CI builds and checks the exact output that gets deployed.

## Workflows

- **CI** (`.github/workflows/ci.yml`): builds the site with the Pages builder, checks
  that the committed minified assets are fresh, and runs `scripts/check-site.js`
  (broken internal links, missing images or srcset variants, missing alt text, post
  images outside `<picture>`, post images after the first without `loading="lazy"`,
  `target="_blank"` links without `rel="noopener"`, missing book covers or thumbs). On `main`
  it then deploys that build to GitHub Pages. If a check fails, nothing ships.
  Requires Settings > Pages > Source: **GitHub Actions**.
- **Optimize Images** (`.github/workflows/optimize-images.yml`): on pushes touching
  JPG/PNG/GIF files under `images/writings/`, generates the WebP variants (360px
  thumb, 800/1200/1920px) for new images, commits them, and dispatches CI so the
  commit is checked and deployed. Idempotent: images that already have variants are
  skipped, as are share images (`og-image.*`) and video posters (`*-poster.*`).
- **Dependabot** (`.github/dependabot.yml`): weekly grouped updates for npm packages
  and GitHub Actions.

## Writing workflow

1. Add the post as `_posts/YYYY-MM-DD-slug.html`; put its images in
   `images/writings/<NN-post-slug>/`.
2. Wrap images in the `<picture>` pattern used by existing posts (WebP srcset +
   original fallback). The first image of a post uses `fetchpriority="high"`, the rest
   `loading="lazy"`.
3. Run `npm run optimize` locally and merge the output before pushing:
   `rsync -av images-optimized/writings/ images/writings/ && rm -rf images-optimized`.
   The Optimize Images Action is a safety net: it commits any missing WebP variants
   and re-runs CI, which checks and deploys the site.
4. In the front matter, set `image:` to the post's `og-image.jpg` (exactly 1200x630)
   and `preview_image:` to the cover's `-small.webp`.

More detail: [IMAGE-OPTIMIZATION.md](./IMAGE-OPTIMIZATION.md),
[GIF-CONVERSION.md](./GIF-CONVERSION.md), [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).

## JS modules

Six vanilla JS modules in `assets/js/` (`theme-toggle`, `tabs`, `toc-drawer`,
`scroll-progress`, `newsletter-animation`, `bookshelf`), each committed as source +
`.min.js`. `assets/css/main.css` is minified to `_includes/main.min.css` and inlined
into every page's `<head>`. After editing any of them, regenerate the minified copies
(CI fails if they are stale):

```bash
npm run minify
```
