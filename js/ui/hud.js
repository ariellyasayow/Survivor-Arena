// =============================================
//  hud.js — Info di layar (nyawa, skor, level, waktu)
// =============================================
// Info seperti nyawa, level, timer, dan skor ditampilkan sebagai tulisan HTML
// di atas game, bukan digambar bareng game-nya. File ini bertugas memperbarui
// tulisan-tulisan itu tiap saat supaya selalu sesuai keadaan game.
import { formatTime } from '../utils/helpers.js';
import { POWERUP_META } from '../effects/powerup-effects.js';

const livesEl = document.getElementById('lives');
const stageLabelEl = document.getElementById('stage-label');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const levelBadgeEl = document.getElementById('level-badge');
const xpFillEl = document.getElementById('xp-bar-fill');
const buffListEl = document.getElementById('buff-list');

// Daftar efek sementara yang perlu ditampilkan (beserta ikon & lama efeknya
// dalam detik), buat memunculkan penanda hitung mundur di layar.
const TRACKED_BUFFS = [
  { key: 'damageBuffUntil', type: 'damage', icon: '\u2694\ufe0f', duration: 8 },
  { key: 'speedBuffUntil', type: 'speed', icon: '\u26a1', duration: 6 },
  { key: 'shotgunBuffUntil', type: 'shotgun', icon: '\ud83d\udca5', duration: 10 },
  { key: 'rapidBuffUntil', type: 'rapid', icon: '\ud83d\udd25', duration: 5 },
];

// Simpan penanda efek yang sudah dibuat, biar tidak dibuat ulang tiap saat.
const buffBadgeEls = {};

/** Ambil penanda efek untuk satu jenis (dibuat sekali, lalu dipakai ulang). */
function getBuffBadge(type) {
  if (buffBadgeEls[type]) return buffBadgeEls[type];

  const meta = POWERUP_META[type];
  const badge = document.createElement('div');
  badge.className = 'buff-badge';
  badge.innerHTML = `
    <span class="buff-icon"></span>
    <div class="buff-info">
      <div class="buff-name" style="color:${meta.color}">${meta.label}</div>
      <div class="buff-track"><div class="buff-fill" style="background:${meta.color}"></div></div>
    </div>
    <span class="buff-time"></span>
  `;
  buffListEl.appendChild(badge);

  const els = {
    root: badge,
    icon: badge.querySelector('.buff-icon'),
    fill: badge.querySelector('.buff-fill'),
    time: badge.querySelector('.buff-time'),
  };
  buffBadgeEls[type] = els;
  return els;
}

/** Perbarui semua info di layar (nyawa, level, timer, skor, XP, efek aktif). */
export function updateHUD(game) {
  livesEl.textContent = '\u2764'.repeat(game.lives) + '\u2661'.repeat(Math.max(0, game.maxLives - game.lives));
  stageLabelEl.textContent = `Lvl ${game.stageIndex + 1}/${game.stageCount}`;
  timerEl.textContent = formatTime(game.timeLeft);
  scoreEl.textContent = `Skor: ${game.score} | Target Poin: ${game.stageScore}/${game.stageTarget}`;
  levelBadgeEl.textContent = `${game.powerLevel + 1}`;
  const xpPct = Math.min(100, (game.xp / game.xpToNextLevel) * 100);
  xpFillEl.style.width = `${xpPct}%`;

  const player = game.player;
  for (const buff of TRACKED_BUFFS) {
    const remaining = player ? player[buff.key] - game.elapsedTime : 0;
    const els = getBuffBadge(buff.type);
    if (remaining > 0) {
      els.root.style.display = 'flex';
      els.icon.textContent = buff.icon;
      els.time.textContent = `${remaining.toFixed(1)}s`;
      const pct = Math.min(100, (remaining / buff.duration) * 100);
      els.fill.style.width = `${pct}%`;
    } else {
      els.root.style.display = 'none';
    }
  }
}