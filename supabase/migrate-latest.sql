-- ============================================================================
-- MIGRASI TERBARU (KONSOLIDASI) — Villa Tebing Buluh
-- Jalankan file ini SEKALI di Supabase dashboard: SQL Editor -> New query ->
-- paste SELURUH isi file ini -> Run.
--
-- File ini MENGGABUNGKAN semua migrate-*.sql sebelumnya (migrate-security,
-- migrate-bukti-bayar, migrate-gallery, migrate-booking-status,
-- migrate-drop-floor-number, migrate-admin-lockdown) jadi SATU file, dan
-- ditulis 100% IDEMPOTEN -- aman dijalankan berkali-kali, tidak akan pernah
-- muncul error "already exists" walau sebagian isinya sudah pernah
-- diterapkan sebelumnya (drop-lalu-create untuk semua policy, if-not-exists
-- untuk tabel/kolom, create-or-replace untuk fungsi/view).
--
-- Kalau bingung migrasi mana yang sudah/belum pernah dijalankan di database
-- Anda: TIDAK PERLU cek satu-satu. Cukup jalankan file INI saja, file
-- migrate-*.sql lain yang lama sudah tidak perlu dijalankan lagi.
--
-- SATU-SATUNYA LANGKAH WAJIB SETELAH MENJALANKAN FILE INI:
--   Di Dashboard -> Authentication -> Sign In / Providers -> Email, matikan
--   "Allow new users to sign up". Setiap akun yang berhasil login sekarang
--   otomatis dipercaya PENUH (tidak ada allowlist admin_users lagi) --
--   satu-satunya cara membatasi siapa yang bisa masuk adalah menutup jalur
--   pendaftaran akun baru dan hanya membuat akun lewat Dashboard ->
--   Authentication -> Add user.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. HAPUS SISTEM ADMIN_USERS / is_admin() -- semua authenticated user dipercaya
-- ---------------------------------------------------------------------------
-- Sebelumnya akses admin dibatasi tabel admin_users + fungsi is_admin(), yang
-- perlu diisi manual lewat SQL Editor setiap kali ada akun admin baru --
-- gampang lupa dan bikin lockout diam-diam (0 baris kena, tanpa error yang
-- jelas). Sekarang: siapa pun yang berhasil login (role `authenticated`)
-- otomatis dapat akses penuh. Fitur "Kelola Pengguna" (/admin/pengguna) juga
-- dihapus karena fungsinya (kelola siapa admin) sudah tidak relevan.
-- PENTING: DROP FUNCTION/TABLE-nya sendiri ditaruh di BAGIAN PALING BAWAH
-- file ini (section 7) -- policy lama di rooms/room_images/bookings/dst di
-- bawah masih memakai is_admin() sampai masing-masing di-drop-lalu-buat-ulang
-- tanpa is_admin(); Postgres menolak DROP FUNCTION selama masih ada policy
-- yang bergantung padanya.

-- ---------------------------------------------------------------------------
-- 1. ROOMS
-- ---------------------------------------------------------------------------
alter table rooms drop column if exists floor_number; -- fitur "lantai" sudah dihapus

drop policy if exists "Admin can insert rooms" on rooms;
create policy "Admin can insert rooms" on rooms for insert to authenticated with check (true);
drop policy if exists "Admin can update rooms" on rooms;
create policy "Admin can update rooms" on rooms for update to authenticated using (true) with check (true);
drop policy if exists "Admin can delete rooms" on rooms;
create policy "Admin can delete rooms" on rooms for delete to authenticated using (true);

-- ---------------------------------------------------------------------------
-- 2. ROOM_IMAGES
-- ---------------------------------------------------------------------------
drop policy if exists "Admin can insert room images" on room_images;
create policy "Admin can insert room images" on room_images for insert to authenticated with check (true);
drop policy if exists "Admin can update room images" on room_images;
create policy "Admin can update room images" on room_images for update to authenticated using (true) with check (true);
drop policy if exists "Admin can delete room images" on room_images;
create policy "Admin can delete room images" on room_images for delete to authenticated using (true);

-- ---------------------------------------------------------------------------
-- 3. BOOKINGS
-- ---------------------------------------------------------------------------
alter table bookings add column if not exists payment_proof_url text;

drop policy if exists "Admin can view bookings" on bookings;
create policy "Admin can view bookings" on bookings for select to authenticated using (true);

drop policy if exists "Anyone can create a booking" on bookings; -- kebijakan lama, sudah diganti RPC di bawah
drop policy if exists "Admin can create bookings" on bookings;
create policy "Admin can create bookings" on bookings for insert to authenticated with check (true);
drop policy if exists "Admin can update bookings" on bookings;
create policy "Admin can update bookings" on bookings for update to authenticated using (true) with check (true);
drop policy if exists "Admin can delete bookings" on bookings;
create policy "Admin can delete bookings" on bookings for delete to authenticated using (true);

revoke insert on public.bookings from anon;

-- View aman untuk publik: hanya room_id + tanggal, TANPA data pribadi tamu.
create or replace view public_availability
with (security_invoker = false)
as
select room_id, check_in, check_out, status
from bookings
where status in ('pending', 'confirmed', 'checked_in');

grant select on public_availability to anon, authenticated;

-- Booking publik (anon) HANYA lewat fungsi ini: validasi & hitung harga di
-- server, status dipaksa 'pending', cek bentrok atomik.
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
  select * into v_room from rooms where id = p_room_id and is_active = true;
  if not found then
    raise exception 'ROOM_NOT_FOUND' using errcode = 'P0002';
  end if;

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

  if p_guest_count is null or p_guest_count < 1 or p_guest_count > v_room.max_guests then
    raise exception 'INVALID_GUEST_COUNT' using errcode = 'P0001';
  end if;
  if v_nights < v_room.min_nights then
    raise exception 'BELOW_MIN_NIGHTS' using errcode = 'P0001';
  end if;

  if char_length(v_name) < 3 or char_length(v_name) > 100 then
    raise exception 'INVALID_NAME' using errcode = 'P0001';
  end if;
  if v_phone !~ '^62\d{8,13}$' then
    raise exception 'INVALID_PHONE' using errcode = 'P0001';
  end if;
  if v_notes is not null and char_length(v_notes) > 500 then
    raise exception 'NOTES_TOO_LONG' using errcode = 'P0001';
  end if;
  if p_payment_proof_path is null
     or p_payment_proof_path !~ '^[0-9a-fA-F-]{36}\.[a-zA-Z0-9]+$' then
    raise exception 'INVALID_PROOF' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from bookings
    where room_id = p_room_id
      and status in ('pending', 'confirmed', 'checked_in')
      and check_in < p_check_out
      and check_out > p_check_in
  ) then
    raise exception 'DATE_TAKEN' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from bookings
    where room_id = p_room_id
      and guest_phone = v_phone
      and check_in = p_check_in
      and status = 'pending'
  ) then
    raise exception 'DUPLICATE_PENDING' using errcode = 'P0001';
  end if;

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

revoke all on function public.create_public_booking(
  uuid, text, text, date, date, int, text, text) from public;
grant execute on function public.create_public_booking(
  uuid, text, text, date, date, int, text, text) to anon, authenticated;

-- Cek status booking publik (/cek-booking): kode booking + no. WA, DUA-DUANYA
-- harus cocok; bukti bayar cuma dikembalikan sebagai boolean has_proof.
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

-- ---------------------------------------------------------------------------
-- 3b. GALLERY_IMAGES
-- ---------------------------------------------------------------------------
create table if not exists gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  alt text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table gallery_images enable row level security;

drop policy if exists "Public can view gallery images" on gallery_images;
create policy "Public can view gallery images" on gallery_images for select using (true);

drop policy if exists "Admin can insert gallery images" on gallery_images;
create policy "Admin can insert gallery images" on gallery_images for insert to authenticated with check (true);
drop policy if exists "Admin can update gallery images" on gallery_images;
create policy "Admin can update gallery images" on gallery_images for update to authenticated using (true) with check (true);
drop policy if exists "Admin can delete gallery images" on gallery_images;
create policy "Admin can delete gallery images" on gallery_images for delete to authenticated using (true);

-- -------------------------------------------------------------------------
-- 4. SETTINGS
-- -------------------------------------------------------------------------
create table if not exists settings (
  key text primary key,
  value text not null
);
alter table settings enable row level security;

drop policy if exists "Public can read settings" on settings;
create policy "Public can read settings" on settings for select to anon, authenticated using (true);

drop policy if exists "Admin can upsert settings" on settings;
create policy "Admin can upsert settings" on settings for insert to authenticated with check (true);
drop policy if exists "Admin can update settings" on settings;
create policy "Admin can update settings" on settings for update to authenticated using (true) with check (true);

insert into settings (key, value) values
  ('whatsapp_number', '6281234567890'),
  ('villa_name', 'Villa Tebing Buluh'),
  ('address', 'Jl. Tanuhi, Hulu Banyu, Kec. Loksado, Kabupaten Hulu Sungai Selatan, Kalimantan Selatan 71282')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 5. STORAGE
-- ---------------------------------------------------------------------------
-- room-images: bucket publik, foto kamar + gambar QRIS (lihat AdminSettingsView).
insert into storage.buckets (id, name, public)
values ('room-images', 'room-images', true)
on conflict (id) do nothing;
update storage.buckets set public = true where id = 'room-images';

drop policy if exists "Public can view room images" on storage.objects;
create policy "Public can view room images" on storage.objects for select using (bucket_id = 'room-images');
drop policy if exists "Admin can upload room images" on storage.objects;
create policy "Admin can upload room images" on storage.objects for insert to authenticated with check (bucket_id = 'room-images');
drop policy if exists "Admin can update room images objects" on storage.objects;
create policy "Admin can update room images objects" on storage.objects for update to authenticated using (bucket_id = 'room-images');
drop policy if exists "Admin can delete room images objects" on storage.objects;
create policy "Admin can delete room images objects" on storage.objects for delete to authenticated using (bucket_id = 'room-images');

-- payment-proofs: bukti bayar tamu -- PRIVAT (data finansial pribadi). Riwayat
-- bucket ini sempat public=true sebelum diprivatkan -- baris update di bawah
-- memaksa state akhir yang benar apa pun riwayatnya.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
update storage.buckets
set public = false, file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'payment-proofs';

drop policy if exists "Public can view payment proofs" on storage.objects; -- kebijakan lama, publik TIDAK boleh baca lagi
drop policy if exists "Admin can view payment proofs" on storage.objects;
create policy "Admin can view payment proofs" on storage.objects for select to authenticated using (bucket_id = 'payment-proofs');
drop policy if exists "Anyone can upload payment proofs" on storage.objects;
create policy "Anyone can upload payment proofs" on storage.objects for insert to anon, authenticated with check (bucket_id = 'payment-proofs');
drop policy if exists "Admin can delete payment proofs" on storage.objects;
create policy "Admin can delete payment proofs" on storage.objects for delete to authenticated using (bucket_id = 'payment-proofs');

-- gallery-images: bucket publik, foto galeri.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery-images', 'gallery-images', true, 8388608,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
update storage.buckets set public = true where id = 'gallery-images';

drop policy if exists "Public can view gallery images objects" on storage.objects;
create policy "Public can view gallery images objects" on storage.objects for select using (bucket_id = 'gallery-images');
drop policy if exists "Admin can upload gallery images objects" on storage.objects;
create policy "Admin can upload gallery images objects" on storage.objects for insert to authenticated with check (bucket_id = 'gallery-images');
drop policy if exists "Admin can delete gallery images objects" on storage.objects;
create policy "Admin can delete gallery images objects" on storage.objects for delete to authenticated using (bucket_id = 'gallery-images');

-- ---------------------------------------------------------------------------
-- 6. GRANT LEVEL-TABEL (GRANT selalu aman diulang, tidak pernah "already exists")
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on public.rooms          to anon, authenticated;
grant select on public.room_images    to anon, authenticated;
grant select on public.settings       to anon, authenticated;
grant select on public.gallery_images to anon, authenticated;

grant select, insert, update, delete on public.rooms          to authenticated;
grant select, insert, update, delete on public.room_images    to authenticated;
grant select, insert, update, delete on public.bookings       to authenticated;
grant select, insert, update, delete on public.settings       to authenticated;
grant select, insert, update, delete on public.gallery_images to authenticated;

-- ---------------------------------------------------------------------------
-- 7. DROP ADMIN_USERS / is_admin() -- sekarang aman, semua policy di atas
-- sudah dibuat ulang tanpa memakai is_admin().
-- ---------------------------------------------------------------------------
drop function if exists public.admin_list_admins();
drop function if exists public.admin_add_admin_by_email(text);
drop function if exists public.admin_remove_admin(uuid);
drop function if exists public.is_admin();
drop table if exists admin_users;
