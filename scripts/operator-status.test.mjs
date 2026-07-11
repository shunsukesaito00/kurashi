import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { describe, it } from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BOOTH_STRICT_RECURSION_REFERENCE_LINE,
  isOperatorInfoReady,
  PASTE_TEMPLATE_REFERENCE_LINE,
  README_ANCHOR_A8_NET,
  README_ANCHOR_BOOTH,
  README_ANCHOR_SEARCH_CONSOLE,
  shouldSkipBoothStrictIntegrationTest,
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

describe('BOOTH_STRICT_RECURSION_REFERENCE_LINE', () => {
  it('shouldSkipBoothStrictIntegrationTest を含む', () => {
    assert.ok(
      BOOTH_STRICT_RECURSION_REFERENCE_LINE.includes(
        'shouldSkipBoothStrictIntegrationTest',
      ),
      '再帰回避参考行に shouldSkipBoothStrictIntegrationTest が含まれる',
    );
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
    assert.ok(
      result.stdout.includes(BOOTH_STRICT_RECURSION_REFERENCE_LINE),
      'test:booth-strict 再帰回避参考行が出力に含まれる',
    );
  });

  it('運営者側の未完了ブロッカー件数を表示する', () => {
    const result = spawnSync(process.execPath, [statusScript], {
      encoding: 'utf8',
      cwd: scriptsDir,
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /運営者側の未完了: 1 項目/);
  });
});

describe('npm run test:booth-strict（本番リポジトリ）', () => {
  it(
    '出品後は check:booth-links が strict でも exit 0',
    { skip: shouldSkipBoothStrictIntegrationTest() },
    () => {
      const checkScript = join(scriptsDir, 'check-booth-links.mjs');
      const result = spawnSync(process.execPath, [checkScript], {
        encoding: 'utf8',
        cwd: scriptsDir,
        env: { ...process.env, BOOTH_URL_STRICT: '1' },
      });

      const output = `${result.stdout}\n${result.stderr}`;
      assert.equal(result.status, 0, output);
      assert.match(output, /OK: BOOTH 出品ZIP/);
      assert.match(
        output,
        /OK: BOOTH 導線 — 必須ファイルの data-booth-url はすべて設定済みです。/,
      );
    },
  );
});

describe('shouldSkipBoothStrictIntegrationTest', () => {
  it('BOOTH_URL_STRICT=1 のとき true（test:booth-strict 統合テストを skip）', () => {
    assert.equal(
      shouldSkipBoothStrictIntegrationTest({ BOOTH_URL_STRICT: '1' }),
      true,
    );
    assert.equal(shouldSkipBoothStrictIntegrationTest({}), false);
    assert.equal(
      shouldSkipBoothStrictIntegrationTest({ BOOTH_URL_STRICT: '0' }),
      false,
    );
  });
});
