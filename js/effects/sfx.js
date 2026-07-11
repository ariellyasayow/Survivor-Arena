// SFX di-generate langsung lewat Web Audio API, jadi tidak butuh file .mp3/.wav
// dulu. Nanti kalau tim sudah punya aset suara asli, tinggal ganti isi tiap
// fungsi ini dengan `new Audio('assets/sounds/xxx.mp3').play()`.

let ctx = null;

function ensureContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

// Panggil ini sekali dari event klik/tap pertama pengguna (aturan browser).
export function unlockAudio() {
  ensureContext();
}

function tone(freq, duration, type = 'sine', volume = 0.2, delay = 0) {
  const audio = ensureContext();
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(audio.destination);
  const startTime = audio.currentTime + delay;
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

export function sfxShoot() {
  tone(760, 0.06, 'square', 0.12);
}

export function sfxHit() {
  tone(180, 0.08, 'sawtooth', 0.15);
}

export function sfxPoint() {
  tone(660, 0.07, 'sine', 0.15);
  tone(880, 0.08, 'sine', 0.15, 0.06);
}

export function sfxLevelUp() {
  tone(523, 0.09, 'triangle', 0.18);
  tone(659, 0.09, 'triangle', 0.18, 0.09);
  tone(784, 0.14, 'triangle', 0.18, 0.18);
}

export function sfxPowerUp() {
  tone(440, 0.08, 'sine', 0.16);
  tone(880, 0.12, 'sine', 0.16, 0.08);
}

export function sfxMonster() {
  tone(110, 0.18, 'sawtooth', 0.08);
}

export function sfxGameOver() {
  tone(300, 0.15, 'sawtooth', 0.15);
  tone(220, 0.15, 'sawtooth', 0.15, 0.15);
  tone(140, 0.3, 'sawtooth', 0.15, 0.3);
}
