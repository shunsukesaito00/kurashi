import { strict as assert } from 'node:assert';
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
