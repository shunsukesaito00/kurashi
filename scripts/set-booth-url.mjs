#!/usr/bin/env node
/**
 * BOOTH 商品URLを data-booth-url 属性へ一括設定する。
 *
 * 使い方:
 *   node set-booth-url.mjs --url https://example.booth.pm/items/123 --dry-run
 *   node set-booth-url.mjs --url https://example.booth.pm/items/123
 *   node set-booth-url.mjs --clear
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';
import {
  BOOTH_URL_ATTR_PATTERN,
  REQUIRED_BOOTH_FILES,
  boothStructureMissing,
} from './booth-config.mjs';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptsDir, '..');

function parseArgs(argv) {
  const opts = { url: '', clear: false, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--clear') opts.clear = true;
    else if (arg === '--url') opts.url = argv[++i] ?? '';
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else if (!opts.url && !opts.clear) opts.url = arg;
  }
  return opts;
}

function collectHtmlFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) {
      collectHtmlFiles(path, acc);
      continue;
    }
    if (path.endsWith('.html')) acc.push(path);
  }
  return acc;
}

function findExtraBoothFiles() {
  const extras = [];
  for (const file of collectHtmlFiles(root)) {
    const rel = relative(root, file);
    if (REQUIRED_BOOTH_FILES.includes(rel)) continue;
    if (readFileSync(file, 'utf8').includes('data-booth-url=')) {
      extras.push(rel);
    }
  }
  return extras.sort();
}

function escapeAttr(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function usage() {
  console.log(`用法:
  node set-booth-url.mjs --url <BOOTH商品URL> [--dry-run]
  node set-booth-url.mjs --clear [--dry-run]

例（確認のみ）:
  node set-booth-url.mjs --url https://kurashi.booth.pm/items/123456 --dry-run

例（本番更新）:
  node set-booth-url.mjs --url https://kurashi.booth.pm/items/123456

対象: ${REQUIRED_BOOTH_FILES.join(', ')}
必須外の data-booth-url は更新せず WARN のみ表示します。
`);
}

function validateUrl(url) {
  if (!/^https?:\/\/.+/.test(url)) {
    console.error('URL は https:// で始まる有効なURLを指定してください。');
    process.exit(1);
  }
}

const opts = parseArgs(process.argv);
if (opts.help || (!opts.url && !opts.clear)) {
  usage();
  process.exit(opts.url || opts.clear ? 0 : 1);
}

const newUrl = opts.clear ? '' : opts.url.trim();
if (!opts.clear) validateUrl(newUrl);

const missingRequired = boothStructureMissing(root);
if (missingRequired.length > 0) {
  console.error(
    `FAIL: 必須ファイルに data-booth-url がありません: ${missingRequired.join(', ')}`,
  );
  console.error(`       期待: ${REQUIRED_BOOTH_FILES.join(', ')}`);
  process.exit(1);
}

const replacement = `data-booth-url="${escapeAttr(newUrl)}"`;
const changed = [];

for (const rel of REQUIRED_BOOTH_FILES) {
  const file = join(root, rel);
  const before = readFileSync(file, 'utf8');
  const matches = before.match(BOOTH_URL_ATTR_PATTERN);
  if (!matches) continue;

  const after = before.replace(BOOTH_URL_ATTR_PATTERN, replacement);
  if (after === before) continue;

  changed.push({
    file: rel,
    hits: matches.length,
    before: matches[0],
    after: replacement,
  });

  if (!opts.dryRun) {
    writeFileSync(file, after, 'utf8');
  }
}

const extras = findExtraBoothFiles();

if (changed.length === 0) {
  console.log('変更なし: 必須ファイルの data-booth-url は既に同じ値です。');
  if (extras.length > 0) {
    console.log(`WARN: 必須外の data-booth-url は更新していません: ${extras.join(', ')}`);
  }
  process.exit(0);
}

const label = opts.clear ? '(クリア)' : newUrl;
console.log(`${opts.dryRun ? '[dry-run] ' : ''}data-booth-url → ${label || '""'}`);
console.log(`対象（必須）: ${REQUIRED_BOOTH_FILES.join(', ')}`);
for (const { file, hits, before, after } of changed) {
  console.log(`  ${file} (${hits} 箇所)`);
  console.log(`    ${before}`);
  console.log(`    ${after}`);
}

if (extras.length > 0) {
  console.log(`WARN: 必須外の data-booth-url は更新していません: ${extras.join(', ')}`);
}

if (opts.dryRun) {
  console.log('\n実行するには --dry-run を外してください。');
} else {
  console.log('\n次: git diff で確認 → commit → push origin main && push origin main:gh-pages');
}
