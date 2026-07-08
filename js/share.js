function readShareParams(keys) {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  keys.forEach((key) => {
    result[key] = params.get(key);
  });
  return result;
}

// file:// では history.replaceState が SecurityError になり得るため失敗時は無視する。
function updateShareUrl(entries) {
  const params = new URLSearchParams();
  entries.forEach(([key, value]) => {
    if (value !== '' && value !== false && value !== null && value !== undefined) {
      params.set(key, value);
    }
  });
  const qs = params.toString();
  try {
    history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''));
  } catch (e) {
    /* ignore (e.g. file://) */
  }
}

function copyShareLink(btnId) {
  const url = window.location.href;
  const done = () => showCopyDone(btnId);
  // clipboard 不可時は textarea フォールバック
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(done).catch(() => fallbackCopy(url, done));
  } else {
    fallbackCopy(url, done);
  }
}

function fallbackCopy(text, onDone) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
    onDone();
  } catch (e) {
    alert('コピーに失敗しました');
  }
  document.body.removeChild(ta);
}

function showCopyDone(btnId) {
  const btn = document.getElementById(btnId);
  const orig = btn.textContent;
  btn.textContent = 'コピーしました';
  setTimeout(() => { btn.textContent = orig; }, 2000);
}

function showShareActions(actionsId, hintId) {
  document.getElementById(actionsId).style.display = 'flex';
  document.getElementById(hintId).style.display = 'block';
}
