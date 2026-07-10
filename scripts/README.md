# scripts/

代表例の同期確認と共有URLの往復テストを行うスクリプト群です。初回のみ `cd scripts && npm install && npx playwright install chromium` で依存を入れます。2回目以降は代表例を変更したときなどに `cd scripts && npm test` を実行します。`npm test` は先に `check:demo-sync`（代表例の同期確認。HTTP サーバー不要）と `check:affiliate-sections`（アフィリエイト導線の横断確認。HTTP サーバー不要）を走らせ、続けて `test:share-urls`（共有URLの往復テスト。HTTP サーバー必須。別ターミナルで `python3 -m http.server 8000` を起動したまま）を実行します。

- `check-demo-sync.mjs` — 代表例の同期確認（README・`index.html`・`verify-share-urls.mjs` のクエリパス一致）
- `check-affiliate-sections.mjs` — アフィリエイト導線の横断確認（積立・時給・手取りの PR 表記・aff-slot 2枠・免責文）
- `replace-site-url.mjs` — 独自ドメイン取得後の URL 一括置換（`sitemap.xml`・`robots.txt`・全HTML・README 等）
- `verify-share-urls.mjs` — 共有URLの往復テスト（Playwright で11ツール。再読み込み後も同じ結果になるか検証）
- `package.json` — `check:demo-sync`・`check:affiliate-sections`・`replace-site-url`・`test:share-urls`・`test` の npm スクリプト定義
- `README.md` — 本ファイル。初回セットアップ・`npm test` の手順
