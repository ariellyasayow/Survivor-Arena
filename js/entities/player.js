import { clamp } from '../utils/helpers.js';
import { WORLD_W, WORLD_H, OBSTACLES } from '../world/background.js';

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
    this.rangeBuffUntil = 0;
    this.visionBuffUntil = 0;

    this.invulnerableUntil = 0;
  }

  get damage() {
    // Naik level (xp) menambah damage, sesuai "XP (tambah damage)" di Game UI.
    return this.baseDamage + (this.powerLevel || 0) * 2;
  }

  isInvulnerable(elapsedTime) {
    return elapsedTime < this.invulnerableUntil;
  }

  takeHit(elapsedTime, invulnSeconds = 1) {
    this.invulnerableUntil = elapsedTime + invulnSeconds;
  }

  update(dt, input, elapsedTime) {
    let dx = input.x;
    let dy = input.y;
    const len = Math.hypot(dx, dy);
    if (len > 0.001) {
      dx /= len;
      dy /= len;
      this.facing = { x: dx, y: dy };
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
  }

  currentVisionRadius(elapsedTime, baseRadius) {
    if (elapsedTime < this.visionBuffUntil) return baseRadius * 1.6;
    return baseRadius;
  }

  currentBulletRange(elapsedTime) {
    if (elapsedTime < this.rangeBuffUntil) return this.baseRange * 1.5;
    return this.baseRange;
  }

  draw(ctx, elapsedTime) {
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
