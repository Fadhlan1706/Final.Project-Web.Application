// theme.js — Dark/Light mode toggle
(function() {
  const saved = localStorage.getItem('ss-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
})();

function initTheme() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const updateIcon = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.innerHTML = isDark ? '☀️' : '🌙';
    btn.title = isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  };
  updateIcon();
  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('ss-theme', next);
    updateIcon();
  });
}
