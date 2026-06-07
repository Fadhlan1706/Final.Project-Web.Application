/**
 * api.js
 * Core API service layer untuk komunikasi dengan Backend PHP (REST API)
 */

const API_BASE_URL = 'http://localhost/SkillSwap-old/api'; // Sesuaikan jika backend dipindah
const MOCK_MODE = true; // SET TO FALSE KETIKA BACKEND SUDAH SIAP

const api = {
  // --- Token Management ---
  getToken() {
    return localStorage.getItem('skillswap_jwt');
  },
  
  setToken(token) {
    localStorage.setItem('skillswap_jwt', token);
  },
  
  removeToken() {
    localStorage.removeItem('skillswap_jwt');
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  // --- Core Fetch Wrapper ---
  async fetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Setup Headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {})
    };

    // Auto attach JWT token
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      // --- MOCK INTERCEPTOR ---
      if (MOCK_MODE) {
        console.log(`[Mock API] Intercepted request to ${endpoint}`);
        return await this.mockResponse(endpoint, options);
      }
      // ------------------------

      const response = await fetch(url, {
        ...options,
        headers
      });

      // Handle 401 Unauthorized (Token expired/invalid)
      if (response.status === 401) {
        this.removeToken();
        // Redirect to login only if not already on auth pages
        if (!window.location.pathname.includes('/auth/')) {
          window.location.href = '/SkillSwap-old/pages/auth/login.html';
        }
        throw new Error('Sesi telah berakhir. Silakan login kembali.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Terjadi kesalahan pada server');
      }

      return data;
    } catch (error) {
      console.error(`[API Error] ${endpoint}:`, error);
      // Re-throw so caller can handle it (e.g. show toast)
      throw error;
    }
  },

  // --- Helper Methods (Frontend -> Backend Mappings) ---

  // Auth
  async login(email, password) {
    return this.fetch('/auth/login.php', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async register(userData) {
    return this.fetch('/auth/register.php', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  // Users & Explore
  async getUsers(filters = {}) {
    // Construct query string
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.level) params.append('level', filters.level);
    if (filters.major) params.append('major', filters.major);
    if (filters.search) params.append('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.fetch(`/users.php${query}`, { method: 'GET' });
  },

  async getUserProfile() {
    return this.fetch('/profile.php', { method: 'GET' });
  },

  // Collaborations
  async getCollaborations() {
    return this.fetch('/collaborations.php', { method: 'GET' });
  },

  async requestCollaboration(data) {
    return this.fetch('/collaborations.php', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateCollabStatus(id, newStatus) {
    return this.fetch(`/collaborations.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
  },

  async submitReview(collabId, reviewData) {
    return this.fetch(`/reviews.php`, {
      method: 'POST',
      body: JSON.stringify({ collab_id: collabId, ...reviewData })
    });
  },

  // --- MOCK BACKEND SIMULATION ---
  // Menyimulasikan delay network dan response dari mock-data.js
  async mockResponse(endpoint, options) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (endpoint.includes('/login')) {
            const body = JSON.parse(options.body);
            if (body.email && body.password) {
              resolve({ token: 'mock-jwt-token-12345', user: CURRENT_USER });
            } else {
              reject(new Error('Email dan password wajib diisi'));
            }
          } 
          else if (endpoint.includes('/users')) {
            resolve(MOCK_USERS);
          }
          else if (endpoint.includes('/collaborations')) {
            resolve(MOCK_COLLABORATIONS);
          }
          else {
            resolve({ success: true, message: 'Mock response OK' });
          }
        } catch (e) {
          reject(new Error('Mock API Error'));
        }
      }, 800); // Simulasi delay 800ms
    });
  }
};

window.api = api;
