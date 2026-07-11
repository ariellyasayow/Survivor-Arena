import { Game } from './game.js';
import { unlockAudio } from './effects/sfx.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);

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

joystickBase.addEventListener('touchstart', (e) => {
  e.preventDefault();
  unlockAudio();
  const t = e.changedTouches[0];
  activeTouchId = t.identifier;
  joystickPointFromEvent(t.clientX, t.clientY);
}, { passive: false });

window.addEventListener('touchmove', (e) => {
  if (activeTouchId === null) return;
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

// Klik untuk unlock audio (aturan autoplay browser)
window.addEventListener('pointerdown', () => unlockAudio());

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

// ---- Game loop --------------------------------------------------------------
let lastTime = performance.now();

function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000); // clamp biar aman kalau tab sempat freeze
  lastTime = now;

  const input = currentInputVector();
  game.update(dt, input);
  game.render();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
