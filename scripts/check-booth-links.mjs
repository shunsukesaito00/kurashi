#!/usr/bin/env node
/**
 * BOOTH 導線（data-booth-url）と出品ZIP（同梱3ファイル）の状態を確認する。
 * 出品前は URL 未設定は警告のみ（exit 0）。本番化時は --strict または環境変数 BOOTH_URL_STRICT=1 で
 * 必須3ファイルの URL 未設定を FAIL にできる。必須外の空属性は WARN のみ。
 * 出品ZIPの同梱不足は常に FAIL（exit 1）。HTTPサーバー不要。
 */
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  BOOTH_ZIP_ENTRIES,
  REQUIRED_BOOTH_FILES,
  boothUrlPending,
  boothZipStatus,
  isRequiredBoothFile,
  scanBoothLinks,
} from './booth-config.mjs';

function resolveRoot() {
  const rootArgIndex = process.argv.indexOf('--root');
  if (rootArgIndex !== -1 && process.argv[rootArgIndex + 1]) {
    return process.argv[rootArgIndex + 1];
  }
  if (process.env.BOOTH_CHECK_ROOT) {
    return process.env.BOOTH_CHECK_ROOT;
  }
  return join(dirname(fileURLToPath(import.meta.url)), '..');
}

const root = resolveRoot();
const strict =
  process.argv.includes('--strict') || process.env.BOOTH_URL_STRICT === '1';

const { configured, extraPending, withAttr } = scanBoothLinks(root);
const pending = boothUrlPending(root);

const missingRequired = REQUIRED_BOOTH_FILES.filter(
  (file) => isRequiredBoothFile(file) && !withAttr.has(file),
);
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

const boothZip = boothZipStatus(root);
if (!boothZip.ok) {
  console.error(`FAIL: BOOTH 出品ZIP — ${boothZip.block}`);
  process.exit(1);
}

console.log(
  `OK: BOOTH 出品ZIP — 同梱3ファイル揃い (${BOOTH_ZIP_ENTRIES.join(', ')})`,
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
