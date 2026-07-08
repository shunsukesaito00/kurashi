#!/usr/bin/env node
/**
 * README の代表例列と index.html デモリンク、verify-share-urls.mjs の path が一致するか確認する。
 * HTTPサーバー不要。
 * 初回のみ: cd scripts && npm install && npx playwright install chromium
 * 2回目以降: cd scripts && npm test（本スクリプトは HTTP サーバー不要）
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptsDir, '..');

function parseReadmeExamples(markdown) {
  const paths = [];
  let inTable = false;

  for (const line of markdown.split('\n')) {
    if (line.startsWith('### 共有URLのクエリキー')) {
      inTable = false;
      continue;
    }
    if (line.startsWith('| ページ | クエリキー |')) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    if (!line.startsWith('|')) break;
    // サイト構成表の scripts/README.md 行など tools/ 以外は対象外
    if (!line.startsWith('| `tools/')) continue;

    const cols = line.split('|').map((s) => s.trim()).filter(Boolean);
    const page = cols[0].replace(/`/g, '');
    const examples = cols[3]
      .replace(/`/g, '')
      .split(' / ')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const example of examples) {
      paths.push(`/${page}${example}`);
    }
  }

  return paths;
}

function parseIndexDemoPaths(html) {
  const section = html.match(/<ul class="demo-list">([\s\S]*?)<\/ul>/);
  if (!section) return [];

  const paths = [];
  const re = /href="([^"]+)"/g;
  let match;
  while ((match = re.exec(section[1])) !== null) {
    if (!match[1].includes('?')) continue;
    paths.push(`/${match[1].replace(/&amp;/g, '&')}`);
  }
  return paths;
}

function parseVerifyPaths(source) {
  const paths = [];
  const re = /path:\s*'([^']+)'/g;
  let match;
  while ((match = re.exec(source)) !== null) {
    paths.push(match[1]);
  }
  return paths;
}

function diffSets(label, expected, actual, actualLabel) {
  const missing = expected.filter((p) => !actual.includes(p));
  const extra = actual.filter((p) => !expected.includes(p));
  if (!missing.length && !extra.length) return [];

  const messages = [`${label} mismatch:`];
  for (const path of missing) messages.push(`  missing in ${actualLabel}: ${path}`);
  for (const path of extra) messages.push(`  extra in ${actualLabel}: ${path}`);
  return messages;
}

const readmePaths = parseReadmeExamples(readFileSync(join(root, 'README.md'), 'utf8'));
const indexPaths = parseIndexDemoPaths(readFileSync(join(root, 'index.html'), 'utf8'));
const verifyPaths = parseVerifyPaths(readFileSync(join(scriptsDir, 'verify-share-urls.mjs'), 'utf8'));

const errors = [
  ...diffSets('README vs index.html demo links', readmePaths, indexPaths, 'index.html'),
  ...diffSets('README vs verify-share-urls.mjs', readmePaths, verifyPaths, 'verify-share-urls.mjs'),
];

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(
  `OK: ${readmePaths.length} demo paths match across README, index.html, and verify-share-urls.mjs`
);
