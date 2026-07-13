// Environment: ground bertekstur + obstacle pohon/batu.
// Di-render ke offscreen canvas sekali per mode (siang/malam) lalu di-cache,
// supaya tiap frame tinggal drawImage (murah), bukan redraw semua tiap frame.
//
// Kalau assets/spritesheets/ground/tile.webp tersedia, ground di-tile pakai
// gambar itu (di-repeat, jadi satu file kecil cukup buat seluruh dunia).
// Kalau belum, tetap pakai grassBase + patch warna solid seperti sekarang.

import { spriteReady, drawSprite, frameForClip } from '../utils/assets.js';

export const WORLD_W = 390;
export const WORLD_H = 640;

// Posisi obstacle tetap (dipakai untuk gambar DAN untuk collision).
export const OBSTACLES = [
  { x: 55, y: 80, r: 20, type: 'tree' },
  { x: 320, y: 55, r: 18, type: 'rock' },
  { x: 340, y: 190, r: 22, type: 'tree' },
  { x: 45, y: 230, r: 16, type: 'rock' },
  { x: 95, y: 430, r: 20, type: 'tree' },
  { x: 330, y: 440, r: 18, type: 'rock' },
  { x: 200, y: 540, r: 22, type: 'tree' },
  { x: 55, y: 575, r: 16, type: 'rock' },
  { x: 345, y: 580, r: 20, type: 'tree' },
  { x: 200, y: 150, r: 15, type: 'rock' },
];

const PALETTE = {
  day: {
    grassBase: '#8BC34A',
    grassPatchA: '#7CB342',
    grassPatchB: '#9CCC65',
    // Warna speckle rumput, di-sample dari assets-image/object/ground/GRASS+.png
    // (tile hijau tua). Dipakai sebagai noise organik, bukan tile berulang,
    // supaya tidak ada seam.
    grassSpeckle: ['#3B7D4F', '#63AB3F', '#2F5753'],
    treeCanopy: '#2E7D32',
    treeHighlight: '#66BB6A',
    treeShadow: 'rgba(27,94,32,0.3)',
    rockBase: '#9E9E9E',
    rockHighlight: 'rgba(189,189,189,0.7)',
    rockShadow: 'rgba(110,122,110,0.35)',
  },
  night: {
    grassBase: '#16281C',
    grassPatchA: '#12211a',
    grassPatchB: '#1d3324',
    grassSpeckle: ['#1c3a29', '#234a20', '#152a29'],
    treeCanopy: '#16321A',
    treeHighlight: 'rgba(58,107,71,0.5)',
    treeShadow: 'rgba(5,13,8,0.45)',
    rockBase: '#5B6670',
    rockHighlight: 'rgba(124,138,148,0.6)',
    rockShadow: 'rgba(10,20,15,0.5)',
  },
};

// PRNG deterministik (mulberry32) — supaya speckle rumput konsisten tiap kali
// cache dibangun ulang (tidak "berkedip" beda posisi kalau di-rebuild).
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawGrassSpeckle(ctx, p) {
  const rand = mulberry32(1337);
  const count = 900; // kepadatan speckle di seluruh dunia 390x640
  for (let i = 0; i < count; i++) {
    const x = rand() * WORLD_W;
    const y = rand() * WORLD_H;
    const size = 1.5 + rand() * 2.5;
    const color = p.grassSpeckle[Math.floor(rand() * p.grassSpeckle.length)];
    ctx.globalAlpha = 0.25 + rand() * 0.35;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, size, size * 0.6, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawTree(ctx, x, y, r, p) {
  ctx.fillStyle = p.treeShadow;
  ctx.beginPath();
  ctx.ellipse(x + r * 0.15, y + r * 0.3, r * 0.9, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = p.treeCanopy;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = p.treeHighlight;
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawRock(ctx, x, y, r, p) {
  ctx.fillStyle = p.rockShadow;
  ctx.beginPath();
  ctx.ellipse(x + r * 0.2, y + r * 0.25, r * 0.9, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = p.rockBase;
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.quadraticCurveTo(x - r * 0.8, y - r, x, y - r * 0.9);
  ctx.quadraticCurveTo(x + r, y - r * 0.7, x + r * 0.9, y);
  ctx.quadraticCurveTo(x + r, y + r * 0.7, x, y + r * 0.75);
  ctx.quadraticCurveTo(x - r * 0.9, y + r * 0.7, x - r, y);
  ctx.fill();

  ctx.fillStyle = p.rockHighlight;
  ctx.beginPath();
  ctx.ellipse(x - r * 0.2, y - r * 0.3, r * 0.35, r * 0.2, -0.4, 0, Math.PI * 2);
  ctx.fill();
}

const cache = { day: null, night: null };

function buildCache(isNight) {
  const key = isNight ? 'night' : 'day';
  const p = PALETTE[key];
  const off = document.createElement('canvas');
  off.width = WORLD_W;
  off.height = WORLD_H;
  const ctx = off.getContext('2d');

  ctx.fillStyle = p.grassBase;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  // Tekstur rumput: speckle noise (warna dari GRASS+.png), digambar sekali
  // ke cache — tidak ada biaya per-frame.
  drawGrassSpeckle(ctx, p);

  ctx.globalAlpha = 0.5;
  const patches = [
    [40, 40, 30, 16, p.grassPatchA], [150, 90, 34, 18, p.grassPatchB],
    [280, 40, 26, 14, p.grassPatchA], [340, 150, 30, 16, p.grassPatchB],
    [60, 200, 28, 15, p.grassPatchB], [220, 260, 26, 14, p.grassPatchA],
    [120, 340, 30, 16, p.grassPatchA], [300, 320, 28, 15, p.grassPatchB],
    [50, 480, 30, 16, p.grassPatchA], [250, 470, 26, 14, p.grassPatchB],
    [150, 580, 30, 16, p.grassPatchA], [330, 600, 24, 13, p.grassPatchB],
  ];
  for (const [x, y, rx, ry, color] of patches) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Rock statis dimasukkan ke cache (murah, tidak beranimasi).
  // Tree TIDAK di-cache di sini karena beranimasi — digambar per-frame di
  // drawBackground() lewat drawTreesAnimated().
  for (const o of OBSTACLES) {
    if (o.type === 'rock') {
      if (spriteReady('rock')) {
        drawSprite(ctx, 'rock', o.x, o.y, o.r * 2.6);
      } else {
        drawRock(ctx, o.x, o.y, o.r, p);
      }
    } else if (o.type === 'tree' && !spriteReady('tree')) {
      // Kalau sprite tree tidak ada, pakai versi primitif (statis) di cache.
      drawTree(ctx, o.x, o.y, o.r, p);
    }
  }

  if (isNight) {
    ctx.fillStyle = '#EAF2FF';
    const stars = [[30, 20], [90, 12], [160, 24], [230, 14], [300, 22], [360, 16], [60, 40]];
    for (const [x, y] of stars) {
      ctx.globalAlpha = 0.6 + Math.random() * 0.2;
      ctx.beginPath();
      ctx.arc(x, y, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  cache[key] = off;
}

export function drawBackground(ctx, isNight) {
  const key = isNight ? 'night' : 'day';
  if (!cache[key]) buildCache(isNight);
  ctx.drawImage(cache[key], 0, 0);
  // Pohon beranimasi digambar di atas cache (kalau sprite tree tersedia).
  drawTreesAnimated(ctx, isNight);
}

// Pohon animasi (16 frame ayunan). Semua pohon pakai frame yang sama tapi
// di-offset fase-nya biar tidak bergerak seragam. Kalau sprite tree tidak
// ada, ini no-op (versi primitif sudah masuk cache).
function drawTreesAnimated(ctx, isNight) {
  if (!spriteReady('tree')) return;
  const t = performance.now() / 1000;
  for (const o of OBSTACLES) {
    if (o.type !== 'tree') continue;
    const frame = frameForClip('tree', t + o.x * 0.03, 8, 'pingpong').index;
    // Pohon digambar lebih besar dari radius collision-nya biar proporsional.
    drawSprite(ctx, 'tree', o.x, o.y - o.r * 0.6, o.r * 4.0, frame);
  }
  if (isNight) {
    // Redupkan sedikit pohon di malam hari biar menyatu dg suasana.
    // (opsional; night mask utama tetap dari game.drawNightMask)
  }
}
