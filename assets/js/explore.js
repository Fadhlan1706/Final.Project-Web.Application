// explore.js — Pencarian, filter, Profile Modal, Request Modal

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('explore-grid')) return;

  let filteredUsers = [];
  let selectedUser  = null;
  const session = getSession();

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

    grid.innerHTML = users.map((u, i) => {
      const initials = u.name.substring(0, 2).toUpperCase();
      const bgImage = u.profilePicture 
        ? `background-image:url(http://localhost:8000${u.profilePicture});background-size:cover;background-position:center;color:transparent;` 
        : `background:linear-gradient(135deg, var(--primary), var(--purple))`;
      
      let skillsHtml = '';
      if (u.skills && u.skills.length > 0) {
        skillsHtml = u.skills.slice(0, 3).map(s => `
          <span class="skill-tag">${s.skillName} ${skillLevelBadge(s.skillLevel)}</span>
        `).join('');
        if (u.skills.length > 3) skillsHtml += `<span class="skill-tag">+${u.skills.length - 3}</span>`;
      } else {
         skillsHtml = '<span class="skill-tag">Belum ada skill</span>';
      }

      return `
        <div class="user-card fade-in" style="animation-delay:${i * 60}ms" data-id="${u.id}" onclick="openProfileModal(${u.id})">
          <div class="user-card-header">
            <div class="user-card-avatar" style="${bgImage}">
              ${initials}
            </div>
            <div style="flex:1">
              <div class="user-card-name">${u.name}</div>
              <div class="user-card-major">${u.major || 'Pengguna'}</div>
            </div>
            <div class="user-card-score">
              <div class="score-val">★ ${Number(u.avg_rating || 0).toFixed(1)}</div>
              <div class="score-label">${u.review_count || 0} ulasan</div>
            </div>
          </div>
          <div class="user-card-skills">
            ${skillsHtml}
          </div>
          <div class="user-card-bio">${u.bio || 'Tidak ada bio'}</div>
          <div class="user-card-footer">
            <div class="user-card-stats">
              <span class="user-card-stat"><strong>${u.collab_count || 0}</strong> kolaborasi</span>
            </div>
            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); openRequestModal(${u.id})">
              <i class="icon icon-sm" data-icon="handshake" data-color="primary"></i> Minta Kolaborasi
            </button>
          </div>
        </div>
      `;
    }).join('');
    
    hydrateIcons(grid);
  }

  // ── SEARCH & FILTER ──
  async function applyFilters() {
    const q       = (document.getElementById('search-input')?.value || '').trim();
    const cat     = document.getElementById('filter-category')?.value || '';
    const level   = document.getElementById('filter-level')?.value || '';
    
    // Construct query string
    const params = new URLSearchParams();
    if (q) params.append('search', q);
    if (cat) params.append('category_id', cat);
    if (level) params.append('level', level);

    try {
      const grid = document.getElementById('explore-grid');
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;">Memuat...</div>';
      
      const response = await API.Explore.getTalents(params.toString());
      filteredUsers = response.data.items || [];
      renderGrid(filteredUsers);
    } catch (error) {
      console.error(error);
      const grid = document.getElementById('explore-grid');
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:red;">Gagal memuat pengguna</div>';
    }
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
  window.openProfileModal = async function(userId) {
    if (userId == session?.id) {
       window.location.href = 'profile.html';
       return;
    }

    try {
      const response = await API.Explore.getUserProfile(userId);
      selectedUser = response.data;
    } catch (e) {
      showToast('Error', 'Gagal memuat profil pengguna', 'error');
      return;
    }

    const initials = selectedUser.name.substring(0, 2).toUpperCase();
    const bgImage = selectedUser.profilePicture 
        ? `url(http://localhost:8000${selectedUser.profilePicture})` 
        : `linear-gradient(135deg, var(--primary), var(--purple))`;

    // Populate header
    document.getElementById('pm-avatar').textContent   = selectedUser.profilePicture ? '' : initials;
    document.getElementById('pm-avatar').style.background = bgImage;
    if (selectedUser.profilePicture) {
        document.getElementById('pm-avatar').style.backgroundSize = 'cover';
        document.getElementById('pm-avatar').style.backgroundPosition = 'center';
    }

    document.getElementById('pm-name').textContent     = selectedUser.name;
    document.getElementById('pm-major').textContent    = `${selectedUser.major || 'Umum'} • ${selectedUser.university || 'Belum diatur'}`;
    
    const stats = selectedUser.stats || {};
    document.getElementById('pm-score').textContent    = Number(stats.avg_rating || 0).toFixed(1);
    document.getElementById('pm-review-count').textContent = `(${stats.review_count || 0} ulasan)`;
    document.getElementById('pm-stars').innerHTML      = renderStars(stats.avg_rating || 0);

    // Bio tab
    document.getElementById('pm-bio').textContent = selectedUser.bio || 'Tidak ada bio';
    
    if (selectedUser.skills && selectedUser.skills.length > 0) {
        document.getElementById('pm-skills-list').innerHTML = selectedUser.skills.map(s => `
          <div class="skill-tag" style="margin-bottom:6px;">
            ${s.skillName} ${skillLevelBadge(s.skillLevel)}
            <span style="font-size:0.65rem;color:var(--text-muted);margin-left:2px;">${s.categoryName || ''}</span>
          </div>
        `).join('');
    } else {
        document.getElementById('pm-skills-list').innerHTML = '<span class="skill-tag">Belum ada skill</span>';
    }

    // Reviews tab
    const reviewsEl = document.getElementById('pm-reviews');
    try {
        const reviewRes = await API.Reviews.getForUser(userId);
        const reviews = reviewRes.data || [];
        if (reviews.length === 0) {
          reviewsEl.innerHTML = '<div class="empty-state" style="padding:30px 0"><div class="empty-state-icon">💬</div><h3>Belum ada ulasan</h3></div>';
        } else {
          reviewsEl.innerHTML = reviews.map(r => `
            <div class="review-item">
              <div class="avatar" style="background:linear-gradient(135deg,var(--accent),var(--purple))">${r.reviewer_name.substring(0,2).toUpperCase()}</div>
              <div style="flex:1">
                <div style="display:flex;align-items:center;gap:8px;">
                  <strong style="font-size:0.875rem">${r.reviewer_name}</strong>
                  ${renderStars(r.rating)}
                </div>
                <div class="review-text">${r.review_text || ''}</div>
                <div class="review-date">${new Date(r.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          `).join('');
        }
    } catch(e) {
        reviewsEl.innerHTML = '<div style="color:red">Gagal memuat ulasan.</div>';
    }

    openModal('profile-modal');
    // Reset to first tab
    document.querySelectorAll('#profile-modal .modal-tab').forEach((t,i) => t.classList.toggle('active', i===0));
    document.querySelectorAll('#profile-modal .tab-panel').forEach((p,i) => p.classList.toggle('active', i===0));
  };

  // ── OPEN REQUEST MODAL (dari profile modal atau card) ──
  window.openRequestModal = async function(userId) {
    if (userId == session?.id) {
        showToast('Info', 'Anda tidak dapat meminta kolaborasi dengan diri sendiri.', 'info');
        return;
    }

    if (!selectedUser || selectedUser.id !== userId) {
        try {
            const response = await API.Explore.getUserProfile(userId);
            selectedUser = response.data;
        } catch (e) {
            showToast('Error', 'Gagal memuat profil', 'error');
            return;
        }
    }

    closeModal('profile-modal');

    document.getElementById('req-partner-name').textContent = selectedUser.name;
    const initials = selectedUser.name.substring(0,2).toUpperCase();
    document.getElementById('req-partner-avatar').textContent = selectedUser.profilePicture ? '' : initials;
    
    if(selectedUser.profilePicture) {
        document.getElementById('req-partner-avatar').style.background = `url(http://localhost:8000${selectedUser.profilePicture})`;
        document.getElementById('req-partner-avatar').style.backgroundSize = 'cover';
    } else {
        document.getElementById('req-partner-avatar').style.background = `linear-gradient(135deg, var(--primary), var(--purple))`;
    }

    // Populate skill options from partner
    const skillNeeded = document.getElementById('req-skill-needed');
    skillNeeded.innerHTML = '<option value="">-- Pilih skill yang kamu butuhkan --</option>' +
      (selectedUser.skills || []).map(s => `<option value="${s.id}">${s.skillName} (${s.skillLevel})</option>`).join('');

    // Current user skills
    try {
        const mySkillsRes = await API.Skills.getMySkills();
        const skillOffered = document.getElementById('req-skill-offered');
        skillOffered.innerHTML = '<option value="">-- Pilih skill yang kamu tawarkan --</option>' +
          (mySkillsRes.data || []).map(s => `<option value="${s.id}">${s.skillName} (${s.skillLevel})</option>`).join('');
    } catch(e) {
        console.error(e);
    }

    openModal('request-modal');
  };

  // Profile modal "Minta Kolaborasi" button
  document.getElementById('btn-open-request')?.addEventListener('click', () => {
    if (selectedUser) openRequestModal(selectedUser.id);
  });

  // ── SUBMIT REQUEST ──
  document.getElementById('form-request')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const skillNeededId  = document.getElementById('req-skill-needed').value;
    const skillOfferedId = document.getElementById('req-skill-offered').value;
    const msg          = document.getElementById('req-message').value.trim();

    if (!skillNeededId || !skillOfferedId || !msg) {
      showToast('Lengkapi form', 'Semua field harus diisi.', 'warning');
      return;
    }

    try {
      const payload = {
         partner_id: selectedUser.id,
         offered_skill_id: skillOfferedId,
         requested_skill_id: skillNeededId,
         message: msg
      };
      
      await API.Collaborations.create(payload);
      closeModal('request-modal');
      document.getElementById('form-request').reset();
      showToast('Permintaan Terkirim! 🎉', `Permintaan kolaborasi berhasil dikirim ke ${selectedUser.name}!`, 'success');
    } catch (error) {
      showToast('Gagal', error.message || 'Terjadi kesalahan saat mengirim permintaan', 'error');
    }
  });

  // ── LOAD MATCHES ──
  async function loadMatches() {
    if (!document.getElementById('matches-grid')) return;
    try {
      if (typeof API !== 'undefined' && API.Skills && API.Skills.getMatches) {
        const res = await API.Skills.getMatches();
        const matches = res.data || [];
        const grid = document.getElementById('matches-grid');
        
        if (!matches.length) {
          grid.innerHTML = '<div class="empty-state" style="grid-column: 1/-1; padding: 24px 0;"><h3>Belum ada rekomendasi</h3><p>Tambahkan skill di profil untuk mendapatkan rekomendasi partner.</p></div>';
          return;
        }

        grid.innerHTML = matches.map((u, i) => `
          <div class="user-card fade-in" style="animation-delay:${i * 60}ms" data-id="${u.id}" onclick="openProfileModal(${u.id})">
            <div class="user-card-header">
              <div class="user-card-avatar" style="background: linear-gradient(135deg, var(--accent), var(--purple))">
                ${u.name.substring(0,2).toUpperCase()}
              </div>
              <div style="flex:1">
                <div class="user-card-name">${u.name}</div>
                <div class="user-card-major">${u.major || 'Mahasiswa'}</div>
              </div>
            </div>
            <div style="font-size: 0.85rem; color: var(--green); margin-top: 12px; font-weight: 600; display: flex; align-items: center; gap: 4px;">
              <i class="icon icon-sm" data-icon="check-circle"></i> Match Score: ${u.match_score}%
            </div>
          </div>
        `).join('');
        hydrateIcons(grid);
      }
    } catch (err) {
      console.error("Failed to load matches:", err);
      document.getElementById('matches-grid').innerHTML = '<div class="empty-state" style="grid-column: 1/-1; padding: 24px 0;"><h3 style="color:var(--red)">Gagal memuat rekomendasi</h3></div>';
    }
  }

  // Init
  applyFilters(); // Initial load
  loadMatches();
});
