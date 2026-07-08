#!/usr/bin/env node
/**
 * 共有URLの往復テスト: クエリ付きで開く → 結果表示 → URL正規化 → 再読み込み → 同じ結果
 *
 * HTTPサーバー必須 — 別ターミナルで python3 -m http.server 8000 を起動したまま実行。
 * 初回のみ: cd scripts && npm install && npx playwright install chromium
 * 2回目以降: cd scripts && npm test（本スクリプトは HTTP サーバー必須）
 * 各ケースの path は README「共有URLのクエリキー」表の代表例と一致させること。
 */
import { chromium } from 'playwright';

const BASE = (process.env.BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

const cases = [
  // README 代表例: ?a=300000&b=330000&c=360000 (tools/tedori.html)
  {
    name: 'tedori',
    path: '/tools/tedori.html?a=300000&b=330000&c=360000',
    ready: '#cmp-result.show',
    snapshot: '#cmp-table',
    urlKeys: ['a', 'b', 'c'],
  },
  // README 代表例: ?a=10000&r=0.10&d=excl (tools/zeikomi.html)
  {
    name: 'zeikomi',
    path: '/tools/zeikomi.html?a=10000&r=0.10&d=excl',
    ready: '#result.show',
    snapshot: '#result table',
    urlKeys: ['a', 'r', 'd'],
  },
  // README 代表例: ?y=2026 (tools/wareki.html · 西暦パラメータ)
  {
    name: 'wareki-seireki',
    path: '/tools/wareki.html?y=2026',
    ready: '#result.show',
    snapshot: '#answer',
    urlKeys: ['y'],
  },
  // README 代表例: ?g=reiwa&n=8 (tools/wareki.html · 和暦パラメータ)
  {
    name: 'wareki-wareki',
    path: '/tools/wareki.html?g=reiwa&n=8',
    ready: '#result.show',
    snapshot: '#answer',
    urlKeys: ['g', 'n'],
  },
  // README 代表例: ?b=1990-05-15 (tools/nenrei.html)
  {
    name: 'nenrei',
    path: '/tools/nenrei.html?b=1990-05-15',
    ready: '#result.show',
    snapshot: '#result',
    urlKeys: ['b'],
  },
  // README 代表例: ?h=170&w=65 (tools/bmi.html)
  {
    name: 'bmi',
    path: '/tools/bmi.html?h=170&w=65',
    ready: '#result.show',
    snapshot: '#result',
    urlKeys: ['h', 'w'],
  },
  // README 代表例: ?m=30000&r=5&y=20 (tools/tsumitate.html)
  {
    name: 'tsumitate',
    path: '/tools/tsumitate.html?m=30000&r=5&y=20',
    ready: '#result.show',
    snapshot: '#result',
    urlKeys: ['m', 'r', 'y'],
  },
  // README 代表例: ?p=10000&d=20 (tools/waribiki.html)
  {
    name: 'waribiki',
    path: '/tools/waribiki.html?p=10000&d=20',
    ready: '#result.show',
    snapshot: '#result',
    urlKeys: ['p', 'd'],
  },
  // README 代表例: ?s=300000&h=160&d=20&o=20 (tools/jikyu.html)
  {
    name: 'jikyu',
    path: '/tools/jikyu.html?s=300000&h=160&d=20&o=20',
    ready: '#result.show',
    snapshot: '#result',
    urlKeys: ['s', 'h', 'd', 'o'],
  },
  // README 代表例: ?s=300000&m=12&support=1 (tools/ikukyu.html)
  {
    name: 'ikukyu',
    path: '/tools/ikukyu.html?s=300000&m=12&support=1',
    ready: '#result.show',
    snapshot: '#result',
    urlKeys: ['s', 'm', 'support'],
  },
  // README 代表例: ?a=10000000&y=20 (tools/taishoku.html)
  {
    name: 'taishoku',
    path: '/tools/taishoku.html?a=10000000&y=20',
    ready: '#result.show',
    snapshot: '#result',
    urlKeys: ['a', 'y'],
  },
  // README 代表例: ?t=%E3%81%8F%E3%82%89%E3%81%97%E3%81%AE%E8%A8%88%E7%AE%97%E5%AE%A4 (tools/moji.html)
  {
    name: 'moji',
    path: '/tools/moji.html?t=%E3%81%8F%E3%82%89%E3%81%97%E3%81%AE%E8%A8%88%E7%AE%97%E5%AE%A4',
    ready: '#count-all',
    snapshot: '#result table',
    urlKeys: ['t'],
    readyCheck: async (page) => {
      const text = await page.locator('#count-all').textContent();
      return text && !text.startsWith('0 文字');
    },
  },
];

async function waitReady(page, testCase) {
  await page.locator(testCase.ready).waitFor({ state: 'visible', timeout: 10000 });
  if (testCase.readyCheck) {
    const ok = await testCase.readyCheck(page);
    if (!ok) throw new Error('共有URLの往復テスト: readyCheck failed');
  }
}

async function readSnapshot(page, selector) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: 'visible', timeout: 10000 });
  return (await el.innerText()).trim();
}

function assertShareUrl(url, urlKeys, name) {
  const u = new URL(url);
  for (const key of urlKeys) {
    if (!u.searchParams.has(key)) {
      throw new Error(`${name}: 共有URLの往復テストでクエリキー "${key}" が見つからない: ${url}`);
    }
  }
}

async function verifyShareUrlRoundTrip(page, testCase) {
  const startUrl = `${BASE}${testCase.path}`;
  await page.goto(startUrl, { waitUntil: 'load' });
  await waitReady(page, testCase);

  const before = await readSnapshot(page, testCase.snapshot);
  const shareUrl = page.url();
  assertShareUrl(shareUrl, testCase.urlKeys, testCase.name);

  await page.goto(shareUrl, { waitUntil: 'load' });
  await waitReady(page, testCase);
  const after = await readSnapshot(page, testCase.snapshot);

  if (before !== after) {
    throw new Error(
      `${testCase.name}: 共有URLの往復テストで再読み込み後に結果が変わった\n--- before ---\n${before}\n--- after ---\n${after}`
    );
  }
}

async function main() {
  let browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    console.error('Playwright の起動に失敗しました。初回は npx playwright install chromium を実行してください。');
    console.error(e.message);
    process.exit(2);
  }

  const page = await browser.newPage();
  const failures = [];

  for (const testCase of cases) {
    try {
      await verifyShareUrlRoundTrip(page, testCase);
      console.log('PASS', testCase.name);
    } catch (e) {
      console.log('FAIL', testCase.name, '-', e.message);
      failures.push(testCase.name);
    }
  }

  await browser.close();

  if (failures.length) {
    console.error(`\n共有URLの往復テスト: ${failures.length} 件が失敗 (${failures.join(', ')})`);
    process.exit(1);
  }
  console.log(`\nALL_PASS: 共有URLの往復テスト (${cases.length} cases)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
