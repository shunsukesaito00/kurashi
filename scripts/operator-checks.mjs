import { readFileSync } from 'fs';
import { join } from 'path';

export const README_ANCHOR_SEARCH_CONSOLE =
  '#search-console-登録sitemap送信運営者作業';
export const README_ANCHOR_A8_NET = '#a8net-登録広告設置運営者作業';
export const README_ANCHOR_BOOTH =
  '#booth販売案-手取り家計シミュレーション用スプレッドシート';

export const PASTE_TEMPLATE_REFERENCE_LINE = `参考: チャット貼付テンプレート（README.md）— 1番 Search Console: ${README_ANCHOR_SEARCH_CONSOLE} / 2番 A8.net: ${README_ANCHOR_A8_NET} / 3〜4番 BOOTH: ${README_ANCHOR_BOOTH}（各節の「チャットへの貼付例」）`;

export const BOOTH_STRICT_RECURSION_REFERENCE_LINE =
  '参考: npm run test:booth-strict — BOOTH_URL_STRICT=1 で npm test（出品前は exit 1 だが ZIP 同梱3ファイルは OK のまま、cd scripts && npm run test:booth-strict）。shouldSkipBoothStrictIntegrationTest() で test:booth 内の統合テストを skip し、test:booth-strict → npm test → test:booth の再帰を回避';

export function shouldSkipBoothStrictIntegrationTest(env = process.env) {
  return env.BOOTH_URL_STRICT === '1';
}

export function isOperatorInfoReady(root) {
  const html = readFileSync(join(root, 'about.html'), 'utf8');
  return (
    html.includes('斎藤 俊介') &&
    html.includes('infomationshunsuke@gmail.com')
  );
}

/** npm run status / README 現状表と同期。技術ブロッカー解消後の運営者優先作業。 */
export const OPERATOR_PRIORITY_LINES = [
  '1. Search Console: sitemap.xml 送信済みか確認（未なら https://shunsukesaito00.github.io/kurashi/sitemap.xml を送信）',
  '2. A8.net: 成約・クリックを週1確認。転職2社目が承認されたら専用広告HTMLをチャットに貼付',
  '3. BOOTH: https://kurashi-tool.booth.pm/items/8606263 の露出（SNS・タグ最適化・無料ツールからの導線）',
  '4. 収益: A8・BOOTH の売上を月初に確認',
  '5. AdSense: 独自ドメイン取得後に申請（現状は後回し可）',
  '6. 独自ドメイン: 金融系A8却下が続く段階で replace-site-url.mjs を検討（現状は後回し可）',
];

export function formatOperatorPrioritySection() {
  return ['運営者の次の優先作業（優先順）:', ...OPERATOR_PRIORITY_LINES.map((line) => `  ${line}`)].join(
    '\n',
  );
}
