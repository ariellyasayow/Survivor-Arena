// =============================================
//  helpers.js — Fungsi bantu yang dipakai di mana-mana
// =============================================
// Isinya perhitungan-perhitungan kecil yang sering dibutuhkan file lain.

/**
 * Cek apakah dua benda bulat saling bersentuhan. Tiap benda harus punya
 * posisi (x, y) dan jari-jari (r). Dipakai misalnya untuk tahu apakah peluru
 * mengenai musuh, atau player menyentuh koin.
 */
export function circleCollide(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distSq = dx * dx + dy * dy;
  const minDist = a.r + b.r;
  return distSq <= minDist * minDist;
}

/** Hitung jarak lurus antara dua titik. */
export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Ambil angka acak (boleh pecahan) di antara min dan max. */
export function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

/** Ambil angka bulat acak dari min sampai max (kedua ujung ikut). */
export function randInt(min, max) {
  return Math.floor(randRange(min, max + 1));
}

/** Jaga nilai supaya tidak kurang dari min atau lebih dari max. */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/** Ambil nilai di antara a dan b, sesuai t (0 = a, 1 = b). Buat gerak halus. */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Ubah jumlah detik jadi tulisan waktu "mm:ss" buat tampilan timer. */
export function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

/** Pilih titik acak di salah satu pinggir dunia, buat memunculkan musuh dari luar layar. */
export function randomEdgePoint(worldW, worldH, margin = 20) {
  const side = randInt(0, 3);
  if (side === 0) return { x: randRange(0, worldW), y: -margin };
  if (side === 1) return { x: worldW + margin, y: randRange(0, worldH) };
  if (side === 2) return { x: randRange(0, worldW), y: worldH + margin };
  return { x: -margin, y: randRange(0, worldH) };
}
