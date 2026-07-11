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

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptsDir, '..');

const ATTR_PATTERN = /data-booth-url="[^"]*"/g;

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

対象: data-booth-url 属性を持つ全 .html ファイル
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

const replacement = `data-booth-url="${escapeAttr(newUrl)}"`;
const files = collectHtmlFiles(root).sort();
const changed = [];

for (const file of files) {
  const before = readFileSync(file, 'utf8');
  if (!before.includes('data-booth-url=')) continue;

  const matches = before.match(ATTR_PATTERN);
  if (!matches) continue;

  const after = before.replace(ATTR_PATTERN, replacement);
  if (after === before) continue;

  changed.push({
    file: relative(root, file),
    hits: matches.length,
    before: matches[0],
    after: replacement,
  });

  if (!opts.dryRun) {
    writeFileSync(file, after, 'utf8');
  }
}

if (changed.length === 0) {
  console.log('変更なし: data-booth-url を含むHTMLがありません。');
  process.exit(0);
}

const label = opts.clear ? '(クリア)' : newUrl;
console.log(`${opts.dryRun ? '[dry-run] ' : ''}data-booth-url → ${label || '""'}`);
for (const { file, hits, before, after } of changed) {
  console.log(`  ${file} (${hits} 箇所)`);
  console.log(`    ${before}`);
  console.log(`    ${after}`);
}

if (opts.dryRun) {
  console.log('\n実行するには --dry-run を外してください。');
} else {
  console.log('\n次: git diff で確認 → commit → push origin main && push origin main:gh-pages');
}
