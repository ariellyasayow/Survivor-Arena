import { clamp } from '../utils/helpers.js';
import { WORLD_W, WORLD_H, OBSTACLES } from '../world/background.js';
import { drawSprite, frameForClip, spriteReady } from '../utils/assets.js';

export class Player {
  constructor() {
    this.x = WORLD_W / 2;
    this.y = WORLD_H / 2;
    this.r = 12;
    this.baseSpeed = 130; // px/detik
    this.facing = { x: 0, y: -1 };

    this.baseDamage = 8;
    this.baseFireRate = 0.5; // detik antar tembakan
    this.baseRange = 160;

    this.fireCooldown = 0;
    this.damageBuffUntil = 0;
    this.speedBuffUntil = 0;
    // --- MODIFIKASI: TIMER POWER-UP SHOTGUN & RAPID FIRE ---
    this.shotgunBuffUntil = 0;    // <--- DIUBAH JADI TIMER (BUKAN PERMANEN LAGI)
    this.rapidBuffUntil = 0;      // <--- DITAMBAHKAN: TIMER RAPID FIRE / MESIN (OPSI 3)
    this.currentElapsedTime = 0;

    this.invulnerableUntil = 0;

    // --- State animasi ---
    this.facingDir = -1;     // -1 = hadap kiri (West, default sprite), +1 = kanan
    this.moving = false;
    this.clipTime = 0;       // waktu berjalan di klip animasi aktif
    this.firingUntil = 0;    // tampilkan animasi firing sampai elapsedTime ini
    this.dead = false;
    this.deathTime = 0;      // waktu berjalan sejak mulai animasi death
  }

  get damage() {
    // Naik level (xp) menambah damage, sesuai "XP (tambah damage)" di Game UI.
    let currentDamage = this.baseDamage + (this.powerLevel || 0) * 2;
    // --- MODIFIKASI OPSI 3: KURANGI SEDIKIT DAMAGE AGAR RAPID FIRE SEIMBANG ---
    if (this.hasRapidFire(this.currentElapsedTime)) {
      currentDamage = Math.max(1, Math.round(currentDamage * 0.7)); // Damage turun 30%
    }
    return currentDamage;
  }

  // Dipanggil game.js tiap kali player berhasil menembak — amunisi infinite,
  // tidak ada magazine/reload lagi.
  notifyShot(elapsedTime) {
    this.firingUntil = elapsedTime + 0.35; // durasi tampil animasi firing
  }

  isInvulnerable(elapsedTime) {
    return elapsedTime < this.invulnerableUntil;
  }

  takeHit(elapsedTime, invulnSeconds = 1) {
    this.invulnerableUntil = elapsedTime + invulnSeconds;
  }

  startDeath() {
    if (!this.dead) {
      this.dead = true;
      this.deathTime = 0;
    }
  }

  // --- MODIFIKASI OPSI 3: METHOD PENGECEKAN STATUS RAPID FIRE ---
  hasRapidFire(elapsedTime) {
    return elapsedTime < this.rapidBuffUntil;
  }

  update(dt, input, elapsedTime) {
    this.currentElapsedTime = elapsedTime; // Simpan untuk referensi getter damage
    if (this.dead) {
      this.deathTime += dt;
      return;
    }

    let dx = input.x;
    let dy = input.y;
    const len = Math.hypot(dx, dy);
    this.moving = len > 0.001;
    if (this.moving) {
      dx /= len;
      dy /= len;
      this.facing = { x: dx, y: dy };
      // Update arah hadap horizontal hanya kalau ada komponen kiri/kanan.
      // Gerak vertikal murni mempertahankan arah hadap terakhir.
      if (Math.abs(dx) > 0.01) this.facingDir = dx < 0 ? -1 : 1;
    } else {
      dx = 0;
      dy = 0;
    }

    let nextX = this.x + dx * this.baseSpeed * dt;
    let nextY = this.y + dy * this.baseSpeed * dt;

    // Soft collision terhadap obstacle (pohon/batu): dorong keluar kalau tabrakan.
    for (const o of OBSTACLES) {
      const ddx = nextX - o.x;
      const ddy = nextY - o.y;
      const dist = Math.hypot(ddx, ddy);
      const minDist = this.r + o.r;
      if (dist < minDist && dist > 0.001) {
        const push = (minDist - dist) / dist;
        nextX += ddx * push;
        nextY += ddy * push;
      }
    }

    this.x = clamp(nextX, this.r, WORLD_W - this.r);
    this.y = clamp(nextY, this.r, WORLD_H - this.r);

    if (this.fireCooldown > 0) this.fireCooldown -= dt;

    this.clipTime += dt;
  }

  currentVisionRadius(elapsedTime, baseRadius) {
    return baseRadius;
  }

  currentBulletRange(elapsedTime) {
    return this.baseRange;
  }

  // --- MODIFIKASI: SEKARANG MENGECEK DURASI WAKTU (BUKAN PERMANEN LAGI) ---
  hasShotgun(elapsedTime) {
    return elapsedTime < this.shotgunBuffUntil;
  }

  // Pilih klip animasi aktif berdasarkan state. Mengembalikan nama sprite key.
  _activeClip(elapsedTime) {
    if (this.dead) return 'playerDeath';
    if (elapsedTime < this.firingUntil) return 'playerFiring';
    if (this.moving) return 'playerRun';
    return 'playerIdle';
  }

  draw(ctx, elapsedTime) {
    const mirror = this.facingDir > 0; // sprite sumber hadap kiri; kanan = mirror
    const size = this.r * 4.2;         // render sedikit lebih besar dari radius fisik

    // --- Path sprite ---
    const clip = this._activeClip(elapsedTime);
    if (spriteReady(clip)) {
      let frame;
      if (clip === 'playerRun') {
        // ping-pong biar loop lari mulus (maju lalu balik), tidak patah.
        frame = frameForClip(clip, this.clipTime, 12, 'pingpong').index;
      } else if (clip === 'playerFiring') {
        frame = frameForClip(clip, elapsedTime, 20, 'loop').index;
      } else if (clip === 'playerDeath') {
        frame = frameForClip(clip, this.deathTime, 10, 'once').index;
      } else {
        frame = 0; // idle
      }

      const blinking = this.isInvulnerable(elapsedTime) && Math.floor(elapsedTime * 12) % 2 === 0;
      if (blinking) ctx.globalAlpha = 0.4;
      drawSprite(ctx, clip, this.x, this.y, size, frame, mirror);
      ctx.globalAlpha = 1;
      return;
    }

    // --- Fallback primitif (kalau sprite belum ada) ---
    const blinking = this.isInvulnerable(elapsedTime) && Math.floor(elapsedTime * 12) % 2 === 0;
    if (blinking) ctx.globalAlpha = 0.4;

    ctx.fillStyle = '#FF6F59';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFC857';
    ctx.beginPath();
    ctx.arc(this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Indikator arah hadap
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(this.x + this.facing.x * this.r * 0.5, this.y + this.facing.y * this.r * 0.5, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }
}