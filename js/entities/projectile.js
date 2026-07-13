import { drawSprite } from '../utils/assets.js';

export class Projectile {
  constructor(x, y, dirX, dirY, range, damage) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.vx = dirX * 320;
    this.vy = dirY * 320;
    this.range = range;
    this.damage = damage;
    this.r = 4;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const traveled = Math.hypot(this.x - this.startX, this.y - this.startY);
    if (traveled >= this.range) this.dead = true;
  }

  draw(ctx) {
    if (drawSprite(ctx, 'projectile', this.x, this.y, this.r * 2.4)) return;

    // Fallback primitif (dipakai selama sprite belum ada di assets/images/).
    ctx.fillStyle = '#FFC857';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
  }
}
