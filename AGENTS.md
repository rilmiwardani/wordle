# PANDUAN PENGEMBANGAN & DESAIN SISTEM AGENT (AGENTS.md)
> **PENTING UNTUK SEMUA AI AGENT:**  
> File ini adalah aturan baku (*Single Source of Truth*) untuk proyek **TikTok Live Wordle & Interactive Word Games**.  
> Setiap kali diminta menambahkan fitur baru, memperbaiki bug, atau **membuat mode game baru**, Anda **WAJIB** mematuhi panduan UI/UX, arsitektur kode, dan aturan anti-pola di bawah ini.

---

## 1. Identitas Proyek & Karakteristik Layar
* **Platform Utama:** TikTok Live Streaming via **OBS Studio / TikTok Live Studio** (Browser Source).
* **Rasio Layar:** **Vertikal 9:16 (Mobile-First Portrait)**.
* **Audiens:** Penonton live streaming di layar HP 6 inci dengan koneksi dan bitrate beragam (rentan kompresi video 480p–720p).
* **Bahasa UI:** Bahasa Indonesia yang santai, lugas, bersahabat, dan memancing interaksi penonton (*Call-to-Action* chat).

---

## 2. ATURAN MUTLAK: ANTI-AI SLOP (DILARANG KERAS)
Setiap desain UI yang dihasilkan **DILARANG KERAS** menggunakan elemen-elemen khas template AI generik berikut:
1. ❌ **JANGAN GUNAKAN palet warna ungu/indigo/sian neon generik AI** (seperti Tailwind `from-purple-600 to-indigo-600` dengan neon glow).
2. ❌ **JANGAN GUNAKAN background jaring-jaring kotak SVG (*grid line pattern*)** atau pola titik-titik (*dot matrix*) dengan ambient blob kabur di belakangnya.
3. ❌ **JANGAN GUNAKAN teks *copywriting* hiperbolis AI** (contoh: *"Supercharge your live stream"*, *"Seamless and effortless"*, *"Unlock the magic"*).
4. ❌ **JANGAN membuat kartu popup kemenangan / modal baru yang terpisah.** Gunakan kartu kemenangan `#winOverlay` yang sudah ada!
5. ❌ **JANGAN membuat sistem audio/SFX baru dari nol.** Gunakan `window.sounds` WebAudio sintetis yang sudah terintegrasi.
6. ❌ **JANGAN menaruh elemen penting di area 15% paling bawah layar** (*TikTok Danger Zone*), karena area tersebut tertutup oleh gelembung komentar live TikTok di layar HP penonton.
7. ❌ **JANGAN GUNAKAN emoji default sistem (Unicode emoji)** seperti 👑, 💡, 💬, ⏭️, 🎯, dsb pada elemen antarmuka (UI). Emoji sistem memiliki rendering yang tidak konsisten (bisa gepeng, hitam-putih, atau font fallback pecah) di berbagai versi Windows, OBS Studio, dan browser HP. **WAJIB gunakan ikon vektor resmi Font Awesome 6** (`<i class="fa-solid fa-..."></i>`).
8. ❌ **JANGAN GUNAKAN efek glow dan neon berlebihan** (seperti `box-shadow: 0 0 25px #neon`, aura cahaya kabur neon ungu/cyan/hijau, atau `text-shadow` berpijar menyilaukan khas AI slop). Gunakan bayangan natural yang bersih (*soft natural drop shadow* / *subtle elevation*, contoh: `rgba(0,0,0,0.35)`), serta garis tepi (*border*) tajam berkontras tinggi agar tampilan tetap tajam dan tidak kabur saat terkompresi bitrate live TikTok 480p–720p.

---

## 3. Sistem Desain Baku (Design Tokens)

### A. Palet Warna Resmi
* **Aksen TikTok & Brand:**
  * TikTok Red: `#fe2c55`
  * TikTok Cyan: `#25f4ee`
  * Amber Gold / Rank: `#f59e0b` / `#ffd54f`
* **Warna Semantik Ubin Game:**
  * Benar / Tepat (*Correct*): `#16a34a` (hijau kontras tinggi agar terbaca jelas dengan teks putih).
  * Posisi Salah (*Present*): `#c6aa24` (kuning hangat, tidak menyilaukan mata).
  * Huruf Salah (*Absent*): `rgba(255, 255, 255, 0.2)`.
  * Kotak Kosong (*Empty*): `rgba(255, 255, 255, 0.05)`.
* **Tema Visual (Wajib Mendukung Keduanya):**
  1. **Dark Nature (Default):** Background gambar `assets/bg_nature.png` dengan overlay gelap transparan.
  2. **Daylight Sepia (`body.theme-sepia`):** Palet *anti-glare matte kraft paper* (`#e2d7c5`, `#423428`, aksen kayu cokelat). Setiap mode baru **wajib memiliki aturan CSS khusus** di bawah selektor `body.theme-sepia`.

### B. Tipografi
* **Font Family:** `'Outfit', sans-serif` (wajib diwarisi ke seluruh elemen).
* **Ketebalan Ubin Huruf:** Wajib `font-weight: 800` atau `900` (*ultra-bold*) dengan `text-shadow` halus agar tetap tajam terbaca di bitrate video rendah.
* **Header & Label:** Gunakan huruf kapital (`uppercase`), ukuran ringkas (10px–13px), dan `letter-spacing: 0.5px - 1px`.

---

## 4. Cetak Biru (Blueprint) Membuat Mode Game Baru
Setiap kali diminta membuat mode game baru, **ikuti 5 pilar arsitektur baku ini secara berurutan**:

### Pilar 1: Struktur HTML (`index.html`)
* Buat satu kontainer utama di dalam `#gameArea` dengan ID `#<namaMode>Container`.
* Beri atribut `style="display: none;"` secara default (hanya ditampilkan saat mode tersebut aktif).
* Sertakan header kartu clue/ronde yang ringkas (1 baris agar tidak memakan ruang papan).

### Pilar 2: Desain & Responsivitas CSS (`style.css`)
* Seluruh styling papan harus menggunakan CSS variable:
  * `var(--board-scale, 1)` untuk kontrol ukuran papan.
  * `var(--correct)`, `var(--present)`, `var(--empty)` untuk ubin.
* Sediakan styling untuk `body.theme-sepia #<namaMode>Container` agar ramah tema siang/kertas.

### Pilar 3: Logika Game di `app.js`
* Deklarasikan state game secara terisolasi (misal: `<namaMode>Round`, `<namaMode>CurrentWord`, dll).
* Buat fungsi-fungsi standar:
  * `init<NamaMode>Game()`: Menginisialisasi papan dan mereset status.
  * `process<NamaMode>Guess(word, userData)`: Memvalidasi tebakan dari chat TikTok.
  * `render<NamaMode>UI()`: Merender tampilan ubin atau grid.
* **Flood & Cooldown Protection:**
  * Jika chat masuk banjir (> 3 tebakan per detik), lewati animasi flip dan gunakan penampilan instan.
  * Gunakan sistem cooldown anti-dominasi (`recordWin(userId)`).

### Pilar 4: Integrasi Audio & Efek Kemenangan
* **Suara Ubin:** Panggil `window.sounds.playFlip(i)` saat ubin terbuka, dan `window.sounds.playGreenChime()` saat huruf hijau muncul.
* **Kemenangan:**
  * Panggil popup kemenangan baku: `handle<NamaMode>Win(userData)`.
  * Isi data `#winAvatar`, `#winName`, `#winPts`, dan `#winWord`.
  * Bunyikan `window.sounds.playWin()`.
  * Integrasikan dengan *Like Progress Bar* (`#likeProgressContainer`) agar penonton tap layar untuk memulai ronde berikutnya.

### Pilar 5: Integrasi Switcher & Dashboard
* Daftarkan mode baru ke dalam fungsi `switchGameMode(mode)` di `app.js`.
* Tambahkan opsi mode di:
  * Tombol navigasi/header switcher.
  * Dropdown Dashboard host (`dashboard/index.html`).
  * Server socket sync (`server.js`).

---

## 5. Ringkasan Prinsip UI/UX untuk Agent
1. **Prioritaskan Keterbacaan Penonton:** Kontras ubin harus tajam, font harus tebal, dan instruksi harus singkat padat.
2. **Konsistensi Visual:** Pengguna tidak boleh merasa sedang membuka website lain saat berpindah mode game. Semua tombol, ubin, font, dan animasi harus terasa seperti satu kesatuan produk yang sama.
3. **Keringanan Performa:** Game berjalan berjam-jam di browser host dan HP Termux. Jangan gunakan library berat, hindari DOM reflow berulang di dalam loop antrean chat, dan bersihkan interval/timer saat berpindah mode.
