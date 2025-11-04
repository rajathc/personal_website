# Design System - rajath.blog

This document outlines the design system for rajath.blog, including typography, colors, spacing, and component guidelines.

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

**Display Font: PP Neue Machina**
- Used for: Headings, titles, navigation, logo
- Weights: Regular (400), Ultrabold (700)
- File format: OpenType (.otf)

**Body Font: Sligoil**
- Used for: Body text, captions, metadata
- Weights: Micro (400), Micro Medium (500), Micro Bold (700)
- File format: WOFF2, WOFF

### Font Sizes

#### Desktop
- **Logo/Site Title**: 2.5rem (40px)
- **H1 (Post Title)**: 4rem (64px)
- **H2**: 3rem (48px)
- **H3**: 2.25rem (36px)
- **Post List Title**: 2.5rem (40px)
- **Body Text**: 1.0625rem (17px)
- **Post Content**: 1.25rem (20px)
- **Tab Buttons**: 1rem (16px)
- **Footer Logo**: 2rem (32px)

#### Mobile (≤768px)
- **Logo/Site Title**: 1.75rem (28px)
- **H1 (Post Title)**: 2.5rem (40px)
- **H2**: 2rem (32px)
- **H3**: 1.5rem (24px)
- **Post List Title**: 1.75rem (28px)
- **Body Text**: 1.0625rem (17px)
- **Tab Buttons**: 0.875rem (14px)
- **Footer Logo**: 1.5rem (24px)

### Typography Scale
- **Line Height**: 1.75 (body), 1.3 (headings), 1.05 (large titles)
- **Letter Spacing**:
  - Headings: -0.02em to -0.04em (tighter)
  - Metadata: 0.1em (looser)

---

## Colors

### Light Mode
```css
--bg-color: #F5F5F5          /* Background */
--text-color: #2C3444        /* Primary text */
--accent-color: #00BFA5      /* Caribbean Green - accent */
--footer-bg: #1E2432         /* Footer background */
--footer-text: #FFFFFF       /* Footer text */
--card-bg: #FFFFFF           /* Card backgrounds */
--border-color: #E0E0E0      /* Borders and dividers */
--drawer-bg: #F5F5F5         /* TOC drawer background */
--drawer-text: #2C3444       /* TOC drawer text */
```

### Dark Mode
```css
--bg-color: #2C3444          /* Background */
--text-color: #E8E8E8        /* Primary text */
--accent-color: #00BFA5      /* Caribbean Green - accent (consistent) */
--footer-bg: #1E2432         /* Footer background (same as light) */
--footer-text: #FFFFFF       /* Footer text */
--card-bg: #3A4252           /* Card backgrounds */
--border-color: #4A5262      /* Borders and dividers */
--drawer-bg: #2C3444         /* TOC drawer background */
--drawer-text: #E8E8E8       /* TOC drawer text */
```

### Color Usage Guidelines
- **Accent Color (#00BFA5)**: Use for active states, highlights, underlines, and CTAs
- **Footer stays dark**: Footer uses dark theme colors (#1E2432) in both light and dark modes
- **Opacity for subtle text**: 0.65 for metadata, 0.5 for hover states on summaries

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
- **3rem** (48px) - 2XL spacing

### Spacing Applications

#### Padding
- **Container horizontal padding**: 1rem (mobile and desktop)
- **Site header**: 3rem top, 1rem sides, 2rem bottom
- **Post container**: 1rem all sides (mobile), 1rem all sides (desktop)
- **Footer**: 3rem vertical, 1rem horizontal
- **Tab buttons**: 0.75rem vertical, 1.5rem horizontal
- **TOC drawer**: 2rem all sides

#### Margins
- **Section spacing**: 2-3rem between major sections
- **Paragraph spacing**: 1.75rem bottom margin
- **Heading spacing**:
  - H2: 3rem top, 1.5rem bottom
  - H3: 2.5rem top, 1.25rem bottom
- **Image margins**: 3rem vertical (desktop), 2rem vertical (mobile)
- **Post list items**: 3rem bottom

#### Gaps
- **Tabs gap**: 1rem
- **Logo elements**: 0.75rem
- **Post header elements**: 1rem

---

## Layout

### Max-Width Constraints
- **Content Container**: 800px
  - Used for: main content, posts, home page, footer
  - Centered with `margin: 0 auto`

### Content Width
All content is constrained to a maximum width of 800px for optimal readability.

### Alignment
- **Text**: Left-aligned (default)
- **Headers**: Left-aligned
- **Images**:
  - Desktop/Tablet: Contained within content width with border-radius
  - Mobile: Edge-to-edge (negative margins to break out of container)

---

## Components

### Buttons

#### Tab Buttons
- **Default State**:
  - Background: transparent
  - Border: 3px transparent bottom
  - Padding: 0.75rem vertical, 1.5rem horizontal
  - Font: PP Neue Machina, 1rem

- **Active State**:
  - Background: var(--accent-color)
  - Color: white
  - Font weight: bold
  - Border-radius: 4px 4px 0 0

- **Mobile**:
  - Font-size: 0.875rem
  - Padding: 0.625rem vertical, 1rem horizontal

#### Theme Toggle
- Icon-only button
- Size: 20px × 20px icon
- Padding: 0.5rem
- Changes based on theme (Sunglasses for light mode, Lightbulb for dark mode)
- Position: Left side of tabs on homepage, Right side of "Rajath" name on post pages

#### Menu Toggle (TOC)
- Icon-only button on post pages
- Size: 24px × 24px icon
- Color: var(--text-color)
- Padding: 0.5rem
- Icons switch when drawer opens/closes

#### Newsletter Subscribe Button
- Positioned inside email input field (right side)
- Padding: 0.75rem vertical, 1.75rem horizontal
- Font-size: 1.0625rem
- Background: var(--accent-color)
- Color: white
- Border-radius: 8px

### Cards

#### Post List Items
- Background: var(--card-bg)
- Border: 1px solid var(--border-color)
- Border-radius: 8px
- Padding: 2rem
- Margin-bottom: 3rem

- **Hover State**:
  - Title color changes to var(--accent-color)
  - Excerpt opacity reduces to 0.5
  - Transition: 0.3s ease

### Links
- **Default**:
  - Color: var(--text-color)
  - Underline: 2px solid var(--accent-color)
  - Offset: 3px

- **Hover**:
  - Color: var(--accent-color)
  - Underline color: var(--text-color)

### Images
- Border-radius: 8px (desktop/tablet)
- Border-radius: 0 (mobile - edge to edge)
- Max-width: 100%
- Height: auto

### TOC Drawer
- Width: 90% (max 600px)
- Height: 100vh
- Background: var(--drawer-bg)
- Slides in from left
- Overlay: rgba(0, 0, 0, 0.5)
- Transition: 0.3s ease

### Footer
- Always uses dark theme colors
- Background: #1E2432
- Text color: #FFFFFF
- Newsletter form integrated
- Social links: Twitter, LinkedIn, RSS

---

## Breakpoints

### Mobile
```css
@media (max-width: 768px)
```
- Single column layout
- Reduced font sizes
- Edge-to-edge images
- Smaller padding and margins
- Tabs wrap on mobile

### Tablet
```css
@media (min-width: 769px) and (max-width: 1024px)
```
- Uses similar styling to desktop
- Images contained with border-radius

### Desktop
```css
@media (min-width: 1025px)
```
- Full typography scale
- Maximum content width: 800px
- Optimal spacing

### Large Desktop
```css
@media (min-width: 1400px)
```
- Same as desktop (maintains 800px content width)

---

## Icons

### Icon Pack
**Phosphor Icons** - Used throughout the site

### Icon Usage
- **Lightbulb** (filled): Light mode indicator (shown in dark mode to switch to light)
- **Sunglasses** (filled): Dark mode indicator (shown in light mode to switch to dark)
- **Menu/Hamburger** (list icon): TOC drawer open state
- **Arrow/Back**: TOC drawer close state
- **Moon/Crescent**: Site logo (favicon.svg)

### Icon Sizing
- Theme toggle icons: 20px × 20px
- Menu toggle icons: 24px × 24px
- Logo icon: 2.5rem (40px) desktop, 1.75rem (28px) mobile

### Icon Colors
- Use `currentColor` or `var(--text-color)` for theme adaptation
- Accent color used for logo/brand elements

---

## Best Practices

### DO's
- ✓ Use the spacing scale consistently
- ✓ Maintain 800px max-width for readability
- ✓ Use semantic HTML elements
- ✓ Ensure color contrast meets WCAG standards
- ✓ Keep footer dark in both themes
- ✓ Use proper heading hierarchy (H1 → H2 → H3)
- ✓ Left-align all text and headings

### DON'Ts
- ✗ Don't use arbitrary spacing values outside the scale
- ✗ Don't center-align headings
- ✗ Don't add padding inside already padded containers
- ✗ Don't use colors outside the defined palette
- ✗ Don't forget hover states on interactive elements
- ✗ Don't make links without proper underlines

---

## Accessibility

### Color Contrast
- Text/Background ratios meet WCAG AA standards
- Accent color provides sufficient contrast
- Links are underlined (not just color-coded)

### Interactive Elements
- Buttons have proper focus states
- Aria labels on icon-only buttons
- Keyboard navigation supported
- Hover states provide clear feedback

### Typography
- Minimum font size: 14px (0.875rem) on mobile
- Line height ensures readability (1.75 for body)
- Letter spacing optimized for each font size

---

## Version History

**Version 1.0** - November 2025
- Initial design system documentation
- Brutalist typography-first design
- Light/dark theme implementation
- Mobile-responsive layouts
- Phosphor icon integration

---

## Notes

- All measurements use rem units for scalability
- CSS custom properties enable theme switching
- System respects user's OS theme preference by default
- Theme preference stored in localStorage
- Transitions add polish without sacrificing performance
