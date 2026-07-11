import { strict as assert } from 'node:assert';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { describe, it } from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isOperatorInfoReady } from './operator-checks.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function withTempFixture(fn) {
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'operator-status-test-'));
  try {
    return fn(fixtureRoot);
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function writeAboutFixture(fixtureRoot, html) {
  writeFileSync(join(fixtureRoot, 'about.html'), html, 'utf8');
}

describe('isOperatorInfoReady', () => {
  it('運営者名と連絡先メールがあれば true', () => {
    withTempFixture((fixtureRoot) => {
      writeAboutFixture(
        fixtureRoot,
        '<tr><th>運営者</th><td>斎藤 俊介（個人）</td></tr><a href="mailto:infomationshunsuke@gmail.com">',
      );
      assert.equal(isOperatorInfoReady(fixtureRoot), true);
    });
  });

  it('BOOTH の「出品準備中」表記があっても運営者情報は true', () => {
    withTempFixture((fixtureRoot) => {
      writeAboutFixture(
        fixtureRoot,
        [
          '<span class="footer-booth-pending">（出品準備中）</span>',
          '<tr><th>運営者</th><td>斎藤 俊介（個人）</td></tr>',
          'infomationshunsuke@gmail.com',
        ].join('\n'),
      );
      assert.equal(isOperatorInfoReady(fixtureRoot), true);
    });
  });

  it('運営者名が無ければ false', () => {
    withTempFixture((fixtureRoot) => {
      writeAboutFixture(fixtureRoot, 'infomationshunsuke@gmail.com');
      assert.equal(isOperatorInfoReady(fixtureRoot), false);
    });
  });

  it('連絡先メールが無ければ false', () => {
    withTempFixture((fixtureRoot) => {
      writeAboutFixture(fixtureRoot, '斎藤 俊介');
      assert.equal(isOperatorInfoReady(fixtureRoot), false);
    });
  });
});

describe('isOperatorInfoReady（本番リポジトリ）', () => {
  it('about.html は運営者情報が設定済み', () => {
    assert.equal(isOperatorInfoReady(root), true);
  });
});
