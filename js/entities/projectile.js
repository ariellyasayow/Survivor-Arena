export class Projectile {
  constructor() {
    // Konstruktor kosong: instance dipakai ulang lewat pool (lihat reset()).
    this.active = false;
    this.reset(0, 0, 0, 0, 0, 0, false);
  }

  // Isi ulang instance yang sama dengan data tembakan baru (dipakai pool).
  reset(x, y, dirX, dirY, range, damage, isEnemy = false) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.dirX = dirX;
    this.dirY = dirY;
    this.speed = 320; // laser di-set 520 lewat isLaser sebelum update pertama
    this.vx = dirX * this.speed;
    this.vy = dirY * this.speed;
    this.range = range;
    this.damage = damage;
    this.r = 4;
    this.dead = false;
    this.isEnemy = isEnemy; // true = projectile dari enemy, false = dari player
    this.isLaser = false;   // di-set true oleh game.js untuk laser enemy3
    this._laserSpeedApplied = false;
    return this;
  }

  update(dt) {
    // Laser lebih cepat (berkas energi) — hanya di-apply sekali.
    if (this.isLaser && !this._laserSpeedApplied) {
      this.speed = 520;
      this.vx = this.dirX * this.speed;
      this.vy = this.dirY * this.speed;
      this.r = 5;
      this._laserSpeedApplied = true;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const traveled = Math.hypot(this.x - this.startX, this.y - this.startY);
    if (traveled >= this.range) this.dead = true;
  }

  draw(ctx) {
    if (this.isLaser) {
      // Laser: berkas garis dengan ekor bercahaya di belakang arah gerak.
      const tailLen = 18;
      const tx = this.x - this.dirX * tailLen;
      const ty = this.y - this.dirY * tailLen;
      ctx.save();
      ctx.lineCap = 'round';
      // Halo luar
      ctx.strokeStyle = 'rgba(180, 255, 120, 0.35)';
      ctx.lineWidth = this.r * 2.4;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();
      // Inti terang
      ctx.strokeStyle = '#C6FF6B';
      ctx.lineWidth = this.r;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Peluru biasa (bulatan): gold untuk player, biru gelap untuk enemy.
    ctx.fillStyle = this.isEnemy ? '#6C7AA8' : '#FFC857';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
  }
}
