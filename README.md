# Organic Noise Site v10

GitHub + Vercel にそのままデプロイできる静的サイト用フォルダです。

## フォルダ構成

```text
.
├── index.html
├── assets/
│   ├── cat-chair.webp
│   ├── chroma.webp
│   └── mermaid.webp
├── styles/
│   ├── base.css
│   ├── components.css
│   ├── layout.css
│   ├── tokens.css
│   ├── v10-topflow.css
│   └── v7-liquid-canvas.css
└── scripts/
    └── main.js
```

## ローカル確認

```bash
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000` を開いてください。

## GitHub へのアップロード

1. GitHub で新しいリポジトリを作成します。
2. このフォルダの中身をリポジトリ直下へアップロードします。
3. `index.html` がリポジトリ直下にある状態にします。

## Vercel でデプロイ

1. Vercel にログインします。
2. **Add New... → Project** を選びます。
3. GitHub リポジトリを選択します。
4. Framework Preset は **Other** のままで大丈夫です。
5. Build Command は空欄で大丈夫です。
6. Output Directory は空欄、または `.` にします。
7. **Deploy** を押します。

## 画像参照について

画像は HTML から相対パスで参照しています。

```html
<img src="assets/mermaid.webp" alt="">
```

Vercel では、このままで `assets/mermaid.webp` が公開されます。
