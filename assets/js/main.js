// main.js — Sidebar, Dropdown, Toast, Modal, Auth Guard

// ── AUTH GUARD (TERINTEGRASI DENGAN API) ──

// Mengambil session dari localStorage (di-set saat proses Login berhasil)
function getSession() {
  // Asumsi: Saat login, token dan data user disimpan di localStorage
  const token = localStorage.getItem("access_token");
  const userData = localStorage.getItem("user_data");

  if (!token || !userData) return null;

  try {
    return JSON.parse(userData);
  } catch {
    return null;
  }
}

// Menjaga rute halaman agar tidak diakses sembarang orang
function requireAuth(role) {
  const session = getSession();

  // Jika tidak ada session nyata, lempar ke halaman login
  if (!session) {
    window.location.replace("/pages/auth/login.html");
    return false;
  }

  // Fallback untuk penentuan role jika dari backend tidak ada
  const userRole = session.role || (session.email && session.email.startsWith("admin") ? "admin" : "user");

  // Jika role tidak sesuai (misal: user biasa mencoba masuk ke /admin/)
  if (role && userRole !== role) {
    const dest =
      userRole === "admin"
        ? "/pages/admin/dashboard.html"
        : "/pages/user/dashboard.html";
    window.location.replace(dest);
    return false;
  }

  return true;
}

// Menggantikan fungsi mockLogout
async function handleLogout() {
  try {
    // 1. Tembak API Logout ke backend agar token di-blacklist/dihapus di server (jika didukung)
    // Cek apakah file api.js sudah diload dan object API tersedia
    if (typeof API !== "undefined" && API.Auth) {
      await API.Auth.logout();
    }
  } catch (error) {
    console.error(
      "Gagal memanggil API logout, namun sesi lokal tetap akan dibersihkan.",
      error,
    );
  } finally {
    // 2. Bersihkan jejak autentikasi di browser
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_data");

    // 3. Arahkan kembali ke halaman login
    window.location.replace("/pages/auth/login.html");
  }
}

// (OPSIONAL) Fungsi untuk merender nama/inisial user asli ke UI Navbar/Sidebar
function renderUserProfile() {
  const session = getSession();
  if (!session) return;

  const nameElements = document.querySelectorAll(".profile-name");
  const roleElements = document.querySelectorAll(".profile-role");
  const avatarElements = document.querySelectorAll(".profile-avatar");

  nameElements.forEach(el => el.innerText = session.name || "User");
  
  // Ambil role fallback atau gunakan session.role jika ada
  const userRole = session.role || (session.email && session.email.startsWith("admin") ? "admin" : "user");
  const roleDisplay = userRole === "admin" ? "Admin" : (session.major || "Mahasiswa");
  
  roleElements.forEach(el => el.innerText = roleDisplay);
  
  if (session.name) {
      const initials = session.name.substring(0,2).toUpperCase();
      avatarElements.forEach(el => {
          if (session.profilePicture) {
              el.innerText = '';
              el.style.backgroundImage = `url(http://localhost:8000${session.profilePicture})`;
              el.style.backgroundSize = 'cover';
              el.style.backgroundPosition = 'center';
              el.style.color = 'transparent';
          } else {
              el.innerText = initials;
          }
      });
  }
}

// ... KODE DI BAWAH INI TETAP SAMA (TIDAK PERLU DIUBAH) ...

// ── SIDEBAR ──
function initSidebar() {
  const toggle = document.getElementById("sidebar-toggle");
  const sidebar = document.querySelector(".sidebar");
  if (toggle && sidebar) {
    toggle.addEventListener("click", () => sidebar.classList.toggle("open"));
  }
}

// ── PROFILE DROPDOWN ──
function initProfileDropdown() {
  const btn = document.getElementById("profile-btn");
  const menu = document.getElementById("profile-menu");
  const logoutBtn = document.getElementById("logout-btn"); // Asumsi ada tombol logout

  if (!btn || !menu) return;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    menu.classList.toggle("open");
  });
  document.addEventListener("click", () => menu.classList.remove("open"));

  // Pasang event listener untuk logout asli
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleLogout();
    });
  }
}

// ── ACTIVE NAV ──
function setActiveNav() {
  const links = document.querySelectorAll(".nav-link");
  const path = window.location.pathname;
  links.forEach(l => {
    if (path.includes(l.getAttribute('href'))) {
      l.classList.add('active');
    } else {
      l.classList.remove('active');
    }
  });
}

// ── TOAST ──
function showToast(title, msg = "", type = "default", duration = 3500) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div style="flex:1">
      <div style="font-weight:700;font-size:0.9rem;margin-bottom:2px">${title}</div>
      <div style="font-size:0.8rem;opacity:0.9;line-height:1.4">${msg}</div>
    </div>
    <button style="background:none;border:none;color:inherit;opacity:0.7;cursor:pointer;padding:4px"><i class="icon icon-sm" data-icon="x"></i></button>
  `;
  container.appendChild(toast);
  if(typeof hydrateIcons === 'function') hydrateIcons(toast);
  
  const closeBtn = toast.querySelector('button');
  closeBtn.onclick = () => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  };
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── MODAL ──
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('active');
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('active');
}
function initModals() {
  document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', (e) => {
      if(e.target === el) el.classList.remove('active');
    });
  });
  document.querySelectorAll('.modal-close, [data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close-modal');
      if (modalId) closeModal(modalId);
      else {
        const m = btn.closest('.modal-overlay');
        if (m) m.classList.remove('active');
      }
    });
  });
}

// ── MODAL TABS ──
function initModalTabs() {
  document.querySelectorAll('.modal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const container = tab.closest('.modal');
      if(!container) return;
      container.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
      container.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');
      if (target) {
        const p = document.getElementById(target);
        if (p) p.classList.add('active');
      }
    });
  });
}

// ── STAR RATING ──
function initStarRating(containerId, onChange) {
  const container = document.getElementById(containerId);
  if(!container) return;
  const stars = container.querySelectorAll('.star-rating-btn');
  let currentVal = 0;
  stars.forEach(s => {
    s.addEventListener('mouseover', () => {
      const val = parseInt(s.dataset.val);
      stars.forEach(st => st.classList.toggle('active', parseInt(st.dataset.val) <= val));
    });
    s.addEventListener('mouseout', () => {
      stars.forEach(st => st.classList.toggle('active', parseInt(st.dataset.val) <= currentVal));
    });
    s.addEventListener('click', () => {
      currentVal = parseInt(s.dataset.val);
      if(typeof onChange === 'function') onChange(currentVal);
    });
  });
}
function renderStars(score, max = 5) {
  let html = '';
  for(let i=1; i<=max; i++) {
    if(i<=score) html += '<i class="icon icon-sm c-amber" data-icon="star" style="fill:var(--amber)"></i>';
    else html += '<i class="icon icon-sm c-muted" data-icon="star"></i>';
  }
  return html;
}
function skillLevelBadge(level) {
  const map = {
    'Beginner': 'badge-gray',
    'Intermediate': 'badge-primary',
    'Advanced': 'badge-purple',
    'Expert': 'badge-amber'
  };
  return `<span class="badge ${map[level]||'badge-gray'}">${level}</span>`;
}

// ── INIT ALL ──
document.addEventListener("DOMContentLoaded", () => {
  initTheme(); // Asumsi fungsi ini ada di theme.js
  initSidebar();
  initProfileDropdown();
  setActiveNav();
  initModals();
  initModalTabs();

  // Render profil jika user sudah login
  if (getSession()) {
    renderUserProfile();
  }
});
