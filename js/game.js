import { Player } from './entities/player.js';
import { Enemy } from './entities/enemy.js';
import { Projectile } from './entities/projectile.js';
import { PointItem } from './objects/point.js';
import { PowerUpItem } from './objects/powerup.js';
import { WORLD_W, WORLD_H, OBSTACLES, drawBackground } from './world/background.js';
import { updateHUD } from './ui/hud.js';
import { updateVFX, drawVFX, spawnHitParticles, spawnLevelUpBurst, spawnFloatingText, clearVFX } from './effects/vfx.js';
import { sfxShoot, sfxHit, sfxPoint, sfxLevelUp, sfxPowerUp, sfxMonster, sfxGameOver } from './effects/sfx.js';
import { POWERUP_TYPES, applyPowerUp } from './effects/powerup-effects.js';
import { circleCollide, distance, randRange, randInt, randomEdgePoint } from './utils/helpers.js';

// ---- Konfigurasi (gampang di-tuning di sini) -------------------------------
export const CONFIG = {
  STAGE_COUNT: 3,
  STAGE_TARGET: [15, 22, 30],       // target poin per stage
  STAGE_TIME: [45, 40, 40],         // detik per stage
  BASE_ENEMY_HP: 18,
  BASE_ENEMY_DAMAGE: 1,
  ENEMY_HP_GROWTH_PER_STAGE: 1.3,
  ENEMY_DMG_GROWTH_PER_STAGE: 1,
  ENEMY_SPEED: 55,
  ENEMY_SPAWN_INTERVAL: 1.8,        // detik antar spawn enemy
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
    this.state = 'intro'; // intro | playing | ended
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
    this.projectiles = [];
    this.points = [];
    this.powerUps = [];

    this.enemySpawnTimer = 0;
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

  // -------------------------------------------------------------- spawning --
  spawnEnemy() {
    const p = randomEdgePoint(WORLD_W, WORLD_H, 16);
    const hp = CONFIG.BASE_ENEMY_HP * Math.pow(CONFIG.ENEMY_HP_GROWTH_PER_STAGE, this.stageIndex);
    const dmg = CONFIG.BASE_ENEMY_DAMAGE + CONFIG.ENEMY_DMG_GROWTH_PER_STAGE * this.stageIndex;
    const speed = CONFIG.ENEMY_SPEED + this.stageIndex * 8;
    this.enemies.push(new Enemy(p.x, p.y, hp, dmg, speed));
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

  // ---------------------------------------------------------------- shoot --
  tryShoot() {
    if (this.player.fireCooldown > 0) return;
    if (this.enemies.length === 0) return;

    let nearest = null;
    let nearestDist = Infinity;
    for (const e of this.enemies) {
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
    this.projectiles.push(new Projectile(this.player.x, this.player.y, dx, dy, range, this.player.damage));
    this.player.fireCooldown = this.player.baseFireRate;
    sfxShoot();
  }

  // --------------------------------------------------------------- update --
  update(dt, input) {
    if (this.state !== 'playing') return;

    this.elapsedTime += dt;
    this.timeLeft -= dt;

    this.player.update(dt, input, this.elapsedTime);
    this.tryShoot();

    for (const proj of this.projectiles) proj.update(dt);
    this.projectiles = this.projectiles.filter((p) => !p.dead);

    for (const e of this.enemies) e.update(dt, this.player, this.elapsedTime, OBSTACLES);

    // Tabrakan peluru vs enemy
    for (const proj of this.projectiles) {
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (circleCollide(proj, e)) {
          e.takeDamage(proj.damage, this.elapsedTime);
          proj.dead = true;
          spawnHitParticles(e.x, e.y, '#7B3FE4', 6);
          sfxHit();
          if (e.dead) {
            this.onEnemyKilled(e);
          }
          break;
        }
      }
    }
    this.enemies = this.enemies.filter((e) => !e.dead);

    // Tabrakan enemy vs player
    if (!this.player.isInvulnerable(this.elapsedTime)) {
      for (const e of this.enemies) {
        if (circleCollide(this.player, e)) {
          this.onPlayerHit(e.damage);
          break;
        }
      }
    }

    // Ambil poin
    for (const pt of this.points) {
      if (!pt.collected && circleCollide(this.player, pt)) {
        pt.collected = true;
        this.onPointCollected(pt);
      }
    }
    this.points = this.points.filter((p) => !p.collected);

    // Ambil power-up
    for (const pu of this.powerUps) {
      if (!pu.collected && circleCollide(this.player, pu)) {
        pu.collected = true;
        applyPowerUp(pu.type, this.player, this);
        spawnFloatingText(pu.x, pu.y, 'Power up!', '#EAF2FF');
        sfxPowerUp();
      }
    }
    this.powerUps = this.powerUps.filter((p) => !p.collected);

    // Spawner
    this.enemySpawnTimer -= dt;
    if (this.enemySpawnTimer <= 0) {
      this.spawnEnemy();
      this.enemySpawnTimer = CONFIG.ENEMY_SPAWN_INTERVAL;
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

    // Cek target stage tercapai
    if (this.stageScore >= this.stageTarget) {
      this.advanceStage();
    } else if (this.timeLeft <= 0) {
      // Waktu habis sebelum target tercapai: kehilangan 1 nyawa, timer reset.
      this.timeLeft = CONFIG.STAGE_TIME[this.stageIndex];
      this.onPlayerHit(1, true);
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

  onPlayerHit(damage, fromTimeout = false) {
    this.lives -= 1;
    this.player.takeHit(this.elapsedTime, 1.2);
    spawnHitParticles(this.player.x, this.player.y, '#FF5470', 10);
    sfxHit();
    if (this.lives <= 0) {
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
    this.projectiles = [];
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

  // ---------------------------------------------------------------- render --
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, WORLD_W, WORLD_H);
    drawBackground(ctx, this.isNight);

    for (const pt of this.points) pt.draw(ctx, this.elapsedTime);
    for (const pu of this.powerUps) pu.draw(ctx, this.elapsedTime);
    for (const e of this.enemies) e.draw(ctx, this.elapsedTime);
    for (const proj of this.projectiles) proj.draw(ctx);
    this.player.draw(ctx, this.elapsedTime);

    drawVFX(ctx);

    if (this.isNight) {
      this.drawNightMask(ctx);
    }
  }

  drawNightMask(ctx) {
    const radius = this.player.currentVisionRadius(this.elapsedTime, CONFIG.NIGHT_VISION_RADIUS);
    ctx.fillStyle = 'rgba(0,0,0,0.86)';
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    ctx.globalCompositeOperation = 'destination-out';
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
    ctx.globalCompositeOperation = 'source-over';
  }
}
