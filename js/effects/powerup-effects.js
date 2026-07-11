// Definisi & penerapan efek untuk tiap jenis power-up.
// Sesuai dokumen konsep "Power Up Effects":
// 1. Jangkauan peluru lebih besar
// 2. Penambahan timer
// 3. Menambah jangkauan cahaya (khusus malam)
// 4. Menambah nyawa player

export const POWERUP_TYPES = ['range', 'timer', 'vision', 'life'];

export const POWERUP_META = {
  range: { color: '#2DE1C7', label: 'Jangkauan+' },
  timer: { color: '#FFC857', label: '+Waktu' },
  vision: { color: '#9FC1E8', label: 'Cahaya+' },
  life: { color: '#FF5470', label: '+Nyawa' },
};

const RANGE_BUFF_DURATION = 8; // detik
const VISION_BUFF_DURATION = 10; // detik
const TIMER_BONUS_SECONDS = 8;

export function applyPowerUp(type, player, game) {
  switch (type) {
    case 'range':
      player.rangeBuffUntil = game.elapsedTime + RANGE_BUFF_DURATION;
      break;
    case 'timer':
      game.timeLeft += TIMER_BONUS_SECONDS;
      break;
    case 'vision':
      // Hanya relevan kalau sedang malam (stage terakhir), tapi aman
      // dipakai kapan saja karena cuma menambah radius penglihatan.
      player.visionBuffUntil = game.elapsedTime + VISION_BUFF_DURATION;
      break;
    case 'life':
      game.lives = Math.min(game.maxLives, game.lives + 1);
      break;
    default:
      break;
  }
}
