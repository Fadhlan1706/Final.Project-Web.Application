// theme.js — Dark/Light mode, self-contained
(function () {
  const saved = localStorage.getItem('ss-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
})();

function initTheme() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  function updateIcon() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.innerHTML = `<i class="icon icon-sm" data-icon="${isDark ? 'sun' : 'moon'}"></i>`;
    if (typeof hydrateIcons === 'function') hydrateIcons(btn);
  }

  updateIcon();
  btn.addEventListener('click', () => {
    const cur  = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('ss-theme', next);
    updateIcon();
  });
}
