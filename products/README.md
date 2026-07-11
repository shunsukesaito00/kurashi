# BOOTH向けデジタル商品

## `tedori-kakei-template.xlsx`

手取り試算・手取り比較・家計サマリ・積立メモ・README の5シート入り Excel テンプレート。手取り計算は [`docs/spreadsheet-spec.md`](../docs/spreadsheet-spec.md) および `tools/tedori.html`、積立は `tools/tsumitate.html` と同一ロジック。

| シート | 内容 |
|---|---|
| README | 免責・使い方・検証用テストケース |
| 手取り試算 | 月収・ボーナス入力 → 手取り（代表例: 月収30万 → 237,184円） |
| 手取り比較 | パターンA〜Cを横並び比較（差額付き） |
| 家計サマリ | 手取り − 固定費 − 変動費 ＝ 自由に使える額・貯蓄率 |
| 積立メモ | 余剰額ベースの複利積立シミュ（代表例: 3万円・5%・20年 → 約1,233万円） |

### 再生成

```bash
python3 scripts/generate-spreadsheet-template.py
```

要: `openpyxl`（`pip install openpyxl`）

### BOOTH出品時

ZIP に本 xlsx と簡易PDFマニュアルを同梱する想定。年間俯瞰シートは次フェーズ。
