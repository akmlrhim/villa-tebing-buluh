-- =====================================================================
-- FIX AKSES DEV: beri GRANT level-tabel ke role anon & authenticated.
-- Jalankan sekali di Supabase: SQL Editor -> New query -> paste -> Run.
--
-- Kenapa perlu: RLS hanya menentukan BARIS mana yang terlihat. Sebelum RLS
-- dievaluasi, Postgres tetap menuntut privilege dasar (GRANT) di level tabel.
-- Tabel & policy sudah dibuat oleh schema.sql, tapi GRANT dasarnya belum ada,
-- sehingga semua request anon/authenticated ditolak dengan 42501
-- "permission denied for table". Skrip ini melengkapi GRANT tersebut.
-- Aman dijalankan berulang (idempoten).
-- =====================================================================

grant usage on schema public to anon, authenticated;

-- --- Publik (anon): hanya boleh MEMBACA data non-sensitif ---
grant select on public.rooms       to anon, authenticated;
grant select on public.room_images to anon, authenticated;
grant select on public.settings    to anon, authenticated;

-- Publik boleh MEMBUAT booking (form pembayaran) tapi TIDAK boleh membaca
-- tabel bookings (data pribadi tamu). Ketersediaan dibaca lewat view aman.
grant insert on public.bookings to anon, authenticated;

-- --- Admin (login) = role authenticated: akses penuh (RLS mengizinkan semua baris) ---
grant select, insert, update, delete on public.rooms       to authenticated;
grant select, insert, update, delete on public.room_images to authenticated;
grant select, insert, update, delete on public.bookings    to authenticated;
grant select, insert, update, delete on public.settings    to authenticated;

-- --- View ketersediaan publik ---
-- Jadikan SECURITY DEFINER (security_invoker = false) supaya anon cukup punya
-- akses ke VIEW-nya saja, bukan ke tabel bookings. Dengan begitu kolom pribadi
-- tamu (guest_name, guest_phone, dst.) tidak pernah bisa diakses publik.
-- WHERE status membatasi baris; SELECT hanya kolom non-sensitif.
create or replace view public_availability
with (security_invoker = false) as
select room_id, check_in, check_out, status
from bookings
where status in ('pending', 'confirmed', 'checked_in');

grant select on public.public_availability to anon, authenticated;

-- --- (Opsional) cegah masalah serupa untuk tabel baru di masa depan ---
-- Buka baris ini kalau ingin tabel baru otomatis dapat GRANT dasar:
-- alter default privileges in schema public grant select on tables to anon, authenticated;
-- alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
