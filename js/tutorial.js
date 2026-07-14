// =============================================
//  tutorial.js — Tutorial interaktif "How to Play"
// =============================================
// Spotlight + tooltip murni DOM/CSS (tanpa gambar canvas tambahan, tanpa
// kerja per-frame di luar 1 pengecekan boolean di game loop). Muncul sekali
// otomatis saat pertama kali main, atau kapan saja lewat tombol "?".

import { viewport } from './viewport.js';
import { VIEWPORT_W, MINIMAP_W, MINIMAP_H, MINIMAP_MARGIN } from './config.js';

const SEEN_KEY = 'survivorArena_tutorialSeen';

const overlayEl = document.getElementById('tutorial-overlay');
const spotlightEl = document.getElementById('tutorial-spotlight');
const tooltipEl = document.getElementById('tutorial-tooltip');
const progressEl = document.getElementById('tutorial-progress');
const textEl = document.getElementById('tutorial-text');
const nextBtn = document.getElementById('tutorial-next');
const skipBtn = document.getElementById('tutorial-skip');
const swipeEl = document.getElementById('tutorial-swipe');
const skipSwipeBtn = document.getElementById('tutorial-skip-swipe');
const howtoBtn = document.getElementById('howto-btn');
const mainOverlayEl = document.getElementById('overlay');

let canvasRef = null;
let active = false;
let stepIndex = 0;

function rectOf(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

// Minimap digambar di canvas (bukan elemen DOM), jadi rect layar-nya dihitung
// manual dari posisi logisnya + transform viewport (scale/offset/dpr) saat ini.
function getMinimapRect() {
  if (!canvasRef) return null;
  const canvasRect = canvasRef.getBoundingClientRect();
  const { scale, offsetX, offsetY, dpr } = viewport;
  const logicalX = VIEWPORT_W - MINIMAP_W - MINIMAP_MARGIN;
  const logicalY = MINIMAP_MARGIN;
  return {
    left: canvasRect.left + (logicalX * scale + offsetX) / dpr,
    top: canvasRect.top + (logicalY * scale + offsetY) / dpr,
    width: (MINIMAP_W * scale) / dpr,
    height: (MINIMAP_H * scale) / dpr,
  };
}

const STEPS = [
  {
    id: 'hp',
    text: 'Permainan akan selesai jika HP kosong.',
    getRect: () => rectOf(document.getElementById('lives')),
  },
  {
    id: 'level',
    text: 'Kalahkan musuh untuk naikkan level XP dan menambah daya serangmu.',
    getRect: () => rectOf(document.getElementById('level-badge')),
  },
  {
    id: 'target',
    text: 'Kumpulkan cukup poin untuk naik ke level selanjutnya. Jika waktu habis, permainan berakhir.',
    getRect: () => rectOf(document.getElementById('target-time')),
  },
  {
    id: 'xp',
    text: 'XP dapat didapat dari musuh yang telah kamu bunuh',
    getRect: () => rectOf(document.getElementById('xp-bar-track')),
  },
  {
    id: 'minimap',
    text: 'Menampilkan musuh terdekat & item penting di sekitarmu.',
    getRect: getMinimapRect,
  },
  {
    id: 'movement',
    text: 'Geser untuk menggerakkan karaktermu.',
  },
];

function applySpotlight(rect) {
  const pad = 10;
  const w = rect.width + pad * 2;
  const h = rect.height + pad * 2;
  spotlightEl.style.left = `${rect.left - pad}px`;
  spotlightEl.style.top = `${rect.top - pad}px`;
  spotlightEl.style.width = `${w}px`;
  spotlightEl.style.height = `${h}px`;
  spotlightEl.style.borderRadius = h < 40 ? '999px' : '14px';
}

function positionTooltip(rect) {
  const pad = 10;
  const margin = 14;
  const tw = tooltipEl.offsetWidth;
  const th = tooltipEl.offsetHeight;

  const spotTop = rect.top - pad;
  const spotBottom = rect.top + rect.height + pad;
  const spotCenterX = rect.left + rect.width / 2;

  let top;
  if (spotBottom + th + margin <= window.innerHeight) {
    top = spotBottom + margin; // taruh di bawah target
  } else if (spotTop - th - margin >= 0) {
    top = spotTop - th - margin; // taruh di atas target
  } else {
    top = Math.max(margin, (window.innerHeight - th) / 2);
  }

  let left = spotCenterX - tw / 2;
  left = Math.max(margin, Math.min(left, window.innerWidth - tw - margin));

  tooltipEl.style.left = `${left}px`;
  tooltipEl.style.top = `${top}px`;
}

function goToStep(idx) {
  if (idx >= STEPS.length) { finish(); return; }
  stepIndex = idx;
  const step = STEPS[idx];
  progressEl.textContent = `${idx + 1}/${STEPS.length}`;

  if (step.id === 'movement') {
    spotlightEl.classList.remove('show');
    tooltipEl.classList.remove('show');
    overlayEl.classList.add('step-movement');
    swipeEl.classList.remove('hidden');
    requestAnimationFrame(() => swipeEl.classList.add('show'));
    return;
  }

  overlayEl.classList.remove('step-movement');
  swipeEl.classList.remove('show');
  swipeEl.classList.add('hidden');

  const rect = step.getRect();
  if (!rect || rect.width < 2 || rect.height < 2) {
    // Elemen target tidak siap/terlihat — lewati langkah ini secara halus.
    goToStep(idx + 1);
    return;
  }

  textEl.textContent = step.text;
  applySpotlight(rect);
  spotlightEl.classList.add('show');
  // Posisikan tooltip setelah teks & layout ter-update (butuh offsetWidth/Height akurat).
  requestAnimationFrame(() => {
    positionTooltip(rect);
    tooltipEl.classList.add('show');
  });
}

function next() {
  goToStep(stepIndex + 1);
}

function finish() {
  if (!active) return;
  active = false;
  localStorage.setItem(SEEN_KEY, '1');
  overlayEl.classList.add('fade-out');
  setTimeout(() => {
    overlayEl.classList.add('hidden');
    overlayEl.classList.remove('fade-out', 'step-movement');
    spotlightEl.classList.remove('show');
    tooltipEl.classList.remove('show');
    swipeEl.classList.remove('show');
    swipeEl.classList.add('hidden');
  }, 360);
}

function start({ force = false } = {}) {
  if (active) return;
  if (!force && localStorage.getItem(SEEN_KEY)) return;
  active = true;
  overlayEl.classList.remove('hidden', 'fade-out');
  goToStep(0);
}

export function initTutorial(canvas) {
  canvasRef = canvas;

  nextBtn.addEventListener('click', next);
  skipBtn.addEventListener('click', finish);
  skipSwipeBtn.addEventListener('click', finish);
  howtoBtn.addEventListener('click', () => start({ force: true }));

  // Tampilkan otomatis begitu pemain pertama kali menekan "Mulai" (overlay
  // utama disembunyikan). Observer sekali-pakai, jauh lebih murah daripada
  // polling tiap frame; hanya dipasang sekali per sesi halaman.
  if (mainOverlayEl) {
    const obs = new MutationObserver(() => {
      if (mainOverlayEl.classList.contains('hidden')) {
        obs.disconnect();
        // Beri jeda singkat supaya HUD sempat ter-render sekali (nyawa, dsb)
        // sebelum spotlight menyorotnya, dan transisinya terasa lebih halus.
        setTimeout(() => start(), 150);
      }
    });
    obs.observe(mainOverlayEl, { attributes: true, attributeFilter: ['class'] });
  }
}

// Dipanggil main.js tiap frame dengan vektor input saat ini. Early-return
// murah saat tidak relevan — biaya nol selama bukan langkah gerakan aktif.
export function notifyInput(x, y) {
  if (!active || STEPS[stepIndex].id !== 'movement') return;
  if (Math.abs(x) > 0.05 || Math.abs(y) > 0.05) finish();
}

// Gameplay (game.update) dijeda selama langkah HUD (1-5) supaya pemain bisa
// fokus baca tooltip tanpa diserang; dilepas begitu masuk langkah gerakan.
export function isBlockingGameplay() {
  return active && STEPS[stepIndex].id !== 'movement';
}

// Dipanggil main.js setelah resize/orientasi berubah, supaya spotlight &
// tooltip tetap presisi menempel ke elemen targetnya.
export function reposition() {
  if (!active) return;
  const step = STEPS[stepIndex];
  if (step.id === 'movement') return;
  const rect = step.getRect();
  if (rect && rect.width >= 2 && rect.height >= 2) {
    applySpotlight(rect);
    positionTooltip(rect);
  }
}
