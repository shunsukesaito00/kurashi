#!/usr/bin/env node
/**
 * BOOTH 商品URLを data-booth-url 属性へ一括設定する。
 *
 * 使い方:
 *   node set-booth-url.mjs --url https://example.booth.pm/items/123 --dry-run
 *   node set-booth-url.mjs --url https://example.booth.pm/items/123
 *   node set-booth-url.mjs --clear
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  BOOTH_URL_ATTR_PATTERN,
  REQUIRED_BOOTH_FILES,
  boothStructureMissing,
  findExtraBoothHtmlFiles,
  isRequiredBoothFile,
} from './booth-config.mjs';

const scriptsDir = dirname(fileURLToPath(import.meta.url));

function resolveRoot(argv) {
  const rootArgIndex = argv.indexOf('--root');
  if (rootArgIndex !== -1 && argv[rootArgIndex + 1]) {
    return argv[rootArgIndex + 1];
  }
  if (process.env.BOOTH_CHECK_ROOT) {
    return process.env.BOOTH_CHECK_ROOT;
  }
  return join(scriptsDir, '..');
}

function parseArgs(argv) {
  const opts = { url: '', clear: false, dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--clear') opts.clear = true;
    else if (arg === '--root') {
      i++;
      continue;
    }
    else if (arg === '--url') opts.url = argv[++i] ?? '';
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else if (!opts.url && !opts.clear) opts.url = arg;
  }
  return opts;
}

function escapeAttr(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function usage() {
  console.log(`用法:
  node set-booth-url.mjs --url <BOOTH商品URL> [--dry-run] [--root <dir>]
  node set-booth-url.mjs --clear [--dry-run] [--root <dir>]

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
const root = resolveRoot(process.argv);
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

for (const rel of REQUIRED_BOOTH_FILES.filter(isRequiredBoothFile)) {
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

const extras = findExtraBoothHtmlFiles(root);

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
