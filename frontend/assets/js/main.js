// main.js — Sidebar, Dropdown, Toast, Modal, Auth Guard

// ── AUTH GUARD ──
// Cek apakah user sudah login. Dalam implementasi PHP nanti,
// cukup ganti fungsi ini dengan cek session dari server.
function getSession() {
  const raw = sessionStorage.getItem('ss_session');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function requireAuth(role) {
  const session = getSession();
  if (!session) {
    window.location.replace('/pages/auth/login.html');
    return false;
  }
  if (role && session.role !== role) {
    // Role mismatch: user coba akses admin atau sebaliknya
    const dest = session.role === 'admin'
      ? '/pages/admin/dashboard.html'
      : '/pages/user/dashboard.html';
    window.location.replace(dest);
    return false;
  }
  return true;
}

// Mock login helper — akan diganti PHP session
function mockLogin(role) {
  const users = {
    user: { id: 99, name: 'Reza Anugrah', initials: 'RA', role: 'user' },
    admin: { id: 1, name: 'Admin', initials: 'AD', role: 'admin' },
  };
  sessionStorage.setItem('ss_session', JSON.stringify(users[role] || users.user));
}

function mockLogout() {
  sessionStorage.removeItem('ss_session');
  window.location.replace('/pages/auth/login.html');
}

// ── SIDEBAR ──
function initSidebar() {
  const shell  = document.getElementById('app-shell');
  const toggle = document.getElementById('sidebar-toggle');
  if (!shell || !toggle) return;

  const isMobile = () => window.innerWidth <= 768;
  if (localStorage.getItem('ss-sidebar') === 'collapsed' && !isMobile()) {
    shell.classList.add('sidebar-collapsed');
  }

  toggle.addEventListener('click', () => {
    if (isMobile()) {
      shell.classList.toggle('mobile-open');
    } else {
      shell.classList.toggle('sidebar-collapsed');
      localStorage.setItem('ss-sidebar',
        shell.classList.contains('sidebar-collapsed') ? 'collapsed' : 'expanded');
    }
  });

  document.addEventListener('click', e => {
    if (isMobile() && shell.classList.contains('mobile-open')) {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
        shell.classList.remove('mobile-open');
      }
    }
  });
}

// ── PROFILE DROPDOWN ──
function initProfileDropdown() {
  const btn  = document.getElementById('profile-btn');
  const menu = document.getElementById('profile-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', e => { e.stopPropagation(); menu.classList.toggle('open'); });
  document.addEventListener('click', () => menu.classList.remove('open'));
}

// ── ACTIVE NAV ──
function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    link.classList.toggle('active',
      href && (href === path || (path.endsWith(href) && href !== '#')));
  });
}

// ── TOAST ──
function showToast(title, msg = '', type = 'default', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const iconMap = { success:'check-circle', error:'x', warning:'alert-triangle', default:'info' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="icon icon-sm toast-icon" data-icon="${iconMap[type]||'info'}"></i>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
    </div>`;
  container.appendChild(toast);
  if (typeof hydrateIcons === 'function') hydrateIcons(toast);
  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── MODAL ──
function openModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('open'); document.body.style.overflow = ''; }
}
function initModals() {
  document.querySelectorAll('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', e => { if (e.target === ov) closeModal(ov.id); });
  });
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });
}

// ── MODAL TABS ──
function initModalTabs() {
  document.querySelectorAll('.modal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const container = tab.closest('.modal');
      container.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
      container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = container.querySelector(`#tab-${tab.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });
}

// ── STAR RATING ──
function initStarRating(containerId, onChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  let value = 0;
  const stars = container.querySelectorAll('.star');
  stars.forEach((star, i) => {
    star.addEventListener('mouseenter', () =>
      stars.forEach((s, j) => s.classList.toggle('active', j <= i)));
    star.addEventListener('mouseleave', () =>
      stars.forEach((s, j) => s.classList.toggle('active', j < value)));
    star.addEventListener('click', () => {
      value = i + 1;
      stars.forEach((s, j) => s.classList.toggle('active', j < value));
      if (onChange) onChange(value);
    });
  });
}

function renderStars(score, max = 5) {
  let html = '<div class="stars-display">';
  for (let i = 1; i <= max; i++)
    html += `<span class="star-s ${i <= Math.round(score) ? '' : 'empty'}">★</span>`;
  return html + '</div>';
}

function skillLevelBadge(level) {
  const map = { Mahir: 'green', Menengah: 'blue', Pemula: 'amber' };
  return `<span class="badge badge-${map[level]||'gray'}" style="font-size:0.6rem;padding:1px 5px">${level}</span>`;
}

// ── INIT ALL ──
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSidebar();
  initProfileDropdown();
  setActiveNav();
  initModals();
  initModalTabs();
});
