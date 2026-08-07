# Villa Tebing Buluh

Vue 3 + Vite (frontend) dengan backend **PHP + MySQL** di repo yang sama.

Frontend dan API dilayani dari **satu domain**, jadi tidak ada CORS dan tidak
ada URL API yang perlu diganti saat pindah hosting.

Dirancang untuk **shared hosting biasa** (Hostinger paket single, cPanel,
apa pun yang menyediakan PHP 8 + MySQL). Tidak butuh Node.js di server —
Node hanya dipakai di komputer sendiri untuk mem-_build_ frontend.

---

## Arsitektur

```
Browser  ->  Apache  ->  public_html/index.html   SPA hasil `npm run build`
                     ->  public_html/api/         API PHP (front controller)  ->  MySQL
                     ->  public_html/uploads/     foto kamar & galeri (publik)

             vtb-private/uploads/payment-proofs/  bukti bayar (DI LUAR public_html)
```

Browser **tidak pernah** bicara langsung ke database. Seluruh otorisasi dijaga
di layer API (`api/lib/auth.php` + pemisahan endpoint publik vs admin).

Situs ini tidak memuat webfont sama sekali — semua teks memakai `system-ui`
(font bawaan perangkat tamu). Jangan menambahkan `<link>` ke Google Fonts:
itu menambah request pihak ketiga dan membuat teks bergeser saat halaman
dimuat, dua hal yang paling terasa di koneksi lambat.

### Kenapa PHP

Paket hosting single di Hostinger hanya menjalankan PHP. Versi sebelumnya
memakai Node/Express — kode itu masih bisa dilihat di riwayat git
(`git log -- server/`) tapi sudah dihapus dari proyek.

Kontrak API-nya **tidak berubah sama sekali** saat berpindah: path, metode,
bentuk JSON, dan kode error (`DATE_TAKEN`, `INVALID_PROOF`, …) semuanya sama,
sehingga tidak ada satu baris pun di `src/` yang perlu disesuaikan.

---

## Setup lokal

Butuh **PHP 8.1+** (dengan ekstensi `pdo_mysql` dan `fileinfo`), MySQL, dan
Node.js untuk build frontend. Di Laragon ketiganya sudah tersedia.

1. **Buat database**

   ```sql
   CREATE DATABASE villatebingbuluh CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Impor skema** — aman dijalankan berkali-kali (idempoten):

   ```bash
   mysql -u root villatebingbuluh < api/schema.sql
   ```

3. **Buat `api/config.php`** dari `api/config.example.php`, lalu isi kredensial
   database dan `jwt_secret`:

   ```bash
   php -r "echo bin2hex(random_bytes(48)), PHP_EOL;"
   ```

   `jwt_secret` menandatangani token login admin **sekaligus** tautan bukti
   bayar. API menolak melayani kalau kurang dari 32 karakter.

4. **Pasang dependensi & buat akun admin**

   ```bash
   npm install
   npm run create-admin admin@vila.com passwordrahasia
   ```

   Ini satu-satunya cara membuat akun admin — API sengaja tidak punya endpoint
   registrasi. Menjalankan ulang dengan email sama akan mengganti passwordnya.

5. **Isi data contoh** (opsional, untuk development)

   ```bash
   npm run seed
   ```

   Lihat [Seeder data contoh](#seeder-data-contoh) di bawah.

6. **Jalankan** (dua terminal)

   ```bash
   npm run api   # API PHP di :3001 (server bawaan PHP)
   npm run dev   # frontend di :5173, sudah mem-proxy /api dan /uploads
   ```

---

## Seeder data contoh

`api/tools/seed.php` mengisi **semua** tabel dengan data contoh yang saling
nyambung: 4 kamar (satu sengaja nonaktif) beserta fotonya, 3 promo (satu khusus
kamar tertentu, satu sudah kedaluwarsa), 12 foto galeri, 11 booking yang
mencakup keenam status, seluruh pengaturan situs, dan satu akun admin contoh.

```bash
npm run seed              # tambah/perbarui data contoh, data lain dibiarkan
npm run seed -- --fresh --yes   # kosongkan dulu semua tabel isi, baru diisi ulang
```

Yang perlu diketahui:

- **Idempoten.** Semua baris punya ID tetap (turunan md5 dari nama datanya),
  jadi menjalankan ulang memperbarui baris yang sama, bukan menggandakan.
- **Tanggal booking relatif hari ini** (mis. check-in H+3, H+14), supaya
  kalender admin selalu terisi kapan pun seeder dijalankan.
- **Total harga dihitung ulang** lewat `compute_stay()` di `api/lib/pricing.php`,
  jadi angkanya konsisten dengan promo yang ikut di-seed.
- **Bukti bayar** dibuatkan berkas PNG contoh di bucket privat, jadi tombol
  "Lihat bukti bayar" di admin benar-benar bisa dibuka.
- **Akun admin contoh** `admin@villatebingbuluh.test` / `admin12345` hanya
  dibuat kalau emailnya belum ada — password akun yang sudah ada tidak pernah
  ditimpa. Jangan pakai di produksi.
- `--fresh` **menghapus** seluruh isi `bookings`, `promos`, `promo_rooms`,
  `rooms`, `room_images`, dan `gallery_images`. Tanpa `--yes` seeder menolak
  jalan. Tabel `admin_users` tidak pernah ikut dihapus.
- Sama seperti `create-admin.php`, seeder menolak dipanggil dari browser.

---

## Deploy ke Hostinger (satu domain)

> **Butuh paket Web Premium ke atas.** Paket **Single tidak punya SSH maupun
> SFTP** — hanya FTP biasa. Padahal langkah 8 (buat akun admin) menjalankan
> `api/tools/create-admin.php`, dan berkas itu sengaja menolak jalan di luar
> CLI. Tanpa SSH, deploy berhenti di situ: situsnya tampil, tapi tidak ada
> yang bisa masuk ke `/admin`.

Susunan berkas di server:

```
domains/NAMADOMAIN/
├── public_html/            <- document root
│   ├── index.html          }
│   ├── assets/             } isi folder dist/ hasil `npm run build`
│   ├── img/  favicon.png   }
│   ├── .htaccess           <- dari public_html.htaccess di repo
│   ├── api/                <- seluruh folder api/ dari repo
│   │   ├── config.php      <- dibuat sendiri, TIDAK ada di repo
│   │   └── ...
│   └── uploads/
│       ├── .htaccess       <- dari uploads.htaccess di repo
│       ├── room-images/
│       └── gallery-images/
└── vtb-private/
    └── uploads/
        └── payment-proofs/ <- di LUAR public_html, tidak bisa diakses Apache
```

Langkah:

1. `npm run build` di komputer sendiri.
2. Unggah **isi** `dist/` ke `public_html/` (bukan folder `dist`-nya).
3. Unggah folder `api/` ke `public_html/api/`.
4. Salin `public_html.htaccess` dari repo menjadi `public_html/.htaccess`,
   dan `uploads.htaccess` menjadi `public_html/uploads/.htaccess`.
5. Buat database di hPanel → Databases → MySQL Databases, lalu impor
   `api/schema.sql` lewat phpMyAdmin.
6. Salin `api/config.example.php` menjadi `api/config.php` dan isi nilainya.
7. Buat folder `vtb-private/uploads/payment-proofs/` sejajar dengan
   `public_html` (lewat File Manager).
8. Buat akun admin lewat SSH. Aktifkan dulu di hPanel → Websites → Dashboard →
   Advanced → SSH Access, lalu jalankan perintah `ssh` yang ditampilkan di sana
   dari terminal sendiri (passwordnya = password FTP):

   ```bash
   cd domains/NAMADOMAIN/public_html
   php api/tools/create-admin.php admin@vila.com passwordrahasia
   ```

   Hostinger tidak menyediakan terminal di dalam browser untuk shared hosting —
   yang ada di hPanel hanya halaman kredensial SSH. Fitur "Browser Terminal"
   yang beredar di tutorial itu khusus VPS.

9. Aktifkan SSL gratis di hPanel → Security → SSL. `.htaccess` sudah memaksa
   pengalihan ke HTTPS.

**Yang TIDAK perlu diunggah:** `src/`, `node_modules/`, `shared/`,
`api/tests/`, `api/dev-server.php`, `package.json`. Semuanya hanya dipakai saat
pengembangan. (`shared/pricing.js` sudah ikut ter-_bundle_ ke dalam `dist/`.)

> **Backup:** folder `uploads/` dan `vtb-private/` berisi foto kamar, galeri,
> dan bukti bayar tamu. Isinya tidak ikut git dan tidak bisa dibuat ulang dari
> kode — ikutkan dalam backup rutin bersama dump MySQL.

---

## Deploy otomatis lewat GitHub Actions

`.github/workflows/deploy.yml` mengerjakan ulang langkah 1–4 di atas setiap kali
ada push ke `main` (bisa juga dijalankan manual lewat tab **Actions** → **Run
workflow**). Langkah 5–8 — database, `config.php`, folder `vtb-private/`, dan
akun admin — tetap manual sekali di awal; workflow ini hanya mengirim kode.

### Secret yang harus diisi

Settings → Secrets and variables → Actions:

| Secret                       | Isi                                                       |
| ---------------------------- | --------------------------------------------------------- |
| `HOSTINGER_SSH_HOST`         | IP server dari hPanel → Advanced → SSH Access              |
| `HOSTINGER_SSH_USER`         | mis. `u123456789`                                          |
| `HOSTINGER_SSH_PORT`         | opsional, default `65002`                                  |
| `HOSTINGER_SSH_KEY`          | **kunci privat** OpenSSH; publiknya ditempel di hPanel     |
| `HOSTINGER_SSH_KNOWN_HOSTS`  | opsional, keluaran `ssh-keyscan -p 65002 IP`               |
| `HOSTINGER_DEPLOY_PATH`      | mis. `domains/villatebingbuluh.com/public_html`            |
| `SITUS_URL`                  | mis. `villatebingbuluh.com`, dipakai untuk cek pasca-deploy |

Buat kuncinya dengan `ssh-keygen -t ed25519 -f vtb-deploy -N ""`, tempel isi
`vtb-deploy.pub` ke hPanel → SSH Access → Manage SSH keys, dan isi
`vtb-deploy` (tanpa `.pub`) ke `HOSTINGER_SSH_KEY`. Tanpa
`HOSTINGER_SSH_KNOWN_HOSTS` identitas server diterima apa adanya saat pertama
jalan; mengisinya membuat server dipatok dan MITM ditolak.

### Yang sengaja TIDAK ikut terkirim

Workflow menyusun folder `_release/` yang persis menyerupai `public_html/`,
lalu `rsync --delete`. Yang dibuang sebelum kirim:

- `api/tests/`, `api/dev-server.php`, `api/config.example.php` — hanya untuk
  pengembangan.
- **`api/schema.sql` dan `api/migrations/`** — `api/.htaccess` menyajikan berkas
  yang benar-benar ada secara langsung (aturannya cuma mengalihkan yang *tidak*
  ada ke `index.php`), jadi kalau ikut terunggah isinya bisa diunduh siapa pun
  di `/api/schema.sql`. Keduanya diimpor lewat phpMyAdmin dari salinan lokal,
  server tidak pernah membutuhkannya. `api/tools/` tetap dikirim karena
  `create-admin.php` dijalankan di server — berkasnya sudah dijaga ganda oleh
  `RedirectMatch 404` dan pemeriksaan `PHP_SAPI`.

Dua hal yang dilindungi dari `--delete` supaya data produksi tidak ikut terhapus:

- `--exclude='/api/config.php'` — kredensial database, tidak ada di git.
- `--exclude='/uploads/*/'` — `room-images/` dan `gallery-images/`. Hanya isi
  subfoldernya yang dilindungi; `uploads/.htaccess` tetap diperbarui.

`vtb-private/` berada di luar `public_html` sehingga tidak pernah tersentuh.

### Kalau gagal

- `rsync tidak ada di server` — paket hostingnya tidak menyediakan `rsync`;
  ganti langkah kirim dengan tar over SSH atau deploy FTP.
- `HOSTINGER_DEPLOY_PATH tidak ditemukan` — path-nya relatif terhadap home SSH,
  bukan `/home/uXXXX/...`.
- Langkah **Cek situs hidup** merah tapi rsync hijau — kodenya sudah naik,
  masalahnya di `config.php`, database, atau domainnya belum mengarah ke server
  ini. Bandingkan dengan origin langsung:
  `curl -sk --resolve villatebingbuluh.com:443:145.79.28.37 https://villatebingbuluh.com/api/rooms`
  Kalau origin membalas JSON tapi domain publik tidak, masalahnya di DNS/proksi,
  bukan di deploy.

> **Domain di belakang Cloudflare.** `villatebingbuluh.com` di-proksi Cloudflare,
> jadi A record di dasbor Cloudflare harus menunjuk ke `145.79.28.37` — bukan ke
> IP parkir Hostinger. Langkah cek memeriksa **isi** balasan, bukan sekadar kode
> 200, karena halaman parkir Hostinger juga membalas 200 dan pernah membuat
> deploy tampak hijau padahal situsnya tidak tersaji.

---

## Catatan keamanan

- **Bukti bayar disimpan di luar `public_html`.** Berkasnya berisi data
  finansial pribadi tamu, jadi Apache tidak punya cara apa pun menyajikannya —
  perlindungannya tidak bergantung pada `.htaccess` yang benar. Admin
  membacanya lewat URL bertanda tangan HMAC bermasa berlaku (`/api/proofs/...`),
  dipakai karena tag `<img>` tidak bisa mengirim header `Authorization`.
- **Tipe berkas unggahan diperiksa dari isinya**, bukan dari nama atau header
  kiriman klien (`finfo`, magic bytes). Nama berkas selalu ditulis ulang jadi
  `UUID.ext`, jadi tidak ada jalan untuk path traversal maupun ekstensi yang
  bisa dieksekusi.
- **Harga dihitung ulang di server.** `POST /api/bookings/public` mengabaikan
  total harga kiriman klien dan menghitungnya dari data kamar + promo di
  database.
- **Cek bentrok bersifat atomik.** Pemeriksaan tanggal dan `INSERT` berada di
  satu transaksi dengan `FOR UPDATE`, jadi dua tamu yang menekan kirim
  bersamaan tidak bisa memesan tanggal yang sama.
- **Header keamanan** (CSP, HSTS, anti-clickjacking) dipasang di
  `public_html/.htaccess` untuk halaman, dan di `api/index.php` untuk balasan
  API.
- **Tidak ada endpoint registrasi.** Akun admin hanya lahir dari
  `api/tools/create-admin.php`, yang menolak jalan kalau dipanggil dari browser.

---

## Gambar: batas keras 50 KB

Semua gambar yang tersimpan di server — aset statis maupun unggahan admin —
harus **di bawah 50 KB**. Ada dua jalur yang menjaganya.

### 1. Aset statis (`public/img/`)

Master resolusi penuh disimpan di **`assets/img-src/`**. Folder ini sengaja ada
di luar `public/`, jadi tidak ikut terkirim ke server (workflow hanya menyalin
`dist/` dan `api/`). Jangan hapus: ini satu-satunya sumber kalau varian perlu
dibuat ulang.

```bash
npm run images
```

Perintah itu membaca `assets/img-src/`, memotong ke rasio **3:2**, lalu menulis
varian **640 / 828 / 1080** ke `public/img/`. Kualitas WebP dicari otomatis
(binary search) — dipakai angka tertinggi yang masih muat 50 KB. Di akhir,
skrip memindai seluruh `public/` dan keluar dengan kode error kalau masih ada
berkas di atas 50 KB.

**Kalau menambah gambar hero baru:** taruh master di `assets/img-src/`,
daftarkan di array `HEROES` pada `scripts/optimize-images.mjs`, jalankan
`npm run images`.

> **Kenapa maksimal 1080px?** Batas 50 KB membuat lebar besar mustahil: pada
> 1600px kualitas WebP jatuh ke q≈6 dan pada 2000px berkasnya tetap 56–130 KB
> bahkan di kualitas terendah. Jadi varian 1600/2000 dihapus, bukan diperkecil
> kualitasnya. Konsekuensinya hero terlihat agak lembut di monitor lebar —
> sebagian besar tertutup gradien gelap di atasnya. Kalau suatu saat batasnya
> dilonggarkan, ubah `MAX_BYTES` dan `WIDTHS` di skrip lalu jalankan ulang.

### 2. Unggahan admin (`uploads/`)

`api/lib/images.php` mengompres **setiap** berkas yang masuk sebelum disimpan.
Apa pun yang diunggah (JPG/PNG/WebP) keluar sebagai `.webp`:

- sisi terpanjang dipotong ke maksimal **1600px**;
- orientasi EXIF dari kamera HP diluruskan;
- kualitas dicari otomatis sampai muat 50 KB, dan kalau tetap tidak muat,
  ukurannya diperkecil 20% lalu dicoba lagi (sampai batas 320px);
- gambar bergaya grafis — **kode QRIS**, tangkapan layar — dideteksi lewat
  ukuran hasilnya lalu disimpan **lossless**, jadi QRIS tetap tajam dan
  terpindai (contoh: 4,8 KB → 0,7 KB, tanpa kehilangan piksel).

Berkas yang sudah telanjur ada di server bisa disapu sekali jalan:

```bash
php api/tools/compress-uploads.php
```

Skrip itu mengompres **di tempat dengan format yang sama** (webp tetap webp,
jpg tetap jpg) supaya nama berkas yang sudah tercatat di database tidak
berubah.

### 3. Menghapus gambar ikut menghapus berkasnya

Menghapus baris di database saja akan meninggalkan berkas yatim yang menumpuk
di disk selamanya. Karena itu berkas fisik ikut dihapus saat:

| Aksi admin | Berkas yang dibersihkan |
| ---------- | ----------------------- |
| Hapus kamar (satuan/massal) | semua foto kamar itu |
| Edit kamar lalu membuang foto | foto yang dibuang saja |
| Hapus foto galeri (satuan/massal) | foto tersebut |
| Ganti gambar QRIS | gambar QRIS yang lama |
| Hapus booking (satuan/massal) | bukti bayarnya |

Aturan pengamannya ada di `delete_upload_refs()` (`api/lib/uploads.php`):

- berkas **hanya** dihapus kalau tidak ada baris lain yang masih memakainya —
  satu foto yang dipakai kamar **dan** galeri baru hilang setelah referensi
  terakhirnya dilepas;
- hanya URL unggahan lokal (`/uploads/<bucket>/<uuid>.<ext>`) yang diproses;
  URL luar seperti Unsplash dan jalur aneh seperti `../../config.php`
  diabaikan, jadi tidak bisa dipakai untuk menghapus berkas sembarangan;
- penghapusan berkas dilakukan **setelah** transaksi database sukses, supaya
  transaksi yang batal tidak terlanjur menghapus berkas;
- gagal menghapus berkas tidak membatalkan permintaan, hanya dicatat ke log.

Untuk berkas yatim yang sudah telanjur menumpuk sebelum ini ada:

```bash
php api/tools/prune-uploads.php        # uji coba, tidak menghapus apa pun
php api/tools/prune-uploads.php --yes  # benar-benar menghapus
```

---

## Berkas PHP tidak bisa diakses dari browser

`api/config.php` berisi password database dan `jwt_secret`, jadi ditolak lewat
`<FilesMatch>` di `api/.htaccess`. Selain itu setiap subfolder `api/` punya
`.htaccess` berisi `Require all denied`:

- `api/lib/.htaccess`
- `api/routes/.htaccess`
- `api/tools/.htaccess`

Ini tidak mengganggu jalannya API, karena `require` di PHP membaca berkas lewat
filesystem, bukan lewat Apache. Yang diblokir hanya permintaan HTTP langsung
seperti `/api/lib/db.php`. Satu-satunya berkas PHP yang boleh dipanggil browser
adalah `api/index.php`.

Workflow deploy memastikan keempat `.htaccess` itu ikut terkirim dan
`api/config.php` tidak pernah ikut.

---

## Promo harga kamar

Admin bisa memberi harga khusus untuk **periode menginap** tertentu lewat menu
**Kelola Promo** (`/admin/promo`).

- Potongan berupa **persen** atau **nominal rupiah per malam** (`discount_type`
  = `percent` | `nominal`). Keduanya mengurangi harga normal kamar, jadi satu
  promo bisa dipakai lintas kamar walau harga dasarnya berbeda. Potongan yang
  melebihi harga kamar dijepit ke Rp 0, tidak pernah negatif.
- Berlaku untuk **semua kamar** atau **kamar terpilih**.
- Perhitungannya **prorata per malam**: hanya malam yang jatuh di dalam periode
  promo yang didiskon. Menginap sampai lewat periode tetap membayar harga
  normal untuk sisa malamnya.
- `end_date` bersifat **inklusif** — promo "10–20 Agustus" ikut memberi harga
  promo untuk malam 20 Agustus.
- Bila beberapa promo menutupi malam yang sama, yang dipakai adalah **yang
  paling murah** bagi tamu. Aturan ini juga menjaga promo tidak pernah
  menaikkan harga.
- Menghapus atau menonaktifkan promo **tidak** mengubah booking yang sudah
  dibuat: harganya sudah membeku di `bookings.total_price` saat pemesanan.

Tipe lama `fixed_price` (harga tetap per malam) sudah dihapus. Database yang
sudah berisi promo lama perlu dijalankan sekali lewat **phpMyAdmin** (hPanel →
Databases → phpMyAdmin → tab Import → pilih berkasnya):

```
api/migrations/2026-08-04-promo-nominal.sql
```

phpMyAdmin dipilih karena tersedia di semua paket. Di komputer sendiri — atau
lewat SSH kalau paketnya Premium ke atas — perintah setaranya:
`mysql -u USER -p NAMA_DB < berkas`.

Konversinya perkiraan — potongan dihitung dari kamar termurah yang kena promo —
jadi periksa ulang nilainya di `/admin/promo` setelah migrasi.

### ⚠️ Aturan harga ditulis di DUA tempat

| Berkas                | Dipakai | Perannya                          |
| --------------------- | ------- | --------------------------------- |
| `api/lib/pricing.php` | server  | **otoritas** — menentukan tagihan |
| `shared/pricing.js`   | browser | menampilkan estimasi ke tamu      |

PHP tidak bisa mengimpor modul JavaScript, jadi duplikasi ini tak terhindarkan.
**Mengubah salah satu berarti mengubah keduanya.** Kesamaannya dijaga uji:

```bash
npm run test:pricing
```

Uji itu menjalankan kumpulan kasus yang sama lewat PHP dan Node lalu
membandingkan hasilnya malam per malam. Jalankan setiap kali aturan harga
disentuh — kalau keduanya menyimpang, tamu akan melihat satu angka lalu
ditagih angka lain.

---

## Peta kode

| Berkas                       | Isi                                                      |
| ---------------------------- | -------------------------------------------------------- |
| `api/schema.sql`             | Skema MySQL (idempoten)                                  |
| `api/migrations/`            | Perubahan skema untuk database yang sudah berisi data    |
| `api/index.php`              | Front controller + tabel rute + header keamanan          |
| `api/config.example.php`     | Templat konfigurasi (salin jadi `config.php`)            |
| `api/lib/db.php`             | PDO + helper query/transaksi                             |
| `api/lib/auth.php`           | JWT HS256 tanpa dependensi + `require_auth()`            |
| `api/lib/uploads.php`        | Bucket unggahan + tanda tangan bukti bayar               |
| `api/lib/images.php`         | Kompresi WebP unggahan (batas keras 50 KB)               |
| `api/lib/pricing.php`        | Mesin harga + promo (**kembaran** `shared/pricing.js`)   |
| `api/routes/`                | auth, rooms, bookings, promos, gallery, settings, upload |
| `api/tools/create-admin.php` | Buat/ganti password akun admin (CLI saja)                |
| `api/tools/seed.php`         | Isi semua tabel dengan data contoh (CLI saja)            |
| `api/tools/compress-uploads.php` | Sapu berkas lama di `uploads/` ke bawah 50 KB        |
| `api/tools/prune-uploads.php` | Hapus berkas unggahan yatim (tidak dirujuk database)    |
| `scripts/optimize-images.mjs`| Bangun varian hero `public/img/` dari `assets/img-src/`   |
| `assets/img-src/`            | Master gambar resolusi penuh (tidak ikut deploy)         |
| `api/tests/`                 | Uji parity harga PHP ↔ JS                                |
| `api/dev-server.php`         | Router server bawaan PHP (development saja)              |
| `public_html.htaccess`       | Salin jadi `public_html/.htaccess` saat deploy           |
| `uploads.htaccess`           | Salin jadi `public_html/uploads/.htaccess` saat deploy   |
| `shared/pricing.js`          | Mesin harga sisi browser                                 |
| `src/lib/api.js`             | Klien REST + `friendlyDbError`                           |
| `src/lib/storage.js`         | Unggah gambar ke `/api/upload/*`                         |
| `src/composables/`           | State per-domain (rooms, bookings, promos, gallery, dst) |

Tanpa backend yang jalan, halaman publik otomatis memakai data contoh dari
`src/data/demoData.js` (hanya saat `npm run dev`).
