import { POWERUP_META } from '../effects/powerup-effects.js';
import { drawSprite, frameForClip, spriteReady } from '../utils/assets.js';

// Font di-cache sebagai konstanta (hindari re-parse string tiap frame).
const F_BADGE = 'bold 9px sans-serif';
const F_FALLBACK = 'bold 10px sans-serif';

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

    // 'life' pakai sprite hati; tipe lain pakai orb berputar (diberi label
    // huruf kecil + tint tipis biar tetap bisa dibedakan antar tipe).
    const spriteKey = this.type === 'life' ? 'heart' : 'orb';
    const frame = frameForClip(spriteKey, elapsedTime, 10, 'loop').index;
    if (spriteReady(spriteKey) && drawSprite(ctx, spriteKey, this.x, y, this.r * 2.6, frame)) {
      if (this.type !== 'life') {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = meta.color;
        ctx.font = F_BADGE;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(meta.label[0], this.x, y - this.r - 4);
        ctx.restore();
      }
      return;
    }

    // Fallback primitif (dipakai selama sprite belum ada di assets/spritesheets/).
    ctx.fillStyle = meta.color;
    ctx.beginPath();
    ctx.arc(this.x, y, this.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#0B0F2B';
    ctx.font = F_FALLBACK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', this.x, y);
  }
}
