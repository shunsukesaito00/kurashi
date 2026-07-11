# BOOTH向けデジタル商品

## `tedori-kakei-template.xlsx`

手取り試算・手取り比較・家計サマリ・積立メモ・年間俯瞰・README の6シート入り Excel テンプレート（BOOTHスタンダード版のシート構成）。手取り計算は [`docs/spreadsheet-spec.md`](../docs/spreadsheet-spec.md) および `tools/tedori.html`、積立は `tools/tsumitate.html` と同一ロジック。

| シート | 内容 |
|---|---|
| README | 免責・使い方・検証用テストケース |
| 手取り試算 | 月収・ボーナス入力 → 手取り（代表例: 月収30万 → 237,184円） |
| 手取り比較 | パターンA〜Cを横並び比較（差額付き） |
| 家計サマリ | 手取り − 固定費 − 変動費 ＝ 自由に使える額・貯蓄率 |
| 積立メモ | 余剰額ベースの複利積立シミュ（代表例: 3万円・5%・20年 → 約1,233万円） |
| 年間俯瞰 | 12か月の手取り・支出・貯蓄の合計表（印刷・面談用） |

### 再生成

```bash
python3 scripts/generate-spreadsheet-template.py
```

要: `openpyxl`（`pip install openpyxl`）

### BOOTH出品時

```bash
python3 scripts/build-booth-package.py
```

`products/tedori-kakei-booth.zip` に xlsx と `manual.pdf`（READMEシート内容ベース）が同梱されます。要: `pip install -r products/requirements-booth.txt`

BOOTH出品後は `node scripts/set-booth-url.mjs --url <商品URL>` でサイトの導線を有効化できます。
