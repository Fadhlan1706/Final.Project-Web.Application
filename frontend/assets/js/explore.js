// explore.js — Pencarian, filter, Profile Modal, Request Modal (API Integration)

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('explore-grid')) return;

  let filteredUsers = [];
  let selectedUser  = null;

  // ── FETCH DATA ──
  async function fetchUsers(filters = {}) {
    const grid = document.getElementById('explore-grid');
    const count = document.getElementById('result-count');
    
    // Loading State
    grid.innerHTML = `
      <div style="grid-column:1/-1; padding:40px; text-align:center; color:var(--text-muted)">
        ${icon('loader', 32)}
        <div style="margin-top:12px">Memuat data partner...</div>
      </div>
    `;
    if (count) count.textContent = 'Memuat...';

    try {
      const data = await api.getUsers(filters);
      filteredUsers = data;
      renderGrid(filteredUsers);
    } catch (err) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon" style="color:var(--red)">${icon('alert-circle', 32)}</div>
          <h3>Gagal Memuat Data</h3>
          <p>${err.message}</p>
        </div>`;
      if (count) count.textContent = 'Gagal memuat';
    }
  }

  // ── RENDER GRID ──
  function renderGrid(users) {
    const grid = document.getElementById('explore-grid');
    const count = document.getElementById('result-count');
    if (count) count.textContent = `${users.length} partner ditemukan`;

    if (users.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">${icon('search', 32)}</div>
          <h3>Tidak ada hasil</h3>
          <p>Coba kata kunci atau filter yang berbeda</p>
        </div>`;
      return;
    }

    grid.innerHTML = users.map((u, i) => `
      <div class="user-card fade-in" style="animation-delay:${i * 60}ms" data-id="${u.id}" onclick="openProfileModal(${u.id})">
        <div class="user-card-header">
          <div class="user-card-avatar" style="background: linear-gradient(135deg, ${u.avatarColor}, ${u.avatarColor}99)">
            ${u.initials}
          </div>
          <div style="flex:1">
            <div class="user-card-name">${u.name}</div>
            <div class="user-card-major">${u.major}</div>
          </div>
          <div class="user-card-score">
            <div class="score-val">★ ${u.score}</div>
            <div class="score-label">${u.reviewCount} ulasan</div>
          </div>
        </div>
        <div class="user-card-skills">
          ${u.skills.slice(0, 3).map(s => `
            <span class="skill-tag">${s.name} ${skillLevelBadge(s.level)}</span>
          `).join('')}
          ${u.skills.length > 3 ? `<span class="skill-tag">+${u.skills.length - 3}</span>` : ''}
        </div>
        <div class="user-card-bio">${u.bio}</div>
        <div class="user-card-footer">
          <div class="user-card-stats">
            <span class="user-card-stat"><strong>${u.collaborationsCount}</strong> kolaborasi</span>
          </div>
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); openRequestModal(${u.id})">
            ${icon('handshake', 14)} Minta Kolaborasi
          </button>
        </div>
      </div>
    `).join('');
  }

  // ── SEARCH & FILTER ──
  function applyFilters() {
    const search  = document.getElementById('search-input')?.value || '';
    const cat     = document.getElementById('filter-category')?.value || '';
    const level   = document.getElementById('filter-level')?.value || '';
    const major   = document.getElementById('filter-major')?.value || '';

    // If API supports backend filtering, pass params. 
    // Since mock mode might not fully support backend sorting perfectly yet, we rely on fetch wrapper handling it.
    fetchUsers({ search, category: cat, level, major });
  }

  // Debounce search input
  let searchTimeout;
  document.getElementById('search-input')?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 500);
  });
  
  document.getElementById('filter-category')?.addEventListener('change', applyFilters);
  document.getElementById('filter-level')?.addEventListener('change', applyFilters);
  document.getElementById('filter-major')?.addEventListener('change', applyFilters);
  
  document.getElementById('btn-reset-filter')?.addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-level').value = '';
    document.getElementById('filter-major').value = '';
    applyFilters();
  });

  // ── OPEN PROFILE MODAL ──
  window.openProfileModal = function(userId) {
    selectedUser = filteredUsers.find(u => u.id === userId);
    if (!selectedUser) return;

    // Populate header
    document.getElementById('pm-avatar').textContent   = selectedUser.initials;
    document.getElementById('pm-avatar').style.background = `linear-gradient(135deg, ${selectedUser.avatarColor}, ${selectedUser.avatarColor}99)`;
    document.getElementById('pm-name').textContent     = selectedUser.name;
    document.getElementById('pm-major').textContent    = `${selectedUser.major} • ${selectedUser.university}`;
    document.getElementById('pm-score').textContent    = selectedUser.score;
    document.getElementById('pm-reviews-count').textContent = selectedUser.reviewCount;
    document.getElementById('pm-collab-count').textContent  = selectedUser.collaborationsCount;

    // Bio tab
    document.getElementById('pm-bio').textContent = selectedUser.bio;
    document.getElementById('pm-skills').innerHTML = selectedUser.skills.map(s => `
      <span class="skill-tag">${s.name} ${skillLevelBadge(s.level)}</span>
    `).join('');
    document.getElementById('pm-learn').innerHTML = selectedUser.wantToLearn.map(w => `
      <span class="skill-tag" style="background:var(--bg);border-color:var(--border)">${w}</span>
    `).join('');

    // Reviews tab
    const reviewsEl = document.getElementById('pm-reviews');
    if (selectedUser.reviews.length === 0) {
      reviewsEl.innerHTML = '<div class="empty-state" style="padding:30px 0"><div class="empty-state-icon">' + icon('message-square', 32) + '</div><h3>Belum ada ulasan</h3></div>';
    } else {
      reviewsEl.innerHTML = selectedUser.reviews.map(r => `
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px">
            <div style="font-weight:600">${r.from}</div>
            <div style="color:var(--amber);font-size:0.8rem">★ ${r.score}</div>
          </div>
          <div style="font-size:0.9rem;color:var(--text-secondary)">"${r.text}"</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:8px">${r.date}</div>
        </div>
      `).join('');
    }

    openModal('profile-modal');
  };

  window.switchModalTab = function(tabName) {
    document.querySelectorAll('.tab-pane').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    event.currentTarget.classList.add('active');
  };

  // ── OPEN REQUEST MODAL ──
  window.openRequestModal = function(userId) {
    selectedUser = filteredUsers.find(u => u.id === userId);
    if (!selectedUser) return;
    
    closeModal('profile-modal');

    document.getElementById('req-name').textContent = selectedUser.name;
    document.getElementById('req-avatar').textContent = selectedUser.initials;
    document.getElementById('req-avatar').style.background = `linear-gradient(135deg, ${selectedUser.avatarColor}, ${selectedUser.avatarColor}99)`;

    // Populate skill options
    const skillNeeded = document.getElementById('req-skill-needed');
    skillNeeded.innerHTML = '<option value="">-- Pilih skill yang kamu butuhkan --</option>' +
      selectedUser.skills.map(s => `<option value="${s.name}">${s.name} (${s.level})</option>`).join('');

    openModal('request-modal');
  };

  document.getElementById('pm-request-btn')?.addEventListener('click', () => {
    if (selectedUser) openRequestModal(selectedUser.id);
  });

  // ── SUBMIT REQUEST ──
  document.getElementById('form-request')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const skillNeeded  = document.getElementById('req-skill-needed').value;
    const skillOffered = document.getElementById('req-skill-offered').value;
    const msg          = e.target.querySelector('textarea').value.trim();

    if (!skillNeeded || !skillOffered) {
      showToast('Lengkapi form', 'Pilih skill yang dibutuhkan dan ditawarkan.', 'warning');
      return;
    }

    const btn = e.target.querySelector('[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = icon('loader', 16) + ' Mengirim...';

    try {
      await api.requestCollaboration({
        partner_id: selectedUser.id,
        skill_needed: skillNeeded,
        skill_offered: skillOffered,
        message: msg
      });

      closeModal('request-modal');
      e.target.reset();
      showToast('Permintaan Terkirim!', `Permintaan kolaborasi berhasil dikirim ke ${selectedUser.name}!`, 'success', 4000);
    } catch (err) {
      showToast('Gagal Mengirim Request', err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });

  // Init fetch
  fetchUsers();
});
