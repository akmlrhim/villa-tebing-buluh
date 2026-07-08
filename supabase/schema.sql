-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run
-- Project: Villa Tebing Buluh
-- Structure follows PRD.md section 5.2, extended with floor_number + min_nights
-- (needed for the "lantai 1" / "untuk 14 malam" fields shown on the room card design).

-- =========================================
-- 1. ROOMS (kamar/unit vila, dikelola admin)
-- =========================================
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,                        -- "Cemerlang 1"
  slug text not null unique,
  floor_number int,                          -- 1 -> tampil "lantai 1"
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
  with check (true);

create policy "Admin can update rooms"
  on rooms for update
  to authenticated
  using (true)
  with check (true);

create policy "Admin can delete rooms"
  on rooms for delete
  to authenticated
  using (true);

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
  with check (true);

create policy "Admin can update room images"
  on room_images for update
  to authenticated
  using (true)
  with check (true);

create policy "Admin can delete room images"
  on room_images for delete
  to authenticated
  using (true);

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
  created_at timestamptz not null default now(),
  constraint valid_dates check (check_out > check_in)
);

alter table bookings enable row level security;

-- Data pribadi tamu tidak boleh terbaca publik (F-05.3) -> tidak ada select policy untuk anon di sini,
-- publik baca ketersediaan lewat view public_availability di bawah.
create policy "Admin can view bookings"
  on bookings for select
  to authenticated
  using (true);

create policy "Anyone can create a booking"
  on bookings for insert
  to anon, authenticated
  with check (true);

create policy "Admin can update bookings"
  on bookings for update
  to authenticated
  using (true)
  with check (true);

create policy "Admin can delete bookings"
  on bookings for delete
  to authenticated
  using (true);

-- View aman untuk publik: hanya room_id + tanggal, TANPA data pribadi tamu (F-05.3)
create or replace view public_availability
with (security_invoker = true)
as
select room_id, check_in, check_out, status
from bookings
where status in ('pending', 'confirmed', 'checked_in');

grant select on public_availability to anon, authenticated;

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
  with check (true);

create policy "Admin can update settings"
  on settings for update
  to authenticated
  using (true)
  with check (true);

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
  with check (bucket_id = 'room-images');

create policy "Admin can update room images objects"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'room-images');

create policy "Admin can delete room images objects"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'room-images');
