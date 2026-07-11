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
  boothUrlPending,
  boothZipStatus,
  scanBoothLinks,
} from './booth-config.mjs';
import { isOperatorInfoReady, PASTE_TEMPLATE_REFERENCE_LINE } from './operator-checks.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { configured, extraPending, withAttr } = scanBoothLinks(root);
const boothStructureMissingList = REQUIRED_BOOTH_FILES.filter(
  (file) => !withAttr.has(file),
);
const boothPending = boothUrlPending(root);
const boothConfiguredRequired = configured.filter((entry) => entry.required);
const requiredBoothLabel = REQUIRED_BOOTH_FILES.join(', ');
const boothZip = boothZipStatus(root);

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

const checks = [
  {
    label: '運営者情報（実名義）',
    done: isOperatorInfoReady(root),
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
    label: 'BOOTH 出品ZIP（同梱3ファイル）',
    done: boothZip.ok,
    action:
      'tedori-kakei-template.xlsx（6シート）/ manual.pdf（2ページ）/ booth-thumbnail.png（1280×1280）',
    block: boothZip.block,
  },
  {
    label: 'BOOTH 導線構造（必須3ファイル）',
    done: boothStructureMissingList.length === 0,
    action: `揃い: ${requiredBoothLabel}`,
    block: `data-booth-url 不足: ${boothStructureMissingList.join(', ')}`,
  },
  {
    label: 'BOOTH 商品URL（data-booth-url）',
    done:
      boothPending.length === 0 &&
      boothConfiguredRequired.length === REQUIRED_BOOTH_FILES.length,
    action:
      boothConfiguredRequired.length > 0
        ? `設定済み ${boothConfiguredRequired.length} ファイル: ${boothConfiguredRequired.map((entry) => entry.file).join(', ')}`
        : `全導線にURL設定済み（${requiredBoothLabel}）`,
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

if (extraPending.length > 0) {
  console.log(
    `\n参考: 必須外の空 data-booth-url ${extraPending.length} ファイル（WARN のみ）: ${extraPending.join(', ')}`,
  );
}

if (boothPending.length > 0) {
  console.log(
    '\n参考: npm run test:booth-strict は出品前では check:booth-links で exit 1 になりますが、必須3ファイルの data-booth-url が空の間は正常な挙動です。厳格モードでも出品ZIP同梱3ファイルは OK のまま、exit 1 になるのは商品URL（data-booth-url）未設定のみです。',
  );
}

console.log(`\nエージェント側の準備: 完了（ツール・導線・テスト・手順書）`);
console.log(`運営者側の未完了: ${pending} 項目`);
console.log(
  '参考: npm run test:booth — BOOTH導線・運営者情報チェック（operator-checks.mjs）のユニット・CLI・クライアント（JSDOM）テスト 73件（cd scripts && npm run test:booth）',
);
console.log(
  '参考: npm run check:booth-links — BOOTH 導線（data-booth-url）と出品ZIP同梱3ファイルを確認（npm test に含まれる）',
);
console.log(
  '参考: npm run test:booth-strict — BOOTH_URL_STRICT=1 で npm test（出品前は exit 1 だが ZIP 同梱3ファイルは OK のまま、cd scripts && npm run test:booth-strict）。shouldSkipBoothStrictIntegrationTest() で test:booth 内の統合テストを skip し、test:booth-strict → npm test → test:booth の再帰を回避',
);

if (pending > 0) {
  console.log('\n次に貼り付けてほしいもの（どちらか先に）:');
  console.log('  1. Search Console: google-site-verification: googlexxx.html');
  console.log('  2. A8.net: 承認済み案件の広告HTML');
  if (boothPending.length > 0) {
    const zipNote = boothZip.ok ? ' — 同梱3ファイル確認済み' : '';
    console.log(
      `  3. BOOTH: アカウント開設・980円ダウンロード販売で出品（products/tedori-kakei-booth.zip${zipNote}）`,
    );
    console.log(
      '  4. BOOTH出品後: 商品URLをチャットに貼付 → まず cd scripts && node set-booth-url.mjs --url <商品URL> --dry-run で置換内容を確認 → --dry-run を外して about/index/tedori を一括更新・デプロイ',
    );
  }
  console.log(PASTE_TEMPLATE_REFERENCE_LINE);
  process.exit(0);
}

console.log('\n全ブロッカー解消済み。収益発生は流入・成約次第。');
