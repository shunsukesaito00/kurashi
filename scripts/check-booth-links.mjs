#!/usr/bin/env node
/**
 * BOOTH 導線（data-booth-url）の状態を確認する。
 * 出品前は警告のみ（exit 0）。本番化時は --strict または環境変数 BOOTH_URL_STRICT=1 で
 * 必須3ファイルの URL 未設定を FAIL にできる。必須外の空属性は WARN のみ。
 * HTTPサーバー不要。
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import {
  BOOTH_URL_PATTERN,
  REQUIRED_BOOTH_FILES,
  boothUrlPending,
} from './booth-config.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const strict =
  process.argv.includes('--strict') || process.env.BOOTH_URL_STRICT === '1';

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
  const extraPending = [];
  const withAttr = new Set();

  for (const file of collectHtmlFiles(root)) {
    const html = readFileSync(file, 'utf8');
    const rel = relative(root, file);
    const matches = [...html.matchAll(BOOTH_URL_PATTERN)];
    if (matches.length === 0) continue;

    withAttr.add(rel);
    const isRequired = REQUIRED_BOOTH_FILES.includes(rel);
    for (const match of matches) {
      const url = match[1].trim();
      if (url) {
        configured.push({ file: rel, url, required: isRequired });
      } else if (!isRequired) {
        extraPending.push(rel);
      }
    }
  }

  return {
    configured,
    extraPending: [...new Set(extraPending)],
    withAttr,
  };
}

const { configured, extraPending, withAttr } = scanBoothLinks();
const pending = boothUrlPending(root);

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

for (const { file, url, required } of configured) {
  const tag = required ? '' : '（必須外）';
  console.log(`設定済  ${file}${tag}  (${url})`);
}

for (const file of pending) {
  console.log(`未設定  ${file}  (data-booth-url="")`);
}

for (const file of extraPending) {
  console.log(`WARN  ${file}  (必須外・data-booth-url="" — 更新対象外)`);
}

if (extraPending.length > 0) {
  console.log(
    `WARN: 必須外の空 data-booth-url ${extraPending.length} ファイル: ${extraPending.join(', ')}`,
  );
}

if (pending.length > 0) {
  const detail = `${pending.join(', ')} — 出品後 node scripts/set-booth-url.mjs --url <商品URL>`;
  if (strict) {
    console.error(`FAIL: BOOTH 商品URL 未設定（必須） ${pending.length} ファイル: ${detail}`);
    process.exit(1);
  }
  console.log(`WARN: BOOTH 商品URL 未設定（必須） ${pending.length} ファイル: ${detail}`);
  process.exit(0);
}

console.log('OK: BOOTH 導線 — 必須ファイルの data-booth-url はすべて設定済みです。');
