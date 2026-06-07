// main.js — Sidebar toggle, Dropdown profil, shared utilities

// ── SIDEBAR ──
function initSidebar() {
  const shell   = document.getElementById('app-shell');
  const toggle  = document.getElementById('sidebar-toggle');
  if (!shell || !toggle) return;

  const isMobile = () => window.innerWidth <= 768;
  const saved    = localStorage.getItem('ss-sidebar');
  if (saved === 'collapsed' && !isMobile()) shell.classList.add('sidebar-collapsed');

  toggle.addEventListener('click', () => {
    if (isMobile()) {
      shell.classList.toggle('mobile-open');
    } else {
      shell.classList.toggle('sidebar-collapsed');
      localStorage.setItem('ss-sidebar', shell.classList.contains('sidebar-collapsed') ? 'collapsed' : 'expanded');
    }
  });

  // Close sidebar on overlay click (mobile)
  document.addEventListener('click', (e) => {
    if (isMobile() && shell.classList.contains('mobile-open')) {
      const sidebar = document.querySelector('.sidebar');
      if (sidebar && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
        shell.classList.remove('mobile-open');
      }
    }
  });
}

// ── DROPDOWN PROFILE ──
function initProfileDropdown() {
  const btn  = document.getElementById('profile-btn');
  const menu = document.getElementById('profile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('open');
  });
  document.addEventListener('click', () => menu.classList.remove('open'));
}

// ── ACTIVE NAV LINK ──
function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === path || 
      (path.includes(link.getAttribute('href')) && link.getAttribute('href') !== '#'));
  });
}

// ── TOAST NOTIFICATION ──
function showToast(title, msg = '', type = 'default', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: icon('check-circle', 18), error: icon('x-circle', 18), warning: icon('circle-alert', 18), default: icon('info', 18) };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.default}</span>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${msg ? `<div class="toast-msg">${msg}</div>` : ''}
    </div>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── MODAL UTILITIES ──
function openModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}
function closeModal(id) {
  const overlay = document.getElementById(id);
  if (overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}
function initModals() {
  // Close on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
  // Close buttons
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });
}

// ── MODAL TABS ──
function initModalTabs() {
  document.querySelectorAll('.modal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const panel = tab.dataset.tab;
      const container = tab.closest('.modal');
      container.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
      container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = container.querySelector(`#tab-${panel}`);
      if (target) target.classList.add('active');
    });
  });
}

// ── STAR RATING INPUT ──
function initStarRating(containerId, onChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  let value = 0;
  const stars = container.querySelectorAll('.star');
  stars.forEach((star, i) => {
    star.addEventListener('mouseenter', () => {
      stars.forEach((s, j) => s.classList.toggle('active', j <= i));
    });
    star.addEventListener('mouseleave', () => {
      stars.forEach((s, j) => s.classList.toggle('active', j < value));
    });
    star.addEventListener('click', () => {
      value = i + 1;
      stars.forEach((s, j) => s.classList.toggle('active', j < value));
      if (onChange) onChange(value);
    });
  });
}

// ── RENDER STAR DISPLAY ──
function renderStars(score, maxStars = 5) {
  let html = '<div class="stars-display">';
  for (let i = 1; i <= maxStars; i++) {
    html += `<span class="star-s ${i <= Math.round(score) ? '' : 'empty'}">★</span>`;
  }
  html += '</div>';
  return html;
}

// ── SKILL LEVEL BADGE ──
function skillLevelBadge(level) {
  const map = { 'Mahir': 'green', 'Menengah': 'blue', 'Pemula': 'amber' };
  return `<span class="badge badge-${map[level] || 'gray'}" style="font-size:0.6rem;padding:1px 5px;">${level}</span>`;
}

// ── AUTH GUARD ──
// Redirect to login if user is not authenticated (no JWT)
function checkAuth() {
  const path = window.location.pathname;
  const isProtected = path.includes('/user/') || path.includes('/admin/');
  const isAuthPage  = path.includes('/auth/');

  if (isProtected && typeof api !== 'undefined' && !api.isAuthenticated()) {
    window.location.href = path.includes('/admin/')
      ? '../auth/login.html'
      : '../auth/login.html';
    return false;
  }

  return true;
}

// ── LOGOUT ──
function logout() {
  if (typeof api !== 'undefined') {
    api.removeToken();
  }
  window.location.href = window.location.pathname.includes('/admin/')
    ? '../auth/login.html'
    : '../auth/login.html';
}

// ── INIT ALL SHARED ──
document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  // Check auth before initializing protected page UI
  if (!checkAuth()) return;

  initSidebar();
  initProfileDropdown();
  setActiveNav();
  initModals();
  initModalTabs();
});
