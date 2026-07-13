-- MIGRASI: fitur upload bukti pembayaran QRIS (13 Jul 2026)
-- Jalankan SEKALI di Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Hanya untuk database yang sudah pernah menjalankan schema.sql versi lama;
-- instalasi baru cukup menjalankan schema.sql (sudah memuat semua ini).
--
-- CATATAN KEAMANAN: bucket 'payment-proofs' di bawah dibuat PUBLIC, tetapi
-- migrate-security.sql kemudian menjadikannya PRIVAT (bukti bayar = data
-- finansial pribadi tamu). Setelah migrasi ini, WAJIB jalankan juga
-- supabase/migrate-security.sql.

-- 1. Kolom bukti bayar di bookings
alter table bookings add column if not exists payment_proof_url text;

-- 2. Bucket bukti pembayaran (public read; nama file UUID acak, tidak bisa ditebak)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- 3. Policy storage: publik lihat, tamu (anon) unggah, admin hapus
create policy "Public can view payment proofs"
  on storage.objects for select
  using (bucket_id = 'payment-proofs');

create policy "Anyone can upload payment proofs"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'payment-proofs');

create policy "Admin can delete payment proofs"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'payment-proofs');
