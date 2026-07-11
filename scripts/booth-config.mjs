/** BOOTH 導線の共通設定・ヘルパー */
import { readFileSync } from 'fs';
import { join } from 'path';

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

export function readBoothUrlMatches(html) {
  return [...html.matchAll(BOOTH_URL_PATTERN)];
}

export function hasBoothUrlAttr(file, root) {
  return readFileSync(join(root, file), 'utf8').includes('data-booth-url=');
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
    if (matches.length === 0 || matches.some((m) => !m[1].trim())) {
      pending.push(file);
    }
  }
  return pending;
}
