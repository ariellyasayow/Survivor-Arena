// Sistem efek visual ringan: partikel & teks melayang.
// Semua state disimpan di array module-level lalu di-update/digambar tiap frame.

let particles = [];
let floatingTexts = [];

export function spawnHitParticles(x, y, color = '#FF5470', count = 8) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 60 + Math.random() * 60;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.35,
      maxLife: 0.35,
      size: 2 + Math.random() * 2,
      color,
    });
  }
}

export function spawnLevelUpBurst(x, y, color = '#FFC857') {
  for (let i = 0; i < 16; i++) {
    const angle = (Math.PI * 2 * i) / 16;
    const speed = 90 + Math.random() * 40;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.6,
      maxLife: 0.6,
      size: 3,
      color,
    });
  }
}

export function spawnFloatingText(x, y, text, color = '#EAF2FF') {
  floatingTexts.push({ x, y, text, color, life: 0.8, maxLife: 0.8 });
}

export function updateVFX(dt) {
  particles = particles.filter((p) => p.life > 0);
  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.92;
    p.vy *= 0.92;
    p.life -= dt;
  }

  floatingTexts = floatingTexts.filter((t) => t.life > 0);
  for (const t of floatingTexts) {
    t.y -= 24 * dt;
    t.life -= dt;
  }
}

export function drawVFX(ctx) {
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  for (const t of floatingTexts) {
    const alpha = Math.max(0, t.life / t.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
  }
  ctx.globalAlpha = 1;
}

export function clearVFX() {
  particles = [];
  floatingTexts = [];
}
