import { drawSprite } from '../utils/assets.js';

let enemyIdCounter = 0;

export class Enemy {
  constructor(x, y, hp, damage, speed) {
    this.id = enemyIdCounter++;
    this.x = x;
    this.y = y;
    this.r = 11;
    this.hp = hp;
    this.maxHp = hp;
    this.damage = damage;
    this.speed = speed;
    this.dead = false;
    this.hitFlashUntil = 0;
  }

  update(dt, target, elapsedTime, obstacles) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    let vx = (dx / dist) * this.speed;
    let vy = (dy / dist) * this.speed;

    let nextX = this.x + vx * dt;
    let nextY = this.y + vy * dt;

    for (const o of obstacles) {
      const ddx = nextX - o.x;
      const ddy = nextY - o.y;
      const d = Math.hypot(ddx, ddy);
      const minDist = this.r + o.r;
      if (d < minDist && d > 0.001) {
        const push = (minDist - d) / d;
        nextX += ddx * push;
        nextY += ddy * push;
      }
    }

    this.x = nextX;
    this.y = nextY;
  }

  takeDamage(amount, elapsedTime) {
    this.hp -= amount;
    this.hitFlashUntil = elapsedTime + 0.08;
    if (this.hp <= 0) this.dead = true;
  }

  draw(ctx, elapsedTime) {
    const flashing = elapsedTime < this.hitFlashUntil;

    if (drawSprite(ctx, 'enemy', this.x, this.y, this.r * 2.6)) {
      if (flashing) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else {
      // Fallback primitif (dipakai selama sprite belum ada di assets/images/).
      ctx.fillStyle = flashing ? '#FFFFFF' : '#7B3FE4';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#EAF2FF';
      ctx.beginPath();
      ctx.arc(this.x - 3, this.y - 2, 2, 0, Math.PI * 2);
      ctx.arc(this.x + 3, this.y - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mini health bar di atas kepala
    const w = this.r * 1.8;
    const hpRatio = Math.max(0, this.hp / this.maxHp);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(this.x - w / 2, this.y - this.r - 8, w, 3);
    ctx.fillStyle = '#FF5470';
    ctx.fillRect(this.x - w / 2, this.y - this.r - 8, w * hpRatio, 3);
  }
}
