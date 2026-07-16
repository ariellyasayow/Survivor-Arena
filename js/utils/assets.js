// =============================================
//  assets.js — Pemuat & pengatur gambar animasi
// =============================================
// Tugasnya memuat gambar karakter/item dan membantu memainkan animasinya.
//
// Gambar di sini sifatnya OPSIONAL. Kalau filenya belum ada, game tetap jalan
// dengan menggambar bentuk sederhana (lingkaran/kotak) sebagai gantinya. Begitu
// filenya ditaruh di folder yang benar, game otomatis pakai gambar itu — tidak
// perlu ubah kode lain.
//
// Satu file gambar berisi banyak "frame" (pose) yang dijejer ke kanan. Dengan
// mengganti frame yang ditampilkan secara berurutan, gambar jadi seperti
// bergerak (animasi). Semua karakter digambar menghadap kiri; untuk menghadap
// kanan tinggal dibalik saat menggambar.
//
// Lokasi file: assets/spritesheets/<objek>/<animasi>.webp

// Daftar semua gambar: src = lokasi file, frames = jumlah pose,
// fw/fh = lebar & tinggi satu frame (dalam piksel).
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

// Tempat menyimpan gambar yang sudah dimuat, biar tidak dimuat berulang.
const sprites = {};

/**
 * Muat satu gambar. Kalau filenya tidak ada, tidak error — gambar cuma ditandai
 * "belum siap" supaya game pakai bentuk sederhana sebagai gantinya.
 */
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

/**
 * Muat semua gambar sekaligus. Dipanggil sekali sebelum game mulai supaya
 * gambar tidak muncul mendadak di tengah permainan. Aman walau belum ada
 * satu pun file gambar.
 */
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

/** Ambil data gambar tertentu; null saat gambarnya belum ada. */
export function getSprite(key) {
  return sprites[key] || null;
}

/** Cek apakah gambar sudah siap dipakai. */
export function spriteReady(key) {
  const sp = sprites[key];
  return !!(sp && sp.ready);
}

/** Jumlah pose (frame) dalam satu gambar animasi. */
export function frameCount(key) {
  const sp = sprites[key];
  return sp ? sp.frames : 0;
}

/**
 * Tentukan pose (frame) mana yang harus ditampilkan sekarang, berdasarkan
 * berapa lama animasi sudah berjalan. Ada tiga cara main:
 *   - 'loop'     : diputar berulang dari awal (misal jalan kaki)
 *   - 'pingpong' : maju lalu mundur, biar mulus tanpa loncat
 *   - 'once'     : maju sekali lalu berhenti di pose terakhir (misal mati)
 * fps = seberapa cepat animasinya (makin besar makin cepat).
 */
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

/**
 * Gambar satu pose (frame) ke layar, dengan titik (x, y) sebagai pusatnya.
 * mirror = true membalik gambar ke kiri/kanan (buat menghadap arah lain).
 * Mengembalikan false saat gambarnya belum siap.
 */
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
