import { strict as assert } from 'node:assert';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { describe, it } from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BOOTH_ZIP_ENTRIES,
  REQUIRED_BOOTH_FILES,
  boothStructureMissing,
  boothUrlPending,
  boothZipStatus,
  escapeBoothUrlAttr,
  findExtraBoothHtmlFiles,
  isRequiredBoothFile,
  readFirstBoothUrl,
  scanBoothLinks,
} from './booth-config.mjs';
import { boothCliChildEnv } from './booth-cli-test-helpers.mjs';

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

function htmlWithMultipleEmptyBoothAttrs(count = 2) {
  const links = Array.from(
    { length: count },
    () => '<a data-booth-url="">BOOTH</a>',
  ).join('');
  return `<!DOCTYPE html><html><body>${links}</body></html>`;
}

function htmlWithMultipleBoothAttrs(url, count = 2) {
  const links = Array.from(
    { length: count },
    () => `<a data-booth-url="${url}">BOOTH</a>`,
  ).join('');
  return `<!DOCTYPE html><html><body>${links}</body></html>`;
}

function htmlWithLeadingEmptyThenBoothUrl(url) {
  return `<!DOCTYPE html><html><body><a data-booth-url="">BOOTH</a><a data-booth-url="${url}">BOOTH</a></body></html>`;
}

describe('boothCliChildEnv', () => {
  it('デフォルトで BOOTH_URL_STRICT を子プロセス env から除外する', () => {
    const previous = process.env.BOOTH_URL_STRICT;
    process.env.BOOTH_URL_STRICT = '1';
    try {
      const env = boothCliChildEnv();
      assert.equal(env.BOOTH_URL_STRICT, undefined);
      assert.ok('PATH' in env);
    } finally {
      if (previous === undefined) {
        delete process.env.BOOTH_URL_STRICT;
      } else {
        process.env.BOOTH_URL_STRICT = previous;
      }
    }
  });

  it('keepStrictEnv: true のとき BOOTH_URL_STRICT を維持する', () => {
    const previous = process.env.BOOTH_URL_STRICT;
    process.env.BOOTH_URL_STRICT = '1';
    try {
      const env = boothCliChildEnv({ keepStrictEnv: true });
      assert.equal(env.BOOTH_URL_STRICT, '1');
    } finally {
      if (previous === undefined) {
        delete process.env.BOOTH_URL_STRICT;
      } else {
        process.env.BOOTH_URL_STRICT = previous;
      }
    }
  });
});

describe('escapeBoothUrlAttr', () => {
  it('URL 内の " を &quot; にエスケープする', () => {
    assert.equal(escapeBoothUrlAttr('a"b'), 'a&quot;b');
  });

  it('URL 内の & を &amp; にエスケープする', () => {
    assert.equal(escapeBoothUrlAttr('a&b=c'), 'a&amp;b=c');
  });
});

describe('readFirstBoothUrl', () => {
  const boothUrl = 'https://example.booth.pm/items/123456';

  it('空の data-booth-url のみなら null を返す', () => {
    assert.equal(readFirstBoothUrl(htmlWithBoothAttr()), null);
    assert.equal(readFirstBoothUrl(htmlWithMultipleEmptyBoothAttrs(2)), null);
  });

  it('先頭が空でも後続に URL があればその URL を返す', () => {
    assert.equal(
      readFirstBoothUrl(htmlWithLeadingEmptyThenBoothUrl(boothUrl)),
      boothUrl,
    );
  });

  it('data-booth-url が無ければ null を返す', () => {
    assert.equal(readFirstBoothUrl(htmlWithoutBoothAttr()), null);
  });
});

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

describe('scanBoothLinks configured（一時ディレクトリ）', () => {
  const boothUrl = 'https://example.booth.pm/items/123456';

  it('必須ファイルに URL が設定されていれば configured に含まれる', () => {
    withTempFixture((fixtureRoot) => {
      writeHtmlFixture(
        fixtureRoot,
        'index.html',
        htmlWithBoothAttr(boothUrl),
      );

      const { configured } = scanBoothLinks(fixtureRoot);
      assert.deepEqual(configured, [
        { file: 'index.html', url: boothUrl, required: true },
      ]);
    });
  });

  it('必須3ファイルすべてに URL が設定されていれば configured に3件含まれる', () => {
    withTempFixture((fixtureRoot) => {
      for (const file of REQUIRED_BOOTH_FILES) {
        writeHtmlFixture(fixtureRoot, file, htmlWithBoothAttr(boothUrl));
      }

      const { configured } = scanBoothLinks(fixtureRoot);
      assert.equal(configured.length, 3);
      for (const file of REQUIRED_BOOTH_FILES) {
        assert.deepEqual(
          configured.find((entry) => entry.file === file),
          { file, url: boothUrl, required: true },
        );
      }
      assert.deepEqual(boothUrlPending(fixtureRoot), []);
    });
  });

  it('URL が空の必須ファイルは configured に含めない', () => {
    withTempFixture((fixtureRoot) => {
      writeHtmlFixture(fixtureRoot, 'about.html', htmlWithBoothAttr(boothUrl));
      writeHtmlFixture(fixtureRoot, 'index.html', htmlWithBoothAttr());
      writeHtmlFixture(
        fixtureRoot,
        'tools/tedori.html',
        htmlWithBoothAttr(boothUrl),
      );

      const { configured } = scanBoothLinks(fixtureRoot);
      assert.deepEqual(
        configured.map((entry) => entry.file).sort(),
        ['about.html', 'tools/tedori.html'],
      );
      for (const entry of configured) {
        assert.equal(entry.url, boothUrl);
        assert.equal(entry.required, true);
      }
      assert.deepEqual(boothUrlPending(fixtureRoot), ['index.html']);
    });
  });

  it('同一 HTML 内の URL 設定済み data-booth-url が複数あっても configured は重複なく1件', () => {
    withTempFixture((fixtureRoot) => {
      writeHtmlFixture(
        fixtureRoot,
        'index.html',
        htmlWithMultipleBoothAttrs(boothUrl, 3),
      );

      const { configured } = scanBoothLinks(fixtureRoot);
      assert.deepEqual(configured, [
        { file: 'index.html', url: boothUrl, required: true },
      ]);
      assert.equal(
        configured.filter((entry) => entry.file === 'index.html').length,
        1,
      );
    });
  });

  it('最初の data-booth-url が空でも後続に URL があれば configured に含まれる', () => {
    withTempFixture((fixtureRoot) => {
      writeHtmlFixture(
        fixtureRoot,
        'index.html',
        htmlWithLeadingEmptyThenBoothUrl(boothUrl),
      );

      const { configured } = scanBoothLinks(fixtureRoot);
      assert.deepEqual(configured, [
        { file: 'index.html', url: boothUrl, required: true },
      ]);
    });
  });

  it('最初の data-booth-url が空でも後続に URL があれば boothUrlPending は空', () => {
    withTempFixture((fixtureRoot) => {
      for (const file of REQUIRED_BOOTH_FILES) {
        const html =
          file === 'index.html'
            ? htmlWithLeadingEmptyThenBoothUrl(boothUrl)
            : htmlWithBoothAttr(boothUrl);
        writeHtmlFixture(fixtureRoot, file, html);
      }

      assert.deepEqual(boothUrlPending(fixtureRoot), []);
    });
  });
});

describe('scanBoothLinks extraPending（一時ディレクトリ）', () => {
  const boothUrl = 'https://example.booth.pm/items/123456';

  it('必須外 HTML に空の data-booth-url があれば extraPending に含まれる', () => {
    withTempFixture((fixtureRoot) => {
      writeHtmlFixture(
        fixtureRoot,
        'tools/tsumitate.html',
        htmlWithBoothAttr(),
      );

      const { extraPending } = scanBoothLinks(fixtureRoot);
      assert.deepEqual(extraPending, ['tools/tsumitate.html']);
    });
  });

  it('同一 HTML 内の空 data-booth-url が複数あっても extraPending は重複なく1件', () => {
    withTempFixture((fixtureRoot) => {
      writeHtmlFixture(
        fixtureRoot,
        'privacy.html',
        htmlWithMultipleEmptyBoothAttrs(3),
      );

      const { extraPending } = scanBoothLinks(fixtureRoot);
      assert.deepEqual(extraPending, ['privacy.html']);
      assert.equal(extraPending.length, 1);
    });
  });

  it('必須外 HTML に URL が設定されていれば configured に含め extraPending には含めない', () => {
    withTempFixture((fixtureRoot) => {
      writeHtmlFixture(
        fixtureRoot,
        'privacy.html',
        htmlWithBoothAttr(boothUrl),
      );

      const { configured, extraPending } = scanBoothLinks(fixtureRoot);
      assert.deepEqual(extraPending, []);
      assert.deepEqual(configured, [
        { file: 'privacy.html', url: boothUrl, required: false },
      ]);
    });
  });

  it('必須外の空 URL は findExtraBoothHtmlFiles にも含まれる', () => {
    withTempFixture((fixtureRoot) => {
      writeHtmlFixture(fixtureRoot, 'privacy.html', htmlWithBoothAttr());

      const { extraPending } = scanBoothLinks(fixtureRoot);
      assert.deepEqual(extraPending, ['privacy.html']);
      assert.deepEqual(findExtraBoothHtmlFiles(fixtureRoot), ['privacy.html']);
    });
  });

  it('必須ファイルの空 URL は extraPending ではなく boothUrlPending に入る', () => {
    withTempFixture((fixtureRoot) => {
      for (const file of REQUIRED_BOOTH_FILES) {
        const html =
          file === 'index.html'
            ? htmlWithBoothAttr()
            : htmlWithBoothAttr(boothUrl);
        writeHtmlFixture(fixtureRoot, file, html);
      }
      writeHtmlFixture(
        fixtureRoot,
        'tools/tsumitate.html',
        htmlWithBoothAttr(),
      );

      const { extraPending } = scanBoothLinks(fixtureRoot);
      assert.deepEqual(extraPending, ['tools/tsumitate.html']);
      assert.deepEqual(boothUrlPending(fixtureRoot), ['index.html']);
    });
  });
});

describe('BOOTH 導線 設定状態（一時ディレクトリ）', () => {
  const boothUrl = 'https://example.booth.pm/items/123456';

  it('必須3ファイルすべてに URL 設定済みなら boothUrlPending は空で configured は3件', () => {
    withTempFixture((fixtureRoot) => {
      for (const file of REQUIRED_BOOTH_FILES) {
        writeHtmlFixture(fixtureRoot, file, htmlWithBoothAttr(boothUrl));
      }

      assert.deepEqual(boothStructureMissing(fixtureRoot), []);
      assert.deepEqual(boothUrlPending(fixtureRoot), []);

      const { configured, extraPending, withAttr } = scanBoothLinks(fixtureRoot);
      assert.deepEqual(extraPending, []);
      assert.equal(configured.length, 3);
      for (const file of REQUIRED_BOOTH_FILES) {
        assert.equal(withAttr.has(file), true);
        assert.deepEqual(
          configured.find((entry) => entry.file === file),
          { file, url: boothUrl, required: true },
        );
      }
    });
  });

  it('必須3ファイルのうち1件だけ URL 未設定なら boothUrlPending は1件で configured は2件', () => {
    withTempFixture((fixtureRoot) => {
      for (const file of REQUIRED_BOOTH_FILES) {
        const html =
          file === 'index.html'
            ? htmlWithBoothAttr()
            : htmlWithBoothAttr(boothUrl);
        writeHtmlFixture(fixtureRoot, file, html);
      }

      assert.deepEqual(boothStructureMissing(fixtureRoot), []);
      assert.deepEqual(boothUrlPending(fixtureRoot), ['index.html']);

      const { configured, extraPending, withAttr } = scanBoothLinks(fixtureRoot);
      assert.deepEqual(extraPending, []);
      assert.equal(configured.length, 2);
      for (const file of REQUIRED_BOOTH_FILES) {
        assert.equal(withAttr.has(file), true);
      }
      assert.deepEqual(
        configured.map((entry) => entry.file).sort(),
        ['about.html', 'tools/tedori.html'],
      );
      for (const entry of configured) {
        assert.equal(entry.url, boothUrl);
        assert.equal(entry.required, true);
      }
      assert.equal(
        configured.find((entry) => entry.file === 'index.html'),
        undefined,
      );
    });
  });

  it('必須3ファイルすべてが data-booth-url 属性を欠いていれば boothStructureMissing は3件で configured は空', () => {
    withTempFixture((fixtureRoot) => {
      for (const file of REQUIRED_BOOTH_FILES) {
        writeHtmlFixture(fixtureRoot, file, htmlWithoutBoothAttr());
      }

      assert.deepEqual(
        boothStructureMissing(fixtureRoot).sort(),
        [...REQUIRED_BOOTH_FILES].sort(),
      );
      assert.deepEqual(
        boothUrlPending(fixtureRoot).sort(),
        [...REQUIRED_BOOTH_FILES].sort(),
      );

      const { configured, extraPending, withAttr } = scanBoothLinks(fixtureRoot);
      assert.deepEqual(configured, []);
      assert.deepEqual(extraPending, []);
      for (const file of REQUIRED_BOOTH_FILES) {
        assert.equal(withAttr.has(file), false);
      }
    });
  });

  it('必須3ファイルは URL 設定済み・必須外に空属性があれば configured は3件で extraPending は1件', () => {
    withTempFixture((fixtureRoot) => {
      for (const file of REQUIRED_BOOTH_FILES) {
        writeHtmlFixture(fixtureRoot, file, htmlWithBoothAttr(boothUrl));
      }
      writeHtmlFixture(fixtureRoot, 'privacy.html', htmlWithBoothAttr());

      assert.deepEqual(boothStructureMissing(fixtureRoot), []);
      assert.deepEqual(boothUrlPending(fixtureRoot), []);

      const { configured, extraPending, withAttr } = scanBoothLinks(fixtureRoot);
      assert.equal(configured.length, 3);
      for (const file of REQUIRED_BOOTH_FILES) {
        assert.equal(withAttr.has(file), true);
        assert.deepEqual(
          configured.find((entry) => entry.file === file),
          { file, url: boothUrl, required: true },
        );
      }
      assert.deepEqual(extraPending, ['privacy.html']);
      assert.equal(withAttr.has('privacy.html'), true);
      assert.deepEqual(findExtraBoothHtmlFiles(fixtureRoot), ['privacy.html']);
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

  it('configured は必須3ファイルすべてに URL 設定済み', () => {
    const { configured } = scanBoothLinks(root);
    assert.equal(configured.length, REQUIRED_BOOTH_FILES.length);
    assert.deepEqual(
      configured.map((entry) => entry.file).sort(),
      [...REQUIRED_BOOTH_FILES].sort(),
    );
    for (const entry of configured) {
      assert.equal(entry.required, true);
      assert.match(entry.url, /^https:\/\//);
    }
  });

  it('boothUrlPending は空である', () => {
    assert.deepEqual(boothUrlPending(root), []);
  });

  it('findExtraBoothHtmlFiles は必須ファイルを含まない', () => {
    const extras = findExtraBoothHtmlFiles(root);
    for (const file of extras) {
      assert.equal(isRequiredBoothFile(file), false);
    }
  });
});

describe('boothZipStatus（一時ディレクトリ）', () => {
  it('ZIP が無いとき ok: false を返す', () => {
    withTempFixture((fixtureRoot) => {
      const result = boothZipStatus(fixtureRoot);
      assert.equal(result.ok, false);
      assert.match(result.block, /なし/);
    });
  });

  it('同梱3ファイルが揃っていれば ok: true', () => {
    withTempFixture((fixtureRoot) => {
      const result = boothZipStatus(fixtureRoot, {
        exists: () => true,
        listEntries: () => [...BOOTH_ZIP_ENTRIES],
      });
      assert.equal(result.ok, true);
    });
  });

  it('同梱ファイルが不足していれば不足名を block に含める', () => {
    withTempFixture((fixtureRoot) => {
      const result = boothZipStatus(fixtureRoot, {
        exists: () => true,
        listEntries: () => ['tedori-kakei-template.xlsx'],
      });
      assert.equal(result.ok, false);
      assert.match(result.block, /manual\.pdf/);
      assert.match(result.block, /booth-thumbnail\.png/);
    });
  });

  it('listEntries が失敗したとき一覧取得失敗メッセージを返す', () => {
    withTempFixture((fixtureRoot) => {
      const result = boothZipStatus(fixtureRoot, {
        exists: () => true,
        listEntries: () => {
          throw new Error('fail');
        },
      });
      assert.equal(result.ok, false);
      assert.match(result.block, /一覧取得に失敗/);
    });
  });
});

describe('boothZipStatus（本番リポジトリ）', () => {
  it('tedori-kakei-booth.zip に同梱3ファイルが揃っている', () => {
    const result = boothZipStatus(root);
    assert.equal(result.ok, true);
  });
});
