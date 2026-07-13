// Sistem efek visual ringan: partikel & teks melayang.
// Dioptimasi mengikuti acuan drop_n_dash/src/particles.js:
//  - object pooling (pool statis, tidak alokasi objek tiap spawn)
//  - swap-and-pop O(1) untuk hapus (bukan Array.filter yang alokasi array baru)
//  - cap jumlah partikel maksimum (di-tune oleh adaptive quality)

import { PARTICLE_POOL_SIZE, MAX_PARTICLES_HIGH } from '../config.js';

// Font teks melayang di-cache sebagai konstanta (hindari re-parse string tiap frame).
const F_FLOATING = 'bold 12px sans-serif';

// ── Cap partikel (diatur adaptive quality via setMaxParticles) ──
let _maxParticles = MAX_PARTICLES_HIGH;
export function setMaxParticles(n) { _maxParticles = n; }

// ── Object pool ─────────────────────────────
function makeParticle() {
  return { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 0, color: '', active: false };
}

const pool = [];
for (let i = 0; i < PARTICLE_POOL_SIZE; i++) pool.push(makeParticle());

function acquireParticle() {
  for (let i = 0; i < pool.length; i++) {
    if (!pool[i].active) return pool[i];
  }
  // Pool habis — buat baru (fallback, jarang terjadi karena ada cap).
  const p = makeParticle();
  pool.push(p);
  return p;
}

// ── Partikel aktif ──────────────────────────
let particles = [];
let floatingTexts = [];

function emit(x, y, vx, vy, life, size, color) {
  if (particles.length >= _maxParticles) return;
  const p = acquireParticle();
  p.x = x; p.y = y;
  p.vx = vx; p.vy = vy;
  p.life = life; p.maxLife = life;
  p.size = size; p.color = color;
  p.active = true;
  particles.push(p);
}

export function spawnHitParticles(x, y, color = '#FF5470', count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 60 + Math.random() * 60;
    emit(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 0.35, 2 + Math.random() * 2, color);
  }
}

export function spawnLevelUpBurst(x, y, color = '#FFC857') {
  for (let i = 0; i < 16; i++) {
    const angle = (Math.PI * 2 * i) / 16;
    const speed = 90 + Math.random() * 40;
    emit(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 0.6, 3, color);
  }
}

export function spawnFloatingText(x, y, text, color = '#EAF2FF') {
  floatingTexts.push({ x, y, text, color, life: 0.8, maxLife: 0.8 });
}

export function updateVFX(dt) {
  // Swap-and-pop: hapus O(1) tanpa alokasi array baru.
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.92;
    p.vy *= 0.92;
    p.life -= dt;
    if (p.life <= 0) {
      p.active = false;
      particles[i] = particles[particles.length - 1];
      particles.pop();
    }
  }

  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const t = floatingTexts[i];
    t.y -= 24 * dt;
    t.life -= dt;
    if (t.life <= 0) {
      floatingTexts[i] = floatingTexts[floatingTexts.length - 1];
      floatingTexts.pop();
    }
  }
}

export function drawVFX(ctx) {
  // Partikel digambar sebagai fillRect (lebih murah dari arc), mengikuti acuan.
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  if (floatingTexts.length > 0) {
    ctx.font = F_FLOATING;
    ctx.textAlign = 'center';
    for (let i = 0; i < floatingTexts.length; i++) {
      const t = floatingTexts[i];
      const alpha = Math.max(0, t.life / t.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}

export function clearVFX() {
  for (let i = 0; i < particles.length; i++) particles[i].active = false;
  particles.length = 0;
  floatingTexts.length = 0;
}
