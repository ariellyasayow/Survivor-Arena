// =============================================
//  viewport.js — Skala & letterbox canvas full-screen
//  Dunia logis 390×640 di-fit ke layar (jaga rasio), sisa jadi bar gelap.
// =============================================

import { WORLD_W, WORLD_H, MAX_DPR } from './config.js';

// State presentasi yang dibaca oleh render (game.js) & input (main.js).
// - scale   : px canvas per 1 unit dunia logis (sudah termasuk DPR)
// - offsetX : geser horizontal (px canvas) untuk memusatkan letterbox
// - offsetY : geser vertikal
export const viewport = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  dpr: 1,
};

// Hitung ukuran canvas & skala berdasarkan ukuran window saat ini.
// Panggil di awal dan tiap 'resize'.
export function resizeViewport(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const cssW = window.innerWidth;
  const cssH = window.innerHeight;

  // Ukuran buffer canvas dalam device pixel (tajam di layar retina, tapi
  // dibatasi MAX_DPR biar hemat).
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);

  // Fit dunia 390×640 ke layar sambil menjaga rasio (letterbox).
  const scale = Math.min(canvas.width / WORLD_W, canvas.height / WORLD_H);
  viewport.scale = scale;
  viewport.dpr = dpr;
  viewport.offsetX = (canvas.width - WORLD_W * scale) / 2;
  viewport.offsetY = (canvas.height - WORLD_H * scale) / 2;
}

// Konversi koordinat pointer (clientX/clientY dari event) ke koordinat dunia
// logis (0..WORLD_W, 0..WORLD_H). Berguna untuk interaksi tap di area game.
// Joystick TIDAK memakai ini (perhitungannya relatif ke base DOM-nya sendiri).
export function clientToLogical(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  // Posisi dalam device pixel canvas
  const bx = (clientX - rect.left) * (canvas.width / rect.width);
  const by = (clientY - rect.top) * (canvas.height / rect.height);
  return {
    x: (bx - viewport.offsetX) / viewport.scale,
    y: (by - viewport.offsetY) / viewport.scale,
  };
}
