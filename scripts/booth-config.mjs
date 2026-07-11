/** BOOTH 導線の共通設定・ヘルパー */
import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

export const REQUIRED_BOOTH_FILES = [
  'about.html',
  'index.html',
  'tools/tedori.html',
];

export const BOOTH_ZIP_REL = 'products/tedori-kakei-booth.zip';

export const BOOTH_ZIP_ENTRIES = [
  'tedori-kakei-template.xlsx',
  'manual.pdf',
  'booth-thumbnail.png',
];

export function isRequiredBoothFile(filePath) {
  return REQUIRED_BOOTH_FILES.includes(filePath);
}

export const BOOTH_URL_PATTERN = /data-booth-url="([^"]*)"/g;

/** 一括置換用（キャプチャなし） */
export const BOOTH_URL_ATTR_PATTERN = /data-booth-url="[^"]*"/g;

/** data-booth-url 属性値用の HTML エスケープ */
export function escapeBoothUrlAttr(url) {
  return url.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

export function collectHtmlFiles(root, dir = root, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      collectHtmlFiles(root, path, acc);
      continue;
    }
    if (path.endsWith('.html')) acc.push(path);
  }
  return acc;
}

export function readBoothUrlMatches(html) {
  return [...html.matchAll(BOOTH_URL_PATTERN)];
}

/** HTML 内の最初の非空 data-booth-url を返す。無ければ null */
export function readFirstBoothUrl(html) {
  for (const match of readBoothUrlMatches(html)) {
    const url = match[1].trim();
    if (url) return url;
  }
  return null;
}

export function hasBoothUrlAttr(file, root) {
  return readFileSync(join(root, file), 'utf8').includes('data-booth-url=');
}

export function findExtraBoothHtmlFiles(root) {
  const extras = [];
  for (const file of collectHtmlFiles(root)) {
    const rel = relative(root, file);
    if (isRequiredBoothFile(rel)) continue;
    if (hasBoothUrlAttr(rel, root)) extras.push(rel);
  }
  return extras.sort();
}

export function scanBoothLinks(root) {
  const configured = [];
  const extraPending = [];
  const withAttr = new Set();

  for (const file of collectHtmlFiles(root)) {
    const html = readFileSync(file, 'utf8');
    const rel = relative(root, file);
    const matches = readBoothUrlMatches(html);
    if (matches.length === 0) continue;

    withAttr.add(rel);
    const required = isRequiredBoothFile(rel);
    const url = readFirstBoothUrl(html);
    if (url) {
      configured.push({ file: rel, url, required });
    }
    for (const match of matches) {
      if (!match[1].trim() && !required) {
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

export function boothStructureMissing(root) {
  return REQUIRED_BOOTH_FILES.filter(
    (file) => isRequiredBoothFile(file) && !hasBoothUrlAttr(file, root),
  );
}

export function boothUrlPending(root) {
  const pending = [];
  for (const file of REQUIRED_BOOTH_FILES) {
    if (!isRequiredBoothFile(file)) continue;
    const html = readFileSync(join(root, file), 'utf8');
    if (!readFirstBoothUrl(html)) {
      pending.push(file);
    }
  }
  return pending;
}

export function parseBoothZipEntryNames(listing) {
  return listing.trim().split('\n').filter(Boolean);
}

export function boothZipMissingEntries(names) {
  return BOOTH_ZIP_ENTRIES.filter((name) => !names.includes(name));
}

function listBoothZipEntries(zipPath) {
  const listing = execSync(`unzip -Z1 "${zipPath}"`, { encoding: 'utf8' });
  return parseBoothZipEntryNames(listing);
}

export function boothZipStatus(root, deps = {}) {
  const exists = deps.exists ?? existsSync;
  const listEntries = deps.listEntries ?? listBoothZipEntries;
  const zipRel = deps.zipRel ?? BOOTH_ZIP_REL;
  const zipPath = join(root, zipRel);

  if (!exists(zipPath)) {
    return {
      ok: false,
      block: `${zipRel} なし — python3 scripts/build-booth-package.py で生成`,
    };
  }
  try {
    const names = listEntries(zipPath);
    const missing = boothZipMissingEntries(names);
    if (missing.length > 0) {
      return {
        ok: false,
        block: `${zipRel} に不足: ${missing.join(', ')} — python3 scripts/build-booth-package.py で再生成`,
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      block: `${zipRel} の一覧取得に失敗 — unzip コマンドを確認`,
    };
  }
}
