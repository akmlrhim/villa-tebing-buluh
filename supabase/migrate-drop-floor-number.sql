-- MIGRASI: hapus kolom floor_number dari rooms (fitur "lantai" dihapus)
-- Jalankan SEKALI di Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Hanya untuk database yang masih punya kolom ini (schema.sql sudah diperbarui
-- untuk instalasi baru sehingga tidak membuat kolom ini lagi).

alter table rooms drop column if exists floor_number;
