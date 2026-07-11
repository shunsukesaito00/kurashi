/** BOOTH 導線の共通設定・ヘルパー */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

export const REQUIRED_BOOTH_FILES = [
  'about.html',
  'index.html',
  'tools/tedori.html',
];

export function isRequiredBoothFile(filePath) {
  return REQUIRED_BOOTH_FILES.includes(filePath);
}

export const BOOTH_URL_PATTERN = /data-booth-url="([^"]*)"/g;

/** 一括置換用（キャプチャなし） */
export const BOOTH_URL_ATTR_PATTERN = /data-booth-url="[^"]*"/g;

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
    let configuredForFile = false;
    for (const match of matches) {
      const url = match[1].trim();
      if (url) {
        if (!configuredForFile) {
          configured.push({ file: rel, url, required });
          configuredForFile = true;
        }
      } else if (!required) {
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
    const matches = readBoothUrlMatches(html);
    const hasUrl = matches.some((m) => m[1].trim());
    if (matches.length === 0 || !hasUrl) {
      pending.push(file);
    }
  }
  return pending;
}
