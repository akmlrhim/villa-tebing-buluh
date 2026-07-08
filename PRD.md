# Product Requirements Document (PRD)
## Sistem Booking Vila Sederhana

| | |
|---|---|
| **Versi Dokumen** | 1.0 |
| **Tanggal** | 7 Juli 2026 |
| **Status** | Draft |
| **Tech Stack** | Vue.js 3, Supabase, Tailwind CSS |

---

## 1. Latar Belakang & Tujuan

### 1.1 Latar Belakang
Vila membutuhkan website sederhana yang memudahkan calon tamu untuk:
- Melihat detail kamar/unit vila yang tersedia.
- Mengecek ketersediaan kamar pada tanggal tertentu secara real-time.
- Melihat kalender booking (tanggal mana yang sudah terisi dan yang masih kosong).
- Melakukan booking langsung via WhatsApp tanpa proses pembayaran online.

Website ini **bukan** sistem booking otomatis penuh (tanpa payment gateway). Konfirmasi dan pembayaran tetap diproses manual oleh admin melalui WhatsApp.

### 1.2 Tujuan Produk
1. Mengurangi pertanyaan berulang via WhatsApp seperti *"Tanggal X masih kosong tidak?"* karena tamu bisa cek sendiri di website.
2. Menampilkan informasi kamar secara profesional (foto, fasilitas, harga, kapasitas).
3. Mempercepat proses booking dengan tombol WhatsApp yang sudah berisi template pesan otomatis (pre-filled message).
4. Memberikan admin panel sederhana untuk mengelola data kamar dan status booking.

### 1.3 Yang TIDAK Termasuk Scope (Out of Scope)
- Pembayaran online / payment gateway.
- Sistem login/registrasi untuk tamu (guest tidak perlu akun).
- Notifikasi email otomatis.
- Multi-bahasa (hanya Bahasa Indonesia).
- Aplikasi mobile native.

---

## 2. Target Pengguna & User Persona

### 2.1 Guest (Calon Tamu)
- Mengakses website via mobile (mayoritas) dan desktop.
- Ingin cepat tahu: kamar apa saja, harga berapa, tanggal X kosong atau tidak.
- Terbiasa transaksi via WhatsApp.
- Tidak ingin ribet membuat akun.

### 2.2 Admin (Pengelola Vila)
- Mengelola data kamar (tambah/edit/hapus).
- Menginput booking yang sudah dikonfirmasi via WhatsApp ke sistem agar kalender ter-update.
- Mengubah status booking (pending → confirmed → checked-out / cancelled).
- Tidak terlalu technical, butuh antarmuka sederhana.

---

## 3. User Flow

### 3.1 Flow Guest (Booking via WhatsApp)
```
Guest membuka Home
   │
   ├─► Melihat daftar kamar (card: foto, nama, harga, kapasitas)
   │
   ├─► Klik kamar → Modal/Lightbox Detail Kamar (tanpa pindah halaman)
   │        ├─► Galeri foto, fasilitas, deskripsi, harga
   │        └─► Kalender ketersediaan kamar tersebut
   │
   ├─► Cek ketersediaan via widget di Home
   │        └─► Pilih tanggal check-in & check-out + jumlah tamu
   │             └─► Sistem menampilkan kamar yang tersedia
   │
   ├─► (Opsional) Buka menu Our Gallery → lihat semua foto vila & kamar
   ├─► (Opsional) Buka menu About → profil vila, fasilitas umum, lokasi
   ├─► (Opsional) Buka menu Contact → info kontak, alamat, jam operasional
   │
   └─► Klik tombol "Booking via WhatsApp"
            └─► Redirect ke wa.me dengan pesan otomatis berisi:
                nama kamar, tanggal check-in/out, jumlah tamu
                     │
                     └─► Admin balas chat → konfirmasi → 
                         admin input booking ke admin panel
```

### 3.2 Flow Admin
```
Admin login (Supabase Auth)
   │
   ├─► Dashboard: ringkasan booking hari ini & mendatang
   ├─► Kelola Kamar: CRUD data kamar + upload foto
   ├─► Kelola Booking: input booking baru, ubah status, hapus
   └─► Kalender: melihat semua booking dalam tampilan kalender
```

---

## 4. Fitur & Requirement

### 4.1 Halaman Publik (Guest)

Situs publik terdiri dari **4 halaman**: **Home**, **Our Gallery**, **About**, dan **Contact**. Tidak ada route detail kamar (`/kamar/:slug`) atau kalender publik terpisah — keduanya digabung sebagai modal/section di dalam Home & Our Gallery agar navigasi tetap sederhana (4 menu).

#### F-01: Home
| ID | Requirement | Prioritas |
|---|---|---|
| F-01.1 | Hero section dengan foto vila, tagline, dan tombol CTA "Cek Ketersediaan" | Must |
| F-01.2 | Widget cek ketersediaan: input tanggal check-in, check-out, jumlah tamu | Must |
| F-01.3 | Daftar kamar dalam bentuk card grid: foto utama, nama kamar, harga/malam, kapasitas maksimal, badge "Tersedia/Penuh" (berdasarkan tanggal yang dipilih) | Must |
| F-01.4 | Highlight singkat fasilitas umum vila (kolam renang, parkir, WiFi, dll.) dengan link "Selengkapnya" ke halaman About | Should |
| F-01.5 | Navigasi utama (navbar) ke 4 halaman: Home, Our Gallery, About, Contact | Must |
| F-01.6 | Footer: kontak singkat, alamat, jam operasional, link sosial media | Must |
| F-01.7 | Floating button WhatsApp di pojok kanan bawah (selalu terlihat di semua halaman) | Must |

#### F-02: Cek Ketersediaan (di Home)
| ID | Requirement | Prioritas |
|---|---|---|
| F-02.1 | Guest memilih rentang tanggal (date range picker) dan jumlah tamu | Must |
| F-02.2 | Sistem query ke Supabase: kamar dianggap **tidak tersedia** jika ada booking berstatus `pending` atau `confirmed` yang tanggalnya beririsan (overlap) dengan rentang yang dipilih | Must |
| F-02.3 | Hasil ditampilkan sebagai daftar kamar tersedia, dengan estimasi total harga (harga/malam × jumlah malam) | Must |
| F-02.4 | Validasi: check-out harus setelah check-in, tanggal tidak boleh di masa lalu | Must |
| F-02.5 | Jika tidak ada kamar tersedia, tampilkan pesan ramah + tombol "Tanya Admin via WhatsApp" | Should |

#### F-03: Detail Kamar (Modal/Lightbox)
| ID | Requirement | Prioritas |
|---|---|---|
| F-03.1 | Klik card kamar (di Home atau Our Gallery) membuka modal/lightbox, tanpa pindah halaman/route | Must |
| F-03.2 | Galeri foto kamar (carousel) di dalam modal | Must |
| F-03.3 | Informasi: nama, deskripsi, harga/malam, kapasitas, ukuran kamar, jumlah bed | Must |
| F-03.4 | Daftar fasilitas kamar (AC, TV, water heater, dll.) dengan ikon | Must |
| F-03.5 | Kalender ketersediaan kamar tersebut di dalam modal: tanggal terisi ditandai merah/disabled, tanggal kosong bisa dipilih, navigasi bulan (minimal 3 bulan ke depan) | Must |
| F-03.6 | Guest TIDAK bisa melihat data pribadi pemesan (nama/nomor HP) di kalender — hanya status terisi/kosong | Must |
| F-03.7 | Form mini: pilih tanggal dari kalender + jumlah tamu → tombol "Booking via WhatsApp" | Must |

#### F-04: Booking via WhatsApp
| ID | Requirement | Prioritas |
|---|---|---|
| F-04.1 | Tombol booking membuka `https://wa.me/{nomor_admin}?text={pesan}` di tab baru | Must |
| F-04.2 | Template pesan otomatis (URL-encoded), contoh: `Halo, saya ingin booking *{Nama Kamar}* untuk tanggal *{check-in} s/d {check-out}* ({n} malam, {x} tamu). Apakah masih tersedia?` | Must |
| F-04.3 | Nomor WhatsApp admin disimpan di tabel `settings` (bisa diubah tanpa deploy ulang) | Should |

#### F-05: Our Gallery
| ID | Requirement | Prioritas |
|---|---|---|
| F-05.1 | Galeri foto lengkap vila (area umum: kolam renang, taman, lobi, dll.) dalam grid/masonry | Must |
| F-05.2 | Galeri foto dikelompokkan per kamar (tab/filter by kamar) | Should |
| F-05.3 | Klik foto membuka lightbox full-screen dengan navigasi next/prev | Must |
| F-05.4 | Klik nama kamar pada galeri membuka modal Detail Kamar (F-03) | Should |

#### F-06: About
| ID | Requirement | Prioritas |
|---|---|---|
| F-06.1 | Profil/cerita singkat vila | Must |
| F-06.2 | Section fasilitas umum vila (kolam renang, parkir, WiFi, dll.) secara lengkap | Must |
| F-06.3 | Section lokasi dengan embed Google Maps | Should |
| F-06.4 | Ringkasan tipe-tipe kamar yang tersedia (nama, kapasitas) dengan link ke detail kamar (F-03) | Should |

#### F-07: Contact
| ID | Requirement | Prioritas |
|---|---|---|
| F-07.1 | Informasi kontak: alamat lengkap, nomor WhatsApp, jam operasional, link sosial media | Must |
| F-07.2 | Tombol "Chat via WhatsApp" (pesan umum, bukan booking kamar tertentu) | Must |
| F-07.3 | Embed Google Maps lokasi vila | Should | |

### 4.2 Admin Panel

#### F-08: Autentikasi Admin
| ID | Requirement | Prioritas |
|---|---|---|
| F-08.1 | Login menggunakan Supabase Auth (email + password) | Must |
| F-08.2 | Halaman admin (`/admin/*`) dilindungi route guard, redirect ke login jika belum autentikasi | Must |
| F-08.3 | Row Level Security (RLS) di Supabase: operasi tulis hanya untuk user terautentikasi | Must |

#### F-09: Kelola Kamar (CRUD)
| ID | Requirement | Prioritas |
|---|---|---|
| F-09.1 | Tambah/edit/hapus kamar: nama, slug, deskripsi, harga/malam, kapasitas, ukuran, jumlah bed, fasilitas (multi-select/tags), status aktif | Must |
| F-09.2 | Upload multi-foto ke Supabase Storage, pilih foto utama; foto ini juga tampil di Our Gallery (F-05) & modal Detail Kamar (F-03) | Must |
| F-09.3 | Soft delete / toggle status aktif agar kamar bisa disembunyikan tanpa hapus data booking | Should |

#### F-10: Kelola Booking
| ID | Requirement | Prioritas |
|---|---|---|
| F-10.1 | Input booking manual: pilih kamar, nama tamu, nomor WhatsApp tamu, tanggal check-in/out, jumlah tamu, catatan, total harga | Must |
| F-10.2 | Status booking: `pending`, `confirmed`, `checked_in`, `checked_out`, `cancelled` | Must |
| F-10.3 | Validasi anti double-booking: sistem menolak input jika tanggal overlap dengan booking `pending`/`confirmed` di kamar yang sama | Must |
| F-10.4 | Daftar booking dengan filter (status, kamar, rentang tanggal) dan pencarian nama tamu | Must |
| F-10.5 | Tampilan kalender admin: semua booking semua kamar, warna berbeda per status | Should |

#### F-11: Dashboard & Pengaturan
| ID | Requirement | Prioritas |
|---|---|---|
| F-11.1 | Ringkasan: check-in hari ini, check-out hari ini, booking pending, okupansi bulan berjalan | Should |
| F-11.2 | Pengaturan: nomor WhatsApp admin, nama vila, alamat, jam check-in/out default | Should |

---

## 5. Arsitektur Teknis

### 5.1 Tech Stack
| Layer | Teknologi | Keterangan |
|---|---|---|
| Frontend | Vue.js 3 (Composition API) + Vite | SPA |
| Routing | Vue Router 4 | Route guard untuk `/admin` |
| State Management | Pinia | State kamar, booking, auth |
| Styling | Tailwind CSS 4 | Mobile-first, responsive |
| Backend/DB | Supabase (PostgreSQL) | Database + Auth + Storage + RLS |
| Kalender | Library ringan (mis. VCalendar / FullCalendar) | Untuk tampilan kalender booking |
| Hosting | Vercel / Netlify (frontend), Supabase (backend) | Free tier cukup untuk tahap awal |

### 5.2 Skema Database (Supabase / PostgreSQL)

```sql
-- Tabel kamar
create table rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  price_per_night numeric not null,
  max_guests int not null default 2,
  size_sqm int,
  bed_count int default 1,
  bed_type text,
  amenities text[] default '{}',       -- ['AC','TV','Water Heater']
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Foto kamar
create table room_images (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  image_url text not null,             -- URL Supabase Storage
  is_primary boolean default false,
  sort_order int default 0
);

-- Booking
create table bookings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id),
  guest_name text not null,
  guest_phone text not null,
  check_in date not null,
  check_out date not null,
  guest_count int default 1,
  status text not null default 'pending'
    check (status in ('pending','confirmed','checked_in','checked_out','cancelled')),
  total_price numeric,
  notes text,
  created_at timestamptz default now(),
  constraint valid_dates check (check_out > check_in)
);

-- Pengaturan
create table settings (
  key text primary key,                -- 'whatsapp_number', 'villa_name', dst.
  value text not null
);
```

### 5.3 Logika Cek Ketersediaan (Overlap)
Kamar **tidak tersedia** untuk rentang `[check_in, check_out)` jika ada booking dengan:

```sql
select room_id from bookings
where status in ('pending','confirmed','checked_in')
  and check_in < :requested_check_out
  and check_out > :requested_check_in;
```

> Catatan: tanggal check-out tidak menghitung malam terakhir (guest keluar pagi), sehingga kamar bisa dibooking tamu lain di tanggal check-out.

### 5.4 Row Level Security (RLS)
| Tabel | SELECT (public) | INSERT/UPDATE/DELETE |
|---|---|---|
| `rooms`, `room_images` | ✅ Boleh (hanya `is_active = true` untuk publik) | Hanya authenticated admin |
| `bookings` | ✅ Terbatas: hanya kolom `room_id`, `check_in`, `check_out`, `status` (via view `public_availability`, TANPA data pribadi tamu) | Hanya authenticated admin |
| `settings` | ✅ Key tertentu saja (mis. `whatsapp_number`) | Hanya authenticated admin |

```sql
-- View aman untuk publik (tanpa data pribadi)
create view public_availability as
select room_id, check_in, check_out
from bookings
where status in ('pending','confirmed','checked_in');
```

### 5.5 Struktur Halaman (Routes)
Publik hanya **4 halaman**. Detail kamar & kalender ketersediaan per kamar tampil sebagai modal di atas Home/Our Gallery (bukan route sendiri), sehingga tidak butuh route dinamis `/kamar/:slug`.

| Route | Halaman | Akses |
|---|---|---|
| `/` | Home (hero, widget cek ketersediaan, daftar kamar) | Publik |
| `/gallery` | Our Gallery (foto vila & kamar) | Publik |
| `/about` | About (profil vila, fasilitas, lokasi) | Publik |
| `/contact` | Contact (info kontak, WhatsApp, maps) | Publik |
| `/admin/login` | Login admin | Publik |
| `/admin` | Dashboard | Admin |
| `/admin/kamar` | Kelola kamar | Admin |
| `/admin/booking` | Kelola booking | Admin |
| `/admin/pengaturan` | Pengaturan | Admin |

---

## 6. Requirement Non-Fungsional

| Kategori | Requirement |
|---|---|
| **Responsif** | Mobile-first; seluruh halaman publik optimal di layar 360px ke atas |
| **Performa** | Homepage load < 3 detik di koneksi 4G; lazy-load gambar; kompresi foto sebelum upload |
| **SEO** | Meta tags dasar, judul halaman deskriptif, alt text pada gambar |
| **Keamanan** | RLS aktif di semua tabel; data pribadi tamu tidak pernah ter-expose ke publik; validasi input di frontend & database constraint |
| **Ketersediaan Data** | Data ketersediaan real-time dari Supabase (tanpa cache basi yang menyesatkan guest) |
| **Aksesibilitas** | Kontras warna memadai, tombol cukup besar untuk sentuhan jari |

---

### Kriteria Sukses (Definition of Done)
1. Guest bisa cek ketersediaan tanggal tanpa bertanya ke admin.
2. Tombol WhatsApp menghasilkan pesan otomatis yang lengkap dan benar.
3. Tidak ada double-booking yang bisa terjadi dari sisi input admin.
4. Data pribadi tamu tidak dapat diakses dari halaman publik maupun API publik.
5. Website tampil baik di mobile dan desktop.