#!/usr/bin/env node
/**
 * BOOTH 導線（data-booth-url）の状態を確認する。
 * 出品前は警告のみ（exit 0）。本番化時は --strict または環境変数 BOOTH_URL_STRICT=1 で未設定を FAIL にできる。
 * HTTPサーバー不要。
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const strict =
  process.argv.includes('--strict') || process.env.BOOTH_URL_STRICT === '1';

/** BOOTH 導線を置く必須 HTML（data-booth-url 属性の有無を構造チェック） */
const REQUIRED_BOOTH_FILES = [
  'about.html',
  'index.html',
  'tools/tedori.html',
];

function collectHtmlFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      collectHtmlFiles(path, acc);
      continue;
    }
    if (path.endsWith('.html')) acc.push(path);
  }
  return acc;
}

function scanBoothLinks() {
  const configured = [];
  const pending = [];
  const withAttr = new Set();

  for (const file of collectHtmlFiles(root)) {
    const html = readFileSync(file, 'utf8');
    const rel = relative(root, file);
    const matches = [...html.matchAll(/data-booth-url="([^"]*)"/g)];
    if (matches.length === 0) continue;

    withAttr.add(rel);
    for (const match of matches) {
      const url = match[1].trim();
      if (url) configured.push({ file: rel, url });
      else pending.push(rel);
    }
  }

  return {
    configured,
    pending: [...new Set(pending)],
    withAttr,
  };
}

const { configured, pending, withAttr } = scanBoothLinks();

const missingRequired = REQUIRED_BOOTH_FILES.filter((file) => !withAttr.has(file));
if (missingRequired.length > 0) {
  console.error(
    `FAIL: BOOTH 導線の必須ファイルに data-booth-url がありません: ${missingRequired.join(', ')}`,
  );
  console.error(`       期待: ${REQUIRED_BOOTH_FILES.join(', ')}`);
  process.exit(1);
}

console.log(
  `OK: BOOTH 導線構造 — 必須 ${REQUIRED_BOOTH_FILES.length} ファイル揃い (${REQUIRED_BOOTH_FILES.join(', ')})`,
);

if (configured.length === 0 && pending.length === 0) {
  console.error('FAIL: data-booth-url 属性を持つ HTML がありません。');
  process.exit(1);
}

for (const { file, url } of configured) {
  console.log(`設定済  ${file}  (${url})`);
}

for (const file of pending) {
  console.log(`未設定  ${file}  (data-booth-url="")`);
}

if (pending.length > 0) {
  const detail = `${pending.join(', ')} — 出品後 node scripts/set-booth-url.mjs --url <商品URL>`;
  if (strict) {
    console.error(`FAIL: BOOTH 商品URL 未設定 ${pending.length} ファイル: ${detail}`);
    process.exit(1);
  }
  console.log(`WARN: BOOTH 商品URL 未設定 ${pending.length} ファイル: ${detail}`);
  process.exit(0);
}

console.log('OK: BOOTH 導線 — 全 data-booth-url が設定済みです。');
