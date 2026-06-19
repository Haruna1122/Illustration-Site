# Artist Portfolio Prototype

This prototype has been reorganized from a single long TOP page into a hierarchical static portfolio site.

## Main structure

- `index.html` - Home / entry page
- `work/index.html` - Work category landing
- `work/<category>/index.html` - Category listing
- `work/<category>/<sample>/index.html` - Work detail page
- `commission/index.html` - Commission landing
- `commission/portrait/index.html` - Portrait commission detail
- `commission/flyer-design/index.html` - Flyer design commission detail
- `commission/skeb/index.html` - Skeb guide
- `shop/index.html` - ZINE / BOOTH landing
- `shop/zine-soft-noise/index.html` - ZINE detail template
- `about/index.html` - Profile page

## Placeholder replacement notes

- Replace images marked with `data-placeholder-image` after final artwork references are ready.
- TOP CTA panel images are mapped in `scripts/assets-config.js` as `ctaWork`, `ctaCommission`, and `ctaBooth`. You can replace the asset paths there without touching the HTML.
- Replace links marked with `data-link-placeholder` after Skeb, BOOTH, X, Instagram, and Email URLs are finalized.
- The visual system is still based on the original liquid membrane, drifting particles, smoke, grain, and blurred light layers.

## Navigation note

Links use explicit `index.html` paths so the prototype works when opened locally from the filesystem and when served from a static host.

## 2026-06 organic TOP CTA update

The homepage hero CTAs (`View Work`, `Commission`, `BOOTH`) were enlarged and restyled as organic image panels that visually echo the main liquid hero. Placeholder images remain connected through `scripts/assets-config.js` keys:

- `ctaWork`
- `ctaCommission`
- `ctaBooth`

Replace those values or the files in `assets/` when final artwork is ready.

## v17 CTA update

- TOPの `View Work / Commission / BOOTH` を、CSS角丸カードではなくSVG path / clipPath / 発光ラインの液体膜CTAに作り直しました。
- `data-lower-liquid-card` と `data-lower-hover-animate` を使い、v10と同じSMIL hover motionで膜が変形します。
- 画像差し替えは `scripts/assets-config.js` の `ctaWork` / `ctaCommission` / `ctaBooth` を維持しています。

## v18 subpage headline balance

- サブページ上部の導入文言（例: 「ZINEとBOOTHへの入口。」）のフォントサイズを半分以下に抑えました。
- TOP heroや液体SVG CTAの構造は変更していません。

## v18 update

- TOPのFluid hero内にある3つの画像パネルをナビゲーションボタン化しました。
- DesktopではCommissionとBOOTHを上段に置き、Worksを少し小さめに下段へ回しています。
- Mobileでは縦積みではなく、Commission、BOOTH、Worksが少し互い違いになるようにSVG内の配置変数を調整しています。
- パネル画像は従来どおり `scripts/assets-config.js` で差し替えられます。
