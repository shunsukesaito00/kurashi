#!/usr/bin/env node
/**
 * アフィリエイト導線の横断確認 — 積立・時給・手取り・育休・退職金の5ページで
 * PR表記・step-list・比較表・aff-slot 2枠・免責文が揃っているか確認する。
 * HTTPサーバー不要。
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptsDir, '..');

const PAGES = [
  {
    file: 'tools/tsumitate.html',
    compareHeading: '証券会社選びの比較ポイント',
    disclaimerAction: '口座開設等',
    extraDisclaimer: '特定の金融商品の勧誘',
  },
  {
    file: 'tools/jikyu.html',
    compareHeading: '転職サービス選びの比較ポイント',
    disclaimerAction: 'サービス登録等',
  },
  {
    file: 'tools/tedori.html',
    compareHeading: '転職サービス選びの比較ポイント',
    disclaimerAction: 'サービス登録等',
    sectionClass: 'article no-print',
  },
  {
    file: 'tools/ikukyu.html',
    compareHeading: '転職サービス選びの比較ポイント',
    disclaimerAction: 'サービス登録等',
  },
  {
    file: 'tools/taishoku.html',
    compareHeading: '関連サービス選びの比較ポイント',
    disclaimerAction: 'サービス登録・口座開設等',
    extraDisclaimer: '特定の金融商品の勧誘',
  },
];

function countMatches(html, pattern) {
  return (html.match(pattern) || []).length;
}

let failed = false;

for (const page of PAGES) {
  const path = join(root, page.file);
  const html = readFileSync(path, 'utf8');
  const label = page.file;

  const checks = [
    ['pr-label', html.includes('class="pr-label"')],
    ['広告含有の注記', html.includes('本セクションには広告(アフィリエイトリンク)を含みます。')],
    ['step-list', html.includes('class="step-list"')],
    ['比較ポイント見出し', html.includes(page.compareHeading)],
    ['aff-slot ×2', countMatches(html, /class="aff-slot"/g) === 2],
    ['ASPコメント', html.includes('<!-- ASP(A8.net・もしもアフィリエイト等)')],
    ['免責文', html.includes(`リンク経由の${page.disclaimerAction}により報酬を受け取る場合があります`)],
  ];

  if (page.extraDisclaimer) {
    checks.push(['金融商品免責', html.includes(page.extraDisclaimer)]);
  }
  if (page.sectionClass) {
    checks.push(['no-print セクション', html.includes(`<section class="${page.sectionClass}">`)]);
  }

  for (const [name, ok] of checks) {
    if (!ok) {
      console.error(`FAIL ${label}: ${name}`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log('OK: アフィリエイト導線（積立・時給・手取り・育休・退職金）の横断確認に合格しました。');
