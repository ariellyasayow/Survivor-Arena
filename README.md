# Survivor Arena

Survivor Arena adalah game arena bertahan hidup dengan sudut pandang dari atas (top-down). Kamu berperan sebagai satu karakter yang dikepung musuh dari segala arah, bertugas mengumpulkan poin sambil bertahan sampai waktu habis. Yang bikin seru: karaktermu menembak sendiri ke musuh terdekat, jadi kamu tinggal fokus bergerak, menghindar, dan mengatur posisi — cocok dimainkan santai di HP dengan satu jempol.

---

## Fitur Utama

- **Tembak otomatis** — karakter membidik musuh terdekat sendiri, pemain cukup fokus bergerak dan menghindar.
- **Joystick mengikuti jari** — kontrol gerak muncul persis di titik pertama jari menyentuh layar, jadi nyaman dipegang di posisi mana pun.
- **3 level dengan tingkat kesulitan naik** — musuh makin banyak dan makin kuat tiap level; level terakhir gelap dan pandangan terbatas seperti pakai senter.
- **3 jenis musuh berbeda** — pengejar jarak dekat, peledak nekat, dan penembak laser jarak jauh.
- **Beragam power-up** — tambah nyawa, tembakan lebih sakit, lari lebih cepat, tembakan menyebar (shotgun), dan tembakan super cepat.
- **Peta kecil (minimap)** — menampilkan posisi musuh, koin, dan power-up di sekitarmu.
- **Panduan bawaan** — tutorial "Cara Main" muncul otomatis di awal dan bisa dibuka lagi kapan saja.
- **Ringan & mandiri** — jalan langsung di browser HP tanpa perlu instalasi berat atau koneksi terus-menerus.

---

## Cara Bermain

### Tujuan
Kumpulkan koin sampai memenuhi target poin di tiap level sebelum waktu habis. Selesaikan ketiga level untuk menang. Kalau nyawa habis atau waktu keburu nol, permainan berakhir.

### Kontrol (HP / layar sentuh)

| Aksi | Cara |
|---|---|
| Menggerakkan karakter | Sentuh lalu geser (drag) di sisi kiri layar — joystick muncul di titik sentuhmu |
| Menembak | Otomatis ke musuh terdekat, tidak perlu tombol |
| Membuka panduan "Cara Main" | Tap tombol **?** di pojok kanan bawah |
| Mulai / main lagi | Tap tombol **Mulai** (atau **Main lagi** setelah selesai) |

### Aturan yang perlu diketahui
- **Waktu habis = langsung kalah**, bukan sekadar kehilangan nyawa. Kejar target poin secepatnya.
- **Tiap naik level, waktu bertambah** (Level 1: 1 menit 30 detik, lalu +30 detik tiap level) — tapi musuh juga makin kuat.
- **Level terakhir gelap.** Kamu hanya bisa melihat area kecil di sekitar karakter, jadi lebih waspada.
- **Kumpulkan XP dengan mengalahkan musuh** untuk naik level dan menambah kekuatan tembakan.
- **Power-up nyawa bersifat permanen** (menambah nyawa), sedangkan power-up lain (shotgun, tembak cepat, damage, kecepatan) hanya bertahan beberapa detik.

---

## Cara Menjalankan

Game ini berbentuk aplikasi web ringan, jadi dijalankan lewat browser HP (atau dibungkus ke dalam aplikasi berbasis WebView).

### Kebutuhan perangkat
- **Android 8.0+** atau **iOS 13+**
- Browser modern (Chrome, Safari, atau bawaan sistem versi terbaru)
- Penyimpanan sangat kecil (**di bawah 5 MB**)
- Koneksi internet hanya untuk memuat pertama kali; setelah itu tidak butuh server

### Cara memainkan (untuk pemain)
1. Buka tautan game yang dibagikan (atau buka lewat aplikasi tempat game ini dipasang) di browser HP.
2. Tunggu halaman termuat sampai muncul layar "Survivor Arena".
3. Tap **Mulai**, ikuti panduan "Cara Main", lalu bermain.

### Menjalankan dari source (untuk developer)
Proyek ini murni file statis, jadi cukup dilayani lewat server sederhana lalu diakses dari HP dalam jaringan WiFi yang sama:

```bash
# Masuk ke folder proyek
cd game-app-project

# Jalankan server statis (butuh Python)
python -m http.server 8000 --bind 0.0.0.0


## Struktur Folder Project

```
game-app-project/
├─ index.html          # Halaman utama + tampilan info & tutorial
├─ style.css           # Gaya tampilan: HUD, tombol, joystick, tutorial
├─ js/                 # Semua kode game
│  ├─ main.js          # Titik awal: kontrol pemain & perulangan game
│  ├─ game.js          # Pusat kendali: aturan, spawn, tembak, level
│  ├─ tutorial.js      # Panduan interaktif "Cara Main"
│  ├─ entities/        # Karakter: player, musuh 1/2/3, peluru
│  ├─ objects/         # Item: koin & power-up
│  ├─ effects/         # Suara dan efek visual (percikan, teks melayang)
│  ├─ ui/              # Info di layar (nyawa, skor, level, waktu)
│  ├─ world/           # Latar: rumput, pohon, batu
│  └─ utils/           # Fungsi bantu & pemuat gambar
└─ assets/
   └─ spritesheets/    # Gambar karakter & item
```

Penjelasan folder utama:
- **`js/entities/`** — semua yang "hidup" dan bergerak: player, tiga jenis musuh, dan peluru.
- **`js/objects/`** — benda yang bisa diambil: koin dan power-up.
- **`js/effects/`** — pemanis: suara dan efek visual.
- **`js/ui/`** — tampilan angka & info di atas layar.
- **`js/world/`** — latar tempat bermain.
- **`js/utils/`** — kumpulan fungsi pembantu dan pengatur gambar yang dipakai banyak file.
- **`assets/spritesheets/`** — file gambar karakter dan item. Bersifat opsional: sebelum gambar dimuat, game menampilkan bentuk sederhana sebagai gantinya.

---

## Tech Stack

- **Engine/Framework:** tidak memakai engine game — dibangun langsung di atas **Canvas 2D** bawaan browser (murni tanpa framework).
- **Bahasa utama:** **JavaScript** (ES Modules), dengan **HTML** dan **CSS** untuk halaman dan tampilan.
- **Tools & library tambahan:**
  - **Web Audio API** — membuat semua efek suara langsung dari kode (tanpa file audio).
  - **localStorage** — mengingat apakah pemain sudah melihat tutorial.
  - **Python + Pillow** — hanya dipakai developer untuk mengolah gambar mentah menjadi file gambar game (opsional, tidak ikut saat game berjalan).

Tidak ada library eksternal, tidak ada proses build, dan tidak butuh server backend — seluruh game berjalan di sisi pemain.
