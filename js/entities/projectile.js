export class Projectile {
  constructor() {
    this.active = false;
    this.reset(0, 0, 0, 0, 0, 0, false);
  }

  reset(x, y, dirX, dirY, range, damage, isEnemy = false) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.dirX = dirX;
    this.dirY = dirY;
    
    // Kecepatan awal: jika dari musuh (isEnemy) langsung rem ke angka 60!
    this.speed = isEnemy ? 60 : 360; 
    
    this.vx = dirX * this.speed;
    this.vy = dirY * this.speed;
    this.range = range;
    this.damage = damage;
    this.r = 4;
    this.dead = false;
    this.isEnemy = isEnemy; 
    this.isLaser = false;   
    this._laserSpeedApplied = false;
    return this;
  }

  update(dt) {
    if (this.isLaser && !this._laserSpeedApplied) {
      this.speed = 60; 
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
      const tailLen = 18;
      const tx = this.x - this.dirX * tailLen;
      const ty = this.y - this.dirY * tailLen;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255, 84, 112, 0.35)';
      ctx.lineWidth = this.r * 2.4;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();
      ctx.strokeStyle = '#FF5470';
      ctx.lineWidth = this.r;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(this.x, this.y);
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.fillStyle = this.isEnemy ? '#FF5470' : '#FFC857';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    ctx.fill();
  }
}