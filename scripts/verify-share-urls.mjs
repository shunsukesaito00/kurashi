#!/usr/bin/env node
/**
 * 共有URLの往復テスト: クエリ付きで開く → 結果表示 → URL正規化 → 再読み込み → 同じ結果
 *
 * 前提: ローカルHTTPサーバーが起動していること (README の python3 -m http.server 8000)
 * 実行: npx --yes -p playwright@1.61.1 node scripts/verify-share-urls.mjs
 * 初回: npx playwright install chromium
 */
import { chromium } from 'playwright';

const BASE = (process.env.BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

const cases = [
  {
    name: 'tedori',
    path: '/tools/tedori.html?a=300000&b=330000&c=360000',
    ready: '#cmp-result.show',
    snapshot: '#cmp-table',
    urlKeys: ['a', 'b', 'c'],
  },
  {
    name: 'zeikomi',
    path: '/tools/zeikomi.html?a=10000&r=0.10&d=excl',
    ready: '#result.show',
    snapshot: '#result table',
    urlKeys: ['a', 'r', 'd'],
  },
  {
    name: 'wareki-seireki',
    path: '/tools/wareki.html?y=2026',
    ready: '#result.show',
    snapshot: '#answer',
    urlKeys: ['y'],
  },
  {
    name: 'wareki-wareki',
    path: '/tools/wareki.html?g=reiwa&n=8',
    ready: '#result.show',
    snapshot: '#answer',
    urlKeys: ['g', 'n'],
  },
  {
    name: 'nenrei',
    path: '/tools/nenrei.html?b=1990-05-15',
    ready: '#result.show',
    snapshot: '#result',
    urlKeys: ['b'],
  },
  {
    name: 'bmi',
    path: '/tools/bmi.html?h=170&w=65',
    ready: '#result.show',
    snapshot: '#result',
    urlKeys: ['h', 'w'],
  },
  {
    name: 'tsumitate',
    path: '/tools/tsumitate.html?m=30000&r=5&y=20',
    ready: '#result.show',
    snapshot: '#result',
    urlKeys: ['m', 'r', 'y'],
  },
  {
    name: 'waribiki',
    path: '/tools/waribiki.html?p=10000&d=20',
    ready: '#result.show',
    snapshot: '#result',
    urlKeys: ['p', 'd'],
  },
  {
    name: 'jikyu',
    path: '/tools/jikyu.html?s=300000&h=160&d=20&o=20',
    ready: '#result.show',
    snapshot: '#result',
    urlKeys: ['s', 'h', 'd', 'o'],
  },
  {
    name: 'ikukyu',
    path: '/tools/ikukyu.html?s=300000&m=12&support=1',
    ready: '#result.show',
    snapshot: '#result',
    urlKeys: ['s', 'm', 'support'],
  },
  {
    name: 'taishoku',
    path: '/tools/taishoku.html?a=10000000&y=20',
    ready: '#result.show',
    snapshot: '#result',
    urlKeys: ['a', 'y'],
  },
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
    if (!ok) throw new Error('readyCheck failed');
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
      throw new Error(`${name}: missing query key "${key}" in ${url}`);
    }
  }
}

async function verifyRoundTrip(page, testCase) {
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
      `${testCase.name}: result changed after reload\n--- before ---\n${before}\n--- after ---\n${after}`
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
      await verifyRoundTrip(page, testCase);
      console.log('PASS', testCase.name);
    } catch (e) {
      console.log('FAIL', testCase.name, '-', e.message);
      failures.push(testCase.name);
    }
  }

  await browser.close();

  if (failures.length) {
    console.error(`\n${failures.length} tool(s) failed: ${failures.join(', ')}`);
    process.exit(1);
  }
  console.log(`\nALL_PASS (${cases.length} cases)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
