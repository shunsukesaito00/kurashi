#!/usr/bin/env node
/**
 * aff-slot がプレースホルダのままか確認する。
 * 広告コード設置前は「未設置」、HTMLタグ等が入っていれば「設置済み」と判定。
 * HTTPサーバー不要。
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptsDir, '..');

const PAGES = [
  { file: 'tools/tsumitate.html', label: '積立（証券口座）' },
  { file: 'tools/jikyu.html', label: '時給（転職）' },
  { file: 'tools/tedori.html', label: '手取り（転職）' },
  { file: 'tools/ikukyu.html', label: '育休（転職）' },
  { file: 'tools/taishoku.html', label: '退職金（転職・証券）' },
];

const PLACEHOLDER = '広告コードをここに貼り付け';

let pending = 0;
let placed = 0;

for (const page of PAGES) {
  const html = readFileSync(join(root, page.file), 'utf8');
  const slots = html.match(/class="aff-slot"[\s\S]*?<\/div>/g) || [];
  if (slots.length !== 2) {
    console.error(`FAIL ${page.file}: aff-slot が ${slots.length} 個（期待: 2）`);
    process.exit(1);
  }
  for (let i = 0; i < slots.length; i++) {
    const n = i + 1;
    if (slots[i].includes(PLACEHOLDER)) {
      console.log(`未設置  ${page.label} 枠${n}  (${page.file})`);
      pending++;
    } else {
      console.log(`設置済  ${page.label} 枠${n}  (${page.file})`);
      placed++;
    }
  }
}

console.log(`\n合計: 設置済 ${placed} / 未設置 ${pending}（全${placed + pending}枠）`);

if (pending === 6) {
  console.log('OK: 全枠プレースホルダ — A8.net 承認後に広告コードを貼り付けてください。');
  process.exit(0);
}

if (pending === 0) {
  console.log('OK: 全枠に広告コードが設置されています。');
  process.exit(0);
}

console.log(`OK: 一部設置済み（${placed}/${placed + pending} 枠）。残りはプレースホルダまたは承認待ち。`);
process.exit(0);
