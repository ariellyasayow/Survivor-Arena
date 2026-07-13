# Assets

Sistem sprite sudah siap (`js/utils/assets.js`). Setiap entity (`Player`,
`Enemy`, `PointItem`, `PowerUpItem`, `Projectile`, background) sudah dicoba
pakai gambar dulu, dan **otomatis fallback ke bentuk primitif Canvas**
(lingkaran/bentuk warna yang sekarang) kalau file gambarnya belum ada. Jadi
kamu bisa nambahin aset satu per satu tanpa pernah bikin game error/blank.

## Cara pakai

1. Siapkan gambar (lihat panduan bikin aset & optimasi di bawah).
2. Simpan ke `assets/images/` dengan nama file **persis** seperti ini:

   | File | Dipakai untuk | Ukuran sumber disarankan |
   |---|---|---|
   | `player.webp` | karakter pemain | 64×64 px |
   | `enemy.webp` | musuh | 64×64 px |
   | `point.webp` | koin/poin | 32×32 px |
   | `powerup.webp` | ikon power-up (1 gambar dipakai utk semua tipe, diberi tint warna otomatis) | 40×40 px |
   | `projectile.webp` | peluru | 20×20 px |
   | `bg-tile.webp` | tekstur rumput/lantai (di-*tile*/diulang, bukan 1 gambar full-map) | 128×128 px, harus *seamless* (ujung kiri-kanan & atas-bawah nyambung) |

3. Refresh game. Tidak perlu ubah kode apa pun — `js/utils/assets.js` akan
   otomatis mendeteksi dan memakainya.

Kalau mau ganti path/nama file, edit `SPRITE_MANIFEST` di
`js/utils/assets.js`.

## Kenapa ukurannya sekecil itu?

World game ini cuma **390×640 px**, dan semua object di dalamnya kecil
(radius 7–22 px). Karakter di layar cuma butuh ~30-50px persegi — sprite
64×64 sudah lebih dari cukup untuk tampil tajam (termasuk di layar retina
2x). Membuat sprite jauh lebih besar dari itu (misal 512×512) cuma
menambah ukuran file & waktu decode tanpa manfaat visual apa pun, karena
browser akan men-downscale-nya saat digambar.

## Panduan optimasi gambar (biar seringan mungkin)

### 1. Format: pakai WebP

WebP biasanya 25–50% lebih kecil dari PNG dengan kualitas visual setara,
dan tetap mendukung transparansi (alpha channel) — cocok untuk
sprite karakter/enemy/item yang perlu background transparan.

Convert PNG/JPG ke WebP:
- Online: [squoosh.app](https://squoosh.app) (drag-drop, preview kualitas vs ukuran real-time, gratis, jalan di browser).
- CLI (kalau install `cwebp` dari Google): `cwebp -q 80 player.png -o player.webp`

Kalau butuh dukungan browser sangat lama (jarang relevan buat game baru),
baru pertimbangkan simpan PNG sebagai fallback tambahan.

### 2. Resize ke ukuran render asli — jangan upload aset mentah

Kalau aset dari asset pack/AI generator biasanya berukuran besar (512px,
1024px, dst). Resize dulu ke ukuran yang benar-benar dipakai (lihat tabel
di atas) sebelum convert ke WebP. Ini pengaruh paling besar ke ukuran
file — mengecilkan 512px → 64px bisa memangkas ukuran file sampai 90%+.

### 3. Kompres losslessly kalau perlu presisi warna, lossy kalau tidak

Untuk sprite kecil dengan warna flat/kartun, kompresi lossy (kualitas
75–85) biasanya tidak kelihatan bedanya tapi ukuran file jauh lebih
kecil. Cek dulu hasilnya di Squoosh sebelum commit ke satu angka.

### 4. Background: pakai tile kecil yang diulang, bukan 1 gambar full-map

`bg-tile.webp` didesain untuk di-*tile* (diulang berkali-kali) mengisi
seluruh area 390×640, mirip wallpaper. Ini jauh lebih ringan daripada
bikin 1 file besar seukuran seluruh dunia — cukup 1 file 128×128px kecil,
harus dibuat *seamless* (pola di tepi kiri/kanan dan atas/bawah harus
nyambung mulus supaya tidak kelihatan garis sambungan saat diulang).

### 5. Sprite sheet untuk animasi (opsional, kalau nanti nambah animasi jalan/mati)

`js/utils/assets.js` sudah punya dukungan dasar sprite sheet horizontal
(`frames`, `fw`, `fh` di `SPRITE_MANIFEST`, plus parameter `frameIndex` di
`drawSprite`). Kalau nanti karakter butuh animasi (misal 4 frame jalan),
gabung semua frame jadi 1 file sejajar horizontal (misal 256×64 untuk
4 frame @64px) — ini bikin browser cuma perlu 1 request gambar untuk
seluruh animasi, bukan 4 file terpisah.

### 6. Total budget yang wajar

Untuk game seringan ini, target total ukuran semua gambar di bawah
~200–300 KB sudah sangat aman untuk load cepat bahkan di koneksi mobile
pelan. Kalau pakai ukuran & tips di atas, biasanya kamu akan jauh di
bawah itu (masing-masing file sprite kecil umumnya < 5-10 KB).

## Kalau belum punya aset sama sekali

Bisa cari base gratis lisensi CC0/permisif di situs seperti
[Kenney.nl](https://kenney.nl) atau [OpenGameArt.org](https://opengameart.org)
(banyak asset pack "top-down" atau "survivor-like" yang cocok), lalu ikuti
langkah resize + convert WebP di atas sebelum dipakai.
