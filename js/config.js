// =============================================
//  config.js — Konstanta performa & presentasi
//  Mengikuti standar acuan drop_n_dash/src/config.js
// =============================================

// ── Dunia logis ─────────────────────────────
// Ukuran dunia game tetap 390×640 (dipakai untuk semua matematika gameplay:
// spawn, clamp, collision, night mask). Sumber kebenarannya tetap di
// world/background.js; di sini hanya di-re-export biar gampang diakses.
export { WORLD_W, WORLD_H } from './world/background.js';

// ── Presentasi / layout ─────────────────────
// Batasi device pixel ratio supaya tidak boros fill-rate GPU di layar
// high-DPR (mis. DPR 3 → dibatasi ke 2, hemat ~56% kerja GPU).
export const MAX_DPR = 2;

// ── Particle system ─────────────────────────
export const MAX_PARTICLES_HIGH = 60;   // cap partikel aktif saat quality tinggi
export const MAX_PARTICLES_LOW = 24;    // cap saat quality rendah
export const PARTICLE_POOL_SIZE = 80;   // pool statis yang dialokasi sekali

// ── Projectile pool ─────────────────────────
// Peluru player (magazine 50) + laser enemy3 bisa banyak sekaligus; pool
// mencegah alokasi objek/array baru tiap frame (hindari GC stutter).
export const PROJECTILE_POOL_SIZE = 80;

// ── Adaptive quality ────────────────────────
// dt dinormalisasi ke 60fps (dt=1 berarti 16.666ms). dt > 2.5 ≈ < 24 FPS.
export const LOW_FPS_THRESHOLD = 2.5;
export const QUALITY_DROP_FRAMES = 90;  // frame low-FPS beruntun sebelum turun quality

// ── Audio ───────────────────────────────────
export const AUDIO_THROTTLE_MS = 45;    // jarak minimum antar SFX yang sama
