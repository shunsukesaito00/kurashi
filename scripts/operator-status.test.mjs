import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { describe, it } from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isOperatorInfoReady,
  PASTE_TEMPLATE_REFERENCE_LINE,
  README_ANCHOR_A8_NET,
  README_ANCHOR_BOOTH,
  README_ANCHOR_SEARCH_CONSOLE,
} from './operator-checks.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const scriptsDir = dirname(fileURLToPath(import.meta.url));
const statusScript = join(scriptsDir, 'operator-status.mjs');

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

describe('PASTE_TEMPLATE_REFERENCE_LINE', () => {
  it('README アンカー3件を含む', () => {
    for (const anchor of [
      README_ANCHOR_SEARCH_CONSOLE,
      README_ANCHOR_A8_NET,
      README_ANCHOR_BOOTH,
    ]) {
      assert.ok(
        PASTE_TEMPLATE_REFERENCE_LINE.includes(anchor),
        `貼付参照行に ${anchor} が含まれる`,
      );
    }
  });
});

describe('operator-status.mjs CLI', () => {
  it('未完了ブロッカーがあるとき出力にチャット貼付テンプレート参照行を含む', () => {
    const result = spawnSync(process.execPath, [statusScript], {
      encoding: 'utf8',
      cwd: scriptsDir,
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /次に貼り付けてほしいもの/);
    assert.ok(
      result.stdout.includes(PASTE_TEMPLATE_REFERENCE_LINE),
      '貼付テンプレート参照行が出力に含まれる',
    );
  });
});

describe('npm run test:booth-strict（本番リポジトリ）', () => {
  it(
    '出品前は exit 1 で ZIP は OK・商品URL は FAIL',
    { skip: process.env.BOOTH_URL_STRICT === '1' },
    () => {
      const result = spawnSync('npm', ['run', 'test:booth-strict'], {
        encoding: 'utf8',
        cwd: scriptsDir,
      });

      const output = `${result.stdout}\n${result.stderr}`;
      assert.equal(result.status, 1, output);
      assert.match(output, /OK: BOOTH 出品ZIP/);
      assert.match(output, /FAIL: BOOTH 商品URL/);
    },
  );
});
