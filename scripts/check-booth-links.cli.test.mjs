import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { describe, it } from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REQUIRED_BOOTH_FILES } from './booth-config.mjs';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const checkScript = join(scriptsDir, 'check-booth-links.mjs');

function writeHtmlFixture(fixtureRoot, relPath, html) {
  const filePath = join(fixtureRoot, relPath);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, html, 'utf8');
}

function htmlWithoutBoothAttr() {
  return '<!DOCTYPE html><html><body><a href="#">BOOTH</a></body></html>';
}

function withTempFixture(fn) {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'booth-links-cli-test-'));
  try {
    return fn(fixtureRoot);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function runCheckBoothLinks(fixtureRoot, extraArgs = []) {
  return spawnSync(
    process.execPath,
    [checkScript, '--root', fixtureRoot, ...extraArgs],
    { encoding: 'utf8', cwd: scriptsDir },
  );
}

describe('check-booth-links.mjs CLI', () => {
  it('必須3ファイルの構造欠落時は exit code 1 を返す', () => {
    withTempFixture((fixtureRoot) => {
      for (const file of REQUIRED_BOOTH_FILES) {
        writeHtmlFixture(fixtureRoot, file, htmlWithoutBoothAttr());
      }

      const result = runCheckBoothLinks(fixtureRoot);
      assert.equal(result.status, 1);
      assert.match(result.stderr, /FAIL: BOOTH 導線の必須ファイルに data-booth-url がありません/);
      for (const file of REQUIRED_BOOTH_FILES) {
        assert.match(result.stderr, new RegExp(file.replace('.', '\\.')));
      }
    });
  });
});
