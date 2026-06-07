// explore.js — Pencarian, filter, Profile Modal, Request Modal

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('explore-grid')) return;

  let filteredUsers = [...MOCK_USERS];
  let selectedUser  = null;
  let requestRating = 0;

  // ── RENDER GRID ──
  function renderGrid(users) {
    const grid = document.getElementById('explore-grid');
    const count = document.getElementById('result-count');
    if (count) count.textContent = `${users.length} partner ditemukan`;

    if (users.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon">🔍</div>
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
            <i class="icon icon-sm" data-icon="handshake" data-color="primary"></i> Minta Kolaborasi
          </button>
        </div>
      </div>
    `).join('');
  }

  // ── SEARCH & FILTER ──
  function applyFilters() {
    const q       = (document.getElementById('search-input')?.value || '').toLowerCase();
    const cat     = document.getElementById('filter-category')?.value || '';
    const level   = document.getElementById('filter-level')?.value || '';
    const sortBy  = document.getElementById('sort-by')?.value || 'score';

    let result = MOCK_USERS.filter(u => {
      const matchQ = !q || 
        u.name.toLowerCase().includes(q) ||
        u.major.toLowerCase().includes(q) ||
        u.bio.toLowerCase().includes(q) ||
        u.skills.some(s => s.name.toLowerCase().includes(q));
      const matchCat   = !cat   || u.skills.some(s => s.category === cat);
      const matchLevel = !level || u.skills.some(s => s.level === level);
      return matchQ && matchCat && matchLevel;
    });

    if (sortBy === 'score')   result.sort((a, b) => b.score - a.score);
    if (sortBy === 'reviews') result.sort((a, b) => b.reviewCount - a.reviewCount);
    if (sortBy === 'collabs') result.sort((a, b) => b.collaborationsCount - a.collaborationsCount);

    filteredUsers = result;
    renderGrid(filteredUsers);
  }

  document.getElementById('search-input')?.addEventListener('input', applyFilters);
  document.getElementById('filter-category')?.addEventListener('change', applyFilters);
  document.getElementById('filter-level')?.addEventListener('change', applyFilters);
  document.getElementById('sort-by')?.addEventListener('change', applyFilters);
  document.getElementById('btn-reset-filter')?.addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-level').value = '';
    document.getElementById('sort-by').value = 'score';
    applyFilters();
  });

  // ── OPEN PROFILE MODAL ──
  window.openProfileModal = function(userId) {
    selectedUser = MOCK_USERS.find(u => u.id === userId);
    if (!selectedUser) return;

    // Populate header
    document.getElementById('pm-avatar').textContent   = selectedUser.initials;
    document.getElementById('pm-avatar').style.background = `linear-gradient(135deg, ${selectedUser.avatarColor}, ${selectedUser.avatarColor}99)`;
    document.getElementById('pm-name').textContent     = selectedUser.name;
    document.getElementById('pm-major').textContent    = `${selectedUser.major} • ${selectedUser.university}`;
    document.getElementById('pm-score').textContent    = selectedUser.score;
    document.getElementById('pm-review-count').textContent = `(${selectedUser.reviewCount} ulasan)`;
    document.getElementById('pm-stars').innerHTML      = renderStars(selectedUser.score);

    // Bio tab
    document.getElementById('pm-bio').textContent = selectedUser.bio;
    document.getElementById('pm-skills-list').innerHTML = selectedUser.skills.map(s => `
      <div class="skill-tag" style="margin-bottom:6px;">
        ${s.name} ${skillLevelBadge(s.level)}
        <span style="font-size:0.65rem;color:var(--text-muted);margin-left:2px;">${s.category}</span>
      </div>
    `).join('');
    document.getElementById('pm-want-learn').innerHTML = selectedUser.wantToLearn.map(w => `
      <span class="skill-tag">${w}</span>
    `).join('');

    // Reviews tab
    const reviewsEl = document.getElementById('pm-reviews');
    if (selectedUser.reviews.length === 0) {
      reviewsEl.innerHTML = '<div class="empty-state" style="padding:30px 0"><div class="empty-state-icon">💬</div><h3>Belum ada ulasan</h3></div>';
    } else {
      reviewsEl.innerHTML = selectedUser.reviews.map(r => `
        <div class="review-item">
          <div class="avatar" style="background:linear-gradient(135deg,var(--accent),var(--purple))">${r.fromInitials}</div>
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:8px;">
              <strong style="font-size:0.875rem">${r.from}</strong>
              ${renderStars(r.score)}
            </div>
            <div class="review-text">${r.text}</div>
            <div class="review-date">${r.date}</div>
          </div>
        </div>
      `).join('');
    }

    openModal('profile-modal');
    // Reset to first tab
    document.querySelectorAll('#profile-modal .modal-tab').forEach((t,i) => t.classList.toggle('active', i===0));
    document.querySelectorAll('#profile-modal .tab-panel').forEach((p,i) => p.classList.toggle('active', i===0));
  };

  // ── OPEN REQUEST MODAL (dari profile modal atau card) ──
  window.openRequestModal = function(userId) {
    selectedUser = MOCK_USERS.find(u => u.id === userId);
    if (!selectedUser) return;
    closeModal('profile-modal');

    document.getElementById('req-partner-name').textContent = selectedUser.name;
    document.getElementById('req-partner-avatar').textContent = selectedUser.initials;
    document.getElementById('req-partner-avatar').style.background = `linear-gradient(135deg, ${selectedUser.avatarColor}, ${selectedUser.avatarColor}99)`;

    // Populate skill options from partner
    const skillNeeded = document.getElementById('req-skill-needed');
    skillNeeded.innerHTML = '<option value="">-- Pilih skill yang kamu butuhkan --</option>' +
      selectedUser.skills.map(s => `<option value="${s.name}">${s.name} (${s.level})</option>`).join('');

    // Current user skills
    const skillOffered = document.getElementById('req-skill-offered');
    skillOffered.innerHTML = '<option value="">-- Pilih skill yang kamu tawarkan --</option>' +
      CURRENT_USER.skills.map(s => `<option value="${s.name}">${s.name} (${s.level})</option>`).join('');

    openModal('request-modal');
  };

  // Profile modal "Minta Kolaborasi" button
  document.getElementById('btn-open-request')?.addEventListener('click', () => {
    if (selectedUser) openRequestModal(selectedUser.id);
  });

  // ── SUBMIT REQUEST ──
  document.getElementById('form-request')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const skillNeeded  = document.getElementById('req-skill-needed').value;
    const skillOffered = document.getElementById('req-skill-offered').value;
    const msg          = document.getElementById('req-message').value.trim();

    if (!skillNeeded || !skillOffered || !msg) {
      showToast('Lengkapi form', 'Semua field harus diisi.', 'warning');
      return;
    }

    // Add to collaborations mock
    const newCollab = {
      id: Date.now(),
      initiatorId: CURRENT_USER.id,
      partnerId: selectedUser.id,
      initiatorName: CURRENT_USER.name,
      initiatorInitials: CURRENT_USER.initials,
      partnerName: selectedUser.name,
      partnerInitials: selectedUser.initials,
      skillNeeded, skillOffered, message: msg,
      status: 'pending',
      date: 'Baru saja',
      dateRaw: new Date(),
    };
    MOCK_COLLABORATIONS.push(newCollab);

    closeModal('request-modal');
    document.getElementById('form-request').reset();
    showToast('Permintaan Terkirim! 🎉', `Permintaan kolaborasi berhasil dikirim ke ${selectedUser.name}!`, 'success', 4000);
  });

  // Init
  renderGrid(MOCK_USERS);
});
