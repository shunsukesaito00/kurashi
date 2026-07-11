import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const boothScript = readFileSync(join(root, 'js/booth.js'), 'utf8');

function initBoothInDom(bodyHtml) {
  const dom = new JSDOM(
    `<!DOCTYPE html><html><body>${bodyHtml}<script>${boothScript}</script></body></html>`,
    { runScripts: 'dangerously' },
  );
  const { document, window } = dom.window;
  if (document.readyState === 'loading') {
    document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
  }
  return window;
}

describe('js/booth.js', () => {
  it('data-booth-url が空のときリンクを無効化する', () => {
    const window = initBoothInDom(
      '<a class="footer-booth-link" href="#" data-booth-url="">BOOTH</a>',
    );
    const link = window.document.querySelector('.footer-booth-link');

    assert.equal(link.getAttribute('href'), '#');
    assert.equal(link.classList.contains('is-pending'), true);

    const event = new window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    link.dispatchEvent(event);
    assert.equal(event.defaultPrevented, true);
  });

  it('data-booth-url が設定済みのとき href をその URL にする', () => {
    const boothUrl = 'https://example.booth.pm/items/123456';
    const window = initBoothInDom(
      `<a class="footer-booth-link" href="#" data-booth-url="${boothUrl}">BOOTH</a>`,
    );
    const link = window.document.querySelector('.footer-booth-link');

    assert.equal(link.href, boothUrl);
    assert.equal(link.target, '_blank');
    assert.equal(link.rel, 'noopener noreferrer');
    assert.equal(link.classList.contains('is-pending'), false);

    const event = new window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    link.dispatchEvent(event);
    assert.equal(event.defaultPrevented, false);
  });

  it('tedori 構造で URL 設定時に booth-cta-pending を hidden にする', () => {
    const boothUrl = 'https://example.booth.pm/items/123456';
    const window = initBoothInDom(`
      <div class="booth-cta" id="booth-cta" data-booth-url="${boothUrl}" hidden>
        <p><a class="btn booth-cta-link" id="booth-cta-link" href="#">BOOTHでテンプレートを見る</a></p>
        <p class="note booth-cta-pending">※ 出品URL確定後、上のブロックの data-booth-url にBOOTHの商品URLを設定してください。</p>
      </div>
    `);
    const { document } = window;
    const block = document.getElementById('booth-cta');
    const link = document.getElementById('booth-cta-link');
    const pending = document.querySelector('.booth-cta-pending');

    assert.equal(link.href, boothUrl);
    assert.equal(link.target, '_blank');
    assert.equal(link.rel, 'noopener noreferrer');
    assert.equal(link.classList.contains('is-pending'), false);
    assert.equal(block.classList.contains('is-pending'), false);
    assert.equal(block.hidden, false);
    assert.equal(pending.hidden, true);
  });

  it('tedori 構造で data-booth-url が空のとき is-pending を付け pending を表示する', () => {
    const window = initBoothInDom(`
      <div class="booth-cta" id="booth-cta" data-booth-url="">
        <p><a class="btn booth-cta-link" id="booth-cta-link" href="#">BOOTHでテンプレートを見る</a></p>
        <p class="note booth-cta-pending">※ 出品URL確定後、上のブロックの data-booth-url にBOOTHの商品URLを設定してください。</p>
      </div>
    `);
    const { document } = window;
    const block = document.getElementById('booth-cta');
    const link = document.getElementById('booth-cta-link');
    const pending = document.querySelector('.booth-cta-pending');

    assert.equal(link.getAttribute('href'), '#');
    assert.equal(link.classList.contains('is-pending'), true);
    assert.equal(block.classList.contains('is-pending'), true);
    assert.equal(pending.hidden, false);

    const event = new window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    link.dispatchEvent(event);
    assert.equal(event.defaultPrevented, true);
  });

  it('about 構造で data-booth-url が空のときリンクを無効化する', () => {
    const window = initBoothInDom(
      '<a class="booth-cta-link" href="#" data-booth-url="">BOOTHで有料テンプレートを見る</a>',
    );
    const link = window.document.querySelector('.booth-cta-link');

    assert.equal(link.getAttribute('href'), '#');
    assert.equal(link.classList.contains('is-pending'), true);

    const event = new window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    link.dispatchEvent(event);
    assert.equal(event.defaultPrevented, true);
  });

  it('about 構造で data-booth-url が設定済みのとき href をその URL にする', () => {
    const boothUrl = 'https://example.booth.pm/items/123456';
    const window = initBoothInDom(
      `<a class="booth-cta-link" href="#" data-booth-url="${boothUrl}">BOOTHで有料テンプレートを見る</a>`,
    );
    const link = window.document.querySelector('.booth-cta-link');

    assert.equal(link.href, boothUrl);
    assert.equal(link.target, '_blank');
    assert.equal(link.rel, 'noopener noreferrer');
    assert.equal(link.classList.contains('is-pending'), false);

    const event = new window.MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    });
    link.dispatchEvent(event);
    assert.equal(event.defaultPrevented, false);
  });

  it('index 構造で URL 設定時に隣接する footer-booth-pending を hidden にする', () => {
    const boothUrl = 'https://example.booth.pm/items/123456';
    const window = initBoothInDom(`
      <a class="footer-booth-link" href="#" data-booth-url="${boothUrl}">有料テンプレート（BOOTH）</a>
      <span class="footer-booth-pending">準備中</span>
    `);
    const { document } = window;
    const link = document.querySelector('.footer-booth-link');
    const pending = document.querySelector('.footer-booth-pending');

    assert.equal(link.href, boothUrl);
    assert.equal(pending.hidden, true);
  });

  it('about 構造で URL 設定時に隣接する footer-booth-pending を hidden にする', () => {
    const boothUrl = 'https://example.booth.pm/items/123456';
    const window = initBoothInDom(`
      <a class="booth-cta-link" href="#" data-booth-url="${boothUrl}">BOOTHで有料テンプレートを見る</a>
      <span class="footer-booth-pending">（出品準備中）</span>
    `);
    const { document } = window;
    const pending = document.querySelector('.footer-booth-pending');

    assert.equal(pending.hidden, true);
  });
});
