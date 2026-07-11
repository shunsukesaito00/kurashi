# scripts/

代表例の同期確認と共有URLの往復テストを行うスクリプト群です。初回のみ `cd scripts && npm install && npx playwright install chromium` で依存を入れます。2回目以降は代表例を変更したときなどに `cd scripts && npm test` を実行します。`npm test` は先に `check:demo-sync`（代表例の同期確認。HTTP サーバー不要）、`test:booth`（BOOTH導線のユニット・CLI・クライアント（JSDOM）テスト、57件。HTTP サーバー不要）、`check:booth-links`（BOOTH 導線の `data-booth-url` 確認。未設定は WARN のみ）、`check:affiliate-sections`（アフィリエイト導線の横断確認。HTTP サーバー不要）、`check:aff-placeholders`（aff-slot の広告コード設置状況。HTTP サーバー不要）を走らせ、続けて `test:share-urls`（共有URLの往復テスト。HTTP サーバー必須。別ターミナルで `python3 -m http.server 8000` を起動したまま）を実行します。`test:booth` には `boothCliChildEnv()`（`booth-cli-test-helpers.mjs`）のユニットテストも含まれます。

BOOTH出品後に導線未設定をテスト失敗にする場合は `BOOTH_URL_STRICT=1 npm test` または `npm run test:booth-strict` を使います。`npm run test:booth-strict` を出品前の状態で実行すると `check:booth-links` で exit 1 になりますが、必須3ファイルの `data-booth-url` が空の間は正常な挙動です。

- `check-demo-sync.mjs` — 代表例の同期確認（README・`index.html`・`verify-share-urls.mjs` のクエリパス一致）
- `booth-config.mjs` — BOOTH 導線の必須ファイル一覧・`isRequiredBoothFile()`・`scanBoothLinks()`・`findExtraBoothHtmlFiles()` 等の共通ヘルパー
- `booth-cli-test-helpers.mjs` — BOOTH CLI テスト用の子プロセス env ヘルパー（`boothCliChildEnv()`。`check-booth-links.cli.test.mjs` / `set-booth-url.cli.test.mjs` が `test:booth-strict` 実行時に親の `BOOTH_URL_STRICT` を子へ渡さない）。`boothCliChildEnv` のユニットテストは `check-booth-links.test.mjs` にある
- `check-booth-links.mjs` — BOOTH 導線（`data-booth-url`）の設定状況。必須3ファイルの構造・URL チェック。必須外の空属性は WARN のみ（`--strict` / `BOOTH_URL_STRICT=1` は必須のみ FAIL）。`--root <dir>` または `BOOTH_CHECK_ROOT` で対象ルートを上書き可能
- `check-booth-links.test.mjs` / `check-booth-links.cli.test.mjs` / `set-booth-url.cli.test.mjs` / `booth.client.test.mjs` — BOOTH導線のユニット・CLI・クライアント（JSDOM）テスト（`npm run test:booth`、57件）

`booth.client.test.mjs` は `js/booth.js` を JSDOM で検証し、必須3ファイルの HTML 構造と対応する3パターンをカバーします。`index.html` は `footer-booth-link` 単一アンカー、`about.html` は `booth-cta-link` に `data-booth-url` を直付けした単一アンカー、`tools/tedori.html` は `div[data-booth-url]` 内の `booth-cta-link` と `.booth-cta-pending` ラップ構造です。空 URL 時の無効化と URL 設定時の `href` 更新（tedori は pending 非表示）をそれぞれ検証します。

- `check-affiliate-sections.mjs` — アフィリエイト導線の横断確認（積立・時給・手取りの PR 表記・aff-slot 2枠・免責文）
- `check-aff-placeholders.mjs` — aff-slot に広告コードが貼られたか確認（未設置/設置済）
- `operator-status.mjs` — 収益化フェーズ1の運営者ブロッカー一覧（`npm run status`）。BOOTH は構造3ファイルと URL 設定を分けて表示
- `set-booth-url.mjs` — BOOTH 商品URLを `data-booth-url` に一括設定（`booth-config.mjs` の必須3ファイルのみ更新。必須外は WARN）。本番反映前は `node set-booth-url.mjs --url <商品URL> --dry-run` で置換内容を確認してから `--dry-run` を外す。`--root <dir>` / `BOOTH_CHECK_ROOT` 対応
- `apply-job-affiliates.mjs` — 転職バナーを jikyu/tedori/ikukyu/taishoku に一括設置（`affiliates/job-slot*.html` 要）
- `replace-site-url.mjs` — 独自ドメイン取得後の URL 一括置換（`sitemap.xml`・`robots.txt`・全HTML・README 等）
- `verify-share-urls.mjs` — 共有URLの往復テスト（Playwright で11ツール。再読み込み後も同じ結果になるか検証）
- `package.json` — `check:demo-sync`・`test:booth`・`check:booth-links`・`check:affiliate-sections`・`test:booth-strict`・`test:share-urls`・`test` の npm スクリプト定義
- `README.md` — 本ファイル。初回セットアップ・`npm test` の手順
