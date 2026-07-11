# affiliates/

A8.net から取得した広告HTMLをここに置き、一括設置スクリプトで各ページに反映します。

## 転職エージェント（4ページ一括）

1. `job-slot1.html.example` を `job-slot1.html` にコピー
2. `job-slot2.html.example` を `job-slot2.html` にコピー
3. A8.net 管理画面の承認済み転職案件から、それぞれのHTMLを貼り付け
4. 実行:

```bash
cd scripts && node apply-job-affiliates.mjs --dry-run
node apply-job-affiliates.mjs
```

対象: `jikyu.html`・`tedori.html`・`ikukyu.html` の枠①②、`taishoku.html` の枠①のみ（枠②は証券のまま）。

`job-slot*.html` はサイトに公開されません（スクリプトが HTML ツールへ埋め込むだけ）。
