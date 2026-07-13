// Loader gambar ringan dengan fallback otomatis.
//
// Filosofi: game ini didesain dari awal buat gambar primitif lewat Canvas API
// (lihat entity draw() masing-masing). Sprite gambar itu OPSIONAL — kalau file
// belum ada di assets/images/, entity tetap jalan pakai bentuk primitif yang
// sekarang. Begitu file sprite ditaruh di path yang benar, game otomatis
// pakai gambar itu tanpa perlu ubah kode lain.
//
// Kenapa gini: supaya tim bisa nambahin aset bertahap (satu-satu) tanpa
// pernah bikin game crash/blank karena ada Image() yang gagal load.

// Daftar sprite yang dikenali game. Tambah entry baru di sini kalau mau
// pakai gambar untuk elemen lain.
// - src: path relatif ke assets/images/
// - frames: jumlah frame animasi di sprite sheet (1 = gambar statis)
// - fw/fh: ukuran satu frame dalam px (bukan ukuran file keseluruhan)
const SPRITE_MANIFEST = {
  player: { src: 'assets/images/player.webp', frames: 1, fw: 32, fh: 32 },
  enemy: { src: 'assets/images/enemy.webp', frames: 1, fw: 32, fh: 32 },
  point: { src: 'assets/images/point.webp', frames: 1, fw: 16, fh: 16 },
  powerup: { src: 'assets/images/powerup.webp', frames: 1, fw: 20, fh: 20 },
  projectile: { src: 'assets/images/projectile.webp', frames: 1, fw: 10, fh: 10 },
  bgTile: { src: 'assets/images/bg-tile.webp', frames: 1, fw: 64, fh: 64 },
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

// Gambar sprite (atau satu frame dari sprite sheet horizontal) berpusat di (x, y).
// frameIndex dipakai kalau def.frames > 1 (animasi berjejer horizontal).
export function drawSprite(ctx, key, x, y, size, frameIndex = 0) {
  const sp = sprites[key];
  if (!sp || !sp.ready) return false;

  const sx = frameIndex * sp.fw;
  ctx.drawImage(
    sp.img,
    sx, 0, sp.fw, sp.fh,
    x - size / 2, y - size / 2, size, size,
  );
  return true;
}
