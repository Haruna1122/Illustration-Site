# Codex Notes - v16 Grit Texture Pass

## Intent

The user liked the TOP, panels, hover membranes, and WebGL refraction. Do not redesign those. v16 only adds a rougher background texture so the atmosphere feels more tactile, sandy, and dreamlike instead of smooth or light-band-like.

## Do not touch unless requested

```text
styles/v10-topflow.css
styles/refraction.css
scripts/refraction.js
main panel SVG markup
foreground liquid panel layout
```

## Main edit points

```text
styles/atmosphere.css
scripts/atmosphere.js
index.html atmosphere block near the top of <body>
```

## v16 additions

### CSS grit layer

`index.html` now includes:

```html
<div class="atmosphere__grit"></div>
```

This is a CSS-only dither overlay, so it is cheap compared with adding another animated canvas. Its strength is controlled by:

```css
--atmosphere-grit-opacity
```

### Canvas texture changes

`scripts/atmosphere.js` now uses lower rendering cost:

```js
state.dpr = Math.min(window.devicePixelRatio || 1, 1.12);
smokeScale: 0.36;
smokeFps: 20;
particleFps: 24;
```

Sand particles are rendered with direct strokes and tiny square specks instead of per-particle linear gradients. That should look more granular and cost less.

### Smoke wisps

`drawWisps()` still follows the same ribbon paths from v15, but now draws three layers of sparse strokes and dots. This should read as noisy drifting sand rather than glowing bands.

## If the texture is too strong

First lower these values:

```css
--atmosphere-grit-opacity: 0.14;
--atmosphere-noise-opacity: 0.11;
--atmosphere-particle-opacity: 0.62;
```

## If the texture is still too subtle

Increase only one at a time:

```css
--atmosphere-grit-opacity: 0.26;
--atmosphere-noise-opacity: 0.19;
```

Or in `createParticles()`, reduce the divisor slightly:

```js
Math.round(area / 3900)
```

Avoid raising the canvas DPR unless absolutely necessary. The gritty look benefits from lower resolution.

## External assets

Image replacement remains in `scripts/assets-config.js`. External image URLs are fine, but WebGL refraction needs CORS headers from the image host.

## v17 CTA panels

- TOP hero CTAも `data-lower-liquid-card` 構造に寄せました。
- 調整対象は `index.html` / `standalone-preview.html` の `hero-liquid-cta` と、`styles/portfolio.css` 末尾の `v17 TOP CTA membranes` です。
- ホバーの膜変形は `data-lower-hover-animate` の path `values` と `dur` で調整してください。

## v18 hero navigation panels

The three image panels inside the TOP Fluid hero are now clickable SVG navigation links.

Key edits:

- `index.html` and `standalone-preview.html`
  - Search for `liquid-stage--nav`.
  - SVG anchors use `.hero-panel-link--commission`, `.hero-panel-link--booth`, and `.hero-panel-link--works`.
  - Links point to `commission/index.html`, `shop/index.html`, and `work/index.html`.
- `styles/portfolio.css`
  - Search for `v18: make the TOP fluid hero artwork panels`.
  - Panel layout is controlled by `--panel-x`, `--panel-y`, `--panel-scale`, and `--panel-hover-scale`.
  - Desktop prioritizes Commission and BOOTH in the upper row, with Works lower and smaller.
  - Mobile keeps a staggered arrangement instead of a flat vertical stack.

To tune trimming, keep the image source the same and adjust SVG image attributes or clip paths first. To tune panel position, change the CSS custom properties rather than editing every path.
