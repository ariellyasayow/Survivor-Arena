# Survivor Arena (prototype)

konsep tim: player dikepung enemy, cari poin sebelum waktu habis, level terakhir jadi malam
dengan jangkauan pandang terbatas.

## Cara menjalankan

1. Buka folder ini di VS Code.
2. Install extension **Live Server** (kalau belum).
3. Klik kanan `index.html` → **Open with Live Server**.

Wajib lewat Live Server (atau server lokal lain), tidak bisa dibuka langsung
dari file explorer, karena game ini pakai ES Modules (`import`/`export`) yang
diblokir browser kalau diakses lewat `file://`.

## Kontrol

- **Desktop**: WASD / arrow keys untuk gerak. Tembak otomatis ke musuh terdekat.
- **Mobile**: joystick di kiri bawah layar.

## Struktur folder

```
index.html            entry point + HUD (health, score, timer, level, xp)
style.css              styling HUD, overlay, joystick
js/
  main.js              bootstrap, input, game loop
  game.js              state utama & semua konfigurasi angka (CONFIG)
  entities/
    player.js          player: gerak, damage, buff
    enemy.js           enemy: kejar player, hp, damage
    projectile.js       peluru
  objects/
    point.js           collectible poin
    powerup.js         pickup power-up
  ui/
    hud.js             update elemen HUD di DOM
  effects/
    vfx.js             partikel & floating text
    sfx.js             suara sintesis (Web Audio, tanpa file audio)
    powerup-effects.js efek tiap power-up
  world/
    background.js      ground, pohon, batu (siang/malam), posisi obstacle
  utils/
    helpers.js          collision, random, format waktu
assets/                 taruh sprite/sfx asli di sini kalau sudah ada
```


