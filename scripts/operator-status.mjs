#!/usr/bin/env node
/**
 * 収益化フェーズ1の運営者ブロッカー状況を一覧表示する。
 * HTTPサーバー不要。
 */
import { readFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  REQUIRED_BOOTH_FILES,
  boothStructureMissing,
  boothUrlPending,
} from './booth-config.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function has(file, pattern) {
  return readFileSync(join(root, file), 'utf8').includes(pattern);
}

function affPending() {
  const files = ['tools/tsumitate.html', 'tools/jikyu.html', 'tools/tedori.html'];
  let n = 0;
  for (const f of files) {
    const html = readFileSync(join(root, f), 'utf8');
    n += (html.match(/広告コードをここに貼り付け/g) || []).length;
  }
  return n;
}

const boothStructureMissingList = boothStructureMissing(root);
const boothPending = boothUrlPending(root);

const checks = [
  {
    label: '運営者情報（実名義）',
    done: has('about.html', '斎藤 俊介') && !has('about.html', '準備中'),
    action: 'about.html 済み',
    block: 'about.html に運営者名・連絡先を記載',
  },
  {
    label: 'Search Console 所有権確認',
    done:
      has('index.html', 'google-site-verification') ||
      readdirSync(root).some((f) => /^google[a-z0-9]+\.html$/i.test(f)),
    action: '確認コードをチャットに貼付 → エージェントがデプロイ',
    block: 'Search Console で確認コードを取得して貼り付け',
  },
  {
    label: 'A8.net 広告コード（aff-slot 6枠）',
    done: affPending() === 0,
    action: `未設置 ${affPending()}/6 枠 — 承認後HTMLを貼付 → エージェントが設置`,
    block: 'A8.net 登録・提携申請・承認後に広告コード取得',
  },
  {
    label: '独自ドメイン',
    done: !has('sitemap.xml', 'github.io'),
    action: 'github.io 運用中（AdSense審査は不利）',
    block: 'ドメイン取得後 replace-site-url.mjs で一括置換',
  },
  {
    label: 'BOOTH 導線構造（必須3ファイル）',
    done: boothStructureMissingList.length === 0,
    action: `揃い: ${REQUIRED_BOOTH_FILES.join(', ')}`,
    block: `data-booth-url 不足: ${boothStructureMissingList.join(', ')}`,
  },
  {
    label: 'BOOTH 商品URL（data-booth-url）',
    done: boothPending.length === 0,
    action: `全導線にURL設定済み（${REQUIRED_BOOTH_FILES.join(', ')}）`,
    block:
      boothPending.length > 0
        ? `URL未設定 ${boothPending.length} ファイル: ${boothPending.join(', ')} — set-booth-url.mjs --url <商品URL>`
        : 'BOOTH出品後 node scripts/set-booth-url.mjs --url <商品URL>',
  },
];

console.log('収益化フェーズ1 — 運営者ブロッカー状況\n');

let pending = 0;
for (const c of checks) {
  const mark = c.done ? '✓ 完了' : '✗ 未完了';
  console.log(`${mark}  ${c.label}`);
  if (!c.done) {
    console.log(`       → ${c.block}`);
    pending++;
  } else if (c.action) {
    console.log(`       ${c.action}`);
  }
}

console.log(`\nエージェント側の準備: 完了（ツール・導線・テスト・手順書）`);
console.log(`運営者側の未完了: ${pending} 項目`);

if (pending > 0) {
  console.log('\n次に貼り付けてほしいもの（どちらか先に）:');
  console.log('  1. Search Console: google-site-verification: googlexxx.html');
  console.log('  2. A8.net: 承認済み案件の広告HTML');
  if (boothPending.length > 0) {
    console.log('  3. BOOTH: 出品後 set-booth-url.mjs --url <商品URL>');
  }
  process.exit(0);
}

console.log('\n全ブロッカー解消済み。収益発生は流入・成約次第。');
