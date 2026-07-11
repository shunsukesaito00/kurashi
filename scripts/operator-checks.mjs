import { readFileSync } from 'fs';
import { join } from 'path';

export const README_ANCHOR_SEARCH_CONSOLE =
  '#search-console-登録sitemap送信運営者作業';
export const README_ANCHOR_A8_NET = '#a8net-登録広告設置運営者作業';
export const README_ANCHOR_BOOTH =
  '#booth販売案-手取り家計シミュレーション用スプレッドシート';

export const PASTE_TEMPLATE_REFERENCE_LINE = `参考: チャット貼付テンプレート（README.md）— 1番 Search Console: ${README_ANCHOR_SEARCH_CONSOLE} / 2番 A8.net: ${README_ANCHOR_A8_NET} / 3〜4番 BOOTH: ${README_ANCHOR_BOOTH}（各節の「チャットへの貼付例」）`;

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
