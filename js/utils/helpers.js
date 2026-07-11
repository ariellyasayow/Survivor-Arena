// Kumpulan fungsi bantu yang dipakai di banyak tempat.

export function circleCollide(a, b) {
  // a dan b harus punya {x, y, r}
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distSq = dx * dx + dy * dy;
  const minDist = a.r + b.r;
  return distSq <= minDist * minDist;
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

export function randInt(min, max) {
  return Math.floor(randRange(min, max + 1));
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

// Titik acak di tepi dunia (buat spawn enemy dari luar layar)
export function randomEdgePoint(worldW, worldH, margin = 20) {
  const side = randInt(0, 3);
  if (side === 0) return { x: randRange(0, worldW), y: -margin };
  if (side === 1) return { x: worldW + margin, y: randRange(0, worldH) };
  if (side === 2) return { x: randRange(0, worldW), y: worldH + margin };
  return { x: -margin, y: randRange(0, worldH) };
}
