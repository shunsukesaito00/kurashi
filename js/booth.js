/** BOOTH 導線: data-booth-url 属性からリンクを有効化する */
function initBoothLinks() {
  document.querySelectorAll('[data-booth-url]').forEach((block) => {
    const url = (block.dataset.boothUrl || '').trim();
    const link = block.matches('a')
      ? block
      : block.querySelector('a.booth-cta-link, a.footer-booth-link');
    if (!link) return;

    const pending = block.querySelector('.booth-cta-pending, .footer-booth-pending');
    if (url) {
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.classList.remove('is-pending');
      if (pending) pending.hidden = true;
      if (!block.matches('a')) {
        block.classList.remove('is-pending');
        block.hidden = false;
      }
    } else {
      link.addEventListener('click', (e) => e.preventDefault());
      link.classList.add('is-pending');
      if (!block.matches('a')) block.classList.add('is-pending');
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBoothLinks);
} else {
  initBoothLinks();
}
