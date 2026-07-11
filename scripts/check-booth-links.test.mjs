import { strict as assert } from 'node:assert';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { describe, it } from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REQUIRED_BOOTH_FILES,
  boothStructureMissing,
  boothUrlPending,
  findExtraBoothHtmlFiles,
  isRequiredBoothFile,
  scanBoothLinks,
} from './booth-config.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function writeHtmlFixture(fixtureRoot, relPath, html) {
  const filePath = join(fixtureRoot, relPath);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, html, 'utf8');
}

function withTempFixture(fn) {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'booth-links-test-'));
  try {
    return fn(fixtureRoot);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function htmlWithBoothAttr(url = '') {
  return `<!DOCTYPE html><html><body><a data-booth-url="${url}">BOOTH</a></body></html>`;
}

function htmlWithoutBoothAttr() {
  return '<!DOCTYPE html><html><body><a href="#">BOOTH</a></body></html>';
}

describe('isRequiredBoothFile', () => {
  it('必須3ファイルを true と判定する', () => {
    for (const file of REQUIRED_BOOTH_FILES) {
      assert.equal(isRequiredBoothFile(file), true);
    }
  });

  it('必須外のパスは false と判定する', () => {
    assert.equal(isRequiredBoothFile('tools/tsumitate.html'), false);
    assert.equal(isRequiredBoothFile('privacy.html'), false);
  });
});

describe('boothStructureMissing（一時ディレクトリ）', () => {
  it('必須ファイルすべてに data-booth-url が無いと3件すべて返す', () => {
    withTempFixture((fixtureRoot) => {
      for (const file of REQUIRED_BOOTH_FILES) {
        writeHtmlFixture(fixtureRoot, file, htmlWithoutBoothAttr());
      }
      assert.deepEqual(
        boothStructureMissing(fixtureRoot).sort(),
        [...REQUIRED_BOOTH_FILES].sort(),
      );
    });
  });

  it('data-booth-url が欠けている必須ファイルだけを返す', () => {
    withTempFixture((fixtureRoot) => {
      for (const file of REQUIRED_BOOTH_FILES) {
        const html =
          file === 'index.html'
            ? htmlWithoutBoothAttr()
            : htmlWithBoothAttr();
        writeHtmlFixture(fixtureRoot, file, html);
      }
      assert.deepEqual(boothStructureMissing(fixtureRoot), ['index.html']);
    });
  });

  it('属性はあるが URL が空なら構造欠落とはみなさない', () => {
    withTempFixture((fixtureRoot) => {
      for (const file of REQUIRED_BOOTH_FILES) {
        writeHtmlFixture(fixtureRoot, file, htmlWithBoothAttr());
      }
      assert.deepEqual(boothStructureMissing(fixtureRoot), []);
      assert.deepEqual(
        boothUrlPending(fixtureRoot).sort(),
        [...REQUIRED_BOOTH_FILES].sort(),
      );
    });
  });

  it('scanBoothLinks の withAttr に欠落ファイルを含めない', () => {
    withTempFixture((fixtureRoot) => {
      writeHtmlFixture(fixtureRoot, 'about.html', htmlWithBoothAttr());
      writeHtmlFixture(fixtureRoot, 'index.html', htmlWithoutBoothAttr());
      writeHtmlFixture(fixtureRoot, 'tools/tedori.html', htmlWithBoothAttr());

      const { withAttr } = scanBoothLinks(fixtureRoot);
      assert.equal(withAttr.has('index.html'), false);
      assert.equal(withAttr.has('about.html'), true);
      assert.equal(withAttr.has('tools/tedori.html'), true);
      assert.deepEqual(boothStructureMissing(fixtureRoot), ['index.html']);
    });
  });
});

describe('scanBoothLinks（本番リポジトリ）', () => {
  it('必須3ファイルすべてに data-booth-url がある', () => {
    const { withAttr } = scanBoothLinks(root);
    for (const file of REQUIRED_BOOTH_FILES) {
      assert.equal(
        withAttr.has(file),
        true,
        `${file} に data-booth-url がありません`,
      );
    }
  });

  it('必須3ファイルは withAttr の部分集合である', () => {
    const { withAttr } = scanBoothLinks(root);
    const requiredInScan = [...withAttr].filter(isRequiredBoothFile);
    assert.deepEqual(requiredInScan.sort(), [...REQUIRED_BOOTH_FILES].sort());
  });

  it('boothStructureMissing が空である', () => {
    assert.deepEqual(boothStructureMissing(root), []);
  });

  it('boothUrlPending は必須3ファイルのみを返す', () => {
    const pending = boothUrlPending(root);
    assert.deepEqual(pending.sort(), [...REQUIRED_BOOTH_FILES].sort());
    for (const file of pending) {
      assert.equal(isRequiredBoothFile(file), true);
    }
  });

  it('findExtraBoothHtmlFiles は必須ファイルを含まない', () => {
    const extras = findExtraBoothHtmlFiles(root);
    for (const file of extras) {
      assert.equal(isRequiredBoothFile(file), false);
    }
  });
});
