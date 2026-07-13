import { Player } from './entities/player.js';
import { Enemy } from './entities/enemy.js';
import { Enemy2 } from './entities/enemy2.js';
import { Enemy3 } from './entities/enemy3.js';
import {
  spawnProjectile, updateProjectiles, drawProjectiles,
  forEachActiveProjectile, clearProjectiles,
} from './entities/projectilePool.js';
import { PointItem } from './objects/point.js';
import { PowerUpItem } from './objects/powerup.js';
import { WORLD_W, WORLD_H, OBSTACLES, drawBackground } from './world/background.js';
import { updateHUD } from './ui/hud.js';
import { updateVFX, drawVFX, spawnHitParticles, spawnLevelUpBurst, spawnFloatingText, clearVFX } from './effects/vfx.js';
import { sfxShoot, sfxHit, sfxPoint, sfxLevelUp, sfxPowerUp, sfxMonster, sfxGameOver, sfxExplosion, sfxLaser, sfxSwing } from './effects/sfx.js';
import { POWERUP_TYPES, applyPowerUp } from './effects/powerup-effects.js';
import { circleCollide, distance, randRange, randInt, randomEdgePoint } from './utils/helpers.js';
import { spriteReady } from './utils/assets.js';
import { viewport, camera, updateCamera } from './viewport.js';
import { VIEWPORT_W, VIEWPORT_H } from './config.js';
import { isLowQuality } from './quality.js';

export const CONFIG = {
  STAGE_COUNT: 3,
  STAGE_TARGET: [15, 22, 30],
  STAGE_TIME: [45, 40, 40],
  BASE_ENEMY_HP: 18,
  BASE_ENEMY_DAMAGE: 1,
  ENEMY_HP_GROWTH_PER_STAGE: 1.3,
  ENEMY_DMG_GROWTH_PER_STAGE: 1,
  ENEMY_SPEED: 55,
  ENEMY_SPAWN_INTERVAL: 1.8,
  MAX_ENEMY1: 8,
  MAX_ENEMY2: 3,
  MAX_ENEMY3: 3,
  POINT_SPAWN_INTERVAL: 2.2,
  POWERUP_SPAWN_INTERVAL: 9,
  MAX_LIVES: 5,
  START_LIVES: 3,
  XP_TO_LEVEL_BASE: 40,
  NIGHT_VISION_RADIUS: 130,
};

const overlayEl = document.getElementById('overlay');
const overlayTitleEl = document.getElementById('overlay-title');
const overlayMessageEl = document.getElementById('overlay-message');
const overlayButtonEl = document.getElementById('overlay-button');

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.reset();

    overlayButtonEl.addEventListener('click', () => {
      if (this.state === 'ended') {
        this.reset();
      }
      this.state = 'playing';
      overlayEl.classList.add('hidden');
    });
  }

  reset() {
    this.state = 'intro';
    this.elapsedTime = 0;
    this.stageIndex = 0;
    this.stageCount = CONFIG.STAGE_COUNT;
    this.stageTarget = CONFIG.STAGE_TARGET[0];
    this.timeLeft = CONFIG.STAGE_TIME[0];

    this.score = 0;
    this.stageScore = 0;
    this.xp = 0;
    this.powerLevel = 0;
    this.xpToNextLevel = CONFIG.XP_TO_LEVEL_BASE;

    this.lives = CONFIG.START_LIVES;
    this.maxLives = CONFIG.MAX_LIVES;

    this.player = new Player();
    this.player.powerLevel = 0;
    this.enemies = [];
    this.enemy2s = [];
    this.enemy3s = [];
    clearProjectiles();
    this.points = [];
    this.powerUps = [];

    this.enemySpawnTimer = 0;
    this.enemy2SpawnTimer = 3.5;
    this.enemy3SpawnTimer = 5.0;
    this.pointSpawnTimer = 0.5;
    this.powerUpSpawnTimer = CONFIG.POWERUP_SPAWN_INTERVAL;

    clearVFX();

    overlayTitleEl.textContent = 'Survivor Arena';
    overlayMessageEl.textContent = 'Kumpulkan poin, hindari & hajar musuh, bertahan sampai waktu habis.\nLevel terakhir akan gelap.';
    overlayButtonEl.textContent = 'Mulai';
    overlayEl.classList.remove('hidden');
  }

  get isNight() {
    return this.stageIndex === this.stageCount - 1;
  }

  spawnEnemy() {
    const p = randomEdgePoint(WORLD_W, WORLD_H, 16);
    const hp = CONFIG.BASE_ENEMY_HP * Math.pow(CONFIG.ENEMY_HP_GROWTH_PER_STAGE, this.stageIndex);
    const dmg = CONFIG.BASE_ENEMY_DAMAGE + CONFIG.ENEMY_DMG_GROWTH_PER_STAGE * this.stageIndex;
    const speed = CONFIG.ENEMY_SPEED + this.stageIndex * 8;
    this.enemies.push(new Enemy(p.x, p.y, hp, dmg, speed));
    sfxMonster();
  }

  spawnEnemy2() {
    const p = randomEdgePoint(WORLD_W, WORLD_H, 16);
    const baseHp = CONFIG.BASE_ENEMY_HP * Math.pow(CONFIG.ENEMY_HP_GROWTH_PER_STAGE, this.stageIndex);
    const hp = baseHp * 0.75;
    const dmg = CONFIG.BASE_ENEMY_DAMAGE + CONFIG.ENEMY_DMG_GROWTH_PER_STAGE * this.stageIndex;
    const speed = CONFIG.ENEMY_SPEED + this.stageIndex * 8;
    this.enemy2s.push(new Enemy2(p.x, p.y, hp, dmg, speed));
    sfxMonster();
  }

  spawnEnemy3() {
    const p = randomEdgePoint(WORLD_W, WORLD_H, 16);
    const hp = CONFIG.BASE_ENEMY_HP * Math.pow(CONFIG.ENEMY_HP_GROWTH_PER_STAGE, this.stageIndex);
    const dmg = CONFIG.BASE_ENEMY_DAMAGE + CONFIG.ENEMY_DMG_GROWTH_PER_STAGE * this.stageIndex;
    const speed = CONFIG.ENEMY_SPEED + this.stageIndex * 8;
    this.enemy3s.push(new Enemy3(p.x, p.y, hp, dmg, speed));
    sfxMonster();
  }

  spawnPoint() {
    const margin = 24;
    const x = randRange(margin, WORLD_W - margin);
    const y = randRange(margin, WORLD_H - margin);
    this.points.push(new PointItem(x, y, 1));
  }

  spawnPowerUp() {
    const margin = 24;
    const x = randRange(margin, WORLD_W - margin);
    const y = randRange(margin, WORLD_H - margin);
    const type = POWERUP_TYPES[randInt(0, POWERUP_TYPES.length - 1)];
    this.powerUps.push(new PowerUpItem(x, y, type));
  }

  allEnemies() {
    return [...this.enemies, ...this.enemy2s, ...this.enemy3s];
  }

  tryShoot() {
    if (this.player.fireCooldown > 0) return;
    if (this.player.isReloading(this.elapsedTime)) return;

    let nearest = null;
    let nearestDist = Infinity;
    for (const e of this.allEnemies()) {
      if (!e.isTargetable) continue;
      const d = distance(this.player, e);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = e;
      }
    }
    if (!nearest) return;

    const range = this.player.currentBulletRange(this.elapsedTime);
    if (nearestDist > range) return;

    const dx = (nearest.x - this.player.x) / nearestDist;
    const dy = (nearest.y - this.player.y) / nearestDist;
    spawnProjectile(this.player.x, this.player.y, dx, dy, range, this.player.damage);
    this.player.fireCooldown = this.player.baseFireRate;
    this.player.notifyShot(this.elapsedTime);
    sfxShoot();
  }

  update(dt, input) {
    if (this.state === 'dying') {
      this.elapsedTime += dt;
      this.player.update(dt, { x: 0, y: 0 }, this.elapsedTime);
      updateCamera(this.player.x, this.player.y);
      updateVFX(dt);
      if (this.player.deathTime >= 0.9) {
        this.endGame(false);
      }
      return;
    }

    if (this.state !== 'playing') return;

    this.elapsedTime += dt;
    this.timeLeft -= dt;

    this.player.update(dt, input, this.elapsedTime);
    updateCamera(this.player.x, this.player.y);
    this.tryShoot();

    updateProjectiles(dt);

    for (const e of this.enemies) {
      const wasAttacking = e.attacking;
      e.update(dt, this.player, this.elapsedTime, OBSTACLES);
      if (!wasAttacking && e.attacking) {
        sfxSwing();
      }
    }
    for (const e2 of this.enemy2s) {
      e2.update(dt, this.player, this.elapsedTime, OBSTACLES);
      if (e2.consumeExplosionTrigger()) {
        spawnHitParticles(e2.x, e2.y, '#FF6B4A', 14);
        sfxExplosion();
      }
      if (e2.hitsPlayerNow(this.player)) {
        this.onPlayerHit(1, { instantKill: true });
      }
    }
    for (const e3 of this.enemy3s) {
      e3.update(dt, this.player, this.elapsedTime, OBSTACLES);
      if (e3.shouldFireLaser()) {
        const dx = this.player.x - e3.x;
        const dy = this.player.y - e3.y;
        const dist = Math.hypot(dx, dy) || 1;
        const dirX = dx / dist;
        const dirY = dy / dist;
        const muzzle = e3.r + 8;
        const sx = e3.x + dirX * muzzle;
        const sy = e3.y + dirY * muzzle;
        const laser = spawnProjectile(sx, sy, dirX, dirY, e3.attackRange, e3.damage, true);
        laser.isLaser = true;
        sfxLaser();
      }
    }

    forEachActiveProjectile((proj) => {
      if (proj.isEnemy) return;
      for (const e of this.enemies) {
        if (e.dying) continue;
        if (circleCollide(proj, e)) {
          e.takeDamage(proj.damage, this.elapsedTime);
          proj.dead = true;
          spawnHitParticles(e.x, e.y, '#7B3FE4', 6);
          sfxHit();
          if (e.defeated) {
            e.startDeath();
            this.onEnemyKilled(e);
          }
          break;
        }
      }
      for (const e2 of this.enemy2s) {
        if (e2.dying || e2.attacking) continue;
        if (circleCollide(proj, e2)) {
          e2.takeDamage(proj.damage, this.elapsedTime);
          proj.dead = true;
          spawnHitParticles(e2.x, e2.y, '#FF6B4A', 6);
          sfxHit();
          if (e2.defeated) {
            e2.startDeath();
            this.onEnemyKilled(e2);
          }
          break;
        }
      }
      for (const e3 of this.enemy3s) {
        if (e3.dying) continue;
        if (circleCollide(proj, e3)) {
          e3.takeDamage(proj.damage, this.elapsedTime);
          proj.dead = true;
          spawnHitParticles(e3.x, e3.y, '#4A90E2', 6);
          sfxHit();
          if (e3.defeated) {
            e3.startDeath();
            this.onEnemyKilled(e3);
          }
          break;
        }
      }
    });

    this.enemies = this.enemies.filter((e) => !e.isGone());
    this.enemy2s = this.enemy2s.filter((e2) => !e2.isGone());
    this.enemy3s = this.enemy3s.filter((e3) => !e3.isGone());

    for (const e of this.enemies) {
      if (e.shouldDealDamage(this.player)) {
        this.onPlayerHit(1);
      }
    }

    if (!this.player.isInvulnerable(this.elapsedTime)) {
      let alreadyHit = false;
      forEachActiveProjectile((proj) => {
        if (alreadyHit || !proj.isEnemy || proj.dead) return;
        if (circleCollide(this.player, proj)) {
          alreadyHit = true;
          this.onPlayerHit(1);
          proj.dead = true;
        }
      });
    }

    for (const pt of this.points) {
      if (!pt.collected && circleCollide(this.player, pt)) {
        pt.collected = true;
        this.onPointCollected(pt);
      }
    }
    this.points = this.points.filter((p) => !p.collected);

    for (const pu of this.powerUps) {
      if (!pu.collected && circleCollide(this.player, pu)) {
        pu.collected = true;
        applyPowerUp(pu.type, this.player, this);
        spawnFloatingText(pu.x, pu.y, 'Power up!', '#EAF2FF');
        sfxPowerUp();
      }
    }
    this.powerUps = this.powerUps.filter((p) => !p.collected);

    const alive = (arr) => arr.filter((e) => !e.dying).length;

    this.enemySpawnTimer -= dt;
    if (this.enemySpawnTimer <= 0) {
      if (alive(this.enemies) < CONFIG.MAX_ENEMY1) this.spawnEnemy();
      this.enemySpawnTimer = CONFIG.ENEMY_SPAWN_INTERVAL;
    }
    this.enemy2SpawnTimer -= dt;
    if (this.enemy2SpawnTimer <= 0) {
      if (alive(this.enemy2s) < CONFIG.MAX_ENEMY2) this.spawnEnemy2();
      this.enemy2SpawnTimer = CONFIG.ENEMY_SPAWN_INTERVAL * 2.5;
    }
    this.enemy3SpawnTimer -= dt;
    if (this.enemy3SpawnTimer <= 0) {
      if (alive(this.enemy3s) < CONFIG.MAX_ENEMY3) this.spawnEnemy3();
      this.enemy3SpawnTimer = CONFIG.ENEMY_SPAWN_INTERVAL * 3.0;
    }
    this.pointSpawnTimer -= dt;
    if (this.pointSpawnTimer <= 0) {
      this.spawnPoint();
      this.pointSpawnTimer = CONFIG.POINT_SPAWN_INTERVAL;
    }
    this.powerUpSpawnTimer -= dt;
    if (this.powerUpSpawnTimer <= 0) {
      this.spawnPowerUp();
      this.powerUpSpawnTimer = CONFIG.POWERUP_SPAWN_INTERVAL;
    }

    updateVFX(dt);

    if (this.stageScore >= this.stageTarget) {
      this.advanceStage();
    } else if (this.timeLeft <= 0) {
      this.timeLeft = CONFIG.STAGE_TIME[this.stageIndex];
      this.onPlayerHit(1, { fromTimeout: true });
    }

    updateHUD(this);
  }

  onPointCollected(pt) {
    this.score += 10 * pt.value;
    this.stageScore += pt.value;
    this.xp += 8;
    spawnFloatingText(pt.x, pt.y, '+10', '#FFC857');
    sfxPoint();
    this.checkPowerLevelUp();
  }

  onEnemyKilled(enemy) {
    this.score += 15;
    this.xp += 12;
    spawnFloatingText(enemy.x, enemy.y - 10, '+15', '#FF6F59');
    this.checkPowerLevelUp();
  }

  checkPowerLevelUp() {
    if (this.xp >= this.xpToNextLevel) {
      this.xp -= this.xpToNextLevel;
      this.powerLevel += 1;
      this.player.powerLevel = this.powerLevel;
      this.xpToNextLevel = Math.round(this.xpToNextLevel * 1.25);
      this.lives = Math.min(this.maxLives, this.lives + 1);
      spawnLevelUpBurst(this.player.x, this.player.y);
      sfxLevelUp();
    }
  }

  onPlayerHit(damage = 1, { fromTimeout = false, instantKill = false } = {}) {
    if (!fromTimeout && this.player.isInvulnerable(this.elapsedTime)) return;
    this.lives -= instantKill ? this.lives : damage;
    if (this.lives < 0) this.lives = 0;
    this.player.takeHit(this.elapsedTime, 1.2);
    spawnHitParticles(this.player.x, this.player.y, '#FF5470', 10);
    sfxHit();
    if (this.lives <= 0) {
      this.startPlayerDeath();
    }
  }

  startPlayerDeath() {
    this.player.startDeath();
    sfxGameOver();
    if (spriteReady('playerDeath')) {
      this.state = 'dying';
    } else {
      this.endGame(false);
    }
  }

  advanceStage() {
    this.stageIndex += 1;
    if (this.stageIndex >= this.stageCount) {
      this.endGame(true);
      return;
    }
    this.stageScore = 0;
    this.stageTarget = CONFIG.STAGE_TARGET[this.stageIndex];
    this.timeLeft = CONFIG.STAGE_TIME[this.stageIndex];
    this.enemies = [];
    this.enemy2s = [];
    this.enemy3s = [];
    clearProjectiles();
    this.enemy2SpawnTimer = 3.5;
    this.enemy3SpawnTimer = 5.0;
    spawnLevelUpBurst(this.player.x, this.player.y, '#2DE1C7');
    sfxLevelUp();
  }

  endGame(won) {
    this.state = 'ended';
    sfxGameOver();
    overlayTitleEl.textContent = won ? 'Kamu selamat!' : 'Game over';
    overlayMessageEl.textContent = won
      ? `Semua level selesai. Skor akhir: ${this.score}`
      : `Kehabisan nyawa di level ${this.stageIndex + 1}. Skor akhir: ${this.score}`;
    overlayButtonEl.textContent = 'Main lagi';
    overlayEl.classList.remove('hidden');
  }

  render() {
    const ctx = this.ctx;
    const { scale, offsetX, offsetY } = viewport;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#05070f';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VIEWPORT_W, VIEWPORT_H);
    ctx.clip();

    // Geser kanvas berlawanan arah dengan posisi kamera
    ctx.translate(-camera.x, -camera.y);

    drawBackground(ctx, this.isNight);

    for (const pt of this.points) pt.draw(ctx, this.elapsedTime);
    for (const pu of this.powerUps) pu.draw(ctx, this.elapsedTime);
    for (const e of this.enemies) e.draw(ctx, this.elapsedTime);
    for (const e2 of this.enemy2s) e2.draw(ctx, this.elapsedTime);
    for (const e3 of this.enemy3s) e3.draw(ctx, this.elapsedTime);
    drawProjectiles(ctx);
    this.player.draw(ctx, this.elapsedTime);

    drawVFX(ctx);

    if (this.isNight) {
      this.drawNightMask(ctx);
    }

    ctx.restore();

    // Gambar Mini-Map di atas layer game logis (tanpa offset kamera)
    if (this.state === 'playing' || this.state === 'dying') {
      this.drawMiniMap(ctx);
    }
  }

  drawNightMask(ctx) {
    const radius = this.player.currentVisionRadius(this.elapsedTime, CONFIG.NIGHT_VISION_RADIUS);
    ctx.fillStyle = 'rgba(0,0,0,0.86)';
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    ctx.globalCompositeOperation = 'destination-out';
    if (isLowQuality()) {
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, radius * 0.85, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const gradient = ctx.createRadialGradient(
        this.player.x, this.player.y, radius * 0.3,
        this.player.x, this.player.y, radius,
      );
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(this.player.x, this.player.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  drawMiniMap(ctx) {
    const mapW = 90;
    const mapH = 90;
    const margin = 12;
    const mapX = VIEWPORT_W - mapW - margin;
    const mapY = margin;

    ctx.save();
    // Background minimap
    ctx.fillStyle = 'rgba(11, 15, 43, 0.85)';
    ctx.fillRect(mapX, mapY, mapW, mapH);
    ctx.strokeStyle = '#2DE1C7';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(mapX, mapY, mapW, mapH);

    const scaleX = mapW / WORLD_W;
    const scaleY = mapH / WORLD_H;

    // Titik Musuh (Merah)
    ctx.fillStyle = '#FF5470';
    for (const e of this.allEnemies()) {
      if (e.dying) continue;
      ctx.fillRect(mapX + e.x * scaleX - 1.5, mapY + e.y * scaleY - 1.5, 3, 3);
    }

    // Area Kamera / Viewport (Garis samar)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      mapX + camera.x * scaleX,
      mapY + camera.y * scaleY,
      VIEWPORT_W * scaleX,
      VIEWPORT_H * scaleY
    );

    // Titik Player (Kuning/Emas)
    ctx.fillStyle = '#FFC857';
    ctx.beginPath();
    ctx.arc(mapX + this.player.x * scaleX, mapY + this.player.y * scaleY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}