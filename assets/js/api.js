// Sesuaikan port dengan yang kamu gunakan (misal: 8000 atau 8080)
const BASE_URL = "http://localhost:8000";

/**
 * Fungsi utama (wrapper) untuk melakukan HTTP Request ke Backend
 */
async function fetchAPI(endpoint, method = "GET", data = null) {
  // Pengaturan default header
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Backend menggunakan sistem session (cookies), maka dari itu `credentials: "include"` wajib
  const config = {
    method: method,
    headers: headers,
    credentials: "include",
  };

  // Jika ada data payload (untuk POST/PUT), ubah ke string JSON
  if (data && (method === "POST" || method === "PUT")) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    const result = await response.json(); // Backend menggunakan \App\Helpers\Response::success

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes("/api/auth/login")) {
         localStorage.removeItem("access_token");
         localStorage.removeItem("user_data");
         window.location.replace("/pages/auth/login.html");
      }
      throw new Error(result.message || "Terjadi kesalahan pada server");
    }

    return result; // Mengembalikan data JSON dari backend
  } catch (error) {
    console.error(`[API Error] ${method} ${endpoint}:`, error);
    throw error; // Melempar error agar bisa ditangkap oleh file JS lain
  }
}

/**
 * Kumpulan Endpoint API yang siap dipanggil oleh file JS lain
 */
const API = {
  // ================== AUTH ==================
  Auth: {
    register: (data) => fetchAPI("/api/auth/register", "POST", data),
    login: (data) => fetchAPI("/api/auth/login", "POST", data),
    adminLogin: (data) => fetchAPI("/api/auth/admin-login", "POST", data),
    verifyEmail: (data) => fetchAPI("/api/auth/verify-email", "POST", data),
    logout: () => fetchAPI("/api/auth/logout", "POST"),
    getMe: () => fetchAPI("/api/auth/me", "GET"),
    changePassword: (data) => fetchAPI("/api/auth/password", "PUT", data),
    updateProfile: (data) => fetchAPI("/api/profile", "PUT", data),
  },

  // ================== EXPLORE / USERS ==================
  Explore: {
    // params: string query untuk filter (contoh: 'page=1&search=jhon')
    getTalents: (queryString = "") =>
      fetchAPI(`/api/explore?${queryString}`, "GET"),
    getUserProfile: (id) => fetchAPI(`/api/users/${id}`, "GET"),
    getUserStats: (id) => fetchAPI(`/api/users/${id}/stats`, "GET"),
  },

  // ================== CATEGORIES ==================
  Categories: {
    getAll: () => fetchAPI("/api/categories", "GET"),
    create: (data) => fetchAPI("/api/admin/categories", "POST", data),
    update: (id, data) => fetchAPI(`/api/admin/categories/${id}`, "PUT", data),
    delete: (id) => fetchAPI(`/api/admin/categories/${id}`, "DELETE"),
  },

  // ================== SKILLS ==================
  Skills: {
    getAll: () => fetchAPI("/api/skills", "GET"),
    getMySkills: () => fetchAPI("/api/skills/my", "GET"),
    getMatches: () => fetchAPI("/api/skills/matches", "GET"),
    getStats: () => fetchAPI("/api/skills/stats", "GET"),
    getById: (id) => fetchAPI(`/api/skills/${id}`, "GET"),
    create: (data) => fetchAPI("/api/skills", "POST", data),
    update: (id, data) => fetchAPI(`/api/skills/${id}`, "PUT", data),
    delete: (id) => fetchAPI(`/api/skills/${id}`, "DELETE"),
  },

  // ================== COLLABORATIONS ==================
  Collaborations: {
    getAll: () => fetchAPI("/api/collaborations", "GET"),
    getById: (id) => fetchAPI(`/api/collaborations/${id}`, "GET"),
    create: (data) => fetchAPI("/api/collaborations", "POST", data),
    updateStatus: (id, data) =>
      fetchAPI(`/api/collaborations/${id}/status`, "PUT", data),
  },

  // ================== REVIEWS ==================
  Reviews: {
    create: (data) => fetchAPI("/api/reviews", "POST", data),
    getTop: () => fetchAPI("/api/reviews/top", "GET"),
    getForUser: (id) => fetchAPI(`/api/users/${id}/reviews`, "GET"),
  },

  // ================== REPORTS ==================
  Reports: {
    create: (data) => fetchAPI("/api/reports", "POST", data),
  },

  // ================== ADMIN ==================
  Admin: {
    getReportsOverview: () => fetchAPI("/api/admin/reports", "GET"),
    getUsers: (page = 1, search = "") => fetchAPI(`/api/admin/users?page=${page}&search=${encodeURIComponent(search)}`, "GET"),
    getUser: (id) => fetchAPI(`/api/admin/users/${id}`, "GET"),
    suspendUser: (id) => fetchAPI(`/api/admin/users/${id}/suspend`, "PUT"),
    restoreUser: (id) => fetchAPI(`/api/admin/users/${id}/restore`, "PUT"),
    deleteUser: (id) => fetchAPI(`/api/admin/users/${id}`, "DELETE"),
    listCategories: () => fetchAPI("/api/admin/categories", "GET"),
    createCategory: (data) => fetchAPI("/api/admin/categories", "POST", data),
    updateCategory: (id, data) => fetchAPI(`/api/admin/categories/${id}`, "PUT", data),
    deleteCategory: (id) => fetchAPI(`/api/admin/categories/${id}`, "DELETE"),
    deleteSkill: (id) => fetchAPI(`/api/admin/skills/${id}`, "DELETE"),
    listCollaborations: () => fetchAPI("/api/admin/collaborations", "GET"),
    getReportsList: (page = 1) => fetchAPI(`/api/admin/reports-list?page=${page}`, "GET"),
    updateReportStatus: (id, status) => fetchAPI(`/api/admin/reports/${id}`, "PUT", { status })
  },
};
