#!/usr/bin/env node
/**
 * 転職エージェントの A8.net 広告コードを4ページに一括設置する。
 *
 * 事前準備:
 *   1. affiliates/job-slot1.html に枠①のHTMLを貼り付け
 *   2. affiliates/job-slot2.html に枠②のHTMLを貼り付け
 *   （.example をコピーして作成可）
 *
 * 使い方:
 *   node apply-job-affiliates.mjs
 *   node apply-job-affiliates.mjs --dry-run
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');

const SLOT1_FILE = join(root, 'affiliates/job-slot1.html');
const SLOT2_FILE = join(root, 'affiliates/job-slot2.html');

const PLACEHOLDER1 =
  '<div class="aff-slot">アフィリエイト広告枠①<br>(転職サービスの広告コードをここに貼り付け)</div>';
const PLACEHOLDER2 =
  '<div class="aff-slot">アフィリエイト広告枠②<br>(比較用に2社目の広告コードをここに貼り付け)</div>';

const TARGETS = [
  'tools/jikyu.html',
  'tools/tedori.html',
  'tools/ikukyu.html',
  'tools/taishoku.html',
];

function wrapSlot(html) {
  const body = html.trim();
  return `<div class="aff-slot">\n${body}\n    </div>`;
}

function loadSlot(path, label) {
  if (!existsSync(path)) {
    console.error(`未作成: ${path.replace(root + '/', '')}`);
    console.error(`  affiliates/job-slot1.html.example をコピーし、A8.netのHTMLを貼り付けてください（${label}）`);
    process.exit(1);
  }
  const content = readFileSync(path, 'utf8').trim();
  if (!content.includes('<a ') || !content.includes('a8mat=')) {
    console.error(`${label} に有効なA8.net広告HTMLがありません（<a> と a8mat= を確認）`);
    process.exit(1);
  }
  return wrapSlot(content);
}

const slot1 = loadSlot(SLOT1_FILE, '枠①');
const slot2 = loadSlot(SLOT2_FILE, '枠②');

let updated = 0;

for (const rel of TARGETS) {
  const path = join(root, rel);
  let html = readFileSync(path, 'utf8');
  const before = html;

  if (!html.includes(PLACEHOLDER1)) {
    console.error(`FAIL ${rel}: 枠①プレースホルダが見つかりません（設置済みの可能性）`);
    process.exit(1);
  }
  html = html.replace(PLACEHOLDER1, slot1);

  if (rel === 'tools/taishoku.html') {
    console.log(`SKIP ${rel} 枠② — 証券バナー設置済みのため維持`);
  } else {
    if (!html.includes(PLACEHOLDER2)) {
      console.error(`FAIL ${rel}: 枠②プレースホルダが見つかりません`);
      process.exit(1);
    }
    html = html.replace(PLACEHOLDER2, slot2);
  }

  if (html !== before) {
    if (!dryRun) writeFileSync(path, html, 'utf8');
    console.log(`${dryRun ? '[dry-run] ' : ''}OK ${rel}`);
    updated++;
  }
}

console.log(`\n${updated} ファイルを更新${dryRun ? '（dry-run）' : ''}しました。`);
if (!dryRun) {
  console.log('次: cd scripts && npm run check:aff-placeholders && npm test');
  console.log('    git add -A && git commit && git push origin main && git push origin main:gh-pages');
}
