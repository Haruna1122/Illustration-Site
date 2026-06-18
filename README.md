# Organic Noise Site v11

v10 の流体UIをベースに、WebGL の屈折レイヤーを追加した版です。SVG の膜やホバー時の枠の動きはそのまま残し、画像の上に薄い `canvas` を重ねて、水越しに見えるような揺らぎを足しています。

## 確認方法

```bash
cd organic-noise-site-v11
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000` を開いてください。WebGL と画像読み込みの都合で、`file://` 直開きではなくローカルサーバー経由の確認がおすすめです。

## 画像の差し替え

画像パスは `scripts/assets-config.js` に集約しています。

```js
window.SITE_ASSETS = {
  mermaid: "assets/mermaid.webp",
  catChair: "assets/cat-chair.webp",
  chroma: "assets/chroma.webp",
};
```

GitHub Pages に置く場合は、同じリポジトリ内の画像パスに置き換えるのが一番安全です。

```js
window.SITE_ASSETS = {
  mermaid: "assets/my-new-main.webp",
  catChair: "assets/my-new-sub.webp",
  chroma: "assets/my-new-color.webp",
};
```

外部URLも指定できます。

```js
window.SITE_ASSETS = {
  mermaid: "https://example.com/images/main.webp",
  catChair: "https://example.com/images/sub.webp",
  chroma: "https://example.com/images/color.webp",
};
```

通常の画像表示は外部URLでも動きます。ただし WebGL の屈折レイヤーは画像をテクスチャとして読み込むため、外部サーバー側で CORS が許可されている必要があります。CORS がない画像では、画像本体は表示されますが、屈折レイヤーだけ自動的に無効になります。

## 主な編集箇所

```text
scripts/assets-config.js  画像パスの差し替え
scripts/asset-loader.js   data-asset-key から画像を反映
scripts/refraction.js     WebGL屈折シェーダー
styles/refraction.css     屈折レイヤーの濃さ、重ね方
index.html                data-refraction-key / data-asset-key
```

## 屈折の強さを変える

HTML側の `data-refraction-intensity` を変えると、要素ごとに揺らぎの強さを調整できます。

```html
<article data-refraction-key="mermaid" data-refraction-intensity="0.92">
```

小さくすると静かに、大きくすると水面感が強くなります。

## スタンドアローン版

`standalone-preview.html` は CSS / JS / 画像を直接埋め込んだ確認用です。Codex や GitHub に持っていく場合は、通常構成の `index.html` 側を編集してください。
