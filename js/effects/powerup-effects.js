// =============================================
//  powerup-effects.js — Daftar & efek power-up
// =============================================
// Mengatur item bonus yang bisa diambil player: apa saja jenisnya, warnanya,
// dan apa efeknya saat diambil.

// Semua jenis power-up yang bisa muncul (dipilih acak saat memunculkannya).
export const POWERUP_TYPES = ['life', 'damage', 'speed', 'shotgun', 'rapid'];

// Warna & tulisan tiap jenis — dipakai buat gambar item, peta kecil, dan HUD.
export const POWERUP_META = {
  life: { color: '#FF5470', label: '+Nyawa' },
  damage: { color: '#FF6F59', label: 'Damage+' },
  speed: { color: '#FFC857', label: 'Cepat!' },
  shotgun: { color: '#FF2A2A', label: 'Shotgun!' },
  rapid: { color: '#FF8C00', label: 'Mesin!' }, // <--- WARNA ORANYE MENYALA
};

// Lama tiap efek bertahan (dalam detik).
const DAMAGE_BUFF_SECONDS = 8;
const SPEED_BUFF_SECONDS = 6;
const SHOTGUN_BUFF_SECONDS = 10;
const RAPID_BUFF_SECONDS = 5;

/**
 * Jalankan efek power-up saat player mengambilnya:
 *   - life   : tambah 1 nyawa (tidak melebihi batas maksimal)
 *   - damage : peluru lebih sakit selama beberapa detik
 *   - speed  : lari lebih cepat selama beberapa detik
 *   - shotgun: tembakan menyebar selama beberapa detik
 *   - rapid  : menembak sangat cepat selama beberapa detik
 * Untuk efek sementara, kita catat sampai detik ke berapa efeknya berlaku.
 */
export function applyPowerUp(type, player, game) {
  switch (type) {
    case 'life':
      game.lives = Math.min(game.maxLives, game.lives + 1);
      break;
    case 'damage':
      player.baseDamage += 5;
      player.damageBuffUntil = game.elapsedTime + DAMAGE_BUFF_SECONDS;
      setTimeout(() => { player.baseDamage -= 5; }, DAMAGE_BUFF_SECONDS * 1000);
      break;
    case 'speed':
      player.baseSpeed += 40;
      player.speedBuffUntil = game.elapsedTime + SPEED_BUFF_SECONDS;
      setTimeout(() => { player.baseSpeed -= 40; }, SPEED_BUFF_SECONDS * 1000);
      break;
    case 'shotgun':
      player.shotgunBuffUntil = game.elapsedTime + SHOTGUN_BUFF_SECONDS;
      break;
    case 'rapid':
      player.rapidBuffUntil = game.elapsedTime + RAPID_BUFF_SECONDS;
      break;
  }
}