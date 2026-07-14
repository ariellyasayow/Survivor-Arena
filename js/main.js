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
import { initTutorial, notifyInput, isBlockingGameplay, reposition as repositionTutorial } from './tutorial.js';

// Tampilkan FPS meter di pojok layar (buat tes performa langsung di HP tanpa
// kabel/DevTools). Tambahkan ?fps=0 di URL untuk menyembunyikannya.
if (new URLSearchParams(location.search).get('fps') !== '0') {
  initFpsMeter();
}

const canvas = document.getElementById('game-canvas');

// ---- Layout: canvas full-screen + skala letterbox (jaga rasio) -------------
resizeViewport(canvas);
window.addEventListener('resize', () => {
  resizeViewport(canvas);
  repositionTutorial();
});

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

// ---- Virtual joystick floating (buat mobile/touch) --------------------------
// Joystick TIDAK terkunci di satu posisi: muncul tepat di titik jari user
// pertama menyentuh zona kiri layar (#touch-controls), lalu drag dihitung
// relatif terhadap titik sentuh awal itu (origin), bukan posisi DOM tetap.
const touchZone = document.getElementById('touch-controls');
const joystickBase = document.getElementById('joystick-base');
const joystickStick = document.getElementById('joystick-stick');
let joystickVector = { x: 0, y: 0 };
let activeTouchId = null;
let originX = 0;
let originY = 0;
const JOYSTICK_MAX = 34;

function showJoystickAt(clientX, clientY) {
  const rect = touchZone.getBoundingClientRect();
  originX = clientX;
  originY = clientY;
  joystickBase.style.left = `${clientX - rect.left}px`;
  joystickBase.style.top = `${clientY - rect.top}px`;
  joystickBase.classList.add('active');
}

function joystickPointFromEvent(clientX, clientY) {
  let dx = clientX - originX;
  let dy = clientY - originY;
  const dist = Math.hypot(dx, dy);
  if (dist > JOYSTICK_MAX) {
    dx = (dx / dist) * JOYSTICK_MAX;
    dy = (dy / dist) * JOYSTICK_MAX;
  }
  joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;
  joystickVector = { x: dx / JOYSTICK_MAX, y: dy / JOYSTICK_MAX };
}

function resetJoystick() {
  joystickBase.classList.remove('active');
  joystickStick.style.transform = 'translate(0px, 0px)';
  joystickVector = { x: 0, y: 0 };
  activeTouchId = null;
}

touchZone.addEventListener('touchstart', (e) => {
  if (activeTouchId !== null) return; // sudah ada jari aktif, abaikan sentuhan lain
  if (e.cancelable) e.preventDefault();
  unlockAudio();
  const t = e.changedTouches[0];
  activeTouchId = t.identifier;
  showJoystickAt(t.clientX, t.clientY);
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
});

window.addEventListener('touchcancel', (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === activeTouchId) resetJoystick();
  }
});

// Klik untuk unlock audio (aturan autoplay browser)
window.addEventListener('pointerdown', () => unlockAudio());

// Cegah context-menu (long-press) & seleksi teks saat interaksi di canvas.
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// ---- Tutorial interaktif "How to Play" -------------------------------------
// Menggantikan hint swipe sederhana sebelumnya: sekarang menyorot tiap
// komponen HUD lalu diakhiri tutorial gerakan (lihat js/tutorial.js).
initTutorial(canvas);

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
  notifyInput(input.x, input.y);
  // Selama langkah HUD tutorial (1-5), gameplay dijeda supaya pemain fokus
  // baca tooltip; render tetap jalan agar layar tidak kosong di baliknya.
  if (!isBlockingGameplay()) game.update(dt, input);
  game.render();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
