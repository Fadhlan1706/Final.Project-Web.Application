// collaboration.js — Kanban Board logic, Review Modal, state management

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('kanban-board')) return;

  let reviewTarget = null;
  let reviewScore  = 0;
  let draggedId    = null;
  let allCollaborations = [];
  const session = getSession();

  // ── RENDER KANBAN ──
  async function loadAndRenderKanban() {
    try {
        const response = await API.Collaborations.getAll();
        allCollaborations = response.data || [];
        renderKanban();
    } catch (e) {
        showToast('Error', 'Gagal memuat data kolaborasi', 'error');
    }
  }

  function renderKanban() {
    if (!session) return;
    const statuses = ['pending', 'accepted', 'completed'];
    statuses.forEach(status => {
      const col   = document.querySelector(`.kanban-col[data-status="${status}"] .kanban-cards`);
      const count = document.querySelector(`.kanban-col[data-status="${status}"] .kanban-col-count`);
      if (!col) return;

      const cards = allCollaborations.filter(c => c.status === status);
      if (count) count.textContent = cards.length;

      if (cards.length === 0) {
        col.innerHTML = `<div class="empty-state" style="padding:24px 0;font-size:0.8rem">
          <div class="empty-state-icon" style="font-size:28px">📋</div>
          <p>Tidak ada kolaborasi</p>
        </div>`;
        return;
      }

      col.innerHTML = cards.map(c => buildCard(c, status)).join('');
      bindCardEvents(col, status);
    });
  }

  function buildCard(c, status) {
    // Current user's role
    const isInitiator = c.requester_id === session.id;
    const myRole      = isInitiator ? 'Pengirim' : 'Penerima';
    
    // Partner's details to show
    const partnerName = isInitiator ? c.receiver_name : c.requester_name;
    const initiatorInitials = (c.requester_name || '').substring(0,2).toUpperCase();
    const partnerInitials = (c.receiver_name || '').substring(0,2).toUpperCase();

    // Map hyphenated statuses back to underscore for backend if needed.
    const toStatus = (s) => s;

    const actions = {
      pending: isInitiator
        ? `<button class="btn btn-ghost btn-sm" onclick="updateCollabStatus(${c.id}, 'rejected')">Batalkan</button>` 
        : `<button class="btn btn-success btn-sm" onclick="updateCollabStatus(${c.id}, 'accepted')">Terima</button>
           <button class="btn btn-danger btn-sm" onclick="updateCollabStatus(${c.id}, 'rejected')">Tolak</button>`,
      'accepted':
        `<button class="btn btn-primary btn-sm" onclick="updateCollabStatus(${c.id}, 'completed')">Selesai</button>`,
      completed:
        c.is_reviewed
          ? `<span class="badge badge-green">✓ Diulas</span>`
          : `<button class="btn btn-outline-primary btn-sm" onclick="openReviewModal(${c.id})">Beri Ulasan</button>`,
    };

    return `
      <div class="kanban-card" data-id="${c.id}" draggable="true">
        <div class="kanban-card-top">
          <div class="kanban-card-users">
            <div class="avatar" style="width:28px;height:28px;border-radius:8px;font-size:11px;background:linear-gradient(135deg,var(--accent),var(--purple))">${initiatorInitials}</div>
            <span class="kanban-card-arrow">→</span>
            <div class="avatar" style="width:28px;height:28px;border-radius:8px;font-size:11px;background:linear-gradient(135deg,var(--green),#51cf66)">${partnerInitials}</div>
          </div>
          <span class="badge badge-${status === 'pending' ? 'amber' : status === 'in-progress' ? 'blue' : 'green'}" style="font-size:0.65rem">
            ${myRole}
          </span>
        </div>
        <div class="kanban-card-title">
          ${partnerName}
        </div>
        <div class="kanban-card-desc">${c.message || 'Tidak ada pesan'}</div>
        <div class="kanban-card-skills">
          <span class="skill-tag" style="font-size:0.72rem" title="Dibutuhkan"><i class="icon icon-xs c-accent" data-icon="briefcase"></i> ${c.skill_name || 'Skill'}</span>
        </div>
        <div class="kanban-card-footer">
          <span class="kanban-card-date"><i class="icon icon-xs c-muted" data-icon="clock"></i> ${new Date(c.created_at).toLocaleDateString()}</span>
          <div class="kanban-card-actions">${actions[status] || ''}</div>
        </div>
      </div>
    `;
  }

  function bindCardEvents(col, status) {
    // Drag
    col.querySelectorAll('.kanban-card').forEach(card => {
      card.addEventListener('dragstart', () => {
        draggedId = parseInt(card.dataset.id);
        setTimeout(() => card.classList.add('dragging'), 0);
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        draggedId = null;
      });
    });
  }

  // Drop zones
  document.querySelectorAll('.kanban-cards').forEach(zone => {
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', async (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const newStatus = zone.closest('.kanban-col').dataset.status;
      if (draggedId && newStatus) {
         try {
             const apiStatus = newStatus === 'in-progress' ? 'in_progress' : newStatus;
             await API.Collaborations.updateStatus(draggedId, { status: apiStatus });
             await loadAndRenderKanban();
             showToast('Status diperbarui', `Kartu dipindah ke ${statusLabel(newStatus)}`, 'success');
         } catch(e) {
             showToast('Gagal', e.message, 'error');
         }
      }
    });
  });

  function statusLabel(s) {
    return { pending: 'Menunggu', 'in-progress': 'Sedang Berjalan', completed: 'Selesai' }[s] || s;
  }

  // ── ACTIONS ──
  window.updateCollabStatus = async function(id, status) {
      try {
          const apiStatus = status === 'in-progress' ? 'in_progress' : status;
          await API.Collaborations.updateStatus(id, { status: apiStatus });
          await loadAndRenderKanban();
          
          if (status === 'in-progress') {
              showToast('Kolaborasi Diterima! 🎉', `Status menjadi Sedang Berjalan`, 'success');
          } else if (status === 'rejected') {
              showToast('Ditolak/Dibatalkan', `Kolaborasi telah dihentikan`, 'warning');
          } else if (status === 'completed') {
              showToast('Kolaborasi Selesai! 🏆', 'Kolaborasi berhasil diselesaikan. Jangan lupa beri ulasan!', 'success', 5000);
              setTimeout(() => openReviewModal(id), 1500);
          }
      } catch(e) {
          showToast('Gagal', e.message, 'error');
      }
  };

  // ── REVIEW MODAL ──
  window.openReviewModal = function(id) {
    reviewTarget = allCollaborations.find(c => c.id === id);
    if (!reviewTarget) return;

    const isInitiator = reviewTarget.requester_id === session.id;
    const partnerName = isInitiator ? reviewTarget.receiver_name : reviewTarget.requester_name;

    document.getElementById('review-partner-name').textContent = partnerName;
    reviewScore = 0;
    document.querySelectorAll('#star-rating .star').forEach(s => s.classList.remove('active'));
    document.getElementById('review-text').value = '';

    openModal('review-modal');
    initStarRating('star-rating', (val) => { reviewScore = val; });
  };

  document.getElementById('form-review')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (reviewScore === 0) {
      showToast('Pilih Rating', 'Silakan beri rating bintang terlebih dahulu.', 'warning');
      return;
    }
    const text = document.getElementById('review-text').value.trim();
    if (!text) {
      showToast('Tulis Ulasan', 'Silakan tulis ulasan singkat.', 'warning');
      return;
    }

    try {
      const isInitiator = reviewTarget.requester_id === session.id;
      const targetUserId = isInitiator ? reviewTarget.receiver_id : reviewTarget.requester_id;

      await API.Reviews.create({
          target_user_id: targetUserId,
          collaboration_id: reviewTarget.id,
          rating: reviewScore,
          review_text: text
      });

      closeModal('review-modal');
      await loadAndRenderKanban();
      showToast('Ulasan Terkirim! ⭐', 'Terima kasih telah memberikan ulasan.', 'success');
    } catch(err) {
      showToast('Gagal mengirim ulasan', err.message, 'error');
    }
  });

  // Init
  loadAndRenderKanban();
});
