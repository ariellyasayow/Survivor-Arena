// --- DITAMBAHKAN TIPE BARU 'rapid' ---
export const POWERUP_TYPES = ['life', 'damage', 'speed', 'shotgun', 'rapid'];

export const POWERUP_META = {
  life: { color: '#FF5470', label: '+Nyawa' },
  damage: { color: '#FF6F59', label: 'Damage+' },
  speed: { color: '#FFC857', label: 'Cepat!' },
  shotgun: { color: '#FF2A2A', label: 'Shotgun!' },
  rapid: { color: '#FF8C00', label: 'Mesin!' }, // <--- WARNA ORANYE MENYALA
};

const DAMAGE_BUFF_SECONDS = 8;
const SPEED_BUFF_SECONDS = 6;
const SHOTGUN_BUFF_SECONDS = 10; // <--- MODIFIKASI: DURASI SHOTGUN 10 DETIK
const RAPID_BUFF_SECONDS = 5;    // <--- MODIFIKASI: DURASI RAPID FIRE 5 DETIK

export function applyPowerUp(type, player, game) {
  switch (type) {
    case 'life':
      // Menambah hati (nyawa) dengan maksimal sesuai maxLives
      game.lives = Math.min(game.maxLives, game.lives + 1);
      break;
    case 'damage':
      // Peluru sakit sementara waktu (+5 damage selama 8 detik)
      player.baseDamage += 5;
      player.damageBuffUntil = game.elapsedTime + DAMAGE_BUFF_SECONDS;
      setTimeout(() => { player.baseDamage -= 5; }, DAMAGE_BUFF_SECONDS * 1000);
      break;
    case 'speed':
      // Kecepatan lari bertambah drastis sementara (+40 speed selama 6 detik)
      player.baseSpeed += 40;
      player.speedBuffUntil = game.elapsedTime + SPEED_BUFF_SECONDS;
      setTimeout(() => { player.baseSpeed -= 40; }, SPEED_BUFF_SECONDS * 1000);
      break;
    case 'shotgun':
      // --- MODIFIKASI: DIUBAH DARI PERMANEN MENJADI TIMER 10 DETIK ---
      player.shotgunBuffUntil = game.elapsedTime + SHOTGUN_BUFF_SECONDS;
      break;
    case 'rapid':
      // --- MODIFIKASI: AKTIFKAN MODE SENAPAN MESIN SELAMA 5 DETIK ---
      player.rapidBuffUntil = game.elapsedTime + RAPID_BUFF_SECONDS;
      break;
  }
}