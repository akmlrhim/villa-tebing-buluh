-- DIGANTIKAN oleh supabase/migrate-latest.sql -- jangan jalankan file ini
-- lagi, disimpan sebagai riwayat perubahan.
-- MIGRASI: cek status booking publik (halaman /cek-booking)
-- Jalankan SEKALI di Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Hanya untuk database yang sudah pernah menjalankan schema.sql versi lama;
-- instalasi baru cukup menjalankan schema.sql (sudah memuat semua ini).
--
-- Tamu memasukkan kode booking (8 karakter pertama UUID) + nomor WA yang
-- dipakai saat booking. SECURITY DEFINER agar anon tidak perlu akses langsung
-- ke tabel bookings — lookup hanya mengembalikan baris yang cocok DUA-DUANYA
-- kode & nomor, dan bukti bayar hanya dikembalikan sebagai penanda ada/tidak
-- (bukan path/URL asli).
create or replace function public.get_booking_status(
  p_code  text,
  p_phone text
)
returns table (
  id          uuid,
  guest_name  text,
  status      text,
  room_name   text,
  check_in    date,
  check_out   date,
  guest_count int,
  total_price numeric,
  notes       text,
  created_at  timestamptz,
  has_proof   boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    b.id, b.guest_name, b.status, r.name, b.check_in, b.check_out,
    b.guest_count, b.total_price, b.notes, b.created_at,
    (b.payment_proof_url is not null)
  from bookings b
  join rooms r on r.id = b.room_id
  where lower(b.id::text) like (lower(coalesce(p_code, '')) || '-%')
    and b.guest_phone = coalesce(p_phone, '')
  limit 1;
end;
$$;

revoke all on function public.get_booking_status(text, text) from public;
grant execute on function public.get_booking_status(text, text) to anon, authenticated;
