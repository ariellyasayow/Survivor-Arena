# Assets

Folder ini masih kosong dengan sengaja.

Prototype saat ini menggambar semua visual langsung lewat kode (Canvas API,
lihat `js/world/background.js` dan tiap file di `js/entities/`), dan semua
SFX di-generate lewat Web Audio API (`js/effects/sfx.js`) — jadi tidak ada
dependency ke file gambar/suara sama sekali dulu. Ini sengaja biar tetap
ringan di awal.

Kalau tim sudah punya aset asli:

- Taruh sprite di `assets/images/` (format PNG dengan background transparan
  disarankan).
- Taruh file suara di `assets/sounds/` (format `.mp3` atau `.wav` pendek).
- Update kode di `js/entities/*.js`, `js/world/background.js`, dan
  `js/effects/sfx.js` untuk load dan pakai file tersebut, gantikan bentuk
  primitif/synth yang ada sekarang.
