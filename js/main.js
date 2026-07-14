import { Game } from './game.js';
import { unlockAudio } from './effects/sfx.js';
import { preloadSprites } from './utils/assets.js';
import { setMaxParticles } from './effects/vfx.js';
import { setRenderQuality } from './quality.js';
import { resizeViewport } from './viewport.js';
import {
  QUALITY_DROP_FRAMES, MAX_PARTICLES_HIGH, MAX_PARTICLES_LOW,
} from './config.js';
import { initFpsMeter, tickFpsMeter } from './debug/fpsMeter.js';

// Tampilkan FPS meter di pojok layar (buat tes performa langsung di HP tanpa
// kabel/DevTools). Tambahkan ?fps=0 di URL untuk menyembunyikannya.
if (new URLSearchParams(location.search).get('fps') !== '0') {
  initFpsMeter();
}

const canvas = document.getElementById('game-canvas');

// ---- Layout: canvas full-screen + skala letterbox (jaga rasio) -------------
resizeViewport(canvas);
window.addEventListener('resize', () => resizeViewport(canvas));

const game = new Game(canvas);

// Preload sprite (kalau ada) sebelum game loop jalan, supaya tidak ada
// gambar "pop-in" di tengah gameplay. Aman walau belum ada file gambar
// sama sekali — entity fallback ke bentuk primitif Canvas.
await preloadSprites();

// ---- Input keyboard (buat testing di desktop) ------------------------------
const keys = { up: false, down: false, left: false, right: false };

window.addEventListener('keydown', (e) => {
  unlockAudio();
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = true;
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = true;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = false;
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = false;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
});

// ---- Virtual joystick (buat mobile/touch) ----------------------------------
// Joystick memakai koordinat relatif ke base DOM-nya sendiri, jadi TIDAK
// terpengaruh skala/letterbox canvas.
const joystickBase = document.getElementById('joystick-base');
const joystickStick = document.getElementById('joystick-stick');
let joystickVector = { x: 0, y: 0 };
let activeTouchId = null;
const JOYSTICK_MAX = 34;

function joystickPointFromEvent(clientX, clientY) {
  const rect = joystickBase.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = clientX - cx;
  let dy = clientY - cy;
  const dist = Math.hypot(dx, dy);
  if (dist > JOYSTICK_MAX) {
    dx = (dx / dist) * JOYSTICK_MAX;
    dy = (dy / dist) * JOYSTICK_MAX;
  }
  joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;
  joystickVector = { x: dx / JOYSTICK_MAX, y: dy / JOYSTICK_MAX };
}

function resetJoystick() {
  joystickStick.style.transform = 'translate(0px, 0px)';
  joystickVector = { x: 0, y: 0 };
  activeTouchId = null;
}

// --- PENGAMAN TAMBAHAN: Reset semua input (joystick & keyboard) ---
function resetAllInputs() {
  resetJoystick();
  keys.up = false;
  keys.down = false;
  keys.left = false;
  keys.right = false;
}

joystickBase.addEventListener('touchstart', (e) => {
  if (e.cancelable) e.preventDefault();
  unlockAudio();
  const t = e.changedTouches[0];
  activeTouchId = t.identifier;
  joystickPointFromEvent(t.clientX, t.clientY);
}, { passive: false });

window.addEventListener('touchmove', (e) => {
  if (activeTouchId === null) return;
  if (e.cancelable) e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier === activeTouchId) {
      joystickPointFromEvent(t.clientX, t.clientY);
    }
  }
}, { passive: false });

window.addEventListener('touchend', (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === activeTouchId) resetJoystick();
  }
  // Pengaman 1: Jika sudah tidak ada jari yang menempel di layar, paksa reset!
  if (e.touches.length === 0) resetJoystick();
});

// --- PENGAMAN 2: Sentuhan terputus oleh sistem (telepon masuk, pop-up, geser keluar browser) ---
window.addEventListener('touchcancel', (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === activeTouchId) resetJoystick();
  }
  if (e.touches.length === 0) resetJoystick();
});

// --- PENGAMAN 3: Kehilangan fokus layar (ganti tab, buka panel notifikasi HP) ---
window.addEventListener('blur', resetAllInputs);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) resetAllInputs();
});

// Klik untuk unlock audio (aturan autoplay browser)
window.addEventListener('pointerdown', () => unlockAudio());

// Cegah context-menu (long-press) & seleksi teks saat interaksi di canvas.
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function currentInputVector() {
  let x = joystickVector.x;
  let y = joystickVector.y;
  if (x === 0 && y === 0) {
    if (keys.left) x -= 1;
    if (keys.right) x += 1;
    if (keys.up) y -= 1;
    if (keys.down) y += 1;
  }
  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  return { x, y };
}

// ---- Adaptive quality ------------------------------------------------------
// Turunkan kualitas (cap partikel) kalau FPS jatuh berkepanjangan.
// Catatan: dt di game ini dalam DETIK, jadi threshold low-FPS = 1/24 s.
const LOW_FPS_DT = 1 / 24; // ~0.0417 s per frame ≈ 24 FPS
let qualityLevel = 'high'; // 'high' | 'medium' | 'low'
let lowFpsCount = 0;

function checkPerformance(dt) {
  if (dt > LOW_FPS_DT) {
    lowFpsCount++;
  } else {
    lowFpsCount = Math.max(0, lowFpsCount - 2); // pulih lebih cepat dari turun
  }

  if (lowFpsCount > QUALITY_DROP_FRAMES && qualityLevel === 'high') {
    qualityLevel = 'medium';
    setRenderQuality('medium');
    setMaxParticles(Math.round((MAX_PARTICLES_HIGH + MAX_PARTICLES_LOW) / 2));
    lowFpsCount = 0;
  } else if (lowFpsCount > QUALITY_DROP_FRAMES && qualityLevel === 'medium') {
    qualityLevel = 'low';
    setRenderQuality('low');
    setMaxParticles(MAX_PARTICLES_LOW);
    lowFpsCount = 0;
  }
}

// ---- Game loop -------------------------------------------------------------
let lastTime = -1;

function loop(now) {
  // Frame pertama atau balik dari tab background (>500ms): reset, jangan
  // update fisika biar tidak ada lompatan.
  if (lastTime < 0 || now - lastTime > 500) {
    lastTime = now;
    requestAnimationFrame(loop);
    return;
  }

  const dt = Math.min(0.05, (now - lastTime) / 1000); // clamp anti spiral
  lastTime = now;

  tickFpsMeter(now);
  checkPerformance(dt);

  const input = currentInputVector();
  game.update(dt, input);
  game.render();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);