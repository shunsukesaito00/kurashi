import { readFileSync } from 'fs';
import { join } from 'path';

export function isOperatorInfoReady(root) {
  const html = readFileSync(join(root, 'about.html'), 'utf8');
  return (
    html.includes('斎藤 俊介') &&
    html.includes('infomationshunsuke@gmail.com')
  );
}
