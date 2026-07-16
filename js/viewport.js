// =============================================
//  viewport.js — Ukuran layar & kamera
// =============================================
// Mengatur bagaimana dunia game (yang besar) ditampilkan ke layar (yang kecil):
// menyesuaikan ukuran ke jendela, dan menggeser kamera mengikuti player.

import { WORLD_W, WORLD_H, VIEWPORT_W, VIEWPORT_H, MAX_DPR } from './config.js';

// Info skala & pergeseran gambar biar pas di layar apa pun ukurannya.
export const viewport = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  dpr: 1,
};

// Posisi kamera. speed = seberapa cepat kamera mengejar player
// (kecil = geraknya halus, 1 = langsung menempel).
export const camera = {
  x: 0,
  y: 0,
  speed: 0.08,
};

/** Ambil nilai di antara a dan b (buat gerak kamera yang halus). */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Geser kamera pelan-pelan supaya player selalu di tengah layar. Kamera
 * ditahan agar tidak menampilkan area kosong di luar batas dunia.
 */
export function updateCamera(playerX, playerY) {
  // Target kamera agar player tepat berada di tengah layar terlihat
  const targetX = playerX - VIEWPORT_W / 2;
  const targetY = playerY - VIEWPORT_H / 2;

  camera.x = lerp(camera.x, targetX, camera.speed);
  camera.y = lerp(camera.y, targetY, camera.speed);

  // Batasi (clamp) agar kamera tidak memperlihatkan area luar batas dunia
  camera.x = Math.max(0, Math.min(camera.x, WORLD_W - VIEWPORT_W));
  camera.y = Math.max(0, Math.min(camera.y, WORLD_H - VIEWPORT_H));
}

/**
 * Sesuaikan ukuran gambar ke ukuran jendela browser supaya pas dan tidak
 * gepeng. Dipanggil saat game dibuka dan tiap kali ukuran layar berubah.
 */
export function resizeViewport(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const cssW = window.innerWidth;
  const cssH = window.innerHeight;

  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);

  // Cari skala biar area terlihat (390x640) muat penuh di jendela
  const scale = Math.min(canvas.width / VIEWPORT_W, canvas.height / VIEWPORT_H);
  viewport.scale = scale;
  viewport.dpr = dpr;
  viewport.offsetX = (canvas.width - VIEWPORT_W * scale) / 2;
  viewport.offsetY = (canvas.height - VIEWPORT_H * scale) / 2;
}

/**
 * Ubah posisi sentuhan/klik di layar jadi posisi sebenarnya di dunia game
 * (memperhitungkan skala layar dan posisi kamera saat itu).
 */
export function clientToLogical(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const bx = (clientX - rect.left) * (canvas.width / rect.width);
  const by = (clientY - rect.top) * (canvas.height / rect.height);
  return {
    x: (bx - viewport.offsetX) / viewport.scale + camera.x,
    y: (by - viewport.offsetY) / viewport.scale + camera.y,
  };
}