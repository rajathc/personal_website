# rajath.blog

My personal blog. Built with Jekyll, hosted at [rajath.blog](https://rajath.blog) on GitHub Pages.

If you like the theme, feel free to use it — just swap out the content for your own.

## Local setup

Requires Ruby (see `.ruby-version`) and Node 18+.

```bash
# Ruby toolchain (once): install a modern Ruby via rbenv or brew, then
gem install bundler
bundle install

# Serve locally with live reload
bundle exec jekyll serve

# Node tooling (image optimization + JS minification)
npm ci
```

Note: GitHub Pages builds the site with its own locked Jekyll version (currently 3.x
via the `github-pages` builder), while the Gemfile targets Jekyll 4. Minor rendering
differences between local and production are possible; CI builds with the same
builder as production to catch real breakage.

## Workflows

- **CI** (`.github/workflows/ci.yml`) — builds the site with the GitHub Pages builder
  and fails on broken internal links, missing images/srcset variants, or missing alt text.
- **Optimize Images** (`.github/workflows/optimize-images.yml`) — on pushes touching
  `images/writings/`, generates WebP variants (800/1200/1920px) for new images and
  commits them. Idempotent: images that already have variants are skipped.

## Writing workflow

1. Add post as `_posts/YYYY-MM-DD-slug.html`; put images in `images/writings/<post-slug>/`.
2. Wrap images in the `<picture>` pattern used by existing posts (WebP srcset + original
   fallback). The first image of a post uses `fetchpriority="high"`, the rest `loading="lazy"`.
3. Push — the Action generates the WebP variants; CI validates links and images.

## JS modules

Five vanilla JS modules in `assets/js/`, each committed as source + `.min.js`.
After editing a source file, regenerate the minified copies:

```bash
npm run minify
```
