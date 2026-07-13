import { drawSprite } from '../utils/assets.js';

export class PointItem {
  constructor(x, y, value = 1) {
    this.x = x;
    this.y = y;
    this.r = 7;
    this.value = value;
    this.collected = false;
    this.spawnTime = performance.now();
  }

  draw(ctx, elapsedTime) {
    const pulse = 1 + Math.sin(elapsedTime * 4 + this.x) * 0.15;

    if (drawSprite(ctx, 'point', this.x, this.y, this.r * 2 * pulse)) return;

    // Fallback primitif (dipakai selama sprite belum ada di assets/images/).
    ctx.fillStyle = '#FFC857';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
