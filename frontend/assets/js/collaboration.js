// collaboration.js — Kanban Board logic, Review Modal, state management (API Integration)

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('kanban-board')) return;

  let collabs      = [];
  let reviewTarget = null;
  let reviewScore  = 0;
  let draggedId    = null;

  // ── FETCH COLLABORATIONS ──
  async function fetchCollaborations() {
    const zones = document.querySelectorAll('.kanban-cards');
    zones.forEach(z => {
      z.innerHTML = `
        <div style="padding:40px 0;text-align:center;color:var(--text-muted)">
          ${icon('loader', 24)}
          <div style="font-size:0.8rem;margin-top:8px">Memuat...</div>
        </div>
      `;
    });

    try {
      collabs = await api.getCollaborations();
      renderKanban();
    } catch (err) {
      zones.forEach(z => {
        z.innerHTML = `
          <div class="empty-state" style="padding:24px 0;font-size:0.8rem">
            <div class="empty-state-icon" style="color:var(--red)">${icon('alert-circle', 28)}</div>
            <p>Gagal memuat data.</p>
          </div>
        `;
      });
      showToast('Gagal Memuat', err.message, 'error');
    }
  }

  // ── RENDER KANBAN ──
  function renderKanban() {
    const statuses = ['pending', 'in-progress', 'completed'];
    statuses.forEach(status => {
      const col   = document.querySelector(`.kanban-col[data-status="${status}"] .kanban-cards`);
      const count = document.querySelector(`.kanban-col[data-status="${status}"] .kanban-col-count`);
      if (!col) return;

      const cards = collabs.filter(c => c.status === status);
      if (count) count.textContent = cards.length;

      if (cards.length === 0) {
        col.innerHTML = `<div class="empty-state" style="padding:24px 0;font-size:0.8rem">
          <div class="empty-state-icon" style="font-size:28px">${icon('clipboard-list', 28)}</div>
          <p>Tidak ada kolaborasi</p>
        </div>`;
        return;
      }

      col.innerHTML = cards.map(c => buildCard(c, status)).join('');
      bindCardEvents(col, status);
    });
  }

  function buildCard(c, status) {
    const currentUser = JSON.parse(localStorage.getItem('ss_user') || '{"id":1}'); // Mock fallback for UI
    const isInitiator = c.initiatorId === (currentUser?.id || 1);
    const myRole      = isInitiator ? 'Pengirim' : 'Penerima';

    const actions = {
      pending: isInitiator
        ? `<button class="btn btn-ghost btn-sm" onclick="updateStatus(${c.id}, 'cancelled')">${icon('x', 14)} Batalkan</button>`
        : `<button class="btn btn-success btn-sm" onclick="updateStatus(${c.id}, 'in-progress')">${icon('check', 14)} Terima</button>
           <button class="btn btn-danger btn-sm" onclick="updateStatus(${c.id}, 'rejected')">${icon('x', 14)} Tolak</button>`,
      'in-progress':
        `<button class="btn btn-primary btn-sm" onclick="completeCollab(${c.id})">${icon('flag', 14)} Selesai</button>`,
      completed:
        c.review
          ? `<span class="badge badge-green">${icon('check', 12)} Diulas</span>`
          : `<button class="btn btn-outline-primary btn-sm" onclick="openReviewModal(${c.id})">${icon('star', 14)} Beri Ulasan</button>`,
    };

    return `
      <div class="kanban-card" data-id="${c.id}" draggable="true">
        <div class="kanban-card-top">
          <div class="kanban-card-users">
            <div class="avatar" style="width:28px;height:28px;border-radius:8px;font-size:11px;background:linear-gradient(135deg,var(--accent),var(--purple))">${c.initiatorInitials}</div>
            <span class="kanban-card-arrow">${icon('arrow-right', 14)}</span>
            <div class="avatar" style="width:28px;height:28px;border-radius:8px;font-size:11px;background:linear-gradient(135deg,var(--green),#51cf66)">${c.partnerInitials}</div>
          </div>
          <span class="badge badge-${status === 'pending' ? 'amber' : status === 'in-progress' ? 'blue' : 'green'}" style="font-size:0.65rem">
            ${myRole}
          </span>
        </div>
        <div class="kanban-card-title">
          ${isInitiator ? c.partnerName : c.initiatorName}
        </div>
        <div class="kanban-card-desc">${c.message}</div>
        <div class="kanban-card-skills">
          <span class="skill-tag" style="font-size:0.72rem">${icon('crosshair', 12)} ${c.skillNeeded}</span>
          <span class="skill-tag" style="font-size:0.72rem">${icon('refresh-cw', 12)} ${c.skillOffered}</span>
        </div>
        ${status === 'completed' && c.review ? `
          <div style="background:var(--amber-glow);border-radius:8px;padding:8px 10px;margin-bottom:8px;font-size:0.78rem;color:var(--text-secondary)">
            ${renderStars(c.review.score)} <span style="color:var(--text-primary)">"${c.review.text}"</span>
          </div>
        ` : ''}
        <div class="kanban-card-footer">
          <span class="kanban-card-date">${icon('clock', 12)} ${c.date}</span>
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
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const newStatus = zone.closest('.kanban-col').dataset.status;
      if (draggedId && newStatus) {
        updateStatus(draggedId, newStatus);
      }
    });
  });

  function statusLabel(s) {
    return { pending: 'Menunggu', 'in-progress': 'Sedang Berjalan', completed: 'Selesai' }[s] || s;
  }

  // ── ACTIONS ──
  window.updateStatus = async function(id, newStatus) {
    try {
      await api.updateCollabStatus(id, newStatus);
      
      // Update local state temporarily for UI responsiveness
      // In a real app you might refetch, but here we just update array:
      const idx = collabs.findIndex(c => c.id === id);
      if (idx !== -1) {
        if (newStatus === 'cancelled' || newStatus === 'rejected') {
          collabs.splice(idx, 1);
        } else {
          collabs[idx].status = newStatus;
          collabs[idx].date = 'Baru saja';
        }
        renderKanban();
        showToast('Berhasil', `Status diperbarui ke ${statusLabel(newStatus)}.`, 'success');
      }
    } catch (err) {
      showToast('Gagal Memperbarui', err.message, 'error');
    }
  };

  window.completeCollab = function(id) {
    updateStatus(id, 'completed').then(() => {
      showToast('Kolaborasi Selesai!', 'Kolaborasi berhasil diselesaikan. Jangan lupa beri ulasan!', 'success', 5000);
      setTimeout(() => openReviewModal(id), 1500);
    });
  };

  // ── REVIEW MODAL ──
  window.openReviewModal = function(id) {
    reviewTarget = collabs.find(c => c.id === id);
    if (!reviewTarget) return;

    const currentUser = JSON.parse(localStorage.getItem('ss_user') || '{"id":1}');
    const partnerName = reviewTarget.initiatorId === currentUser.id
      ? reviewTarget.partnerName
      : reviewTarget.initiatorName;

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

    const btn = e.target.querySelector('[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = icon('loader', 16) + ' Mengirim...';

    try {
      await api.submitReview(reviewTarget.id, { score: reviewScore, text });
      
      // Update local state
      reviewTarget.review = { score: reviewScore, text };
      closeModal('review-modal');
      renderKanban();
      showToast('Ulasan Terkirim!', 'Terima kasih telah memberikan ulasan.', 'success');
    } catch (err) {
      showToast('Gagal', err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });

  // Init
  fetchCollaborations();
});
