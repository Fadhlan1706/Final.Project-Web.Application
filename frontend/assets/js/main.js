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

  // Jika role tidak sesuai (misal: user biasa mencoba masuk ke /admin/)
  // Pastikan backend mengembalikan struktur data user yang memiliki properti 'role'
  if (role && session.role !== role) {
    const dest =
      session.role === "admin"
        ? "/pages/admin/dashboard.html"
        : "/pages/user/dashboard.html"; // Sesuaikan dengan folder user kamu
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

  // Contoh: Mencari elemen dengan ID tertentu dan mengganti isinya dengan data asli
  const userNameElement = document.getElementById("user-profile-name");
  const userRoleElement = document.getElementById("user-profile-role");

  if (userNameElement) userNameElement.innerText = session.name; // Sesuaikan dengan key dari backend (misal session.nama_lengkap)
  if (userRoleElement) userRoleElement.innerText = session.role;
}

// ... KODE DI BAWAH INI TETAP SAMA (TIDAK PERLU DIUBAH) ...

// ── SIDEBAR ──
function initSidebar() {
  /* ... */
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
  /* ... */
}

// ── TOAST ──
function showToast(title, msg = "", type = "default", duration = 3500) {
  /* ... */
}

// ── MODAL ──
function openModal(id) {
  /* ... */
}
function closeModal(id) {
  /* ... */
}
function initModals() {
  /* ... */
}

// ── MODAL TABS ──
function initModalTabs() {
  /* ... */
}

// ── STAR RATING ──
function initStarRating(containerId, onChange) {
  /* ... */
}
function renderStars(score, max = 5) {
  /* ... */
}
function skillLevelBadge(level) {
  /* ... */
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
