# くらしの計算室

日常でよく検索される計算(手取り・消費税・和暦変換など)をブラウザだけで完結させる、
日本語の無料ツールサイトです。収益化は商用クエリ向けアフィリエイトを主軸とし、
Google AdSense は副次的な収益源として位置づけています。

## サイト構成

| ページ | 内容 |
|---|---|
| `index.html` | トップ(ツール一覧) |
| `tools/tedori.html` | 手取り計算(月収→手取り) |
| `tools/zeikomi.html` | 消費税計算(税込⇔税抜) |
| `tools/wareki.html` | 西暦・和暦変換 |
| `tools/nenrei.html` | 年齢計算 |
| `tools/bmi.html` | BMI・適正体重 |
| `tools/tsumitate.html` | 積立・複利シミュレーション |
| `tools/waribiki.html` | 割引(〇%オフ)計算 |
| `tools/jikyu.html` | 時給換算 |
| `tools/ikukyu.html` | 育休給付金計算 |
| `tools/taishoku.html` | 退職金の税金計算 |
| `tools/moji.html` | 文字数カウント |
| `privacy.html` | プライバシーポリシー(AdSense審査に必須)。`noindex` であり `sitemap.xml` には載せない |
| `about.html` | 運営者情報(AdSense審査に有利) |
| `scripts/README.md` | 代表例の同期確認・共有URLの往復テスト用スクリプトの説明 |

### 共有URLのクエリキー

各ツールは計算後に `updateShareUrl` でURLを更新し、開いたとき `readShareParams` で復元する。キーは次のとおり。

| ページ | クエリキー | 意味 | 代表例(`index.html` デモ) |
|---|---|---|---|
| `tools/tedori.html` | `a`, `b`, `c` | 月収比較の3つの金額(円)。2つ以上で比較結果を復元 | `?a=300000&b=330000&c=360000` |
| `tools/zeikomi.html` | `a`, `r`, `d` | 金額(円)、税率(`0.08`/`0.10`)、方向(`excl`/`incl`) | `?a=10000&r=0.10&d=excl` |
| `tools/wareki.html` | `y` または `g`+`n` | 西暦パラメータ(`y`)または和暦パラメータ(`g`+`n`) | `?y=2026` / `?g=reiwa&n=8` |
| `tools/nenrei.html` | `b` | 生年月日(`YYYY-MM-DD`) | `?b=1990-05-15` |
| `tools/bmi.html` | `h`, `w` | 身長(cm)、体重(kg) | `?h=170&w=65` |
| `tools/tsumitate.html` | `m`, `r`, `y` | 毎月積立額(円)、年利率(%)、積立年数 | `?m=30000&r=5&y=20` |
| `tools/waribiki.html` | `p`, `d` | 定価(円)、割引率(0〜100) | `?p=10000&d=20` |
| `tools/jikyu.html` | `s`, `h`, `d`, `o` | 月給(円)、所定労働時間、月の勤務日数、残業時間(任意) | `?s=300000&h=160&d=20&o=20` |
| `tools/ikukyu.html` | `s`, `m`, `support` | 月収(円)、休業月数、`support=1` で育児休業等給付の支援給付を含む | `?s=300000&m=12&support=1` |
| `tools/taishoku.html` | `a`, `y` | 退職金額(円)、勤続年数 | `?a=10000000&y=20` |
| `tools/moji.html` | `t` | カウント対象テキスト(最大300文字) | `?t=%E3%81%8F%E3%82%89%E3%81%97%E3%81%AE%E8%A8%88%E7%AE%97%E5%AE%A4` |

代表例を変えるときは、この表と `index.html` のデモリンク、`scripts/verify-share-urls.mjs` の各ケース `path` を同時に更新すること。更新後は `cd scripts && npm test` で代表例の同期確認・`test:booth`（BOOTH導線・運営者情報チェック（`operator-checks.mjs`）のユニット・CLI・クライアント（JSDOM）テスト、78件）・BOOTH導線確認・アフィリエイト構造確認と共有URLの往復テストをまとめて検証できる（`test:share-urls` 用に別ターミナルで HTTP サーバーを起動したまま）。

フレームワーク・ビルド不要の静的HTML/CSS/JSのみ。サーバーサイド処理はありません。
静的アセットは `css/`(共通スタイル)、`js/`(共有URL用の `share.js` など)、`tools/`(各計算ページ)、`scripts/`(代表例の同期確認・共有URLの往復テスト用の `check-demo-sync.mjs`・`verify-share-urls.mjs` と `npm test`)に分かれています。
共有URLの読み書きは `js/share.js` に集約しており、各ツールは次の4関数だけを使う: `readShareParams(keys)` はページ読み込み時にクエリ文字列から指定キーの値をオブジェクトで返す、`updateShareUrl(entries)` は `[キー, 値]` の配列から現在のURLを `history.replaceState` で更新する、`copyShareLink(btnId)` は現在のURLをクリップボードにコピーしボタン文言を一時的に「コピーしました」に変える、`showShareActions(actionsId, hintId)` は共有ボタンと説明文のブロックを表示する。`updateShareUrl` や `copyShareLink` をツール側へ重複実装しないこと。

## ローカルでの確認

```bash
python3 -m http.server 8000
# http://localhost:8000 を開く
```

`index.html` を `file://` で直接開くと、一部ブラウザで共有URLの `history` API が動作しない場合があります。ローカル確認は上記の HTTP サーバー経由を推奨します。

代表例の同期確認と共有URLの往復テスト(`scripts/` 配下)は次のとおりです。`npm test` は `check:demo-sync` → `test:booth`（BOOTH導線・運営者情報チェック（`operator-checks.mjs`）のユニット・CLI・クライアント（JSDOM）テスト、78件） → `check:booth-links` → `check:affiliate-sections` → `check:aff-placeholders` → `test:share-urls` の順で実行します（前者5つは HTTP サーバー不要、`test:share-urls` は別ターミナルで HTTP サーバーを起動したまま）。BOOTH 導線だけ先に検証したい場合は `cd scripts && npm run test:booth` でも可です。`test:booth` には `boothCliChildEnv()`（`booth-cli-test-helpers.mjs`）のユニットテストも含まれます。

```bash
# 初回のみ
cd scripts && npm install && npx playwright install chromium

# 2回目以降(代表例変更時など) — test:share-urls 用に別ターミナルで HTTP サーバーを起動したまま
cd scripts && npm test
```

BOOTH出品後（`set-booth-url.mjs` で商品URLを設定済み）に、導線の未設定をテスト失敗にしたい場合:

```bash
cd scripts && BOOTH_URL_STRICT=1 npm test
# または
cd scripts && npm run test:booth-strict
```

`check:booth-links` は `test:booth` の直後に `npm test` で実行され、出品ZIPの同梱3ファイルを確認し、URL 未設定時は **WARN のみ**（exit 0）。`BOOTH_URL_STRICT=1` を付けると未設定の `data-booth-url` があると FAIL します。`npm run test:booth-strict` を出品前の状態で実行すると `check:booth-links` で exit 1 になりますが、必須3ファイルの `data-booth-url` が空の間は正常な挙動です。厳格モードでも出品ZIP同梱3ファイルは `OK` のまま、exit 1 になるのは商品URL（`data-booth-url`）未設定のみです。

各スクリプトの詳細は [scripts/README.md](scripts/README.md) を参照。

## 公開までの手順(必須)

1. **ホスティング**: 完了済み。GitHub Pages で配信中です。
   公開URL: https://shunsukesaito00.github.io/kurashi/
   `main` へのプッシュ後は `git push origin main:gh-pages` で本番を同期する。
   現状の確認済み: `robots.txt` の `Sitemap:` 行と `sitemap.xml` 先頭の
   `<loc>` は同一オリジン(`https://shunsukesaito00.github.io/kurashi/`)を指している。
2. **独自ドメイン取得(強く推奨)**: AdSense はサブドメイン(`*.github.io` 等)では
   審査に通りにくいため、独自ドメイン(年1,000〜1,500円程度)を取得して割り当てる。
3. **残りのプレースホルダ置換**:
   - ~~`about.html` の運営者名・連絡先を実際の情報に書き換える~~ → 完了
   - 独自ドメイン取得後: `sitemap.xml` と `robots.txt` の
     `https://shunsukesaito00.github.io/kurashi/` を実ドメインに置換する
     (現在は github.io URL 済み。`YOUR-DOMAIN.example` は残っていない)
4. **Google Search Console に登録**し、`sitemap.xml` を送信する。手順は下記「Search Console 登録〜sitemap送信」

## 収益化ロードマップ(月5万円へ)— 2026年7月改訂版(進捗更新)

**方針(変更なし)**: 2026年の環境では「情報検索SEO → AdSense」単体では月5万円は現実的でない。
収益の主軸は**商用クエリ向けアフィリエイト**とし、AdSense・KDP等は副次チャネルとする。

**改訂の理由(要約)**:
- AI Overviews により情報クエリ(「手取り 計算」「令和 西暦」等)はゼロクリック化が進行。
- 完全AI生成のみでの AdSense 審査通過は2026年時点で実質困難。
- ロングテール記事のAI量産はスパムポリシーリスクがあるため**撤回**。
- 商用クエリ(証券口座・転職等)と検索非依存チャネル(KDP・BOOTH)には余地がある。

### 現状(2026年7月12日)

| 区分 | 状態 |
|---|---|
| 公開基盤 | **完了** — GitHub Pages 配信中([本番URL](https://shunsukesaito00.github.io/kurashi/))。11ツール・sitemap・robots・canonical・共有URL |
| 差別化機能 | **完了** — 手取り比較・印刷・全ツール共有URL。育休・退職金ツール追加済み |
| アフィリエイト導線 | **完了** — aff-slot 10枠設置済み（証券2・転職系8。転職2社目は承認後に差し替え可） |
| Search Console | **完了** — 所有権確認コード設置済み。sitemap 送信は運営者が管理画面で確認 |
| BOOTH | **出品・導線完了** — [商品ページ](https://kurashi-tool.booth.pm/items/8606263) 公開・サイト3箇所からリンク済み |
| 収益 | **0円（想定内）** — 流入・成約待ち。A8・BOOTH の管理画面を定期確認 |
| 独自ドメイン | **保留** — `github.io` 継続。AdSense・金融系A8却下が続く段階で検討 |
| 技術ブロッカー | **解消済み**（独自ドメイン除く）— `cd scripts && npm run status` で確認 |

**フェーズ位置**: フェーズ1（初収益化）の**技術設置は完了**。フェーズ2（BOOTH販売）**着手済み**。律速は運営者の集客・成約確認。

#### 運営者の次の優先作業（優先順）

`npm run status` でも同内容を表示。

1. **Search Console**: [sitemap.xml](https://shunsukesaito00.github.io/kurashi/sitemap.xml) を送信済みか確認。未なら送信し、数週間後にインデックス状況を見る
2. **A8.net**: 成約・クリックを週1確認。転職2社目が承認されたら専用広告HTMLをチャットに貼付（現状は渡済み3本で全枠埋め）
3. **BOOTH**: [商品ページ](https://kurashi-tool.booth.pm/items/8606263) の露出（SNS・タグ・無料ツールからの導線）
4. **収益**: A8・BOOTH の売上を月初に確認
5. **AdSense**: 独自ドメイン取得後に申請（**後回し可**）
6. **独自ドメイン**: 金融系A8却下が続く段階で `replace-site-url.mjs` を検討（**後回し可**）

月5万円の目安は依然として**月5〜10成約**(アフィリエイト単価3,000〜15,000円)＋BOOTH月10件程度。PVではなく成約で勝負する。

### フェーズ0: 公開基盤 — 完了

- [x] 11ツール公開(手取り・消費税・和暦・年齢・BMI・積立・割引・時給・育休・退職金・文字数)
- [x] GitHub Pages デプロイ、`main` → `gh-pages` 同期運用
- [x] プライバシーポリシー・運営者情報ページ(審査用骨格)
- [x] 全ツール共有URL(`js/share.js`)、代表例デモ、`npm test` による検証
- [x] 積立・時給・手取りページのアフィリエイト導線セクション(枠のみ)

### フェーズ1: 初収益化(〜1か月) — **技術設置完了・集客フェーズ**

エージェント側の設置作業は完了。未完了は**独自ドメインのみ**（運営者判断で後回し可）。`cd scripts && npm run status` でブロッカーと[運営者の次の優先作業](#運営者の次の優先作業優先順)を確認できる。

1. [x] **ASP登録・提携申請**(A8.net) — 登録・広告設置済み
2. [x] **広告コード設置** — aff-slot 全枠設置済み（転職2社目は承認後に差し替え可）
3. [x] **`about.html` を実名義で埋める** — 運営者: 斎藤 俊介、連絡先メール設置済み
4. [x] **Google Search Console 所有権確認** — meta タグ設置済み。sitemap 送信は運営者が管理画面で確認
5. [ ] **独自ドメイン取得**（強く推奨・**現状は後回し**） — 取得後は `cd scripts && npm run replace-site-url -- --to https://YOUR-DOMAIN --dry-run`

**AdSense**: 申請はするが主軸にしない。独自ドメイン + 運営者情報充実後に申請。全ページの `ad-slot` はプレースホルダのまま。

#### A8.net 登録〜広告設置（運営者作業）

[A8.net 公式](https://www.a8.net/)で進める。会員登録自体にサイト審査はないが、**各広告プログラムごとに提携審査**がある（[FAQ: メディア会員審査](https://www.a8.net/faq/14.html)）。承認まで数日〜2週間かかることがある。

**事前に用意するもの**

| 項目 | 本サイトでの値 |
|---|---|
| メールアドレス | `infomationshunsuke@gmail.com`（A8.net登録・振込通知用） |
| 運営者名 | 斎藤 俊介 |
| サイトURL | `https://shunsukesaito00.github.io/kurashi/` |
| 振込先口座 | 本人名義の銀行口座（報酬受取前に必須） |

**メディア登録・提携申請用コピペ文**（A8.net の入力欄にそのまま貼り付け可）:

サイト説明（メディア登録時）:
```
「くらしの計算室」は、手取り計算・積立シミュレーション・時給換算など11種類の無料計算ツールを提供するサイトです。登録不要でブラウザ内完結、計算結果はURLで共有可能です。家計・転職・投資の意思決定前に数字を確認する用途で利用されます。運営者情報・プライバシーポリシー・アフィリエイト開示はサイト内に掲載済みです。
```

提携申請メモ（証券口座・転職案件の申請欄がある場合）:
```
掲載予定ページ:
・積立シミュレーション直後（証券口座）: /tools/tsumitate.html
・時給計算直後（転職）: /tools/jikyu.html
・手取り比較直後（転職）: /tools/tedori.html
PR表記・アフィリエイト免責は各セクションおよび /about.html に記載済み。入力データはサーバーに送信しません（/privacy.html）。
```

**運営者チェックリスト**（登録当日に完了させる順）:

- [ ] A8.net 会員登録（`infomationshunsuke@gmail.com`）
- [ ] メディア登録（URL: `https://shunsukesaito00.github.io/kurashi/`、上記サイト説明を貼付）
- [ ] 証券口座開設プログラムに2社提携申請 → `tsumitate.html`
- [ ] 転職エージェントに2社提携申請 → `jikyu.html` / `tedori.html`
- [ ] 振込先口座を登録
- [ ] 承認後: 広告コードをエージェントに渡して aff-slot 設置を依頼

**Step 1: 会員登録（約10分）**

1. [A8.net](https://www.a8.net/) →「今すぐ会員登録（無料）」
2. メールアドレスを入力 → 仮登録メールのURLから本登録
3. 基本情報（氏名・住所・電話番号・ログインID・パスワード）を入力
4. **メディア情報**で「サイトをお持ちの方」を選び、サイトURL `https://shunsukesaito00.github.io/kurashi/` を登録
   - ジャンル例: 家計・お金・転職・ライフスタイル
   - サイト名: くらしの計算室
5. 振込先口座を登録（後回し可だが、初成約前に必ず登録）

**Step 2: 提携申請するプログラム（優先2カテゴリ）**

管理画面の「プログラム検索」でキーワード検索し、**提携申請**を送る。単価・承認率は変動するため、申請時に案件ページで確認すること。

| カテゴリ | 検索キーワード例 | 貼り付け先 | 申請数の目安 |
|---|---|---|---|
| 証券口座開設（NISA対応） | `証券口座` `NISA` `口座開設` | `tools/tsumitate.html` の aff-slot ①② | 2社（比較用） |
| 転職エージェント | `転職` `エージェント` `転職サイト` | `tools/jikyu.html`・`tools/tedori.html` の aff-slot ①② | 2社（比較用。時給・手取りで同じ2社を使ってよい） |

提携申請時のメモ例（審査で見られることが多い）:

- サイトは無料の計算ツール集。入力データはブラウザ内処理でサーバー送信なし（`privacy.html` 参照）
- PR表記・アフィリエイト開示は `about.html` および各ツールのPRセクションに記載済み
- 積立ページは投資シミュレーション直後、時給・手取りページは計算・比較結果の直後にサービス紹介を掲載予定

**Step 3: 広告コードの取得と設置**

1. 提携が「承認済み」になった案件を管理画面で開く
2. バナーまたはテキストリンクの広告コード（HTML）をコピー
3. 下記の `aff-slot` プレースホルダを**丸ごと置き換え**（`div` ごと差し替えてよい）

| aff-slot | ファイル | 内容 |
|---|---|---|
| 枠① | `tools/tsumitate.html` | 証券口座Aの広告コード |
| 枠② | `tools/tsumitate.html` | 証券口座Bの広告コード |
| 枠① | `tools/jikyu.html` | 転職サービスAの広告コード |
| 枠② | `tools/jikyu.html` | 転職サービスBの広告コード |
| 枠① | `tools/tedori.html` | 転職サービスA（jikyuと同じで可） |
| 枠② | `tools/tedori.html` | 転職サービスB（jikyuと同じで可） |

4. コミット → `git push origin main` → `git push origin main:gh-pages` で本番反映
5. 本番URLで広告が表示されるか確認（ローカル `file://` ではアフィリエイトタグは動かないことが多い）

**チャットへの貼付例**（`cd scripts && npm run status` の「次に貼り付けてほしいもの」2番と同型。承認後にエージェントへそのまま貼付可）:

```
A8.net の広告HTMLを設置して

枠: tools/jikyu.html の aff-slot ①
案件名: （例）リクナビNEXT
広告HTML:
（A8.net 管理画面からコピーした HTML をここに貼る）
```

複数枠を一度に依頼する場合は、枠ごとにブロックを分ける:

```
A8.net の広告HTMLを設置して

枠: tools/tsumitate.html の aff-slot ①
案件名: （例）証券口座A
広告HTML:
（HTML）

枠: tools/tsumitate.html の aff-slot ②
案件名: （例）証券口座B
広告HTML:
（HTML）
```

転職系は `tools/jikyu.html`・`tools/tedori.html` の aff-slot ①②（計4枠）も同様。設置後は `cd scripts && npm run check:aff-placeholders` で未設置枠が減っているか確認できる。

**Step 4: 承認が遅い・却下された場合**

- `github.io` 無料ドメインは金融・転職案件で却下されやすい。**独自ドメイン取得**（フェーズ1の項目5）を先に進める
- 即承認されやすい案件から始め、実績をつけてから高単価案件に再申請
- 代替ASP: [もしもアフィリエイト](https://af.moshimo.com/) でも同様の手順（登録 → メディア登録 → 提携 → コード貼付）

**初収益までの目安**

| 作業 | 目安期間 |
|---|---|
| A8.net 会員登録 | 当日（10分） |
| プログラム提携承認 | 数日〜2週間 |
| 広告コード設置・デプロイ | 30分（エージェントに依頼可） |
| 初成約 | 設置後すぐ〜数週間（流入次第） |

**もしもアフィリエイトを併用する場合**: A8.netで承認が取れない案件の補完用。手順は A8.net と同型（登録 → メディア `https://shunsukesaito00.github.io/kurashi/` → 提携申請 → コード貼付）。同一 aff-slot に2社のASPコードを混在させず、枠ごとに1社ずつ割り当てる。

#### Search Console 登録〜sitemap送信（運営者作業）

[Google Search Console](https://search.google.com/search-console) で進める。サイトのインデックス登録と検索パフォーマンス確認に使う。AdSense申請前の準備としても推奨。

**本サイトで使うURL**

| 項目 | 値 |
|---|---|
| プロパティ種別 | **URLプレフィックス**（`github.io/リポジトリ名` 形式のため） |
| 登録するURL | `https://shunsukesaito00.github.io/kurashi/` |
| sitemap URL | `https://shunsukesaito00.github.io/kurashi/sitemap.xml` |
| robots.txt | `https://shunsukesaito00.github.io/kurashi/robots.txt`（`Sitemap:` 行あり） |

`sitemap.xml` には **13 URL**（トップ + 11ツール + about）が登録済み。`privacy.html` は `noindex` のため含めない。

**Step 1: プロパティを追加（約5分）**

1. [Search Console](https://search.google.com/search-console) に Google アカウントでログイン
2. 左上のプロパティ選択 →「プロパティを追加」
3. **URLプレフィックス**を選び、`https://shunsukesaito00.github.io/kurashi/` を入力 → 続行
4. 所有権の確認方法を選ぶ（GitHub Pages 静的サイト向けのおすすめ順）:

| 方法 | 手順 | 備考 |
|---|---|---|
| **HTMLファイル**（推奨） | Search Console が表示する `googlexxxxx.html` をリポジトリ直下に置く | 取得後、エージェントに「確認用HTMLを配置して」と依頼可。デプロイ後に「確認」をクリック |
| **HTMLタグ** | `<meta name="google-site-verification" content="…" />` を `index.html` の `<head>` 内に追加 | 同上。エージェントが1行追加してデプロイ |
| DNSレコード | ドメインのTXTレコードを追加 | **独自ドメイン取得後**に使う。現状の `github.io` では不可 |

5. 確認が成功すると「所有権を確認しました」と表示される

**チャットへの貼付例**（`cd scripts && npm run status` の「次に貼り付けてほしいもの」1番と同型）:

HTMLファイル方式（推奨）:

```
Search Console の確認用HTMLを配置して

googlexxxxxxxxxxxxxxxxx.html
（ダウンロードした HTML ファイルの内容をそのまま貼っても可）
```

HTMLタグ方式:

```
Search Console の確認用 meta タグを index.html に追加して

google-site-verification: （Search Console に表示された content 値）
```

または meta タグ1行をそのまま貼付:

```html
<meta name="google-site-verification" content="（content 値）" />
```

**確認用ファイルを置く場合のデプロイ手順（エージェント向けメモ）**

```bash
# 例: Search Console からダウンロードした googlexxxxx.html をリポジトリ直下に配置
git add googlexxxxx.html
git commit -m "Search Console 所有権確認用HTMLを追加"
git push origin main && git push origin main:gh-pages
```

配置後、ブラウザで `https://shunsukesaito00.github.io/kurashi/googlexxxxx.html` が開けることを確認してから Search Console で「確認」を押す。

**Step 2: sitemap を送信（約2分）**

1. Search Console 左メニュー →「サイトマップ」（または「Sitemaps」）
2. 「新しいサイトマップの追加」に `sitemap.xml` と入力 → 送信
   - フルURLではなく **`sitemap.xml` のみ**でよい（プレフィックスが既に登録済みのため）
3. 状態が「成功」になれば完了。初回は数時間〜数日かかることがある

**Step 3: 動作確認**

| 確認項目 | 方法 |
|---|---|
| sitemap が読める | ブラウザで `https://shunsukesaito00.github.io/kurashi/sitemap.xml` を開く |
| robots が正しい | `robots.txt` の `Sitemap:` が上記URLを指しているか確認（済） |
| インデックス状況 | Search Console →「ページ」→ 登録済みURL数が増えていくか（即日反映されない） |
| 手動インデックス（任意） | 上部のURL検査に `https://shunsukesaito00.github.io/kurashi/tools/tedori.html` 等を入力 →「インデックス登録をリクエスト」 |

**独自ドメイン取得後にやること**

1. Search Console に**新しいURLプレフィックス**（例: `https://kurashi.example.com/`）を追加し、再確認
2. `cd scripts && npm run replace-site-url -- --to https://kurashi.example.com` で URL を一括置換（事前に `--dry-run` で確認）
3. `git diff` → commit → `git push origin main && git push origin main:gh-pages`
4. 新プロパティに `sitemap.xml` を再送信
5. 旧 `github.io` プロパティはしばらく併存してよい（移行期間のデータ参照用）

**よくあるつまずき**

- **URLプレフィックスとドメインプロパティを混同** — 本サイトは `…/kurashi/` まで含めたプレフィックス登録が正しい
- **確認ファイルが404** — `gh-pages` への push を忘れている、またはファイルがリポジトリ直下ではない
- **sitemap が「取得できませんでした」** — デプロイ直後は数分待つ。URLの typo（`/kurashi` の有無）を確認

### フェーズ2: 検索非依存の販売チャネル(2〜4か月) — **BOOTH着手済み**

- **Kindle出版(KDP)**: 実用系(計算・手続き・テンプレート集)を月2〜4冊。AI生成は申告必須だが規約上可。Amazon内検索が集客源。
- **デジタル商品(BOOTH・note)**: 家計・転職・育休向けスプレッドシート等を500〜1,500円で販売。
- 本サイトのツールは「無料の入口」、有料版はテンプレート・詳細解説として販売チャネルへ誘導。

- [x] **BOOTH導線・検証スクリプト整備完了** — `js/booth.js` と必須3ファイル（`about.html`・`index.html`・`tools/tedori.html`）の `data-booth-url` 導線、`set-booth-url.mjs` / `check-booth-links.mjs`（`npm test` で出品ZIP同梱3ファイルも確認）、`operator-checks.mjs`（運営者情報の誤判定防止）/ `operator-status.mjs`、`test:booth`（78件: BOOTH導線・運営者情報チェック（`operator-checks.mjs`）・ユニット・CLI・クライアント（JSDOM））、`test:booth-strict` / `BOOTH_URL_STRICT=1` 対応（出品前は exit 1 だが ZIP 同梱は `OK` のまま。`shouldSkipBoothStrictIntegrationTest()` で `test:booth-strict` → `npm test` → `test:booth` の再帰を回避）。出品URL確定後は `set-booth-url.mjs --url <商品URL>` のみ運営者作業

#### BOOTH販売案: 手取り・家計シミュレーション用スプレッドシート

無料ツール（`tedori`・`tsumitate` 等）で体験したユーザーを、**保存・編集・複数シナリオ比較**できる有料版へ誘導する。検索流入に依存せず、BOOTH内検索とSNS拡散が集客になる。

**商品ラインアップ（価格案）**

| 商品 | 価格 | 想定Buyer | 差別化 |
|---|---:|---|---|
| **ライト版** — 手取り比較シート | 500円 | 転職・昇給検討中 | 月収2〜3パターンを横並び比較。サイトの比較機能の「保存版」 |
| **スタンダード版** — 家計＋手取り一体型 | 980円 | 家計見直し層 | 手取り試算＋固定費＋可変費＋貯蓄率を1枚で可視化 |
| **コンプリート版** — キャリア・育休・退職セット | 1,480円 | ライフイベント直前 | 手取り比較＋積立シミュ＋育休給付メモ＋退職金税メモの4シート |

初動は **スタンダード版（980円）1本** から出すのがおすすめ。ライト版は無料ツールとの差が小さく、コンプリートは制作コストが高い。

**スタンダード版の構成（シート案）**

| シート名 | 内容 | 無料ツールとの関係 |
|---|---|---|
| README | 使い方・免責（概算である旨） | — |
| 手取り試算 | 月収・ボーナス入力 → 社保・税の概算手取り | `tedori.html` のロジックを表計算化 |
| 手取り比較 | 最大3パターンの額面・手取り・差額 | 比較モードの保存版 |
| 家計サマリ | 手取り − 固定費 − 変動費 ＝ 自由に使える額 | ツール未提供の領域 |
| 積立メモ | 毎月の余剰額 → 積立シミュ簡易版 | `tsumitate.html` への導線兼ねる |
| 年間俯瞰 | 12か月の手取り・貯蓄の合計 | 印刷・面談用 |

**フォーマット・納品物**

- Google スプレッドシート（コピーして使う形式）または Excel (.xlsx)
- BOOTH では ZIP（xlsx + 簡易PDFマニュアル2〜3ページ）が一般的
- スマホは閲覧のみ想定し、**編集はPC推奨**と明記

**BOOTH 掲載文案（コピペ用・タイトル・説明）**

タイトル案:
```
【2026年版】手取り比較＋家計シミュレーション｜転職・昇給の意思決定用スプレッドシート
```

説明の冒頭（要約）:
```
額面月収から手取りを概算し、2〜3パターンを比較。家計の固定費・変動費を入れると「実際に残るお金」まで一目でわかります。
Webの無料ツール「くらしの計算室」で試算した方の、保存・カスタマイズ版です。税・社保は概算です。最終判断は給与明細・専門家へ。
```

タグ例: `家計簿` `手取り` `転職` `昇給` `スプレッドシート` `Excel` `節約`

**サイトからの導線（整備完了・URLは出品後）**

| 設置箇所 | 文言例 |
|---|---|
| `tools/tedori.html` 比較結果の下 | 「この比較をスプレッドシートで保存したい方はBOOTHで」 → `data-booth-url` プレースホルダ設置済み |
| `index.html` フッター | 「有料テンプレート（BOOTH）」→ `data-booth-url` プレースホルダ設置済み |
| `about.html` | 「BOOTHで有料テンプレートを見る」→ `data-booth-url` プレースホルダ設置済み |
| 共有URL利用者 | ツールは再現できるが、家計全体は有料版 |

BOOTH URL は出品後に、まず `node scripts/set-booth-url.mjs --url <商品URL> --dry-run` で置換内容を確認し、`--dry-run` を外して `about.html`・`index.html`・`tools/tedori.html` を一括更新する。

**収益目安（フェーズ2単体）**

| 前提 | 月収 |
|---|---:|
| スタンダード 980円 × 月10販売 | 9,800円 |
| コンプリート 1,480円 × 月5販売 | 7,400円 |
| BOOTH手数料・振込を差し引く前の目安 | — |

アフィリエイト成約3件（約2.4万円）と組み合わせると、フェーズ1〜2で月5万円の下限に近づく。

**運営者チェックリスト（BOOTH初出品）**

- [x] 計算式仕様を [`docs/spreadsheet-spec.md`](docs/spreadsheet-spec.md) に沿ってシート化 → [`products/tedori-kakei-template.xlsx`](products/tedori-kakei-template.xlsx)（6シート。`python3 scripts/generate-spreadsheet-template.py` で再生成可）
- [x] ZIP納品物（xlsx + PDFマニュアル + サムネイル）→ [`products/tedori-kakei-booth.zip`](products/tedori-kakei-booth.zip)（`python3 scripts/build-booth-package.py` で再生成可）
- [x] `tedori-kakei-booth.zip` の同梱3ファイル確認済み → `tedori-kakei-template.xlsx`（6シート）/ `manual.pdf`（2ページ）/ `booth-thumbnail.png`（1280×1280）
- [x] 免責・概算である旨をREADMEシートに記載 → `products/tedori-kakei-template.xlsx` の README シート
- [x] サムネイル（1280×1280、比較表のスクショ＋タイトル）→ `node scripts/generate-booth-thumbnail.mjs` で `products/booth-thumbnail.png` を生成
- [x] BOOTH導線・検証スクリプト整備完了 → `js/booth.js`、必須3ファイル、`test:booth` 78件（BOOTH導線・運営者情報チェック（`operator-checks.mjs`））、`set-booth-url.mjs` / `check-booth-links.mjs`（`npm test` で出品ZIP同梱3ファイルも確認）/ `operator-checks.mjs`（運営者情報の誤判定防止）/ `operator-status.mjs` / `test:booth-strict`（出品前は exit 1 だが ZIP 同梱は `OK` のまま。`shouldSkipBoothStrictIntegrationTest()` で `test:booth-strict` → `npm test` → `test:booth` の再帰を回避）
- [x] BOOTHアカウント開設・本人確認・出品 — [kurashi-tool.booth.pm](https://kurashi-tool.booth.pm/)
- [x] サイトにBOOTH導線を設置 — `set-booth-url.mjs` 済み（about / index / tedori）

**チャットへの貼付例**（`cd scripts && npm run status` の「次に貼り付けてほしいもの」3・4番と同型）

**3. 出品前**（`npm run status` 3番は主に運営者が BOOTH 管理画面で行う作業。ZIP の同梱をエージェントへ再確認したいとき）:

```
BOOTH出品用ZIPの同梱3ファイルを確認して

products/tedori-kakei-booth.zip（同梱3ファイル確認済み）
```

運営者が BOOTH で行うこと（`npm run status` 3番と同内容）:

1. BOOTH アカウント開設・本人確認
2. 価格 **980円**・**ダウンロード販売**で出品
3. 納品ファイルに [`products/tedori-kakei-booth.zip`](products/tedori-kakei-booth.zip) をアップロード（同梱: `tedori-kakei-template.xlsx` / `manual.pdf` / `booth-thumbnail.png`）
4. 掲載文案は上記「BOOTH 掲載文案（コピペ用）」を利用

**4. 出品後**（商品URLをサイト導線へ反映する依頼。`npm run status` 4番と同型）:

```
BOOTH商品URLをサイトに設置して

商品URL: https://yourshop.booth.pm/items/xxxxxxxx
```

エージェントは `cd scripts && node set-booth-url.mjs --url <商品URL> --dry-run` で `about.html`・`index.html`・`tools/tedori.html` の置換内容を確認し、`--dry-run` を外して一括更新・デプロイする。設置後は `cd scripts && BOOTH_URL_STRICT=1 npm test`（または `npm run test:booth-strict`）で導線未設定が解消されたか確認できる。

**KDP との役割分担**

| チャネル | 向く内容 |
|---|---|
| BOOTH | そのまま使えるテンプレート（即効性） |
| KDP | 手取りの仕組み解説＋シート付き電子書籍（単価250〜500円、量で稼ぐ） |

同じ計算ロジックを再利用できるため、**先にBOOTHで1商品を出し、反応を見てKDP化**するのが効率的。

### フェーズ3: AIが代替しにくい機能(継続)

記事量産はしない。ツールの「体験」で差別化する。

- [x] 複数条件の比較(手取り月収比較)
- [x] 印刷出力(手取り比較)
- [x] 結果のURL共有(全11ツール)
- [x] 手取りページへの転職アフィリエイト導線
- [x] 退職金・育休ページへの関連サービス導線（転職枠はプレースホルダ、退職金ページに証券バナー1枠設置済み）
- [ ] ツール追加は一次情報突合が必須(毎年8月は育休上限・手取り料率を要確認)

### 収益シミュレーション(現実的な初動)

| チャネル | 前提 | 月収目安 |
|---|---|---|
| 証券口座開設 | 月2〜3成約 × 8,000円 | 16,000〜24,000円 |
| 転職サービス | 月2〜3成約 × 8,000円 | 16,000〜24,000円 |
| AdSense(副) | 月1万PV × RPM100円 | 1,000円程度 |
| KDP・BOOTH | 月5〜10販売 × 800円 | 4,000〜8,000円 |

**合計5万円**は「アフィリエイト月4〜6成約」か「アフィリエイト3成約 + KDP/BOOTH」の組み合わせが現実的。いずれもASP登録と導線設置が先決。

### 正直な見通し

サイトの**器は完成に近い**が、収益はまだ0円。次の1か月で動くべきはコードではなく、ASP登録 → 広告コード設置 → Search Console → 独自ドメインの順。
フルAI生成で「確実に」月5万円へ到達する経路は存在しない。成否は商用導線の成約数と販売チャネルの分散で決まる。

## 免責

各ツールの計算は概算です。税率・保険料率・給付上限は改正されるため、次を定期的に見直してください。

- `tools/tedori.html`: 協会けんぽ・厚生年金・雇用保険の料率(年1回目安)
- `tools/ikukyu.html`: 育児休業給付金の賃金日額上限・月額上限(毎年8月1日改定)
- `tools/taishoku.html`: 退職所得控除・所得税率・住民税の扱いで、国税庁のタックスアンサー等の一次情報と照合
