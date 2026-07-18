-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run
-- Project: Villa Tebing Buluh
-- Structure follows PRD.md section 5.2, extended with min_nights
-- (needed for the "untuk 14 malam" field shown on the room card design).

-- =========================================
-- 0. ADMIN ACCESS CONTROL
-- =========================================
-- Semua policy "Admin can ..." di bawah dicek pakai is_admin(), BUKAN cuma
-- `to authenticated`. Alasan: anon key Supabase memang publik (tertanam di
-- bundle JS), jadi siapa pun yang berhasil membuat akun Supabase Auth
-- (kalau signup diizinkan) otomatis jadi role `authenticated`. Kalau policy
-- cuma cek `to authenticated`, akun itu langsung dapat akses tulis PENUH ke
-- semua tabel admin -- termasuk mengganti settings.qris_image_url untuk
-- mengalihkan pembayaran tamu. is_admin() mempersempit ini ke user_id yang
-- memang terdaftar di admin_users.
create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table admin_users enable row level security;
-- Sengaja TANPA policy select/insert/update/delete untuk client -- hanya
-- bisa diisi lewat SQL Editor (service role) atau dibaca lewat is_admin()
-- (SECURITY DEFINER, bypass RLS).
revoke all on public.admin_users from anon, authenticated;

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

-- Manajemen admin (halaman /admin/pengguna): auth.users tidak bisa diquery
-- langsung dari client, jadi fungsi SECURITY DEFINER ini yang menjembatani --
-- masing-masing DIBATASI hanya untuk admin (cek is_admin() di dalamnya).
create or replace function public.admin_list_admins()
returns table (user_id uuid, email text, added_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'NOT_ADMIN' using errcode = '42501';
  end if;
  return query
  select a.user_id, u.email, a.created_at
  from admin_users a
  join auth.users u on u.id = a.user_id
  order by a.created_at asc;
end;
$$;

-- Jadikan akun (yang SUDAH ada di Supabase Auth) sebagai admin lewat email.
-- Tidak membuat akun baru -- akun harus sudah dibuat dulu lewat Supabase
-- Dashboard -> Authentication -> Add user.
create or replace function public.admin_add_admin_by_email(p_email text)
returns table (user_id uuid, email text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if not is_admin() then
    raise exception 'NOT_ADMIN' using errcode = '42501';
  end if;

  select id into v_user_id from auth.users where email ilike btrim(p_email) limit 1;
  if v_user_id is null then
    raise exception 'USER_NOT_FOUND' using errcode = 'P0002';
  end if;

  insert into admin_users (user_id) values (v_user_id)
  on conflict (user_id) do nothing;

  return query select v_user_id, (select u.email from auth.users u where u.id = v_user_id);
end;
$$;

-- Cabut akses admin. Menolak kalau ini admin TERAKHIR supaya tidak ada yang
-- tanpa sengaja mengunci total akses admin ke situs.
create or replace function public.admin_remove_admin(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'NOT_ADMIN' using errcode = '42501';
  end if;

  if (select count(*) from admin_users) <= 1 then
    raise exception 'LAST_ADMIN' using errcode = 'P0001';
  end if;

  delete from admin_users where user_id = p_user_id;
end;
$$;

revoke all on function public.admin_list_admins() from public;
revoke all on function public.admin_add_admin_by_email(text) from public;
revoke all on function public.admin_remove_admin(uuid) from public;
grant execute on function public.admin_list_admins() to authenticated;
grant execute on function public.admin_add_admin_by_email(text) to authenticated;
grant execute on function public.admin_remove_admin(uuid) to authenticated;

-- =========================================
-- 1. ROOMS (kamar/unit vila, dikelola admin)
-- =========================================
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,                        -- "Cemerlang 1"
  slug text not null unique,
  description text,
  price_per_night numeric(12, 2) not null,
  min_nights int not null default 1,         -- 14 -> harga ditampilkan sbg price_per_night * 14
  max_guests int not null default 2,
  size_sqm int,
  bed_count int not null default 1,
  bed_type text,
  amenities text[] not null default '{}',    -- ['Free WiFi','Free Kano','Gazebo','Dapur + Peralatan Lengkap']
  is_active boolean not null default true,   -- soft delete (F-07.3)
  created_at timestamptz not null default now()
);

alter table rooms enable row level security;

create policy "Public can view active rooms"
  on rooms for select
  using (is_active = true);

create policy "Admin can insert rooms"
  on rooms for insert
  to authenticated
  with check (is_admin());

create policy "Admin can update rooms"
  on rooms for update
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "Admin can delete rooms"
  on rooms for delete
  to authenticated
  using (is_admin());

-- =========================================
-- 2. ROOM_IMAGES (foto per kamar)
-- =========================================
create table if not exists room_images (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  image_url text not null,
  is_primary boolean not null default false,
  sort_order int not null default 0
);

alter table room_images enable row level security;

create policy "Public can view images of active rooms"
  on room_images for select
  using (
    exists (
      select 1 from rooms
      where rooms.id = room_images.room_id and rooms.is_active = true
    )
  );

create policy "Admin can insert room images"
  on room_images for insert
  to authenticated
  with check (is_admin());

create policy "Admin can update room images"
  on room_images for update
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "Admin can delete room images"
  on room_images for delete
  to authenticated
  using (is_admin());

-- =========================================
-- 3. BOOKINGS (reservasi tamu)
-- =========================================
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id),
  guest_name text not null,
  guest_phone text not null,
  check_in date not null,
  check_out date not null,
  guest_count int not null default 1,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled')),
  total_price numeric(12, 2),
  notes text,
  payment_proof_url text,                    -- bukti bayar QRIS yang diunggah tamu
  created_at timestamptz not null default now(),
  constraint valid_dates check (check_out > check_in)
);

alter table bookings enable row level security;

-- Data pribadi tamu tidak boleh terbaca publik (F-05.3) -> tidak ada select policy untuk anon di sini,
-- publik baca ketersediaan lewat view public_availability di bawah.
create policy "Admin can view bookings"
  on bookings for select
  to authenticated
  using (is_admin());

-- Publik TIDAK boleh INSERT langsung (bisa disalahgunakan untuk mengunci
-- kalender / mengatur harga). Booking publik hanya lewat fungsi tervalidasi
-- create_public_booking() di bawah. Admin tetap boleh insert penuh.
create policy "Admin can create bookings"
  on bookings for insert
  to authenticated
  with check (is_admin());

create policy "Admin can update bookings"
  on bookings for update
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "Admin can delete bookings"
  on bookings for delete
  to authenticated
  using (is_admin());

-- View aman untuk publik: hanya room_id + tanggal, TANPA data pribadi tamu (F-05.3).
-- SECURITY DEFINER (security_invoker = false) disengaja: anon cukup punya akses
-- ke view ini, tidak perlu (dan tidak boleh) akses ke tabel bookings. View hanya
-- meng-ekspos kolom non-sensitif, jadi data pribadi tamu tetap aman.
create or replace view public_availability
with (security_invoker = false)
as
select room_id, check_in, check_out, status
from bookings
where status in ('pending', 'confirmed', 'checked_in');

grant select on public_availability to anon, authenticated;

-- Pembuatan booking oleh publik (anon) HANYA lewat fungsi ini: validasi kamar,
-- tanggal, tamu, dan bukti bayar di server; cek bentrok atomik; status dipaksa
-- 'pending'; total_price dihitung server (bukan dari klien). Lihat komentar di
-- supabase/migrate-security.sql.
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

-- Cek status booking oleh publik (halaman /cek-booking): tamu memasukkan kode
-- booking (8 karakter pertama UUID, dari layar sukses/WA follow-up) + nomor
-- WA yang dipakai saat booking. SECURITY DEFINER agar anon tidak perlu akses
-- langsung ke tabel bookings (data pribadi tamu lain tetap tidak terekspos -
-- lookup hanya mengembalikan baris yang cocok DUA-DUANYA kode & nomor).
-- Bukti bayar tidak dikembalikan sebagai path/URL, hanya penanda ada/tidaknya.
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

-- =========================================
-- 3b. GALLERY_IMAGES (foto galeri publik, bebas unggah, tanpa kategori)
-- =========================================
create table if not exists gallery_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  alt text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table gallery_images enable row level security;

create policy "Public can view gallery images"
  on gallery_images for select
  using (true);

create policy "Admin can insert gallery images"
  on gallery_images for insert
  to authenticated
  with check (is_admin());

create policy "Admin can update gallery images"
  on gallery_images for update
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "Admin can delete gallery images"
  on gallery_images for delete
  to authenticated
  using (is_admin());

-- =========================================
-- 4. SETTINGS (whatsapp_number, villa_name, dst.)
-- =========================================
create table if not exists settings (
  key text primary key,
  value text not null
);

alter table settings enable row level security;

create policy "Public can read settings"
  on settings for select
  to anon, authenticated
  using (true);

create policy "Admin can upsert settings"
  on settings for insert
  to authenticated
  with check (is_admin());

create policy "Admin can update settings"
  on settings for update
  to authenticated
  using (is_admin())
  with check (is_admin());

insert into settings (key, value) values
  ('whatsapp_number', '6281234567890'),
  ('villa_name', 'Villa Tebing Buluh'),
  ('address', 'Jl. Tanuhi, Hulu Banyu, Kec. Loksado, Kabupaten Hulu Sungai Selatan, Kalimantan Selatan 71282')
on conflict (key) do nothing;

-- =========================================
-- 5. STORAGE (foto kamar)
-- =========================================
insert into storage.buckets (id, name, public)
values ('room-images', 'room-images', true)
on conflict (id) do nothing;

create policy "Public can view room images"
  on storage.objects for select
  using (bucket_id = 'room-images');

create policy "Admin can upload room images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'room-images' and is_admin());

create policy "Admin can update room images objects"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'room-images' and is_admin());

create policy "Admin can delete room images objects"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'room-images' and is_admin());

-- Bucket bukti pembayaran QRIS (diunggah tamu dari halaman /pembayaran).
-- PRIVAT: berisi data finansial pribadi tamu. Admin melihatnya lewat signed URL
-- sementara (lihat src/lib/storage.js -> signedProofUrl). Tamu anon tetap boleh
-- mengunggah, tetapi tidak ada yang bisa membaca tanpa token.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Admin can view payment proofs"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'payment-proofs' and is_admin());

create policy "Anyone can upload payment proofs"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'payment-proofs');

create policy "Admin can delete payment proofs"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'payment-proofs' and is_admin());

-- Bucket foto galeri publik (admin unggah, dikompres & dikonversi ke WebP di
-- browser sebelum unggah -- lihat src/lib/imageCompress.js).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery-images', 'gallery-images', true, 8388608,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Public can view gallery images objects"
  on storage.objects for select
  using (bucket_id = 'gallery-images');

create policy "Admin can upload gallery images objects"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'gallery-images' and is_admin());

create policy "Admin can delete gallery images objects"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'gallery-images' and is_admin());

-- =========================================
-- 6. GRANT LEVEL-TABEL (WAJIB, di luar RLS)
-- =========================================
-- RLS menentukan BARIS yang terlihat; GRANT ini membuka akses level-tabel yang
-- tetap diminta Postgres sebelum RLS dievaluasi. Tanpa blok ini, semua request
-- anon/authenticated ditolak "permission denied for table" (kode 42501).
grant usage on schema public to anon, authenticated;

grant select on public.rooms          to anon, authenticated;
grant select on public.room_images    to anon, authenticated;
grant select on public.settings       to anon, authenticated;
grant select on public.gallery_images to anon, authenticated;
-- Catatan: anon TIDAK diberi insert pada bookings — publik membuat booking hanya
-- lewat fungsi create_public_booking() (SECURITY DEFINER) di atas.

grant select, insert, update, delete on public.rooms          to authenticated;
grant select, insert, update, delete on public.room_images    to authenticated;
grant select, insert, update, delete on public.bookings       to authenticated;
grant select, insert, update, delete on public.settings       to authenticated;
grant select, insert, update, delete on public.gallery_images to authenticated;
