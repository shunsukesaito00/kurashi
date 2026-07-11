import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { describe, it } from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REQUIRED_BOOTH_FILES, boothUrlPending, escapeBoothUrlAttr, readFirstBoothUrl, scanBoothLinks } from './booth-config.mjs';

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

function htmlWithoutBoothAttr() {
  return '<!DOCTYPE html><html><body><a href="#">BOOTH</a></body></html>';
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

  it('--clear で必須3ファイルの data-booth-url を空に戻し boothUrlPending が3件になる', () => {
    withTempFixture((fixtureRoot) => {
      for (const file of REQUIRED_BOOTH_FILES) {
        writeHtmlFixture(fixtureRoot, file, htmlWithBoothAttr(boothUrl));
      }

      const result = runSetBoothUrl(fixtureRoot, ['--clear']);
      assert.equal(result.status, 0);
      assert.doesNotMatch(result.stdout, /\[dry-run\]/);

      for (const file of REQUIRED_BOOTH_FILES) {
        assert.match(readFixtureHtml(fixtureRoot, file), /data-booth-url=""/);
      }

      assert.deepEqual(
        boothUrlPending(fixtureRoot).sort(),
        [...REQUIRED_BOOTH_FILES].sort(),
      );
      assert.deepEqual(scanBoothLinks(fixtureRoot).configured, []);
    });
  });

  it('必須外の空 data-booth-url は --url 実行でも更新せず WARN のみ出す', () => {
    withTempFixture((fixtureRoot) => {
      const extraHtml = htmlWithBoothAttr();
      for (const file of REQUIRED_BOOTH_FILES) {
        writeHtmlFixture(fixtureRoot, file, htmlWithBoothAttr());
      }
      writeHtmlFixture(fixtureRoot, 'privacy.html', extraHtml);

      const result = runSetBoothUrl(fixtureRoot, ['--url', boothUrl]);
      assert.equal(result.status, 0);
      assert.match(
        result.stdout,
        /WARN: 必須外の data-booth-url は更新していません: privacy\.html/,
      );

      for (const file of REQUIRED_BOOTH_FILES) {
        assert.match(
          readFixtureHtml(fixtureRoot, file),
          new RegExp(`data-booth-url="${boothUrl.replace(/\./g, '\\.')}"`),
        );
      }
      assert.equal(readFixtureHtml(fixtureRoot, 'privacy.html'), extraHtml);
      assert.match(readFixtureHtml(fixtureRoot, 'privacy.html'), /data-booth-url=""/);
      assert.doesNotMatch(
        readFixtureHtml(fixtureRoot, 'privacy.html'),
        new RegExp(`data-booth-url="${boothUrl.replace(/\./g, '\\.')}"`),
      );

      const { configured, extraPending } = scanBoothLinks(fixtureRoot);
      assert.equal(configured.length, 3);
      assert.deepEqual(extraPending, ['privacy.html']);
    });
  });

  it('必須3ファイルが既に同じ URL のとき --url 実行は変更なしでファイルを書き換えない', () => {
    withTempFixture((fixtureRoot) => {
      const beforeByFile = new Map();
      for (const file of REQUIRED_BOOTH_FILES) {
        const html = htmlWithBoothAttr(boothUrl);
        writeHtmlFixture(fixtureRoot, file, html);
        beforeByFile.set(file, html);
      }

      const result = runSetBoothUrl(fixtureRoot, ['--url', boothUrl]);
      assert.equal(result.status, 0);
      assert.match(
        result.stdout,
        /変更なし: 必須ファイルの data-booth-url は既に同じ値です。/,
      );
      assert.doesNotMatch(result.stdout, /data-booth-url →/);

      for (const file of REQUIRED_BOOTH_FILES) {
        assert.equal(readFixtureHtml(fixtureRoot, file), beforeByFile.get(file));
      }
      assert.deepEqual(boothUrlPending(fixtureRoot), []);
    });
  });

  it('必須ファイルに data-booth-url が無いとき --url 実行は exit code 1 を返す', () => {
    withTempFixture((fixtureRoot) => {
      for (const file of REQUIRED_BOOTH_FILES) {
        writeHtmlFixture(fixtureRoot, file, htmlWithoutBoothAttr());
      }

      const result = runSetBoothUrl(fixtureRoot, ['--url', boothUrl]);
      assert.equal(result.status, 1);
      assert.match(
        result.stderr,
        /FAIL: 必須ファイルに data-booth-url がありません/,
      );
      for (const file of REQUIRED_BOOTH_FILES) {
        assert.match(result.stderr, new RegExp(file.replace('.', '\\.')));
      }
      assert.match(
        result.stderr,
        new RegExp(`期待: ${REQUIRED_BOOTH_FILES.join(', ').replace(/\./g, '\\.')}`),
      );
    });
  });

  it('無効な URL を --url に渡すと exit code 1 を返す', () => {
    withTempFixture((fixtureRoot) => {
      const beforeByFile = new Map();
      for (const file of REQUIRED_BOOTH_FILES) {
        const html = htmlWithBoothAttr();
        writeHtmlFixture(fixtureRoot, file, html);
        beforeByFile.set(file, html);
      }

      const result = runSetBoothUrl(fixtureRoot, [
        '--url',
        'example.booth.pm/items/123',
      ]);
      assert.equal(result.status, 1);
      assert.match(
        result.stderr,
        /URL は https:\/\/ で始まる有効なURLを指定してください。/,
      );

      for (const file of REQUIRED_BOOTH_FILES) {
        assert.equal(readFixtureHtml(fixtureRoot, file), beforeByFile.get(file));
      }
    });
  });

  it('URL に " を含む場合でも data-booth-url は &quot; にエスケープして書き込む', () => {
    const quotedUrl = 'https://example.booth.pm/items/123?ref="test"';
    const escapedUrl = escapeBoothUrlAttr(quotedUrl);

    withTempFixture((fixtureRoot) => {
      for (const file of REQUIRED_BOOTH_FILES) {
        writeHtmlFixture(fixtureRoot, file, htmlWithBoothAttr());
      }

      const result = runSetBoothUrl(fixtureRoot, ['--url', quotedUrl]);
      assert.equal(result.status, 0);

      for (const file of REQUIRED_BOOTH_FILES) {
        const html = readFixtureHtml(fixtureRoot, file);
        assert.match(html, /data-booth-url="[^"]*"/);
        assert.doesNotMatch(html, /data-booth-url="[^"]*"[^"]*"/);
        assert.equal(
          html,
          `<!DOCTYPE html><html><body><a data-booth-url="${escapedUrl}">BOOTH</a></body></html>`,
        );
        assert.equal(readFirstBoothUrl(html), escapedUrl);
      }

      const { configured } = scanBoothLinks(fixtureRoot);
      assert.equal(configured.length, 3);
      for (const file of REQUIRED_BOOTH_FILES) {
        assert.deepEqual(
          configured.find((entry) => entry.file === file),
          { file, url: escapedUrl, required: true },
        );
      }
      assert.deepEqual(boothUrlPending(fixtureRoot), []);
    });
  });
});
