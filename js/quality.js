// =============================================
//  quality.js — Status level kualitas render
// =============================================
//
// File ini HANYA menyimpan & membaca status kualitas render aktif — tidak
// tahu-menahu cara menentukannya. Level dipakai di titik-titik render yang
// "mahal" untuk di-skip/dikurangi di device kurang mumpuni, contoh:
//   - game.js   -> skip efek glow gradient saat level malam
//   - vfx.js    -> kurangi jumlah partikel maksimal
//
// Siapa yang MENENTUKAN nilainya? main.js, lewat detectDeviceQuality() —
// dicek SEKALI di awal berdasarkan kemampuan device (jumlah core CPU, RAM
// kalau tersedia), bukan dipantau terus-menerus lewat FPS real-time seperti
// versi sebelumnya. Jadi level ini tetap sama sepanjang sesi bermain.

/** @type {'high' | 'medium' | 'low'} */
let currentQuality = 'high';

/** Set level kualitas render aktif. Dipanggil dari main.js saat startup. */
export function setRenderQuality(level) {
  currentQuality = level;
}

/** Ambil level kualitas render aktif saat ini ('high' | 'medium' | 'low'). */
export function getRenderQuality() {
  return currentQuality;
}

/** True kalau device sedang di level kualitas terendah (skip efek mahal). */
export function isLowQuality() {
  return currentQuality === 'low';
}
