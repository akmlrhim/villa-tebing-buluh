-- =============================================================
-- SEEDER Villa Tebing Buluh
-- Jalankan SETELAH schema.sql: SQL Editor -> New query -> paste -> Run.
--
-- Isi: 3 kamar + 9 foto kamar + 24 booking + 10 settings.
-- Aman dijalankan ulang (idempotent): semua baris memakai UUID tetap
-- dengan ON CONFLICT DO NOTHING, jadi tidak ada data ganda.
--
-- Catatan tanggal: booking memakai tanggal RELATIF (current_date + N)
-- supaya kalender selalu terlihat hidup kapan pun seeder dijalankan.
-- Karena idempotent, menjalankan ulang setelah lama TIDAK menggeser
-- tanggal lama; kalau ingin booking segar, kosongkan dulu:
--   delete from bookings;
-- lalu jalankan file ini lagi.
-- =============================================================

-- =========================================
-- 1. ROOMS (3 kamar)
-- =========================================
insert into rooms (id, name, slug, description, price_per_night, min_nights, max_guests, size_sqm, bed_count, bed_type, amenities, is_active) values
(
  'a1000000-0000-4000-8000-000000000001',
  'Cemerlang 1', 'cemerlang-1',
  'Kamar di lantai satu dengan akses langsung ke teras dan kolam renang. Interior kayu jati yang hangat, tempat tidur king, dan kamar mandi dalam dengan air panas. Cocok untuk pasangan yang ingin bangun pagi langsung berenang.',
  850000, 1, 2, 28, 1, 'King',
  array['AC','Water Heater','Free WiFi','Teras Pribadi','Akses Kolam Renang','Free Kano'],
  true
),
(
  'a1000000-0000-4000-8000-000000000002',
  'Cemerlang 2', 'cemerlang-2',
  'Kamar di lantai dua dengan jendela lebar menghadap rumpun bambu dan lembah sungai. Inilah kamar paling tenang di seluruh vila: yang terdengar hanya angin dan air. Tempat tidur king, meja kerja kecil, dan balkon untuk kopi pagi.',
  950000, 1, 2, 30, 1, 'King',
  array['AC','Water Heater','Free WiFi','Balkon View Sungai','Meja Kerja','Free Kano'],
  true
),
(
  'a1000000-0000-4000-8000-000000000003',
  'Serumpun (Family)', 'serumpun-family',
  'Unit keluarga dengan dua tempat tidur besar dan ruang duduk sendiri. Dapur kecil lengkap dengan peralatan masak, cocok untuk keluarga yang menginap beberapa malam. Kapasitas hingga 5 tamu.',
  1400000, 2, 5, 46, 2, 'Queen',
  array['AC','Water Heater','Free WiFi','Dapur + Peralatan Lengkap','Ruang Duduk','Gazebo','Free Kano'],
  true
)
on conflict (id) do nothing;

-- =========================================
-- 2. ROOM_IMAGES (3 foto per kamar)
-- =========================================
insert into room_images (id, room_id, image_url, is_primary, sort_order) values
-- Cemerlang 1
('b1000000-0000-4000-8000-000000000101', 'a1000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80', true,  0),
('b1000000-0000-4000-8000-000000000102', 'a1000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=80',  false, 1),
('b1000000-0000-4000-8000-000000000103', 'a1000000-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1200&q=80', false, 2),
-- Cemerlang 2
('b1000000-0000-4000-8000-000000000201', 'a1000000-0000-4000-8000-000000000002', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80', true,  0),
('b1000000-0000-4000-8000-000000000202', 'a1000000-0000-4000-8000-000000000002', 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80', false, 1),
('b1000000-0000-4000-8000-000000000203', 'a1000000-0000-4000-8000-000000000002', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80', false, 2),
-- Serumpun (Family)
('b1000000-0000-4000-8000-000000000301', 'a1000000-0000-4000-8000-000000000003', 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80', true,  0),
('b1000000-0000-4000-8000-000000000302', 'a1000000-0000-4000-8000-000000000003', 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=1200&q=80', false, 1),
('b1000000-0000-4000-8000-000000000303', 'a1000000-0000-4000-8000-000000000003', 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=1200&q=80', false, 2)
on conflict (id) do nothing;

-- =========================================
-- 3. BOOKINGS (24 booking, tanggal relatif hari ini)
-- Rentang aktif (pending/confirmed/checked_in) TIDAK saling tumpang
-- tindih per kamar, sesuai aturan anti double-booking aplikasi.
-- total_price = harga per malam x jumlah malam.
-- =========================================
insert into bookings (id, room_id, guest_name, guest_phone, check_in, check_out, guest_count, status, total_price, notes) values
-- ---- Cemerlang 1 (850rb/malam) ----
('c1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'Budi Santoso',      '6281234500001', current_date - 30, current_date - 27, 2, 'checked_out', 2550000, 'Minta tambahan handuk saat menginap.'),
('c1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 'Rina Wulandari',    '6281234500002', current_date - 14, current_date - 12, 2, 'checked_out', 1700000, null),
('c1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', 'Andi Pratama',      '6281234500003', current_date - 1,  current_date + 2,  2, 'checked_in',  2550000, 'Honeymoon, minta dekorasi sederhana.'),
('c1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000001', 'Siti Rahmawati',    '6281234500004', current_date + 3,  current_date + 6,  2, 'confirmed',   2550000, null),
('c1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000001', 'Dewi Lestari',      '6281234500005', current_date + 14, current_date + 18, 1, 'pending',     3400000, 'Menunggu konfirmasi pembayaran QRIS.'),
('c1000000-0000-4000-8000-000000000006', 'a1000000-0000-4000-8000-000000000001', 'Agus Hermawan',     '6281234500006', current_date + 32, current_date + 39, 2, 'confirmed',   5950000, 'Menginap seminggu, kerja remote.'),
('c1000000-0000-4000-8000-000000000007', 'a1000000-0000-4000-8000-000000000001', 'Fajar Nugroho',     '6281234500007', current_date + 10, current_date + 12, 2, 'cancelled',   1700000, 'Batal karena jadwal cuti berubah.'),
('c1000000-0000-4000-8000-000000000008', 'a1000000-0000-4000-8000-000000000001', 'Lina Marlina',      '6281234500008', current_date - 45, current_date - 42, 2, 'checked_out', 2550000, null),
-- ---- Cemerlang 2 (950rb/malam) ----
('c1000000-0000-4000-8000-000000000009', 'a1000000-0000-4000-8000-000000000002', 'Hendra Gunawan',    '6281234500009', current_date - 21, current_date - 19, 2, 'checked_out', 1900000, null),
('c1000000-0000-4000-8000-000000000010', 'a1000000-0000-4000-8000-000000000002', 'Maya Anggraini',    '6281234500010', current_date - 7,  current_date - 5,  1, 'checked_out', 1900000, 'Solo trip, menulis buku.'),
('c1000000-0000-4000-8000-000000000011', 'a1000000-0000-4000-8000-000000000002', 'Rizky Ramadhan',    '6281234500011', current_date + 2,  current_date + 3,  2, 'confirmed',   950000,  null),
('c1000000-0000-4000-8000-000000000012', 'a1000000-0000-4000-8000-000000000002', 'Putri Handayani',   '6281234500012', current_date + 11, current_date + 13, 2, 'confirmed',   1900000, 'Anniversary pernikahan.'),
('c1000000-0000-4000-8000-000000000013', 'a1000000-0000-4000-8000-000000000002', 'Yoga Prasetyo',     '6281234500013', current_date + 20, current_date + 24, 2, 'pending',     3800000, null),
('c1000000-0000-4000-8000-000000000014', 'a1000000-0000-4000-8000-000000000002', 'Nadia Safitri',     '6281234500014', current_date + 40, current_date + 43, 2, 'confirmed',   2850000, null),
('c1000000-0000-4000-8000-000000000015', 'a1000000-0000-4000-8000-000000000002', 'Bayu Wicaksono',    '6281234500015', current_date + 5,  current_date + 8,  2, 'cancelled',   2850000, 'Dibatalkan tamu, dana dikembalikan.'),
('c1000000-0000-4000-8000-000000000016', 'a1000000-0000-4000-8000-000000000002', 'Citra Ayuningtyas', '6281234500016', current_date - 35, current_date - 33, 2, 'checked_out', 1900000, null),
-- ---- Serumpun / Family (1,4jt/malam) ----
('c1000000-0000-4000-8000-000000000017', 'a1000000-0000-4000-8000-000000000003', 'Keluarga Wijaya',   '6281234500017', current_date - 25, current_date - 22, 5, 'checked_out', 4200000, 'Dua anak kecil, minta extra bed.'),
('c1000000-0000-4000-8000-000000000018', 'a1000000-0000-4000-8000-000000000003', 'Keluarga Salim',    '6281234500018', current_date - 10, current_date - 8,  4, 'checked_out', 2800000, null),
('c1000000-0000-4000-8000-000000000019', 'a1000000-0000-4000-8000-000000000003', 'Keluarga Hartono',  '6281234500019', current_date,      current_date + 2,  5, 'checked_in',  2800000, 'Reuni keluarga besar.'),
('c1000000-0000-4000-8000-000000000020', 'a1000000-0000-4000-8000-000000000003', 'Ratna Kusuma',      '6281234500020', current_date + 17, current_date + 21, 4, 'pending',     5600000, 'Menunggu bukti transfer.'),
('c1000000-0000-4000-8000-000000000021', 'a1000000-0000-4000-8000-000000000003', 'Keluarga Tanjung',  '6281234500021', current_date + 25, current_date + 27, 5, 'confirmed',   2800000, null),
('c1000000-0000-4000-8000-000000000022', 'a1000000-0000-4000-8000-000000000003', 'Keluarga Firmansyah','6281234500022', current_date + 45, current_date + 50, 4, 'confirmed',  7000000, 'Liburan sekolah.'),
('c1000000-0000-4000-8000-000000000023', 'a1000000-0000-4000-8000-000000000003', 'Doni Saputra',      '6281234500023', current_date + 30, current_date + 33, 3, 'cancelled',   4200000, 'Reschedule, akan booking ulang.'),
('c1000000-0000-4000-8000-000000000024', 'a1000000-0000-4000-8000-000000000003', 'Keluarga Maulana',  '6281234500024', current_date + 60, current_date + 63, 5, 'confirmed',   4200000, null)
on conflict (id) do nothing;

-- =========================================
-- 4. SETTINGS (lengkap, tidak menimpa nilai yang sudah diubah admin)
-- =========================================
insert into settings (key, value) values
  ('whatsapp_number',        '6281234567890'),
  ('villa_name',             'Villa Tebing Buluh'),
  ('address',                'Jl. Tanuhi, Hulu Banyu, Kec. Loksado, Kabupaten Hulu Sungai Selatan, Kalimantan Selatan 71282'),
  ('check_in_time',          '14.00'),
  ('check_out_time',         '12.00'),
  ('instagram',              'villatebingbuluh'),
  ('qris_image_url',         ''),
  ('qris_merchant_name',     'Villa Tebing Buluh'),
  ('qris_nmid',              'ID1024xxxxxxxxx'),
  ('payment_deadline_hours', '2')
on conflict (key) do nothing;
