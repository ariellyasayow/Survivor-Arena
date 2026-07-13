import { formatTime } from '../utils/helpers.js';

const livesEl = document.getElementById('lives');
const stageLabelEl = document.getElementById('stage-label');
const timerEl = document.getElementById('timer');
const scoreEl = document.getElementById('score');
const xpFillEl = document.getElementById('xp-bar-fill');

export function updateHUD(game) {
  livesEl.textContent = '\u2764'.repeat(game.lives) + '\u2661'.repeat(Math.max(0, game.maxLives - game.lives));
  stageLabelEl.textContent = `Lvl ${game.stageIndex + 1}/${game.stageCount}`;
  timerEl.textContent = formatTime(game.timeLeft);
  scoreEl.textContent = `Skor: ${game.score} | Target Poin: ${game.stageScore}/${game.stageTarget}`;
  const xpPct = Math.min(100, (game.xp / game.xpToNextLevel) * 100);
  xpFillEl.style.width = `${xpPct}%`;
}