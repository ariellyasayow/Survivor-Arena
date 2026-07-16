// =============================================
//  sfx.js — Efek suara game
// =============================================
// Semua suara di sini dibuat langsung oleh kode (bukan dari file .mp3/.wav),
// jadi ukuran game tetap kecil. Tiap suara pada dasarnya adalah nada singkat
// atau derau yang dibentuk supaya terdengar seperti tembakan atau ledakan.

import { AUDIO_THROTTLE_MS } from '../config.js';

let ctx = null;

/** Siapkan mesin suara (dibuat sekali, lalu dipakai terus). */
function ensureContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

/**
 * Nyalakan suara. Browser melarang suara berbunyi sebelum pengguna menyentuh
 * layar, jadi ini dipanggil saat sentuhan/klik pertama.
 */
export function unlockAudio() {
  ensureContext();
}

/**
 * Bunyikan satu nada singkat yang volumenya memudar sampai hilang.
 * freq = tinggi-rendah nada, duration = panjang bunyi, type = jenis bunyi,
 * volume = kencangnya, delay = jeda sebelum berbunyi.
 */
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

/**
 * Nada yang tinggi-rendahnya meluncur dari freqFrom ke freqTo — cocok buat
 * bunyi laser atau sabetan.
 */
function sweep(freqFrom, freqTo, duration, type = 'sawtooth', volume = 0.2, delay = 0) {
  const audio = ensureContext();
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(audio.destination);
  const startTime = audio.currentTime + delay;
  osc.frequency.setValueAtTime(freqFrom, startTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqTo), startTime + duration);
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

/**
 * Suara "desis/gemuruh" acak yang meredup — dipakai buat efek ledakan supaya
 * terdengar lebih nyata daripada sekadar nada.
 */
function noiseBurst(duration, { volume = 0.3, filterFreq = 800, filterFreqEnd = 80, delay = 0 } = {}) {
  const audio = ensureContext();
  const startTime = audio.currentTime + delay;
  const sampleCount = Math.ceil(audio.sampleRate * duration);
  const buffer = audio.createBuffer(1, sampleCount, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i++) {
    data[i] = Math.random() * 2 - 1; // white noise
  }

  const noise = audio.createBufferSource();
  noise.buffer = buffer;

  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(filterFreq, startTime);
  filter.frequency.exponentialRampToValueAtTime(Math.max(1, filterFreqEnd), startTime + duration);

  const gain = audio.createGain();
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);

  noise.start(startTime);
  noise.stop(startTime + duration + 0.02);
}

// Catatan kapan tiap suara terakhir dibunyikan.
const _lastPlay = {};

/**
 * Bungkus sebuah suara supaya tidak bisa berbunyi terlalu sering beruntun
 * (biar tidak berisik saat, misalnya, menembak sangat cepat).
 */
function throttled(name, fn) {
  return () => {
    const now = performance.now();
    if (_lastPlay[name] && now - _lastPlay[name] < AUDIO_THROTTLE_MS) return;
    _lastPlay[name] = now;
    fn();
  };
}

export const sfxShoot = throttled('shoot', () => {
  tone(760, 0.06, 'square', 0.12);
});

export const sfxHit = throttled('hit', () => {
  tone(180, 0.08, 'sawtooth', 0.15);
});

export const sfxPoint = throttled('point', () => {
  tone(660, 0.07, 'sine', 0.15);
  tone(880, 0.08, 'sine', 0.15, 0.06);
});

export const sfxLevelUp = throttled('levelUp', () => {
  tone(523, 0.09, 'triangle', 0.18);
  tone(659, 0.09, 'triangle', 0.18, 0.09);
  tone(784, 0.14, 'triangle', 0.18, 0.18);
});

export const sfxPowerUp = throttled('powerUp', () => {
  tone(440, 0.08, 'sine', 0.16);
  tone(880, 0.12, 'sine', 0.16, 0.08);
});

export const sfxMonster = throttled('monster', () => {
  tone(110, 0.18, 'sawtooth', 0.08);
});

export const sfxGameOver = throttled('gameOver', () => {
  tone(300, 0.15, 'sawtooth', 0.15);
  tone(220, 0.15, 'sawtooth', 0.15, 0.15);
  tone(140, 0.3, 'sawtooth', 0.15, 0.3);
});

// Ledakan enemy2: noise "boom" (low-pass meluruh cepat) + sub-bass thump.
export const sfxExplosion = throttled('explosion', () => {
  noiseBurst(0.35, { volume: 0.35, filterFreq: 1400, filterFreqEnd: 60 });
  tone(90, 0.25, 'sine', 0.25);
});

// Laser enemy3: sweep frekuensi tinggi->rendah cepat, khas tembakan sci-fi.
export const sfxLaser = throttled('laser', () => {
  sweep(1400, 220, 0.14, 'sawtooth', 0.14);
});

// Sabetan enemy1: whoosh singkat (sweep pendek + noise halus), saat mulai serang.
export const sfxSwing = throttled('swing', () => {
  sweep(500, 150, 0.1, 'triangle', 0.1);
  noiseBurst(0.08, { volume: 0.08, filterFreq: 2000, filterFreqEnd: 500 });
});
