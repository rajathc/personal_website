# Design System - rajath.blog

This document outlines the design system for rajath.blog: typography, colors, spacing,
layout, components and breakpoints. The source of truth is `assets/css/main.css`; when
the two disagree, the CSS wins and this file should be updated.

---

## Table of Contents

1. [Typography](#typography)
2. [Colors](#colors)
3. [Spacing System](#spacing-system)
4. [Layout](#layout)
5. [Components](#components)
6. [Breakpoints](#breakpoints)
7. [Icons](#icons)

---

## Typography

### Font Families

All fonts are self-hosted as WOFF2, with their OFL license files alongside.

**Interface Font: Bricolage Grotesque**
- Used for: Headings, titles (ExtraBold 800), interface chrome (tabs, buttons, labels, bookshelf)
- Weights: Regular (400), Bold (700), ExtraBold (800)
- File format: WOFF2, latin subset
- Fallback: `Bricolage-fallback` (Arial / Roboto with metric overrides, so titles wrap the same before and after the font loads)

**Logo Font: Oi**
- Used for: The "Rajath" wordmark and the "rajath.blog" footer logo only
- Weight: Regular (400)
- File format: WOFF2, subset to the glyphs of "Rajath" / "rajath.blog"

**Body Font: Sligoil**
- Used for: Body text, captions, metadata
- Weights: Micro (400), Micro Medium (500), Micro Bold (700)
- File format: WOFF2 only, subset to Latin + punctuation + `← → − ★`
- Fallback: `Sligoil-fallback` (Courier New / Roboto Mono / Noto Sans Mono with metric overrides; same 0.6em advance, so no reflow at swap)

### Font Sizes

The root size is `clamp(0.89rem, 0.4625rem + 2vw, 1rem)`: 16px from about 430px wide,
easing down to about 14px on narrower phones, so the whole rem scale shrinks together.
Most display sizes are fluid `clamp()` values, so there is no separate mobile table.

| Element | Size | Notes |
|---------|------|-------|
| Homepage wordmark "Rajath" (`.site-title`) | `clamp(2.75rem, 7.5vw, 5rem)` | Oi, sky gradient |
| Inner-page wordmark (`.site-name`) | `clamp(1.75rem, 3.5vw, 2.5rem)` | Oi, sky gradient |
| Post title, H1 (`.post-title`) | `clamp(2.25rem, 5.5vw, 3.5rem)` | 800, line-height 1.05, -0.04em |
| Page title (`.page-title`) | 2.5rem | 800 |
| Post H2 | `clamp(1.75rem, 4vw, 2.5rem)` | bold, -0.03em |
| Post H3 | `clamp(1.375rem, 3vw, 1.875rem)` | bold, -0.03em |
| Post list title | `clamp(1.5rem, 3vw, 2rem)` | 800; the latest post (hero) `clamp(1.75rem, 4.5vw, 2.5rem)` |
| Body text and post content | 1rem | |
| Metadata (dates, read time) | 0.875rem | uppercase, 500 |
| Captions | 0.875rem | camera details 0.8125rem |
| Tab buttons | 1rem | 0.9375rem at ≤768px, 0.875rem at ≤480px |
| Footer logo | 2rem | 1.5rem at ≤768px |
| Newsletter label | 0.875rem | Bricolage |
| Newsletter field | `max(16px, 1rem)` | never under 16px, or iOS Safari zooms in on focus |
| Bookshelf metadata | 0.6875rem to 0.9375rem | smallest is the 11px kicker |

### Typography Scale
- **Line Height**: 1.75 (body), 1.8 (post and page content), 1.15 (headings), 1.05 (post title)
- **Letter Spacing**:
  - Headings: -0.02em (default), -0.03em to -0.04em (titles)
  - Metadata: 0.05em (post list), 0.1em (post page)
- **Weight**: H1 and H2 are 800; post H2/H3 inside content are bold (700)

---

## Colors

Tokens live on `:root` in `assets/css/main.css`. An inline script in
`_layouts/default.html` sets `data-theme` on `<html>` before first paint (saved choice
in localStorage, else the OS preference). With JavaScript off, the bare `:root` is
light and `@media (prefers-color-scheme: dark)` applies the dark tokens.

### Light Mode (`:root`, `:root[data-theme="light"]`)
```css
--bg-color: #F5F5F5          /* Background */
--text-color: #2C2C2C        /* Primary text */
--link-color: #2C2C2C        /* Link text */
--accent-color: #00CC99      /* Tech green: fills, underlines, highlights */
--accent-strong: #007A5C     /* Accent for text and focus rings (4.9:1 on the light bg) */
--footer-bg: #1a1a1a         /* Footer background */
--footer-text: #FFFFFF       /* Footer text */
--card-bg: #FFFFFF           /* Card backgrounds */
--border-color: #E0E0E0      /* Borders and dividers */
--drawer-bg: #F5F5F5         /* TOC drawer background */
--drawer-text: #2C2C2C       /* TOC drawer text */
--dim-text: #595959          /* Small metadata (5.3:1 on the light bg) */
--control-border: #8C8C8C    /* Select and button outlines (3.1:1 on the light bg) */
```

### Dark Mode (`:root[data-theme="dark"]`)
```css
--bg-color: #1a1a1a          /* Background */
--text-color: #E8E8E8        /* Primary text */
--link-color: #F0F0F0        /* Link text, a touch brighter than body text */
--accent-color: #00CC99      /* Tech green (same in both modes) */
--accent-strong: #00CC99     /* The accent already has 8.4:1 on the dark bg */
--footer-bg: #0f0f0f         /* Footer background, darker than the page */
--footer-text: #FFFFFF       /* Footer text */
--card-bg: #2d2d2d           /* Card backgrounds */
--border-color: #404040      /* Borders and dividers */
--drawer-bg: #1a1a1a         /* TOC drawer background */
--drawer-text: #E8E8E8       /* TOC drawer text */
--dim-text: #9E9E9E          /* Small metadata (6.4:1 on the dark bg) */
--control-border: #6E6E6E    /* Select and button outlines */
```

### Theme-independent
```css
--on-accent: #1a1a1a         /* Text on accent fills (active tab, Subscribe, skip link, 404 label) */
--accent-hover: #00a88f      /* Subscribe button hover fill */
--input-bg: #FFFFFF          /* Newsletter field, white in both themes */
--input-text: #1E2432        /* Newsletter field text */
--disc-groove: #141414       /* 404 record grooves */
--disc-groove-light: #1f1f1f
--sky-gradient: linear-gradient(90deg, #ffb366, #ff9b7a, #dd8ba7, #9b9bbe, #7a9bd4,
                #6283b9, #4a6b9e, ...)  /* Bengaluru evening sky: wordmarks and the newsletter border */
```

### Color Usage Guidelines
- **Accent Color (#00CC99)**: Use for fills, active states, underlines and highlights.
- **Accent as text or outline**: Use `var(--accent-strong)` (hover text, stars, focus rings), so it passes AA in light mode.
- **Text on accent backgrounds**: Use `var(--on-accent)` (#1a1a1a), not white and not `--text-color`.
- **Links**: Use `var(--link-color)`, including in components that color their own anchors.
- **Footer stays dark**: `--footer-bg` is #1a1a1a in light mode and #0f0f0f in dark mode, with #FFFFFF text in both.
- **Subtle text**: Small metadata uses `var(--dim-text)`, which stays AA. Larger secondary text still uses opacity (0.7 to 0.85).

---

## Spacing System

The spacing system uses a consistent scale based on rem units:

### Base Scale
- **0.5rem** (8px) - Minimal spacing
- **0.75rem** (12px) - Small spacing
- **1rem** (16px) - Base unit
- **1.25rem** (20px) - Medium spacing
- **1.5rem** (24px) - Large spacing
- **2rem** (32px) - XL spacing
- **2.5rem** (40px) - Heading and tablet image spacing
- **3rem** (48px) - 2XL spacing
- **4rem** (64px) - Section breaks (footer, previous/next post)

Dense components (bookshelf rows and toolbar, mobile tabs) use a few finer steps in
between (0.35rem to 0.9rem).

### Spacing Applications

#### Padding
- **Container horizontal padding**: 1rem (mobile and desktop)
- **Site header**: 3rem top, 1rem sides, 2rem bottom (mobile: 2rem, 1rem, 1.5rem)
- **Post container**: 1rem all sides
- **Page container** (`/writings/`, `/bookshelf/`, 404): 2rem vertical, 1rem horizontal
- **Footer**: 3rem top, 1rem sides, 3.5rem bottom
- **Tab buttons**: 0.75rem vertical, 1.5rem horizontal
- **TOC drawer**: 2rem all sides

#### Margins
- **Paragraph spacing**: 1.75rem bottom (posts), 1rem (pages)
- **Heading spacing**:
  - H2: 3rem top, 1.5rem bottom
  - H3: 2.5rem top, 1.25rem bottom
- **Images and figures**: 3rem vertical (desktop), 2.5rem for bare images on tablet, 2rem (mobile)
- **Lists in posts**: 1.5rem left padding, 1.5rem bottom margin, 0.5rem between items
- **Post list items**: 3rem gap between items
- **Footer**: 4rem above it

#### Gaps
- **Tabs gap**: 1rem
- **Logo elements**: 0.75rem
- **Post header elements**: 1rem
- **Portrait pairs**: 1rem

---

## Layout

### Max-Width Constraints
- **Content Container**: 800px; 900px at 1400px and wider
  - Used for: site header, main content, posts, pages
  - Centered with `margin: 0 auto`
- **Footer content**: the same text column (`calc(800px - 2rem)`, `calc(900px - 2rem)` at 1400px and wider), so footer links line up with the body text
- **Newsletter form**: 500px
- **Wide figures** (`.image-wide`): 1040px from 1200px wide

### Content Width
Text is constrained to the content container for readability.

### Alignment
- **Text**: Left-aligned (default), including captions
- **Headers**: Left-aligned
- **Images**:
  - Desktop/Tablet: Contained within content width with border-radius; images narrower than the column are centered (from 769px)
  - Mobile: Edge-to-edge (negative margins to break out of container)

---

## Components

### Buttons

All buttons have a minimum 44px by 44px target.

#### Tab Buttons
- Real links to `/writings/` and `/bookshelf/`; `tabs.js` turns them into tabs
- **Default State**:
  - Background: transparent
  - Border: 3px transparent bottom
  - Padding: 0.75rem vertical, 1.5rem horizontal
  - Font: Bricolage Grotesque, 1rem, `var(--link-color)`

- **Active State**:
  - Background: var(--accent-color)
  - Color: var(--on-accent)
  - Font weight: bold
  - Border-radius: 4px 4px 0 0

- **Hover / press** (inactive tabs): 14% / 24% accent tint

- **Mobile**:
  - ≤768px: 0.9375rem, padding 0.6rem vertical, 0.65rem horizontal
  - ≤480px: 0.875rem, padding 0.55rem vertical, 0.5rem horizontal

#### Theme Toggle
- Icon-only button, 44px by 44px
- Icon: 24px by 24px
- Changes based on theme (Sunglasses in light mode, Lightbulb in dark mode)
- Position: right end of the tabs row on the homepage; right of the "Rajath" name on post and page layouts

#### Menu Toggle (TOC)
- Icon-only button on post pages, 44px by 44px
- Icon: 24px by 24px
- Color: var(--text-color)
- Icons switch when drawer opens/closes

#### Newsletter Form
- Visible label above the field (`.newsletter-label`)
- White field (`--input-bg`, `--input-text`) in both themes, 12px radius
- Subscribe button inside the field on the right:
  - Padding: 0.75rem vertical, 1.75rem horizontal (mobile: 0.625rem, 1.25rem)
  - Font: Bricolage Grotesque, bold, 1rem (0.875rem at ≤1024px)
  - Background: var(--accent-color), hover var(--accent-hover)
  - Color: var(--on-accent)
  - Border-radius: 8px
- Posts to Buttondown in a new tab; a status line (`.newsletter-done`) confirms below the form
- The sky gradient runs once around the field when the footer first scrolls into view

### Post List

- No cards: a column with a 3rem gap
- **Latest post (hero)**: full-width 3:2 cover, 8px radius, bigger title
- **Older posts**: compact rows with a 3:2 thumbnail on the left (110px, 96px at ≤600px, 6px radius), title and metadata beside it, excerpt below
- **Hover / focus**: title turns var(--accent-strong) and underlines (2px, 4px offset)

### Links
- **Default**:
  - Color: var(--link-color)
  - Underline: 2px solid var(--accent-color)
  - Offset: 3px

- **Hover**:
  - Color: var(--accent-strong)
  - Underline color: var(--text-color)

- **Focus**: 3px solid var(--accent-strong) outline, 2px offset

### Images
- Border-radius: 8px (desktop/tablet)
- Border-radius: 0 (mobile, edge to edge)
- Max-width: 100%
- Height: auto
- Responsive images use `<picture>` (WebP srcset + original fallback), displayed as a block
- Captions (`.caption`): 0.875rem, left-aligned, opacity 0.8; camera details (`.caption-details`) on their own line at 0.8125rem
- Portrait pairs (`.portrait-group`): side by side from 769px, stacked on mobile

### TOC Drawer
- Width: 90% (max 600px; full width at ≤768px)
- Height: 100%
- Background: var(--drawer-bg)
- Slides in from the right
- Overlay: rgba(0, 0, 0, 0.5)
- Transition: 0.3s ease
- Hidden (`visibility: hidden`) when closed, so focus and screen readers skip it

### Footer
- Always dark: var(--footer-bg) (#1a1a1a light, #0f0f0f dark)
- Text color: var(--footer-text) (#FFFFFF)
- Rounded top corners: 24px
- Oi "rajath.blog" logo, newsletter form, then social links (Twitter, LinkedIn, RSS) and copyright

### Bookshelf
- **Currently reading**: card (var(--card-bg), 1px border, 10px radius)
- **Favourites**: grid of 2:3 covers (min 96px columns, 3px radius, 3px lift on hover)
- **Toolbar** (`.book-toolbar`, `.book-filter-row`): 44px selects with var(--control-border), 6px radius; they wrap on mobile
- **Count and kicker** (`.book-count`, `.book-kicker`): var(--dim-text)
- **Reading log**: year-grouped rows with 34px covers and a bottom border; dates hidden on mobile

### Other
- **Skip link**: accent fill, var(--on-accent) text, shown on focus
- **Scroll progress**: 4px accent bar fixed to the top of post pages
- **Previous/next post**: 1px top border, 4rem above
- **404 record** (`.disc-404`): 140px spinning disc with an accent label; it stops under reduced motion

---

## Breakpoints

### Mobile
```css
@media (max-width: 768px)
```
- Edge-to-edge images
- Smaller header, footer logo and Subscribe button
- Newsletter form and label full width with 1rem margins
- Tighter tabs; TOC drawer full width
- Bookshelf filters wrap; reading-log dates hidden

### Small phones
```css
@media (max-width: 600px)   /* post list thumbnails 96px */
@media (max-width: 480px)   /* smallest tab buttons */
```

### Desktop and tablet
```css
@media (min-width: 769px)
```
- Images narrower than the column are centered
- Portrait pairs sit side by side

### Tablet
```css
@media (min-width: 769px) and (max-width: 1024px)
```
- Uses the desktop treatment (column width, rounded corners)
- 2.5rem image and figure spacing; smaller Subscribe button

### Wide
```css
@media (min-width: 1200px)
```
- `.image-wide` figures break out to 1040px

### Large Desktop
```css
@media (min-width: 1400px)
```
- Containers widen to 900px (footer column to `calc(900px - 2rem)`)

### Media features
- `prefers-color-scheme: dark`: dark tokens when JavaScript is off
- `prefers-reduced-motion: reduce`: animations and transitions off
- `forced-colors: active`: the newsletter field and button get visible borders
- `hover: hover` and `pointer: fine`: hover tints on icon buttons and tabs

---

## Icons

### Icon Pack
**Phosphor Icons** - Inline SVG throughout the site, `aria-hidden="true"`

### Icon Usage
- **Lightbulb** (filled): Light mode indicator (shown in dark mode to switch to light)
- **Sunglasses** (filled): Dark mode indicator (shown in light mode to switch to dark)
- **Menu/Hamburger** (list icon): TOC drawer open state
- **Arrow/Back**: TOC drawer close state
- **Moon/Crescent**: Site icon (`favicon.svg`; `favicon.ico` and `apple-touch-icon.png` for older browsers and iOS)

### Icon Sizing
- Theme toggle icons: 24px by 24px
- Menu toggle icons: 24px by 24px

### Icon Colors
- Use `currentColor` or `var(--text-color)` for theme adaptation

---

## Best Practices

### DO's
- ✓ Use the spacing scale consistently
- ✓ Keep text within the content column for readability
- ✓ Use semantic HTML elements
- ✓ Use `--accent-strong`, `--dim-text` and `--on-accent` so color contrast meets WCAG AA
- ✓ Keep footer dark in both themes
- ✓ Use proper heading hierarchy (H1 → H2 → H3)
- ✓ Left-align body text and headings

### DON'Ts
- ✗ Don't use arbitrary spacing values outside the scale
- ✗ Don't center-align headings
- ✗ Don't add padding inside already padded containers
- ✗ Don't use colors outside the defined palette
- ✗ Don't forget hover and focus states on interactive elements
- ✗ Don't make links without proper underlines

---

## Accessibility

### Color Contrast
- Text/Background ratios meet WCAG AA standards
- Accent-colored text and focus rings use `--accent-strong` (4.9:1 in light mode)
- Small metadata uses `--dim-text` (5.3:1 light, 6.4:1 dark) instead of opacity
- Links are underlined (not just color-coded)

### Interactive Elements
- Buttons have a 44px minimum target and a 3px `--accent-strong` focus outline
- Aria labels on icon-only buttons
- Keyboard navigation: arrow keys move between tabs; the TOC drawer keeps focus inside and closes on Escape
- Skip-to-content link on every page
- Hover states provide clear feedback

### Motion
- `prefers-reduced-motion: reduce` turns off animations and transitions, and stops the 404 disc
- Autoplaying post videos get native controls, and are paused under reduced motion (`toc-drawer.js`)

### Typography
- Body text is 1rem; the smallest text is 0.6875rem (the bookshelf kicker), in `--dim-text`
- Form fields are never under 16px
- Line height ensures readability (1.75 for body)

---

## Version History

**Version 1.1** - October 2026
- Re-synced with `assets/css/main.css`: neutral grey palette (replacing the navy one), footer tokens, `--link-color`, `--accent-strong`, `--dim-text`, `--control-border`, `--on-accent`
- Fluid type scale, current breakpoints, post list, bookshelf, newsletter and 404 components

**Version 1.0** - November 2025
- Initial design system documentation
- Brutalist typography-first design
- Light/dark theme implementation
- Mobile-responsive layouts
- Phosphor icon integration

---

## Notes

- Type and spacing use rem units; borders, radii and touch targets use px
- CSS custom properties enable theme switching
- The site follows the OS theme until the reader picks one with the toggle
- Theme preference stored in localStorage
- Transitions add polish without sacrificing performance
