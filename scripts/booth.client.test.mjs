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
});
