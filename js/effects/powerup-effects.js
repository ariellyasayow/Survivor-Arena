export const POWERUP_TYPES = ['life', 'damage', 'speed', 'range'];

export const POWERUP_META = {
  life: { color: '#FF5470', label: '+Nyawa' },
  damage: { color: '#FF6F59', label: 'Damage+' },
  speed: { color: '#FFC857', label: 'Cepat!' },
  range: { color: '#2DE1C7', label: 'Cahaya Terang!' },
};

export function applyPowerUp(type, player, game) {
  switch (type) {
    case 'life':
      // Menambah hati (nyawa) dengan maksimal sesuai maxLives
      game.lives = Math.min(game.maxLives, game.lives + 1);
      break;
    case 'damage':
      // Peluru sakit sementara waktu (+5 damage selama 8 detik)
      player.baseDamage += 5;
      setTimeout(() => { player.baseDamage -= 5; }, 8000);
      break;
    case 'speed':
      // Kecepatan lari bertambah drastis sementara (+40 speed selama 6 detik)
      player.baseSpeed += 40;
      setTimeout(() => { player.baseSpeed -= 40; }, 6000);
      break;
    case 'range':
      // Memperlebar jangkauan tembakan peluru selama 12 detik
      player.rangeBuffUntil = game.elapsedTime + 12;
      // Memperbesar lingkaran senter cahaya di malam hari (Level 3) selama 12 detik!
      player.visionBuffUntil = game.elapsedTime + 12;
      break;
  }
}