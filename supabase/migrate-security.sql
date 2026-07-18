-- ============================================================================
-- DIGANTIKAN oleh supabase/migrate-latest.sql (konsolidasi semua migrate-*.sql
-- jadi satu file idempoten). Jangan jalankan file ini lagi -- jalankan
-- migrate-latest.sql saja. Disimpan sebagai riwayat perubahan.
-- ============================================================================
-- MIGRASI KEAMANAN — Villa Tebing Buluh
-- Jalankan SEKALI di Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Idempoten (aman dijalankan ulang).
--
-- Menutup dua celah utama:
--   1. Anon sebelumnya bisa INSERT booking apa pun (status='confirmed',
--      total_price sembarang) langsung ke tabel bookings memakai anon key yang
--      tertanam di bundle JS -> bisa mengunci kalender tanpa bayar. Kini anon
--      HANYA boleh membuat booking lewat fungsi create_public_booking() yang
--      memvalidasi & menghitung harga di server dan memaksa status='pending'.
--   2. Bucket 'payment-proofs' sebelumnya publik -> screenshot pembayaran
--      (data finansial pribadi tamu) bisa dibuka siapa pun yang tahu URL. Kini
--      privat; admin melihatnya lewat signed URL sementara.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Fungsi pembuat booking publik (SECURITY DEFINER, tervalidasi di server)
-- ---------------------------------------------------------------------------
create or replace function public.create_public_booking(
  p_room_id            uuid,
  p_guest_name         text,
  p_guest_phone        text,
  p_check_in           date,
  p_check_out          date,
  p_guest_count        int,
  p_notes              text,
  p_payment_proof_path text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room    rooms%rowtype;
  v_name    text := btrim(coalesce(p_guest_name, ''));
  v_phone   text := coalesce(p_guest_phone, '');
  v_notes   text := nullif(btrim(coalesce(p_notes, '')), '');
  v_nights  int;
  v_id      uuid;
begin
  -- Kamar harus ada & aktif.
  select * into v_room from rooms where id = p_room_id and is_active = true;
  if not found then
    raise exception 'ROOM_NOT_FOUND' using errcode = 'P0002';
  end if;

  -- Validasi tanggal.
  if p_check_in is null or p_check_out is null then
    raise exception 'INVALID_DATES' using errcode = 'P0001';
  end if;
  if p_check_in < current_date then
    raise exception 'CHECKIN_IN_PAST' using errcode = 'P0001';
  end if;
  if p_check_out <= p_check_in then
    raise exception 'INVALID_DATE_RANGE' using errcode = 'P0001';
  end if;
  if p_check_out > current_date + interval '1 year' then
    raise exception 'DATE_TOO_FAR' using errcode = 'P0001';
  end if;

  v_nights := p_check_out - p_check_in;

  -- Validasi tamu & lama menginap terhadap batas kamar.
  if p_guest_count is null or p_guest_count < 1 or p_guest_count > v_room.max_guests then
    raise exception 'INVALID_GUEST_COUNT' using errcode = 'P0001';
  end if;
  if v_nights < v_room.min_nights then
    raise exception 'BELOW_MIN_NIGHTS' using errcode = 'P0001';
  end if;

  -- Validasi data tamu.
  if char_length(v_name) < 3 or char_length(v_name) > 100 then
    raise exception 'INVALID_NAME' using errcode = 'P0001';
  end if;
  if v_phone !~ '^62\d{8,13}$' then
    raise exception 'INVALID_PHONE' using errcode = 'P0001';
  end if;
  if v_notes is not null and char_length(v_notes) > 500 then
    raise exception 'NOTES_TOO_LONG' using errcode = 'P0001';
  end if;
  -- Path bukti bayar wajib & harus berpola UUID.ext (dibuat oleh storage.js).
  if p_payment_proof_path is null
     or p_payment_proof_path !~ '^[0-9a-fA-F-]{36}\.[a-zA-Z0-9]+$' then
    raise exception 'INVALID_PROOF' using errcode = 'P0001';
  end if;

  -- Cek bentrok tanggal atomik (mencegah double-booking / race).
  if exists (
    select 1 from bookings
    where room_id = p_room_id
      and status in ('pending', 'confirmed', 'checked_in')
      and check_in < p_check_out
      and check_out > p_check_in
  ) then
    raise exception 'DATE_TAKEN' using errcode = 'P0001';
  end if;

  -- Dedupe ringan anti-spam: booking pending identik dari nomor yang sama.
  if exists (
    select 1 from bookings
    where room_id = p_room_id
      and guest_phone = v_phone
      and check_in = p_check_in
      and status = 'pending'
  ) then
    raise exception 'DUPLICATE_PENDING' using errcode = 'P0001';
  end if;

  -- Insert: status DIPAKSA 'pending', total_price DIHITUNG server.
  insert into bookings (
    room_id, guest_name, guest_phone, check_in, check_out,
    guest_count, status, total_price, notes, payment_proof_url
  ) values (
    p_room_id, v_name, v_phone, p_check_in, p_check_out,
    p_guest_count, 'pending', v_room.price_per_night * v_nights, v_notes,
    p_payment_proof_path
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Hanya boleh dipanggil, bukan diakses langsung tabelnya.
revoke all on function public.create_public_booking(
  uuid, text, text, date, date, int, text, text) from public;
grant execute on function public.create_public_booking(
  uuid, text, text, date, date, int, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Cabut jalur INSERT langsung anon ke tabel bookings
--    (admin/authenticated tetap penuh; publik hanya lewat RPC di atas)
-- ---------------------------------------------------------------------------
drop policy if exists "Anyone can create a booking" on bookings;

create policy "Admin can create bookings"
  on bookings for insert
  to authenticated
  with check (true);

revoke insert on public.bookings from anon;

-- ---------------------------------------------------------------------------
-- 3. Bucket bukti pembayaran -> PRIVAT + akses admin lewat signed URL
-- ---------------------------------------------------------------------------
update storage.buckets set public = false where id = 'payment-proofs';

-- Publik tidak lagi boleh membaca objek bukti bayar.
drop policy if exists "Public can view payment proofs" on storage.objects;

-- Admin (authenticated) boleh membaca -> memungkinkan createSignedUrl.
drop policy if exists "Admin can view payment proofs" on storage.objects;
create policy "Admin can view payment proofs"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'payment-proofs');

-- Insert anon (unggah bukti) & delete admin dari schema tetap berlaku.
