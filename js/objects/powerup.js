import { POWERUP_META } from '../effects/powerup-effects.js';
import { drawSprite } from '../utils/assets.js';

export class PowerUpItem {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.r = 9;
    this.type = type;
    this.collected = false;
  }

  draw(ctx, elapsedTime) {
    const meta = POWERUP_META[this.type];
    const bob = Math.sin(elapsedTime * 3 + this.x) * 3;
    const y = this.y + bob;

    // Sprite generik jadi "badge" dasar (tetap ditinta sesuai warna tipe
    // power-up pakai globalCompositeOperation, biar 1 gambar bisa dipakai
    // untuk semua tipe tanpa perlu 4 file sprite terpisah).
    if (drawSprite(ctx, 'powerup', this.x, y, this.r * 2.2)) {
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = meta.color;
      ctx.fillRect(this.x - this.r, y - this.r, this.r * 2, this.r * 2);
      ctx.restore();
      return;
    }

    // Fallback primitif (dipakai selama sprite belum ada di assets/images/).
    ctx.fillStyle = meta.color;
    ctx.beginPath();
    ctx.arc(this.x, y, this.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#0B0F2B';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', this.x, y);
  }
}
