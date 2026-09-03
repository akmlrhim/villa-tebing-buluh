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

Teks body memakai **Geist**, yang **di-host sendiri** lewat paket
`@fontsource-variable/geist`. Deklarasi `@font-face`-nya ditulis tangan di
`src/style.css` dan sengaja menunjuk **satu berkas saja**:
`geist-latin-wght-normal.woff2` (sumbu bobot 100-900, subset latin). Judul
section besar (`font-display` / token `--font-display`) memakai **Playfair
Display** lewat pola yang sama, juga di-host sendiri lewat
`@fontsource-variable/playfair-display`.

Yang perlu diketahui kalau menyentuh bagian ini:

- **Jangan meng-`import` `@fontsource-variable/geist` (index.css).** Berkas itu
  menarik banyak subset (cyrillic, greek, vietnamese, latin-ext, …). Browser
  memang hanya mengunduh subset yang terpakai berkat `unicode-range`, tapi
  Vite tetap menyalin semua woff2 ke `dist/` dan semuanya ikut ter-`rsync` ke
  server. Subset `latin` sudah mencakup `×`, `²`, `·`, en dash, dan em dash,
  jadi cukup satu per font.
- **Jangan menambahkan `<link>` ke Google Fonts.** Itu request pihak ketiga,
  dan CSP di `public_html.htaccess` memakai `font-src 'self'` sehingga akan
  ditolak browser. Font yang di-host sendiri lolos tanpa mengubah CSP.
- Berkas fontnya **di-preload** lewat plugin `preloadFont()` di
  `vite.config.js`, yang membaca nama ber-hash dari bundle lalu menyisipkan
  `<link rel="preload" as="font" crossorigin>`. Tanpa itu font baru diminta
  setelah layout, dan teks sempat berkedip dari font sistem ke Geist.

### Skala teks di layar HP

Teks di bawah 640 px dikecilkan **serempak** dengan menimpa token `--text-*`
milik Tailwind di `src/style.css`, bukan dengan menempel `sm:text-…` satu per
satu di ratusan komponen:

```css
@media (width < 40rem) {
  :root { --text-sm: 0.8125rem; … }
}
```

Utilitas Tailwind v4 menghasilkan `font-size: var(--text-sm)`, jadi satu blok
ini mengubah seluruh sisi publik **dan** admin sekaligus. Dua hal yang perlu
diingat kalau menyentuhnya:

- Blok itu harus berada **di luar `@layer`** dan setelah `@theme`. Deklarasi
  tanpa layer selalu menang atas yang ber-layer, jadi kalau dipindahkan ke
  dalam `@layer base` seluruh penyesuaiannya diam-diam mati.
- Tinggi barisnya tidak perlu ikut ditimpa. Tailwind menyimpan
  `--text-*--line-height` sebagai rasio tanpa satuan, jadi ia mengecil
  mengikuti ukuran fontnya sendiri.

Ukuran yang ditulis literal (`text-[20px]`, `text-[clamp(…)]`) tidak ikut token
ini dan harus disetel manual — semuanya sudah disesuaikan, tapi kalau menambah
yang baru, sesuaikan sendiri.

Satu pengecualian sengaja: input tanggal di `AvailabilitySearch.vue` dipaku
`text-[16px]`. Safari iOS otomatis mem-_zoom_ halaman saat fokus ke input yang
fontnya di bawah 16 px, dan itu terasa seperti bug di kolom pencarian beranda.

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

## Gambar: anggaran per lebar, bukan lagi rata 50 KB

**Riwayat 8 Sep 2026:** batas rata 50 KB untuk semua lebar membuat varian
1080px jatuh ke kualitas q19–30 — terlihat pecah/kotak-kotak di layar lebar,
dikeluhkan langsung oleh pengguna. Diganti jadi **anggaran per lebar** yang
mendarat di sekitar q75–87 (tajam), diverifikasi lewat browser sungguhan.
Kalau butuh dikencangkan lagi demi kuota hosting, ubah `budgetFor()` di
`scripts/optimize-images.mjs` dan `IMAGE_MAX_BYTES` di `api/lib/images.php` —
jangan kembalikan ke satu angka rata, itu penyebab masalahnya.

### 1. Aset statis (`public/img/`)

Master resolusi penuh disimpan di **`assets/img-src/`**. Folder ini sengaja ada
di luar `public/`, jadi tidak ikut terkirim ke server (workflow hanya menyalin
`dist/` dan `api/`). Jangan hapus: ini satu-satunya sumber kalau varian perlu
dibuat ulang.

```bash
npm run images
```

Perintah itu membaca `assets/img-src/`, memotong ke rasio **3:2**, lalu menulis
varian ke `public/img/`. Kualitas WebP dicari otomatis (binary search) per
lebar — dipakai angka tertinggi yang masih muat anggaran lebar itu
(`budgetFor()` di `scripts/optimize-images.mjs`): 640px→70 KB, 828px→110 KB,
1080px→160 KB, 1600px→270 KB, 1920px→340 KB. Di akhir, skrip memindai
`public/` dan menandai berkas **di luar pipeline ini** yang masih di atas
50 KB (favicon/logo dsb — itu masih harus kecil).

**Kalau menambah gambar hero baru:** taruh master di `assets/img-src/`,
daftarkan di array `HEROES` pada `scripts/optimize-images.mjs`, jalankan
`npm run images`.

> **Kenapa `HeroSection.vue`/`PageHero.vue` tidak pakai jalur ini?** Hero utama
> (Home/About/Gallery/Contact) sengaja memakai Unsplash langsung lewat helper
> `img()`/`imgSrcset()` di `src/data/demoData.js` (q=80, srcset sampai 1920w) —
> bukan `public/img/`. Satu-satunya aset dari jalur `public/img/` yang benar-benar
> tayang saat ini adalah cover "Galeri" di homepage (`GalleryPeek.vue`,
> `img/gallery_heros*.webp`). Kalau ganti foto galeri itu, master barunya taruh
> di `assets/img-src/gallery-peek.webp`.

### 2. Unggahan admin (`uploads/`)

`api/lib/images.php` mengompres **setiap** berkas yang masuk sebelum disimpan.
Apa pun yang diunggah (JPG/PNG/WebP) keluar sebagai `.webp`:

- sisi terpanjang dipotong ke maksimal **1600px**;
- orientasi EXIF dari kamera HP diluruskan;
- kualitas dicari otomatis sampai muat **220 KB** (`IMAGE_MAX_BYTES`), dan
  kalau tetap tidak muat, ukurannya diperkecil 20% lalu dicoba lagi (sampai
  batas 320px) — dengan anggaran 220 KB, foto kamar 1600px biasanya muat di
  kualitas layak (q≈70+) tanpa perlu diperkecil sama sekali;
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

## SEO

Situs ini SPA tanpa SSR: server selalu mengirim `index.html` yang sama, isinya
baru terbentuk setelah JavaScript jalan. Googlebot bisa menjalankan JavaScript,
jadi ini bukan penghalang — tapi artinya **apa pun yang penting sebaiknya ada
di HTML mentah**, karena itulah yang dibaca paling awal dan paling andal
(termasuk oleh perayap yang tidak me-render, seperti pratinjau tautan WhatsApp).

Karena itu pembagiannya:

| Ada di HTML mentah (`index.html`) | Diisi JavaScript saat pindah halaman |
| --------------------------------- | ------------------------------------ |
| judul & deskripsi halaman depan   | judul & deskripsi per halaman        |
| canonical, OG, Twitter card       | canonical, OG, Twitter card per halaman |
| JSON-LD `LodgingBusiness`         | telepon & jam di JSON-LD itu, dari pengaturan admin |
| —                                 | JSON-LD `FAQPage` (di halaman depan) |

`src/lib/seo.js` berisi `applySeo()` yang dipanggil `router.afterEach`. Judul,
deskripsi, dan penanda `noindex` diambil dari `meta` tiap rute di
`src/router/index.js` — **kalau menambah halaman publik baru, isi `title` dan
`description` di situ**, kalau tidak halaman itu memakai teks halaman depan dan
jadi duplikat.

### Yang tidak diindeks

`/pembayaran`, `/cek-booking`, dan seluruh `/admin` ditandai
`noindex, nofollow` lewat `meta: { noindex: true }`, dan juga ditolak di
`public/robots.txt`. URL yang tidak dikenal tidak lagi dilempar ke beranda —
sekarang tampil `NotFoundView` yang ber-`noindex`, supaya salah ketik alamat
tidak berubah jadi ratusan halaman duplikat di mata Google.

> Halaman ini tetap membalas HTTP 200 (Apache selalu menyajikan `index.html`).
> Itu wajar untuk SPA dan sudah cukup selama `noindex` terpasang.

### Sitemap

`public/sitemap.xml` ditulis tangan dan hanya memuat empat halaman publik.
**Perbarui `<lastmod>` kalau isi halamannya berubah banyak**, dan tambahkan
`<url>` baru kalau ada rute publik baru. Jangan masukkan halaman `noindex`.

Daftarkan sekali di Google Search Console (Sitemaps → `sitemap.xml`).

### robots.txt

`public/robots.txt` mengizinkan semua perayap kecuali di jalur privat, dan
menunjuk ke sitemap. Perlu diketahui: **Cloudflare menyisipkan blok "Managed
Content" sendiri** ke balasan `/robots.txt` — blok itu melarang perayap AI
(GPTBot, ClaudeBot, Google-Extended, dll). Itu datang dari dasbor Cloudflare,
bukan dari repo ini; ubah di sana kalau tidak dikehendaki.

### Googlebot kena 403 — JS Detections Cloudflare

Gejalanya: Search Console membalas 403 waktu diminta mengindeks, padahal
`robots.txt`, meta `robots`, dan origin Hostinger semuanya normal (cek origin
langsung dengan `curl --resolve villatebingbuluh.com:443:145.79.28.37`).

Penyebabnya Cloudflare, bukan repo ini. Ada dua hal terpisah:

1. **Bot fight mode** (Security → Settings → filter *Bot traffic*). Di plan
   Free tidak punya pengecualian verified bot, jadi Googlebot ikut ditantang
   dan berujung 403. Harus dimatikan dari dasbor.
2. **JS Detections**, yang menyisipkan `/cdn-cgi/challenge-platform/scripts/
   jsd/main.js` ke tiap balasan HTML. Di plan Free ini **tidak punya toggle
   sendiri** dan tetap `On` walau Bot fight mode sudah mati. Skrip sisipan itu
   inline, jadi juga melanggar CSP `script-src 'self'` kita.

Untuk nomor 2, satu-satunya kendali dari sisi kita adalah direktif
**`no-transform`** pada `Cache-Control` — Cloudflare tidak menyisipkan skrip
JSD kalau balasan origin memuatnya. Itu sebabnya blok `FilesMatch` di
`public_html.htaccess` memakai `no-cache, must-revalidate, no-transform`.
Jangan hapus `no-transform` itu.

Cara memastikan sudah bersih (harus `0`):

```bash
curl -sS https://villatebingbuluh.com/ | grep -c "challenge-platform"
```

Kalau masih 403 setelah keduanya beres, periksa **AI Crawl Control** di level
account: Cloudflare menggolongkan Googlebot sebagai *mixed-purpose crawler*,
jadi menyetel Training = Block ikut memblokir Googlebot walau Search = Allow.
Log penentunya ada di Security → Events, saring UA `Googlebot` atau ASN
`AS15169`.

### Gambar Open Graph

`public/img/og.jpg` (1200×630) dibangun `npm run images` dari
`assets/img-src/home-hero.webp`, dengan anggaran 150 KB (`OG_MAX_BYTES`).
Formatnya JPEG, bukan WebP, karena sebagian perayap pratinjau tautan
masih belum menampilkan WebP.

### Favicon di hasil pencarian Google

Set favicon dibangun `npm run favicons` (`scripts/make-favicons.mjs`) dari
**`assets/logo-mark.png`** — logo vila yang sama, versi mark tanpa tulisan.
Keluarannya `public/favicon.ico`, `favicon-96.png`, dan `apple-touch-icon.png`.
Ganti berkas sumbernya lalu jalankan ulang; jangan sunting keluarannya manual.

`public/favicon.png` **sengaja tidak ikut dibangun ulang** supaya isinya tetap
sama persis dengan yang sudah tayang. Nama itu memakai `max-age` panjang tanpa
hash, jadi kalau isinya diganti tanpa ganti nama, edge Cloudflare masih akan
menyajikan versi lama sampai di-purge. Berkas keluaran di atas semuanya nama
baru, jadi tidak punya masalah itu.

Yang bikin logonya belum muncul di halaman hasil Google, dan sudah diperbaiki:

- **`/favicon.ico` dulu tidak ada.** Karena aturan SPA di `public_html.htaccess`
  melempar berkas yang tidak ada ke `index.html`, URL itu balas `200 text/html`,
  bukan 404. Google memakai `/favicon.ico` sebagai cadangan, dan yang diterima
  malah HTML. Sekarang berkasnya benar-benar ada sehingga `RewriteCond
  %{REQUEST_FILENAME} !-f` melewatinya.
- **Ukurannya 128×128.** Google minta sisi kelipatan 48 px; `favicon-96.png`
  memenuhi itu, dan 96 dipilih supaya mark 128 px cukup diperkecil, bukan
  diperbesar.

Yang tidak bisa dipercepat dari sisi kode: Google baru menukar ikonnya setelah
merayapi ulang beranda, dan itu bisa makan hitungan hari sampai minggu. Minta
perayapan ulang lewat Search Console kalau mau didorong.

Mark-nya line-art tipis, jadi di 16 px detail bambunya memang menyatu. Itu
disadari dan diterima — logonya harus tetap logo asli.

`apple-touch-icon.png` satu-satunya yang latarnya diputihkan: iOS tidak
mendukung ikon transparan dan akan menaruhnya di atas hitam.

### Google Tag Manager

Bootstrap GTM ada di `public/gtm.js`, **bukan** skrip inline di `index.html`.
Alasannya CSP: `script-src` di `public_html.htaccess` tidak mengizinkan
`'unsafe-inline'`, jadi skrip inline akan ditolak browser. Berkas terpisah
dilayani dari domain sendiri sehingga lolos `'self'` tanpa perlu melonggarkan
kebijakan.

CSP-nya juga perlu mengizinkan host Google, kalau tidak `gtm.js` termuat tapi
tidak pernah dijalankan dan tag GA4 di dalamnya tidak pernah menyala:

```
script-src  ... https://www.googletagmanager.com
connect-src ... https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com
frame-src   ... https://www.googletagmanager.com
```

> Kalau nanti ada tag **Custom HTML** di dalam kontainer GTM, tag itu akan
> membuat skrip inline dan tetap ditolak CSP. Pakai tag bawaan GTM, atau
> tambahkan nonce — jangan menambahkan `'unsafe-inline'`.

`gtm.js` sengaja dikecualikan dari cache satu tahun (`access plus 5 minutes`),
karena namanya tidak ber-hash — sama seperti masalah gambar `public/img/`,
mengganti isinya tanpa mengganti nama akan tersangkut di cache tepi.

### JSON-LD yang ikut pengaturan admin

Blok `LodgingBusiness` di `index.html` (dikenali lewat `id="ld-lodging"`) berisi
nilai dasar yang sudah ada di HTML mentah. Setelah `/api/settings` terjawab,
`patchLodgingJsonLd()` di `src/lib/seo.js` menimpa sebagian isinya dengan data
dari **Kelola Pengaturan** — jadi mengganti nomor WhatsApp di `/admin/pengaturan`
langsung mengubah structured data, tanpa menyentuh kode:

| Bidang JSON-LD | Sumber di `settings` | Catatan |
| -------------- | -------------------- | ------- |
| `telephone`    | `whatsapp_number`    | diubah ke bentuk E.164 (`+62…`) |
| `name`         | `villa_name`         | |
| `checkinTime` / `checkoutTime` | `check_in_time` / `check_out_time` | `14.00` → `14:00` |
| `sameAs`       | `instagram`          | dijadikan URL profil |

Penimpaan hanya jalan setelah API benar-benar menjawab (`loaded` di
`useSettings`). Kalau API mati, halaman tetap memakai nilai dasar di
`index.html` dan **tidak** memakai data contoh dari `src/data/demoData.js` —
supaya nomor telepon palsu tidak pernah ikut terbit.

> **`address` sengaja tidak ikut ditimpa.** Di JSON-LD alamatnya terstruktur
> (`streetAddress`, `addressLocality`, `postalCode`, …) sedangkan di pengaturan
> hanya satu baris teks bebas yang tidak bisa dipecah dengan andal. Kalau alamat
> vila berubah, ubah **dua-duanya**: `/admin/pengaturan` dan blok JSON-LD di
> `index.html`.

### Yang masih perlu diisi manusia

- **Google Business Profile.** Untuk penginapan, profil bisnis yang terverifikasi
  jauh lebih menentukan daripada apa pun di halaman ini. Alamat, jam, dan foto
  di sana harus sama persis dengan yang di situs.
- **Search Console.** Daftarkan domainnya, kirim sitemap, lalu pakai
  "Inspeksi URL" untuk memastikan Google benar-benar melihat halaman hasil
  render — bukan `<div id="app">` yang kosong.

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
| `api/lib/images.php`         | Kompresi WebP unggahan (anggaran 220 KB)                 |
| `api/lib/pricing.php`        | Mesin harga + promo (**kembaran** `shared/pricing.js`)   |
| `api/routes/`                | auth, rooms, bookings, promos, gallery, settings, upload |
| `api/tools/create-admin.php` | Buat/ganti password akun admin (CLI saja)                |
| `api/tools/seed.php`         | Isi semua tabel dengan data contoh (CLI saja)            |
| `api/tools/compress-uploads.php` | Sapu berkas lama di `uploads/` ke bawah anggaran     |
| `api/tools/prune-uploads.php` | Hapus berkas unggahan yatim (tidak dirujuk database)    |
| `scripts/optimize-images.mjs`| Bangun varian hero `public/img/` dari `assets/img-src/`   |
| `assets/img-src/`            | Master gambar resolusi penuh (tidak ikut deploy)         |
| `api/tests/`                 | Uji parity harga PHP ↔ JS                                |
| `api/dev-server.php`         | Router server bawaan PHP (development saja)              |
| `public_html.htaccess`       | Salin jadi `public_html/.htaccess` saat deploy           |
| `uploads.htaccess`           | Salin jadi `public_html/uploads/.htaccess` saat deploy   |
| `shared/pricing.js`          | Mesin harga sisi browser                                 |
| `public/robots.txt`          | Aturan perayap + penunjuk sitemap                        |
| `public/sitemap.xml`         | Daftar halaman publik (ditulis tangan)                   |
| `public/gtm.js`              | Bootstrap Google Tag Manager (dipisah karena CSP)        |
| `src/lib/seo.js`             | Judul/deskripsi/canonical/OG per rute + helper JSON-LD   |
| `src/style.css`              | Token tema Tailwind + `@font-face` Geist & Playfair Display |
| `src/lib/api.js`             | Klien REST + `friendlyDbError`                           |
| `src/lib/storage.js`         | Unggah gambar ke `/api/upload/*`                         |
| `src/composables/`           | State per-domain (rooms, bookings, promos, gallery, dst) |

Tanpa backend yang jalan, halaman publik otomatis memakai data contoh dari
`src/data/demoData.js` (hanya saat `npm run dev`).
