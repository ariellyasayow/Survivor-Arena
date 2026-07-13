// Environment: ground bertekstur + obstacle pohon/batu.
// Di-render ke offscreen canvas sekali per mode (siang/malam) lalu di-cache,
// supaya tiap frame tinggal drawImage (murah), bukan redraw semua tiap frame.
//
// Kalau assets/images/bg-tile.webp tersedia, ground di-tile pakai gambar itu
// (di-repeat, jadi satu file kecil cukup buat seluruh dunia). Kalau belum,
// tetap pakai grassBase + patch warna solid seperti sekarang.

import { getSprite } from '../utils/assets.js';

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
    treeCanopy: '#16321A',
    treeHighlight: 'rgba(58,107,71,0.5)',
    treeShadow: 'rgba(5,13,8,0.45)',
    rockBase: '#5B6670',
    rockHighlight: 'rgba(124,138,148,0.6)',
    rockShadow: 'rgba(10,20,15,0.5)',
  },
};

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

  const bgTile = getSprite('bgTile');
  if (bgTile && bgTile.ready) {
    const pattern = ctx.createPattern(bgTile.img, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    if (isNight) {
      ctx.fillStyle = 'rgba(5,10,8,0.55)';
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
  } else {
    ctx.fillStyle = p.grassBase;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  }

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

  for (const o of OBSTACLES) {
    if (o.type === 'tree') drawTree(ctx, o.x, o.y, o.r, p);
    else drawRock(ctx, o.x, o.y, o.r, p);
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
}
