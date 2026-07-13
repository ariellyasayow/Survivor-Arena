# Assets

Sistem sprite + animasi sudah aktif (`js/utils/assets.js`). Setiap entity
(`Player`, `Enemy`, `PointItem`, `PowerUpItem`, background) mencoba pakai
sprite dulu, dan **otomatis fallback ke bentuk primitif Canvas** kalau file
gambarnya belum ada — jadi game tidak pernah error walau aset belum lengkap.

## Struktur

- `assets-image/` — aset MENTAH dari artist (frame terpisah per animasi,
  rotasi item, dll). Ini sumber, tidak dipakai langsung oleh game.
- `spritesheets/` — sprite sheet **WebP** hasil olahan yang benar-benar
  dipakai game, satu subfolder per objek. Dihasilkan dari `assets-image/`
  oleh script build (lihat di bawah).

### Folder sumber (`assets-image/object/`)

Nama folder disamakan dengan objek di game:

| Folder | Objek game | Isi |
|---|---|---|
| `player/` | player | animations (Running/firing/death) + idle |
| `enemy1/` | Enemy tipe 1 (melee) | animations (Running/Death) |
| `enemy2/` | Enemy tipe 2 (kamikaze ledakan) | Running + attack_death (per arah `west/`) |
| `enemy3/` | Enemy tipe 3 (ranged/laser) | sheet 128px: `Walk`/`Attack`/`Dead` |
| `coin/` | poin | `rotations/` (8 arah) |
| `orb/` | power-up (non-nyawa) | `rotations/` (8 arah) |
| `heart/` | power-up nyawa | `rotations/` (8 arah) |
| `tree/` | pohon (obstacle) | `tree-sheet.png` (16 frame) |
| `rock/` | batu (obstacle) | `brown1..3.png` |

## Sprite sheet yang dipakai game (`assets/spritesheets/<objek>/`)

Semua sheet tersusun **horizontal** (frame berjejer kiri→kanan). Karakter
digambar menghadap **West (kiri)**; hadap kanan otomatis di-*mirror* saat
render. Nama file & jumlah frame harus cocok dengan `SPRITE_MANIFEST` di
`js/utils/assets.js`:

| File | Isi | Frame | Mode animasi |
|---|---|---|---|
| `player/idle.webp` | player diam | 1 | statis |
| `player/run.webp` | player lari | 4 | ping-pong (mulus, tidak patah) |
| `player/firing.webp` | player menembak | 9 | loop saat menembak |
| `player/death.webp` | player mati | 9 | once (sekali jalan) |
| `enemy1/run.webp` | musuh tipe 1 lari | 9 | loop |
| `enemy1/death.webp` | musuh tipe 1 mati | 9 | once |
| `enemy2/run.webp` | musuh tipe 2 lari | 4 | loop |
| `enemy2/attack.webp` | musuh tipe 2 ledakan/mati | 9 | once |
| `enemy3/run.webp` | musuh tipe 3 jalan | 5 | loop |
| `enemy3/attack.webp` | musuh tipe 3 menembak laser | 9 | loop (laser lepas di frame ~8) |
| `enemy3/death.webp` | musuh tipe 3 mati | 3 | once |
| `coin/spin.webp` | poin berputar | 8 | loop |
| `orb/spin.webp` | power-up (non-nyawa) | 8 | loop |
| `heart/spin.webp` | power-up nyawa | 8 | loop |
| `tree/tree.webp` | pohon (obstacle) | 16 | ping-pong (ayunan) |
| `rock/rock.webp` | batu (obstacle) | 1 | statis |

Total semua WebP saat ini **~51 KB** — sangat ringan.

## Cara regenerate sprite sheet dari frame mentah

Kalau aset mentah di `assets-image/` berubah, jalankan ulang script build
(butuh Python + Pillow: `python -m pip install Pillow`):

```
python tools/build_assets.py
```

Script ini: menggabungkan tiap folder frame jadi 1 sheet horizontal,
mengurutkan rotasi item supaya berputar mulus, meng-*convert* ke WebP
(quality 82), dan menaruh hasilnya di `assets/spritesheets/<objek>/`.
Idempotent — aman dijalankan berulang.

## Panduan optimasi (kalau nambah/ganti aset)

1. **WebP** untuk semua sprite — 25–50% lebih kecil dari PNG, tetap
   mendukung transparansi. Convert via [squoosh.app](https://squoosh.app)
   atau `cwebp -q 82`.
2. **Resize ke ukuran render** — jangan pakai aset 512px untuk sprite yang
   tampil ~50px. Frame player 64×64 & enemy 60×60 sudah cukup tajam.
3. **Sprite sheet, bukan file terpisah** — gabung frame animasi jadi 1 file
   horizontal supaya browser cuma 1 request per animasi.
4. **Budget** — target total gambar < 200–300 KB. Sekarang jauh di bawah itu.

## Cara kerja mirror & animasi (ringkas)

- `drawSprite(ctx, key, x, y, size, frameIndex, mirror)` — `mirror=true`
  membalik horizontal (untuk hadap kanan/East).
- `frameForClip(key, clipTime, fps, mode)` — hitung index frame dari waktu;
  `mode`: `loop` | `pingpong` | `once`.
- Player: `facingDir` (-1 kiri / +1 kanan) hanya berubah saat ada input
  horizontal; gerak vertikal murni mempertahankan arah terakhir.
