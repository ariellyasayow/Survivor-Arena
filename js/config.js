// =============================================
//  config.js — Konstanta performa & presentasi
// =============================================

// ── Dunia logis & Viewport ───────────────────
export { WORLD_W, WORLD_H } from './world/background.js';
export const VIEWPORT_W = 390; // Lebar area layar yang terlihat
export const VIEWPORT_H = 640; // Tinggi area layar yang terlihat

// ── Presentasi / layout ─────────────────────
export const MAX_DPR = 2;

// ── Particle system ─────────────────────────
export const MAX_PARTICLES_HIGH = 60;
export const MAX_PARTICLES_LOW = 24;
export const PARTICLE_POOL_SIZE = 80;

// ── Projectile pool ─────────────────────────
export const PROJECTILE_POOL_SIZE = 80;

// ── Adaptive quality ────────────────────────
export const LOW_FPS_THRESHOLD = 2.5;
export const QUALITY_DROP_FRAMES = 90;

// ── Audio ───────────────────────────────────
export const AUDIO_THROTTLE_MS = 45;