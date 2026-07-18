-- ============================================================================
-- DIGANTIKAN oleh supabase/migrate-latest.sql (konsolidasi semua migrate-*.sql
-- jadi satu file idempoten, termasuk isi file ini). Jangan jalankan file ini
-- lagi -- jalankan migrate-latest.sql saja. Disimpan sebagai riwayat perubahan.
-- ============================================================================
-- MIGRASI KEAMANAN — Kunci akses tulis admin ke akun admin spesifik
-- Villa Tebing Buluh
-- Jalankan SEKALI di Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Idempoten (aman dijalankan ulang).
--
-- Kenapa: semua policy "Admin can ..." (rooms, room_images, bookings,
-- gallery_images, settings, storage room-images/gallery-images/payment-proofs)
-- sebelumnya cuma dicek `to authenticated`. Anon key Supabase memang publik
-- (tertanam di bundle JS) -- kalau signup diizinkan di project ini, SIAPA PUN
-- bisa membuat akun Supabase Auth sendiri (lewat Auth API langsung, di luar
-- aplikasi ini) dan otomatis dapat role `authenticated`, yang tadinya berarti
-- akses tulis PENUH ke semua tabel admin, termasuk mengganti
-- settings.qris_image_url untuk mengalihkan pembayaran tamu ke QRIS milik
-- penyerang. Migrasi ini menambah lapisan: "authenticated" DAN "terdaftar di
-- admin_users" lewat fungsi is_admin().
--
-- LANGKAH WAJIB SETELAH MENJALANKAN FILE INI (situs akan terkunci total dari
-- admin sampai langkah ini selesai -- termasuk Anda sendiri):
--   1. Pastikan Anda sudah pernah login sekali ke /admin dengan akun admin
--      (supaya baris akun Anda sudah ada di auth.users).
--   2. Di SQL Editor, jalankan query di bawah, GANTI email dengan email
--      login admin Anda:
--
--        insert into admin_users (user_id)
--        select id from auth.users where email = 'GANTI-DENGAN-EMAIL-ADMIN-ANDA'
--        on conflict do nothing;
--
--   3. Verifikasi baris sudah masuk:
--        select * from admin_users;
--      Kalau kosong, cek dulu emailnya persis sama dengan yang dipakai login
--      (select email from auth.users;).
--   4. Di Dashboard -> Authentication -> Sign In / Providers -> Email,
--      MATIKAN "Allow new users to sign up". Tanpa ini, orang lain tetap
--      bisa membuat akun baru lewat Supabase Auth API langsung (akun itu
--      tidak akan ada di admin_users jadi tidak dapat akses tulis, tapi
--      lebih baik jalur pendaftarannya ditutup total).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tabel admin_users -- daftar user_id yang dianggap admin.
--    Tidak ada policy select/insert/update/delete untuk client sama sekali;
--    hanya bisa diisi lewat SQL Editor (service role) atau dibaca lewat
--    fungsi is_admin() SECURITY DEFINER di bawah.
-- ---------------------------------------------------------------------------
create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Fungsi is_admin(): true kalau user yang sedang login ada di admin_users.
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Ganti semua policy admin dari `to authenticated` polos jadi cek is_admin().
-- ---------------------------------------------------------------------------

-- rooms
drop policy if exists "Admin can insert rooms" on rooms;
create policy "Admin can insert rooms" on rooms for insert to authenticated with check (is_admin());
drop policy if exists "Admin can update rooms" on rooms;
create policy "Admin can update rooms" on rooms for update to authenticated using (is_admin()) with check (is_admin());
drop policy if exists "Admin can delete rooms" on rooms;
create policy "Admin can delete rooms" on rooms for delete to authenticated using (is_admin());

-- room_images
drop policy if exists "Admin can insert room images" on room_images;
create policy "Admin can insert room images" on room_images for insert to authenticated with check (is_admin());
drop policy if exists "Admin can update room images" on room_images;
create policy "Admin can update room images" on room_images for update to authenticated using (is_admin()) with check (is_admin());
drop policy if exists "Admin can delete room images" on room_images;
create policy "Admin can delete room images" on room_images for delete to authenticated using (is_admin());

-- bookings
drop policy if exists "Admin can view bookings" on bookings;
create policy "Admin can view bookings" on bookings for select to authenticated using (is_admin());
drop policy if exists "Admin can create bookings" on bookings;
create policy "Admin can create bookings" on bookings for insert to authenticated with check (is_admin());
drop policy if exists "Admin can update bookings" on bookings;
create policy "Admin can update bookings" on bookings for update to authenticated using (is_admin()) with check (is_admin());
drop policy if exists "Admin can delete bookings" on bookings;
create policy "Admin can delete bookings" on bookings for delete to authenticated using (is_admin());

-- gallery_images
drop policy if exists "Admin can insert gallery images" on gallery_images;
create policy "Admin can insert gallery images" on gallery_images for insert to authenticated with check (is_admin());
drop policy if exists "Admin can update gallery images" on gallery_images;
create policy "Admin can update gallery images" on gallery_images for update to authenticated using (is_admin()) with check (is_admin());
drop policy if exists "Admin can delete gallery images" on gallery_images;
create policy "Admin can delete gallery images" on gallery_images for delete to authenticated using (is_admin());

-- settings (termasuk qris_image_url -- inti perbaikan ini)
drop policy if exists "Admin can upsert settings" on settings;
create policy "Admin can upsert settings" on settings for insert to authenticated with check (is_admin());
drop policy if exists "Admin can update settings" on settings;
create policy "Admin can update settings" on settings for update to authenticated using (is_admin()) with check (is_admin());

-- storage: room-images (tempat gambar QRIS diunggah lewat halaman Pengaturan admin)
drop policy if exists "Admin can upload room images" on storage.objects;
create policy "Admin can upload room images" on storage.objects for insert to authenticated with check (bucket_id = 'room-images' and is_admin());
drop policy if exists "Admin can update room images objects" on storage.objects;
create policy "Admin can update room images objects" on storage.objects for update to authenticated using (bucket_id = 'room-images' and is_admin());
drop policy if exists "Admin can delete room images objects" on storage.objects;
create policy "Admin can delete room images objects" on storage.objects for delete to authenticated using (bucket_id = 'room-images' and is_admin());

-- storage: gallery-images
drop policy if exists "Admin can upload gallery images objects" on storage.objects;
create policy "Admin can upload gallery images objects" on storage.objects for insert to authenticated with check (bucket_id = 'gallery-images' and is_admin());
drop policy if exists "Admin can delete gallery images objects" on storage.objects;
create policy "Admin can delete gallery images objects" on storage.objects for delete to authenticated using (bucket_id = 'gallery-images' and is_admin());

-- storage: payment-proofs (admin baca lewat signed URL + hapus; insert TETAP
-- terbuka untuk anon+authenticated karena tamu publik yang mengunggah bukti
-- bayar, bukan admin)
drop policy if exists "Admin can view payment proofs" on storage.objects;
create policy "Admin can view payment proofs" on storage.objects for select to authenticated using (bucket_id = 'payment-proofs' and is_admin());
drop policy if exists "Admin can delete payment proofs" on storage.objects;
create policy "Admin can delete payment proofs" on storage.objects for delete to authenticated using (bucket_id = 'payment-proofs' and is_admin());
