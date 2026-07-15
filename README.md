# Survivor Arena

Top-down survival arena: kumpulkan poin sampai target tiap level terpenuhi
sebelum waktu habis, hindari & hajar musuh yang datang bertahap. 3 level,
level terakhir jadi malam dengan jangkauan pandang terbatas (senter).

Static HTML + CSS + JavaScript murni — **tanpa backend, tanpa build step,
tanpa dependency**. Semua logic jalan di browser (Canvas 2D), state disimpan
lewat `localStorage`.

## Cara menjalankan

1. Buka folder ini di VS Code.
2. Install extension **Live Server** (kalau belum).
3. Klik kanan `index.html` → **Open with Live Server**.

Wajib lewat Live Server (atau server lokal lain, mis. `python -m http.server`),
tidak bisa dibuka langsung dari file explorer, karena game ini pakai ES
Modules (`import`/`export`) yang diblokir browser kalau diakses lewat `file://`.

Untuk tes di HP lewat WiFi: jalankan server dengan `--bind 0.0.0.0`, lalu akses
`http://<ip-lokal-laptop>:<port>` dari HP (harus satu jaringan WiFi yang sama).

## Gameplay

- **Objektif**: kumpulkan poin (koin) sampai `Target Poin` tiap level
  terpenuhi sebelum waktu (`timer`) habis. Waktu habis = game over langsung.
- **Level**: 3 stage, tiap naik level HP musuh naik 35% dan waktu tiap level
  bertambah 30 detik (Lvl 1: 1:30 → Lvl 2: 2:00 → Lvl 3: 2:30).
- **Level terakhir (malam)**: layar gelap, hanya area sekitar player yang
  terlihat (senter/vision radius terbatas).
- **XP & Level (power level)**: dapat XP dari musuh yang dikalahkan, naik
  level menambah damage. Ditampilkan sebagai badge lingkaran bernomor di HUD
  (beda dengan label "Lvl 1/3" yang menunjukkan stage).
- **Nyawa**: mulai dengan 3 nyawa (maks 5). Kena serangan musuh = kehilangan
  nyawa; nyawa habis = game over.
- **Menembak**: otomatis (auto-aim) ke musuh terdekat dalam jangkauan, tidak
  perlu aim manual.

### Musuh

| Tipe | Perilaku |
|---|---|
| Enemy 1 | Mengejar player, serangan melee jarak dekat |
| Enemy 2 | Kamikaze cepat, meledak saat dekat player (radius damage) |
| Enemy 3 | Jarak jauh, menembak laser ke player |

### Power-up (orb, muncul acak di dunia)

| Tipe | Efek |
|---|---|
| ❤ Nyawa | +1 nyawa (maks sesuai batas) |
| ⚔️ Damage | +damage sementara (8 detik) |
| ⚡ Speed | +kecepatan lari sementara (6 detik) |
| 🔫 Shotgun | **Permanen** setelah didapat: tembakan jadi menyebar (5 pelet, auto-aim ke musuh terdekat), jangkauan lebih pendek dari peluru biasa |

Semua power-up digambar seragam (orb mengilap berwarna sesuai tipe), kecuali
nyawa yang tetap pakai sprite hati.

## Kontrol

- **Desktop**: WASD / arrow keys untuk gerak.
- **Mobile**: joystick *floating* — muncul tepat di titik jari pertama
  menyentuh zona gerak (kiri layar), bukan terkunci di posisi tetap.
- Tembak selalu otomatis (tidak ada tombol tembak).

## Tutorial "How to Play"

Tutorial interaktif (spotlight + tooltip) muncul otomatis sekali di awal
pemain pertama kali main — menyorot HP, Level, Target/Waktu, XP, Minimap,
lalu diakhiri tutorial gerakan (swipe). Status "sudah pernah lihat" disimpan
di `localStorage`, bisa dipanggil ulang kapan saja lewat tombol **"?"** di
pojok kanan bawah layar.

## Performa

- Adaptive quality: FPS dipantau tiap frame, otomatis turunkan jumlah
  partikel kalau device kesulitan mempertahankan frame rate.
- DPR (device pixel ratio) di-cap untuk device layar sangat rapat.
- Sprite gambar bersifat opsional — kalau file belum ada di
  `assets/spritesheets/`, entity otomatis fallback ke bentuk primitif Canvas
  (game tetap jalan normal).
- Suara (SFX) di-generate langsung lewat Web Audio API (oscillator/synth),
  tidak ada file audio yang perlu di-load.

## Struktur folder

```
index.html              entry point + HUD + overlay intro/tutorial
style.css                styling HUD, overlay, joystick, tutorial
js/
  main.js                bootstrap, input (keyboard + joystick), game loop
  game.js                state utama, CONFIG (semua angka balancing), minimap
  tutorial.js             tutorial interaktif "How to Play" (spotlight+tooltip)
  viewport.js              skala layar, kamera, letterbox
  config.js                konstanta performa & layout (viewport, minimap, dll)
  quality.js               level kualitas render (adaptive)
  entities/
    player.js              player: gerak, damage, buff, shotgun
    enemy.js                enemy 1: melee chaser
    enemy2.js               enemy 2: kamikaze/exploder
    enemy3.js                enemy 3: ranged laser
    projectile.js            peluru (player + laser enemy3)
    projectilePool.js        object pool untuk projectile
  objects/
    point.js                collectible poin (koin)
    powerup.js               pickup power-up (orb seragam + hati)
  ui/
    hud.js                  update elemen HUD di DOM (nyawa, level, xp, buff)
  effects/
    vfx.js                  partikel & floating text
    sfx.js                  suara sintesis (Web Audio, tanpa file audio)
    powerup-effects.js       efek tiap power-up
  world/
    background.js            ground, pohon, batu (siang/malam), obstacle
  utils/
    helpers.js               collision, random, format waktu, math umum
    assets.js                loader sprite + fallback otomatis + helper animasi
  debug/
    fpsMeter.js               FPS meter kecil buat tes performa di device
assets/
  spritesheets/             sprite WebP yang benar-benar dipakai game (kecil)
  assets-image/             source mentah (gitignored, tidak dipakai runtime)
tools/
  build_assets.py           script olah assets-image/ -> spritesheets/ (gitignored, dev-only)
```

## Catatan publish

Proyek ini murni static client-only (tanpa backend/SSR/Vercel) — bisa
langsung di-host di hosting statis apa pun (GitHub Pages, Netlify, Cloudflare
Pages, itch.io, dsb). Saat deploy/hand-off, cukup ikutkan `index.html`,
`style.css`, `js/`, dan `assets/spritesheets/` — folder `assets/assets-image/`
dan `tools/` tidak dibutuhkan saat runtime.
