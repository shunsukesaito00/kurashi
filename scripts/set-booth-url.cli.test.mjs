import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { describe, it } from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REQUIRED_BOOTH_FILES, boothUrlPending, scanBoothLinks } from './booth-config.mjs';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const setBoothUrlScript = join(scriptsDir, 'set-booth-url.mjs');
const boothUrl = 'https://example.booth.pm/items/123456';

function writeHtmlFixture(fixtureRoot, relPath, html) {
  const filePath = join(fixtureRoot, relPath);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, html, 'utf8');
}

function htmlWithBoothAttr(url = '') {
  return `<!DOCTYPE html><html><body><a data-booth-url="${url}">BOOTH</a></body></html>`;
}

function withTempFixture(fn) {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'set-booth-url-cli-test-'));
  try {
    return fn(fixtureRoot);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function runSetBoothUrl(fixtureRoot, extraArgs = []) {
  return spawnSync(
    process.execPath,
    [setBoothUrlScript, '--root', fixtureRoot, ...extraArgs],
    { encoding: 'utf8', cwd: scriptsDir },
  );
}

function readFixtureHtml(fixtureRoot, relPath) {
  return readFileSync(join(fixtureRoot, relPath), 'utf8');
}

describe('set-booth-url.mjs CLI', () => {
  it('--dry-run は変更対象と置換後 URL を表示しファイルを書き込まない', () => {
    withTempFixture((fixtureRoot) => {
      const beforeByFile = new Map();
      for (const file of REQUIRED_BOOTH_FILES) {
        const html = htmlWithBoothAttr();
        writeHtmlFixture(fixtureRoot, file, html);
        beforeByFile.set(file, html);
      }

      const result = runSetBoothUrl(fixtureRoot, [
        '--url',
        boothUrl,
        '--dry-run',
      ]);
      assert.equal(result.status, 0);
      assert.match(result.stdout, /\[dry-run\] data-booth-url →/);
      assert.match(result.stdout, new RegExp(boothUrl.replace(/\./g, '\\.')));
      assert.match(
        result.stdout,
        new RegExp(`対象（必須）: ${REQUIRED_BOOTH_FILES.join(', ').replace(/\./g, '\\.')}`),
      );
      for (const file of REQUIRED_BOOTH_FILES) {
        assert.match(result.stdout, new RegExp(file.replace('.', '\\.')));
        assert.match(
          result.stdout,
          new RegExp(`data-booth-url="${boothUrl.replace(/\./g, '\\.')}"`),
        );
        assert.equal(readFixtureHtml(fixtureRoot, file), beforeByFile.get(file));
      }
      assert.match(result.stdout, /実行するには --dry-run を外してください。/);
    });
  });

  it('--dry-run なしで必須3ファイルの data-booth-url を指定 URL に更新する', () => {
    withTempFixture((fixtureRoot) => {
      for (const file of REQUIRED_BOOTH_FILES) {
        writeHtmlFixture(fixtureRoot, file, htmlWithBoothAttr());
      }

      const result = runSetBoothUrl(fixtureRoot, ['--url', boothUrl]);
      assert.equal(result.status, 0);
      assert.doesNotMatch(result.stdout, /\[dry-run\]/);

      for (const file of REQUIRED_BOOTH_FILES) {
        assert.match(
          readFixtureHtml(fixtureRoot, file),
          new RegExp(`data-booth-url="${boothUrl.replace(/\./g, '\\.')}"`),
        );
      }

      assert.deepEqual(boothUrlPending(fixtureRoot), []);
      const { configured } = scanBoothLinks(fixtureRoot);
      assert.equal(configured.length, 3);
      for (const file of REQUIRED_BOOTH_FILES) {
        assert.deepEqual(
          configured.find((entry) => entry.file === file),
          { file, url: boothUrl, required: true },
        );
      }
    });
  });

  it('--clear --dry-run は空 URL への置換を表示しファイルを書き込まない', () => {
    withTempFixture((fixtureRoot) => {
      const beforeByFile = new Map();
      for (const file of REQUIRED_BOOTH_FILES) {
        const html = htmlWithBoothAttr(boothUrl);
        writeHtmlFixture(fixtureRoot, file, html);
        beforeByFile.set(file, html);
      }

      const result = runSetBoothUrl(fixtureRoot, ['--clear', '--dry-run']);
      assert.equal(result.status, 0);
      assert.match(result.stdout, /\[dry-run\] data-booth-url → \(クリア\)/);
      for (const file of REQUIRED_BOOTH_FILES) {
        assert.match(result.stdout, new RegExp(file.replace('.', '\\.')));
        assert.match(result.stdout, /data-booth-url=""/);
        assert.equal(readFixtureHtml(fixtureRoot, file), beforeByFile.get(file));
        assert.match(
          readFixtureHtml(fixtureRoot, file),
          new RegExp(`data-booth-url="${boothUrl.replace(/\./g, '\\.')}"`),
        );
      }
      assert.match(result.stdout, /実行するには --dry-run を外してください。/);
    });
  });
});
