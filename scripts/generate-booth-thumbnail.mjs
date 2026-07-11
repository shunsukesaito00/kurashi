#!/usr/bin/env node
/**
 * BOOTH サムネイル用 HTML（1280×1280）と PNG を生成する。
 *
 * 使い方:
 *   node generate-booth-thumbnail.mjs           # HTML + PNG
 *   node generate-booth-thumbnail.mjs --html-only
 *
 * PNG 生成には playwright（scripts/package.json）が必要。
 */
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const htmlOut = join(root, 'products/booth-thumbnail.html');
const pngOut = join(root, 'products/booth-thumbnail.png');
const htmlOnly = process.argv.includes('--html-only');

const COMPARE_ROWS = [
  { label: '額面月収', a: '300,000', b: '330,000', c: '360,000', head: false },
  { label: '毎月の手取り', a: '237,184', b: '259,827', c: '282,471', head: true },
  { label: 'Aとの差（月）', a: '—', b: '+22,643', c: '+45,287', head: false },
];

function buildHtml() {
  const tableRows = COMPARE_ROWS.map(
    (row) => `
    <tr${row.head ? ' class="highlight"' : ''}>
      <th>${row.label}</th>
      <td>${row.a} 円</td>
      <td>${row.b} 円</td>
      <td>${row.c} 円</td>
    </tr>`,
  ).join('');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<title>BOOTHサムネイル — くらしの計算室</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1280px;
    height: 1280px;
    overflow: hidden;
    font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "BIZ UDPGothic", Meiryo, sans-serif;
    background: linear-gradient(155deg, #e6f4ef 0%, #f6f8fa 42%, #ffffff 100%);
    color: #1f2933;
  }
  .canvas {
    width: 1280px;
    height: 1280px;
    padding: 72px 64px 64px;
    display: flex;
    flex-direction: column;
  }
  .brand {
    font-size: 28px;
    font-weight: 700;
    color: #0b7a5c;
    letter-spacing: 0.04em;
    margin-bottom: 20px;
  }
  .brand span { color: #1f2933; }
  .title {
    font-size: 52px;
    font-weight: 800;
    line-height: 1.35;
    margin-bottom: 12px;
  }
  .subtitle {
    font-size: 26px;
    color: #5f6b76;
    margin-bottom: 36px;
  }
  .badges {
    display: flex;
    gap: 12px;
    margin-bottom: 32px;
    flex-wrap: wrap;
  }
  .badge {
    background: #0b7a5c;
    color: #fff;
    font-size: 20px;
    font-weight: 700;
    padding: 8px 18px;
    border-radius: 999px;
  }
  .badge.outline {
    background: #fff;
    color: #0b7a5c;
    border: 2px solid #0b7a5c;
  }
  .card {
    background: #fff;
    border: 1px solid #e1e7ec;
    border-radius: 20px;
    box-shadow: 0 8px 28px rgba(15, 30, 40, 0.08);
    padding: 28px 32px 32px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .card h2 {
    font-size: 24px;
    margin-bottom: 18px;
    color: #0b7a5c;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 22px;
  }
  th, td {
    border: 1px solid #e1e7ec;
    padding: 14px 12px;
    text-align: right;
  }
  th:first-child, td:first-child {
    text-align: left;
    background: #f6f8fa;
    font-weight: 700;
  }
  thead th {
    background: #e6f4ef;
    color: #0b7a5c;
    text-align: center;
    font-size: 20px;
  }
  tr.highlight th, tr.highlight td {
    background: #e6f4ef;
    font-weight: 800;
    color: #0b7a5c;
  }
  .footer {
    margin-top: auto;
    padding-top: 24px;
    font-size: 18px;
    color: #5f6b76;
    text-align: center;
  }
</style>
</head>
<body>
  <div class="canvas">
    <div class="brand">くらしの<span>計算室</span></div>
    <h1 class="title">手取り比較＋家計シミュレーション</h1>
    <p class="subtitle">転職・昇給の意思決定用スプレッドシート（2026年版）</p>
    <div class="badges">
      <span class="badge">Excel テンプレート</span>
      <span class="badge outline">6シート収録</span>
      <span class="badge outline">無料Webツール準拠</span>
    </div>
    <div class="card">
      <h2>手取り比較（代表例）</h2>
      <table>
        <thead>
          <tr><th></th><th>月収A</th><th>月収B</th><th>月収C</th></tr>
        </thead>
        <tbody>${tableRows}
        </tbody>
      </table>
      <p class="footer">※ 概算です。健保・税金は給与明細でご確認ください。</p>
    </div>
  </div>
</body>
</html>`;
}

async function renderPng(htmlPath) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1280 } });
    await page.goto(`file://${htmlPath}`);
    await page.screenshot({ path: pngOut, type: 'png' });
  } finally {
    await browser.close();
  }
}

async function main() {
  const html = buildHtml();
  writeFileSync(htmlOut, html, 'utf8');
  console.log(`OK: ${htmlOut.replace(root + '/', '')}`);

  if (htmlOnly) return;

  await renderPng(htmlOut);
  console.log(`OK: ${pngOut.replace(root + '/', '')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
