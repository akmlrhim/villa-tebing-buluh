-- MIGRASI: manajemen galeri publik (admin unggah, tanpa kategori)
-- Jalankan SEKALI di Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Hanya untuk database yang sudah pernah menjalankan schema.sql versi lama;
-- instalasi baru cukup menjalankan schema.sql (sudah memuat semua ini).

-- 1. Tabel gallery_images
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
  with check (true);

create policy "Admin can update gallery images"
  on gallery_images for update
  to authenticated
  using (true)
  with check (true);

create policy "Admin can delete gallery images"
  on gallery_images for delete
  to authenticated
  using (true);

-- 2. Bucket foto galeri (public read; admin unggah/hapus)
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
  with check (bucket_id = 'gallery-images');

create policy "Admin can delete gallery images objects"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'gallery-images');

-- 3. Grant level-tabel (wajib, di luar RLS)
grant select on public.gallery_images to anon, authenticated;
grant select, insert, update, delete on public.gallery_images to authenticated;
