// Pool objek untuk Projectile (peluru player + laser enemy3).
// Sama pola dengan effects/vfx.js: pool statis + swap-and-pop O(1) untuk
// hapus, supaya tidak alokasi array baru tiap frame (proyektil adalah entity
// paling sering berubah — magazine player 50 peluru + laser enemy3).

import { Projectile } from './projectile.js';
import { PROJECTILE_POOL_SIZE } from '../config.js';

const pool = [];
for (let i = 0; i < PROJECTILE_POOL_SIZE; i++) pool.push(new Projectile());

// Proyektil aktif saat ini (subset dari pool).
let active = [];

function acquire() {
  for (let i = 0; i < pool.length; i++) {
    if (!pool[i].active) return pool[i];
  }
  // Pool habis (jarang terjadi) — buat baru sebagai fallback.
  const p = new Projectile();
  pool.push(p);
  return p;
}

export function spawnProjectile(x, y, dirX, dirY, range, damage, isEnemy = false) {
  const p = acquire();
  p.reset(x, y, dirX, dirY, range, damage, isEnemy);
  p.active = true;
  active.push(p);
  return p;
}

export function updateProjectiles(dt) {
  // Swap-and-pop: hapus O(1) tanpa alokasi array baru.
  for (let i = active.length - 1; i >= 0; i--) {
    const p = active[i];
    p.update(dt);
    if (p.dead) {
      p.active = false;
      active[i] = active[active.length - 1];
      active.pop();
    }
  }
}

export function drawProjectiles(ctx) {
  for (let i = 0; i < active.length; i++) active[i].draw(ctx);
}

// Iterasi manual tanpa alokasi (dipakai untuk collision check di game.js).
export function forEachActiveProjectile(fn) {
  for (let i = 0; i < active.length; i++) fn(active[i]);
}

export function activeProjectileCount() {
  return active.length;
}

export function clearProjectiles() {
  for (let i = 0; i < active.length; i++) active[i].active = false;
  active.length = 0;
}
