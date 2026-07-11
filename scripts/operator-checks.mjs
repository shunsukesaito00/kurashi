import { readFileSync } from 'fs';
import { join } from 'path';

export const PASTE_TEMPLATE_REFERENCE_LINE =
  '参考: チャット貼付テンプレート（README.md）— 1番 Search Console: #search-console-登録sitemap送信運営者作業 / 2番 A8.net: #a8net-登録広告設置運営者作業 / 3〜4番 BOOTH: #booth販売案-手取り家計シミュレーション用スプレッドシート（各節の「チャットへの貼付例」）';

export function isOperatorInfoReady(root) {
  const html = readFileSync(join(root, 'about.html'), 'utf8');
  return (
    html.includes('斎藤 俊介') &&
    html.includes('infomationshunsuke@gmail.com')
  );
}
