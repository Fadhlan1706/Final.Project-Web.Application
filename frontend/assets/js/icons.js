/**
 * icons.js — Sistem Icon Global SkillSwap
 * Lucide Icons (MIT License) — SVG inline, mengikuti CSS color variables
 *
 * Cara pakai di HTML:
 *   <i class="icon" data-icon="search"></i>
 *   <i class="icon icon-sm c-muted" data-icon="bell"></i>
 *   <i class="icon icon-lg" data-icon="star" data-color="amber"></i>
 */

// ── Resolve base path dari lokasi icons.js itu sendiri ──
// Jauh lebih reliable daripada menghitung slash di pathname
const ICON_BASE = (() => {
  // currentScript hanya tersedia saat script pertama kali dieksekusi
  const src = (document.currentScript && document.currentScript.src) || '';
  if (src) {
    // icons.js ada di assets/js/icons.js → naik dua level → root → assets/icons/
    return src.replace(/\/assets\/js\/icons\.js.*$/, '/assets/icons/');
  }
  // Fallback: cari dari link tag pertama yang ada di head (punya href absolut)
  const base = document.querySelector('base[href]');
  if (base) return base.href.replace(/\/?$/, '/') + 'assets/icons/';
  // Last resort: hitung dari pathname
  const parts = window.location.pathname.split('/').filter(Boolean);
  const up = parts.length > 1 ? '../'.repeat(parts.length - 1) : '';
  return window.location.origin + '/' + up + 'assets/icons/';
})();

// ── Cache SVG content in memory ──
const _iconCache = {};

async function fetchIcon(name) {
  if (_iconCache[name] !== undefined) return _iconCache[name];
  try {
    const res = await fetch(ICON_BASE + '/' + name + '.svg');
    if (!res.ok) { _iconCache[name] = null; return null; }
    const text = await res.text();
    _iconCache[name] = text;
    return text;
  } catch {
    _iconCache[name] = null;
    return null;
  }
}

// ── Size map: class → px ──
const SIZE_MAP = {
  'icon-xs' : '12',
  'icon-sm' : '14',
  'icon-md' : '16',
  'icon-lg' : '20',
  'icon-xl' : '26',
  'icon-2xl': '38',
};

// ── Color map: data-color / c-* class → CSS value ──
const COLOR_MAP = {
  current  : 'currentColor',
  accent   : 'var(--accent)',
  accent2  : 'var(--accent-2)',
  green    : 'var(--green)',
  amber    : 'var(--amber)',
  red      : 'var(--red)',
  purple   : 'var(--purple)',
  muted    : 'var(--text-muted)',
  secondary: 'var(--text-secondary)',
  primary  : 'var(--text-primary)',
};

function resolveColor(el) {
  // 1. data-color attribute takes priority
  if (el.dataset.color && COLOR_MAP[el.dataset.color]) {
    return COLOR_MAP[el.dataset.color];
  }
  // 2. c-* utility class (e.g. c-accent, c-muted, c-green)
  for (const cls of el.classList) {
    if (cls.startsWith('c-') && COLOR_MAP[cls.slice(2)]) {
      return COLOR_MAP[cls.slice(2)];
    }
  }
  return 'currentColor';
}

function resolveSize(el) {
  // data-size overrides everything
  if (el.dataset.size) return el.dataset.size;
  for (const [cls, px] of Object.entries(SIZE_MAP)) {
    if (el.classList.contains(cls)) return px;
  }
  return '16'; // default
}

// ── Hydrate a single <i data-icon> element ──
async function hydrateOne(el) {
  if (el.classList.contains('icon-loaded')) return;
  const name = el.dataset.icon;
  if (!name) return;

  const svgText = await fetchIcon(name);
  if (!svgText) {
    el.classList.add('icon-error');
    return;
  }

  const parser = new DOMParser();
  const doc    = parser.parseFromString(svgText, 'image/svg+xml');
  const svgEl  = doc.querySelector('svg');
  if (!svgEl) return;

  const size   = resolveSize(el);
  const stroke = resolveColor(el);

  svgEl.setAttribute('width',  size);
  svgEl.setAttribute('height', size);
  svgEl.setAttribute('stroke', stroke);
  svgEl.setAttribute('aria-hidden', 'true');
  svgEl.setAttribute('focusable', 'false');
  svgEl.style.display      = 'inline-block';
  svgEl.style.verticalAlign = 'middle';
  svgEl.style.flexShrink   = '0';
  svgEl.style.pointerEvents = 'none';

  // Remove any hardcoded color attrs from Lucide that would override stroke
  svgEl.removeAttribute('fill');
  svgEl.querySelectorAll('[fill]').forEach(n => {
    if (n.getAttribute('fill') !== 'none') n.removeAttribute('fill');
  });

  el.innerHTML = '';
  el.appendChild(svgEl);
  el.classList.add('icon-loaded');
}

// ── Hydrate all icons inside a root element ──
async function hydrateIcons(root = document) {
  const els = [...(root.querySelectorAll ? root.querySelectorAll('i[data-icon]:not(.icon-loaded)') : [])];
  if (!els.length) return;
  await Promise.all(els.map(hydrateOne));
}

// ── Auto-hydrate on DOM ready ──
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => hydrateIcons());
} else {
  // Script loaded after DOMContentLoaded (e.g. defer)
  hydrateIcons();
}

// ── Watch for dynamically added icons (Kanban, modals, toast) ──
const _iconObserver = new MutationObserver(mutations => {
  let dirty = false;
  for (const m of mutations) {
    for (const node of m.addedNodes) {
      if (node.nodeType !== 1) continue;
      if (node.matches('i[data-icon]') || node.querySelector('i[data-icon]')) {
        dirty = true;
        break;
      }
    }
    if (dirty) break;
  }
  if (dirty) hydrateIcons();
});

(document.readyState === 'loading'
  ? new Promise(r => document.addEventListener('DOMContentLoaded', r))
  : Promise.resolve()
).then(() => {
  _iconObserver.observe(document.body, { childList: true, subtree: true });
});
