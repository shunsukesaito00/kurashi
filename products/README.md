# BOOTH向けデジタル商品

## `tedori-kakei-template.xlsx`

手取り試算・手取り比較の2シート入り Excel テンプレート。計算式は [`docs/spreadsheet-spec.md`](../docs/spreadsheet-spec.md) および `tools/tedori.html` と同一。

| シート | 内容 |
|---|---|
| 手取り試算 | 月収・ボーナス入力 → 手取り（代表例: 月収30万 → 237,184円） |
| 手取り比較 | パターンA〜Cを横並び比較（差額付き） |

### 再生成

```bash
python3 scripts/generate-spreadsheet-template.py
```

要: `openpyxl`（`pip install openpyxl`）

### BOOTH出品時

ZIP に本 xlsx と簡易PDFマニュアルを同梱する想定。READMEシートは未収録（次フェーズで家計サマリ等を追加予定）。
