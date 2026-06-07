// collaboration.js — Kanban Board logic, Review Modal, state management

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('kanban-board')) return;

  let reviewTarget = null;
  let reviewScore  = 0;
  let draggedId    = null;

  // ── RENDER KANBAN ──
  function renderKanban() {
    const statuses = ['pending', 'in-progress', 'completed'];
    statuses.forEach(status => {
      const col   = document.querySelector(`.kanban-col[data-status="${status}"] .kanban-cards`);
      const count = document.querySelector(`.kanban-col[data-status="${status}"] .kanban-col-count`);
      if (!col) return;

      const cards = MOCK_COLLABORATIONS.filter(c => c.status === status);
      count.textContent = cards.length;

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
    const isInitiator = c.initiatorId === CURRENT_USER.id;
    const myRole      = isInitiator ? 'Pengirim' : 'Penerima';

    const actions = {
      pending: isInitiator
        ? `<button class="btn btn-ghost btn-sm" onclick="cancelCollab(${c.id})">Batalkan</button>`
        : `<button class="btn btn-success btn-sm" onclick="acceptCollab(${c.id})">Terima</button>
           <button class="btn btn-danger btn-sm" onclick="rejectCollab(${c.id})">Tolak</button>`,
      'in-progress':
        `<button class="btn btn-primary btn-sm" onclick="completeCollab(${c.id})">Selesai</button>`,
      completed:
        c.review
          ? `<span class="badge badge-green">✓ Diulas</span>`
          : `<button class="btn btn-outline-primary btn-sm" onclick="openReviewModal(${c.id})">Beri Ulasan</button>`,
    };

    return `
      <div class="kanban-card" data-id="${c.id}" draggable="true">
        <div class="kanban-card-top">
          <div class="kanban-card-users">
            <div class="avatar" style="width:28px;height:28px;border-radius:8px;font-size:11px;background:linear-gradient(135deg,var(--accent),var(--purple))">${c.initiatorInitials}</div>
            <span class="kanban-card-arrow">→</span>
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
          <span class="skill-tag" style="font-size:0.72rem"><i class="icon icon-xs c-accent" data-icon="briefcase"></i> ${c.skillNeeded}</span>
          <span class="skill-tag" style="font-size:0.72rem"><i class="icon icon-xs c-secondary" data-icon="refresh-cw"></i> ${c.skillOffered}</span>
        </div>
        ${status === 'completed' && c.review ? `
          <div style="background:var(--amber-glow);border-radius:8px;padding:8px 10px;margin-bottom:8px;font-size:0.78rem;color:var(--text-secondary)">
            ${renderStars(c.review.score)} <span style="color:var(--text-primary)">"${c.review.text}"</span>
          </div>
        ` : ''}
        <div class="kanban-card-footer">
          <span class="kanban-card-date"><i class="icon icon-xs c-muted" data-icon="clock"></i> ${c.date}</span>
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
        const collab = MOCK_COLLABORATIONS.find(c => c.id === draggedId);
        if (collab) {
          collab.status = newStatus;
          renderKanban();
          showToast('Status diperbarui', `Kartu dipindah ke ${statusLabel(newStatus)}`, 'success');
        }
      }
    });
  });

  function statusLabel(s) {
    return { pending: 'Menunggu', 'in-progress': 'Sedang Berjalan', completed: 'Selesai' }[s] || s;
  }

  // ── ACTIONS ──
  window.acceptCollab = function(id) {
    const c = MOCK_COLLABORATIONS.find(x => x.id === id);
    if (!c) return;
    c.status = 'in-progress';
    c.date   = 'Baru saja';
    renderKanban();
    showToast('Kolaborasi Diterima! 🎉', `Kamu telah menerima request dari ${c.initiatorName}`, 'success');
  };

  window.rejectCollab = function(id) {
    const idx = MOCK_COLLABORATIONS.findIndex(x => x.id === id);
    if (idx === -1) return;
    const name = MOCK_COLLABORATIONS[idx].initiatorName;
    MOCK_COLLABORATIONS.splice(idx, 1);
    renderKanban();
    showToast('Request Ditolak', `Request dari ${name} telah ditolak.`, 'error');
  };

  window.cancelCollab = function(id) {
    const idx = MOCK_COLLABORATIONS.findIndex(x => x.id === id);
    if (idx === -1) return;
    MOCK_COLLABORATIONS.splice(idx, 1);
    renderKanban();
    showToast('Request Dibatalkan', 'Request kolaborasi telah dibatalkan.', 'warning');
  };

  window.completeCollab = function(id) {
    const c = MOCK_COLLABORATIONS.find(x => x.id === id);
    if (!c) return;
    c.status = 'completed';
    c.date   = 'Baru saja';
    renderKanban();
    showToast('Kolaborasi Selesai! 🏆', 'Kolaborasi berhasil diselesaikan. Jangan lupa beri ulasan!', 'success', 5000);
    setTimeout(() => openReviewModal(id), 1500);
  };

  // ── REVIEW MODAL ──
  window.openReviewModal = function(id) {
    reviewTarget = MOCK_COLLABORATIONS.find(c => c.id === id);
    if (!reviewTarget) return;

    const partnerName = reviewTarget.initiatorId === CURRENT_USER.id
      ? reviewTarget.partnerName
      : reviewTarget.initiatorName;

    document.getElementById('review-partner-name').textContent = partnerName;
    reviewScore = 0;
    document.querySelectorAll('#star-rating .star').forEach(s => s.classList.remove('active'));
    document.getElementById('review-text').value = '';

    openModal('review-modal');
    initStarRating('star-rating', (val) => { reviewScore = val; });
  };

  document.getElementById('form-review')?.addEventListener('submit', (e) => {
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

    reviewTarget.review = { score: reviewScore, text };
    closeModal('review-modal');
    renderKanban();
    showToast('Ulasan Terkirim! ⭐', 'Terima kasih telah memberikan ulasan.', 'success');
  });

  // Init
  renderKanban();
});
