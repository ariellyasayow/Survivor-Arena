// Loader gambar ringan dengan fallback otomatis + helper animasi.
//
// Filosofi: game ini didesain dari awal buat gambar primitif lewat Canvas API
// (lihat entity draw() masing-masing). Sprite gambar itu OPSIONAL — kalau file
// belum ada di assets/spritesheets/, entity tetap jalan pakai bentuk primitif
// yang sekarang. Begitu file sprite ditaruh di path yang benar, game otomatis
// pakai gambar itu tanpa perlu ubah kode lain.
//
// Semua sprite sheet di sini tersusun HORIZONTAL (frame berjejer kiri->kanan),
// tiap frame berukuran fw x fh. Semua sprite karakter (player/enemy) digambar
// menghadap WEST (kiri); untuk hadap kanan tinggal di-mirror saat menggambar.
//
// Struktur folder: assets/spritesheets/<objek>/<animasi>.webp — satu subfolder
// per objek game (player, enemy1, enemy2, enemy3, coin, orb, heart, tree, rock).

// - src: path relatif ke assets/spritesheets/
// - frames: jumlah frame di sheet (1 = statis)
// - fw/fh: ukuran satu frame dalam px
const SPRITE_MANIFEST = {
  // Player (hadap kiri) — beberapa klip animasi
  playerIdle: { src: 'assets/spritesheets/player/idle.webp', frames: 1, fw: 64, fh: 64 },
  playerRun: { src: 'assets/spritesheets/player/run.webp', frames: 4, fw: 64, fh: 64 },
  playerFiring: { src: 'assets/spritesheets/player/firing.webp', frames: 9, fw: 64, fh: 64 },
  playerDeath: { src: 'assets/spritesheets/player/death.webp', frames: 9, fw: 64, fh: 64 },

  // Enemy type 1 (hadap kiri) — melee dengan attack jarak dekat
  enemyRun: { src: 'assets/spritesheets/enemy1/run.webp', frames: 9, fw: 60, fh: 60 },
  enemyDeath: { src: 'assets/spritesheets/enemy1/death.webp', frames: 9, fw: 60, fh: 60 },
  enemyAttack: { src: 'assets/spritesheets/enemy1/attack.webp', frames: 9, fw: 60, fh: 60 },

  // Enemy type 2 (hadap kiri) — fast kamikaze dengan ledakan
  enemy2Run: { src: 'assets/spritesheets/enemy2/run.webp', frames: 4, fw: 60, fh: 60 },
  enemy2Attack: { src: 'assets/spritesheets/enemy2/attack.webp', frames: 9, fw: 60, fh: 60 },

  // Enemy type 3 (Demon_1) — serangan jarak jauh
  enemy3Run: { src: 'assets/spritesheets/enemy3/run.webp', frames: 5, fw: 60, fh: 60 },
  enemy3Attack: { src: 'assets/spritesheets/enemy3/attack.webp', frames: 9, fw: 60, fh: 60 },
  enemy3Death: { src: 'assets/spritesheets/enemy3/death.webp', frames: 3, fw: 60, fh: 60 },

  // Item pickup — animasi berputar
  coin: { src: 'assets/spritesheets/coin/spin.webp', frames: 8, fw: 48, fh: 48 },
  orb: { src: 'assets/spritesheets/orb/spin.webp', frames: 8, fw: 34, fh: 34 },
  heart: { src: 'assets/spritesheets/heart/spin.webp', frames: 8, fw: 34, fh: 34 },

  // Environment
  tree: { src: 'assets/spritesheets/tree/tree.webp', frames: 16, fw: 64, fh: 64 },
  rock: { src: 'assets/spritesheets/rock/rock.webp', frames: 1, fw: 48, fh: 48 },
};

const sprites = {};

function loadOne(key, def) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      sprites[key] = { img, ...def, ready: true };
      resolve();
    };
    img.onerror = () => {
      // File belum ada / gagal load: biarkan fallback primitif yang jalan.
      sprites[key] = { img: null, ...def, ready: false };
      resolve();
    };
    img.src = def.src;
  });
}

let preloaded = false;

// Panggil sekali di awal (sebelum game start) buat coba load semua sprite.
// Aman dipanggil walau belum ada file gambar sama sekali — tidak pernah reject.
export async function preloadSprites(onProgress) {
  if (preloaded) return sprites;
  const keys = Object.keys(SPRITE_MANIFEST);
  let done = 0;
  await Promise.all(
    keys.map((key) =>
      loadOne(key, SPRITE_MANIFEST[key]).then(() => {
        done += 1;
        if (onProgress) onProgress(done, keys.length);
      }),
    ),
  );
  preloaded = true;
  return sprites;
}

export function getSprite(key) {
  return sprites[key] || null;
}

export function spriteReady(key) {
  const sp = sprites[key];
  return !!(sp && sp.ready);
}

export function frameCount(key) {
  const sp = sprites[key];
  return sp ? sp.frames : 0;
}

// Hitung index frame dari waktu yang sudah berlalu di klip (detik).
// mode:
//  - 'loop'     : 0,1,2,..,n-1,0,1,..        (default)
//  - 'pingpong' : 0,1,2,..,n-1,n-2,..,1,0,.. (bolak-balik, mulus tanpa lompat)
//  - 'once'     : maju sampai frame terakhir lalu berhenti di sana
// Kembalikan { index, done } — done=true hanya relevan untuk 'once'.
export function frameForClip(key, clipTime, fps = 10, mode = 'loop') {
  const n = frameCount(key) || 1;
  if (n <= 1) return { index: 0, done: true };

  const step = Math.floor(clipTime * fps);

  if (mode === 'once') {
    const index = Math.min(step, n - 1);
    return { index, done: step >= n - 1 };
  }

  if (mode === 'pingpong') {
    const period = 2 * (n - 1); // 0..n-1..1
    const t = step % period;
    const index = t < n ? t : period - t;
    return { index, done: false };
  }

  // loop
  return { index: step % n, done: false };
}

// Gambar satu frame sprite sheet, berpusat di (x, y), ukuran render `size`.
// mirror=true membalik horizontal (dipakai buat hadap kanan/East karena
// sprite sumber menghadap kiri/West).
export function drawSprite(ctx, key, x, y, size, frameIndex = 0, mirror = false) {
  const sp = sprites[key];
  if (!sp || !sp.ready) return false;

  const idx = Math.max(0, Math.min(frameIndex, sp.frames - 1));
  const sx = idx * sp.fw;
  // jaga rasio aspek frame (fw bisa != fh)
  const scale = size / Math.max(sp.fw, sp.fh);
  const dw = sp.fw * scale;
  const dh = sp.fh * scale;

  if (mirror) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    ctx.drawImage(sp.img, sx, 0, sp.fw, sp.fh, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  } else {
    ctx.drawImage(sp.img, sx, 0, sp.fw, sp.fh, x - dw / 2, y - dh / 2, dw, dh);
  }
  return true;
}
