-- ============================================================================
-- SKEMA MySQL — Villa Tebing Buluh
--
-- Menggantikan supabase/schema.sql (Postgres + RLS). Jalankan SEKALI:
--   mysql -u root -p villatebingbuluh < server/schema.sql
-- atau paste seluruh isi file ini di phpMyAdmin (Laragon) tab SQL.
--
-- Ditulis IDEMPOTEN — aman dijalankan berkali-kali (CREATE TABLE IF NOT
-- EXISTS + INSERT IGNORE), tidak akan memunculkan error "already exists".
--
-- CATATAN PENTING SOAL KEAMANAN
-- Di Supabase, keamanan baris dijaga oleh RLS di dalam database karena browser
-- bicara LANGSUNG ke database. Di sini browser TIDAK PERNAH menyentuh MySQL —
-- semua lewat Express, jadi otorisasi dijaga di layer API (server/middleware/
-- auth.js) dan pemisahan endpoint publik vs admin. Karena itu tidak ada
-- padanan RLS/policy di file ini, dan itu memang disengaja.
--
-- ID tetap CHAR(36) UUID (bukan AUTO_INCREMENT) supaya:
--   1. Data lama dari Supabase bisa diimpor apa adanya.
--   2. Kode booking di /cek-booking tetap 8 karakter hex pertama dari UUID.
-- ============================================================================

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------------
-- 1. ADMIN_USERS — pengganti Supabase Auth
-- ---------------------------------------------------------------------------
-- Tidak ada jalur pendaftaran mandiri: akun HANYA dibuat lewat
--   node server/scripts/create-admin.js <email> <password>
-- Ini padanan dari "matikan Allow new users to sign up" di Supabase.
CREATE TABLE IF NOT EXISTS admin_users (
  id            CHAR(36)     NOT NULL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 2. ROOMS
-- ---------------------------------------------------------------------------
-- `amenities` dulu text[] di Postgres; MySQL tidak punya tipe array, jadi
-- dipakai JSON (array of string). mysql2 sudah otomatis parse ke JS array.
CREATE TABLE IF NOT EXISTS rooms (
  id              CHAR(36)      NOT NULL PRIMARY KEY,
  name            VARCHAR(150)  NOT NULL,
  slug            VARCHAR(150)  NOT NULL UNIQUE,
  description     TEXT          NULL,
  price_per_night DECIMAL(12,2) NOT NULL,
  min_nights      INT           NOT NULL DEFAULT 1,
  max_guests      INT           NOT NULL DEFAULT 2,
  size_sqm        INT           NULL,
  bed_count       INT           NOT NULL DEFAULT 1,
  bed_type        VARCHAR(100)  NULL,
  amenities       JSON          NULL,
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rooms_active (is_active),
  INDEX idx_rooms_price (price_per_night)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 3. ROOM_IMAGES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS room_images (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  room_id    CHAR(36)     NOT NULL,
  image_url  VARCHAR(500) NOT NULL,
  is_primary TINYINT(1)   NOT NULL DEFAULT 0,
  sort_order INT          NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_room_images_room (room_id),
  CONSTRAINT fk_room_images_room FOREIGN KEY (room_id)
    REFERENCES rooms (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 4. BOOKINGS
-- ---------------------------------------------------------------------------
-- payment_proof_url menyimpan NAMA FILE di uploads/payment-proofs (bukan URL
-- penuh) — sama seperti dulu menyimpan path objek bucket privat Supabase.
-- ON DELETE RESTRICT: kamar yang masih punya booking tidak boleh dihapus
-- diam-diam bersama riwayat tamunya (di Supabase ini dijaga di layer aplikasi).
CREATE TABLE IF NOT EXISTS bookings (
  id                CHAR(36)      NOT NULL PRIMARY KEY,
  room_id           CHAR(36)      NOT NULL,
  guest_name        VARCHAR(100)  NOT NULL,
  guest_phone       VARCHAR(20)   NOT NULL,
  check_in          DATE          NOT NULL,
  check_out         DATE          NOT NULL,
  guest_count       INT           NOT NULL DEFAULT 1,
  status            VARCHAR(20)   NOT NULL DEFAULT 'pending',
  total_price       DECIMAL(12,2) NULL,
  notes             TEXT          NULL,
  payment_proof_url VARCHAR(500)  NULL,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_bookings_room (room_id),
  INDEX idx_bookings_dates (room_id, check_in, check_out),
  INDEX idx_bookings_status (status),
  INDEX idx_bookings_phone (guest_phone),
  CONSTRAINT fk_bookings_room FOREIGN KEY (room_id)
    REFERENCES rooms (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 5. GALLERY_IMAGES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gallery_images (
  id         CHAR(36)     NOT NULL PRIMARY KEY,
  image_url  VARCHAR(500) NOT NULL,
  alt        VARCHAR(255) NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_gallery_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 6. PROMOS — harga promo kamar per periode
-- ---------------------------------------------------------------------------
-- `start_date`/`end_date` adalah rentang TANGGAL MENGINAP, bukan tanggal
-- pemesanan, dan `end_date` INKLUSIF: promo 10-20 Agustus ikut memberi harga
-- promo untuk malam 20 Agustus. Perhitungannya prorata per malam — lihat
-- shared/pricing.js, satu-satunya tempat aturan harga ditulis.
--
-- discount_type:
--   'percent'     -> discount_value = persen potongan (mis. 20.00 = 20%)
--   'fixed_price' -> discount_value = harga khusus per malam dalam rupiah
CREATE TABLE IF NOT EXISTS promos (
  id             CHAR(36)      NOT NULL PRIMARY KEY,
  name           VARCHAR(150)  NOT NULL,
  description    TEXT          NULL,
  discount_type  VARCHAR(20)   NOT NULL DEFAULT 'percent',
  discount_value DECIMAL(12,2) NOT NULL,
  start_date     DATE          NOT NULL,
  end_date       DATE          NOT NULL,
  -- 1 = berlaku untuk semua kamar; 0 = hanya kamar yang terdaftar di
  -- promo_rooms. Disimpan eksplisit supaya promo "semua kamar" tetap mencakup
  -- kamar yang ditambahkan SETELAH promo dibuat.
  applies_to_all TINYINT(1)    NOT NULL DEFAULT 1,
  is_active      TINYINT(1)    NOT NULL DEFAULT 1,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_promos_active (is_active),
  INDEX idx_promos_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 7. PROMO_ROOMS — kamar mana saja yang kena promo (bila applies_to_all = 0)
-- ---------------------------------------------------------------------------
-- ON DELETE CASCADE di kedua sisi: baris ini hanya penghubung, tidak menyimpan
-- data yang perlu diselamatkan. Berbeda dengan bookings->rooms yang RESTRICT,
-- menghapus kamar TIDAK boleh terhalang hanya karena pernah ikut promo.
CREATE TABLE IF NOT EXISTS promo_rooms (
  promo_id CHAR(36) NOT NULL,
  room_id  CHAR(36) NOT NULL,
  PRIMARY KEY (promo_id, room_id),
  INDEX idx_promo_rooms_room (room_id),
  CONSTRAINT fk_promo_rooms_promo FOREIGN KEY (promo_id)
    REFERENCES promos (id) ON DELETE CASCADE,
  CONSTRAINT fk_promo_rooms_room FOREIGN KEY (room_id)
    REFERENCES rooms (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 8. SETTINGS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  `key`   VARCHAR(100) NOT NULL PRIMARY KEY,
  `value` TEXT         NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INSERT IGNORE = padanan `ON CONFLICT DO NOTHING`: nilai yang sudah diubah
-- admin lewat /admin/pengaturan tidak akan tertimpa balik ke default.
INSERT IGNORE INTO settings (`key`, `value`) VALUES
  ('whatsapp_number', '6281234567890'),
  ('villa_name',      'Villa Tebing Buluh'),
  ('address',         'Jl. Tanuhi, Hulu Banyu, Kec. Loksado, Kabupaten Hulu Sungai Selatan, Kalimantan Selatan 71282');
