// FPS meter kecil untuk tes performa langsung di device (tanpa kabel/DevTools).
// Menampilkan FPS instan + rata-rata 1 detik terakhir di pojok layar.

let el = null;
let frameCount = 0;
let lastSampleTime = 0;
let fps = 0;

export function initFpsMeter() {
  if (el) return;
  el = document.createElement('div');
  el.id = 'fps-meter';
  el.style.cssText = [
    'position:fixed', 'top:6px', 'right:6px', 'z-index:9999',
    'background:rgba(0,0,0,0.55)', 'color:#5CFF8F',
    'font:bold 13px/1.3 monospace', 'padding:4px 8px',
    'border-radius:6px', 'pointer-events:none',
    'white-space:pre',
  ].join(';');
  el.textContent = 'FPS: --';
  document.body.appendChild(el);
  lastSampleTime = performance.now();
}

// Panggil sekali tiap frame dari game loop.
export function tickFpsMeter(now) {
  if (!el) return;
  frameCount++;
  const elapsed = now - lastSampleTime;
  if (elapsed >= 500) { // update tampilan tiap 0.5s biar tidak flicker
    fps = Math.round((frameCount * 1000) / elapsed);
    el.textContent = `FPS: ${fps}`;
    frameCount = 0;
    lastSampleTime = now;
  }
}
