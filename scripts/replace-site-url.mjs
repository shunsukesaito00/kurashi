#!/usr/bin/env node
/**
 * 独自ドメイン取得後のサイトURL一括置換。
 * sitemap.xml・robots.txt・全HTMLの canonical/og:url/JSON-LD、README・AGENTS.md を更新する。
 *
 * 使い方:
 *   node replace-site-url.mjs --to https://example.com --dry-run
 *   node replace-site-url.mjs --to https://example.com
 *
 * 環境変数: FROM_URL（省略時は github.io 本番URL）
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptsDir, '..');

const DEFAULT_FROM = 'https://shunsukesaito00.github.io/kurashi';

function parseArgs(argv) {
  const opts = { from: DEFAULT_FROM, to: '', dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--from') opts.from = argv[++i];
    else if (arg === '--to') opts.to = argv[++i];
    else if (arg === '--help' || arg === '-h') opts.help = true;
    else if (!opts.to) opts.to = arg;
  }
  return opts;
}

function normalizeBase(url) {
  return url.trim().replace(/\/+$/, '');
}

function collectTargetFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) {
      collectTargetFiles(path, acc);
      continue;
    }
    const rel = relative(root, path);
    if (
      rel.endsWith('.html') ||
      rel === 'sitemap.xml' ||
      rel === 'robots.txt' ||
      rel === 'README.md' ||
      rel === 'AGENTS.md'
    ) {
      acc.push(path);
    }
  }
  return acc;
}

function replaceBase(text, fromBase, toBase) {
  return text.split(`${fromBase}/`).join(`${toBase}/`).split(fromBase).join(toBase);
}

function usage() {
  console.log(`用法:
  node replace-site-url.mjs --to <新しいサイトURL> [--from <旧URL>] [--dry-run]

例（確認のみ）:
  node replace-site-url.mjs --to https://kurashi.example.com --dry-run

例（本番置換）:
  node replace-site-url.mjs --to https://kurashi.example.com

置換後: git diff を確認 → main へ push → gh-pages 同期 → Search Console に新プロパティ追加
`);
}

const opts = parseArgs(process.argv);
if (opts.help || !opts.to) {
  usage();
  process.exit(opts.to ? 0 : 1);
}

const fromBase = normalizeBase(opts.from);
const toBase = normalizeBase(opts.to);

if (fromBase === toBase) {
  console.error('FROM と TO が同じです。');
  process.exit(1);
}

if (!/^https?:\/\//.test(toBase)) {
  console.error('TO は https:// で始まるURLを指定してください。');
  process.exit(1);
}

const files = collectTargetFiles(root).sort();
let totalHits = 0;
const changed = [];

for (const file of files) {
  const before = readFileSync(file, 'utf8');
  if (!before.includes(fromBase)) continue;

  const after = replaceBase(before, fromBase, toBase);
  const hits = (before.split(fromBase).length - 1);
  totalHits += hits;
  changed.push({ file: relative(root, file), hits });

  if (!opts.dryRun) {
    writeFileSync(file, after, 'utf8');
  }
}

if (changed.length === 0) {
  console.log(`変更なし: "${fromBase}" を含む対象ファイルがありません。`);
  process.exit(0);
}

console.log(`${opts.dryRun ? '[dry-run] ' : ''}${fromBase} → ${toBase}`);
for (const { file, hits } of changed) {
  console.log(`  ${file} (${hits} 箇所)`);
}
console.log(`合計: ${changed.length} ファイル, ${totalHits} 箇所`);

if (opts.dryRun) {
  console.log('\n実行するには --dry-run を外してください。');
} else {
  console.log('\n次: git diff で確認 → commit → push origin main && push origin main:gh-pages');
}
