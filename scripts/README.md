# scripts/

共有URLの代表例が README・`index.html`・`verify-share-urls.mjs` で揃っているか、および各ツールの共有URLが再読み込み後も同じ結果になるかを検証するスクリプト群です。初回のみリポジトリルートで `python3 -m http.server 8000` を別ターミナルで起動できるようにしておき、`cd scripts && npm install && npx playwright install chromium` で依存を入れます。2回目以降は代表例を変更したときなどに `cd scripts && npm test` を実行します。`npm test` は先に `check:demo-sync`（HTTP サーバー不要。3ファイルのクエリパス一致を確認）を走らせ、続けて `test:share-urls`（HTTP サーバー必須。別ターミナルで `python3 -m http.server 8000` を起動したまま。Playwright で11ツールの往復テスト）を実行します。

- `check-demo-sync.mjs` — 代表例の同期確認（README・`index.html`・`verify-share-urls.mjs` のクエリパス一致）
- `verify-share-urls.mjs` — 各ツールの共有URLが再読み込み後も同じ結果になるか Playwright で検証
- `package.json` — `check:demo-sync`・`test:share-urls`・`test` の npm スクリプト定義
- `README.md` — 本ファイル。初回セットアップ・`npm test` の手順
