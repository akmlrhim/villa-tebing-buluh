import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Placeholder .env.example belum diganti = mode demo (halaman publik pakai data contoh).
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your-project-ref') &&
    !supabaseAnonKey.startsWith('your-'),
)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

/**
 * Supabase update()/delete() TIDAK PERNAH error walau RLS memblokir baris
 * (mis. akun bukan admin) -- baris yang tak lolos `using` cuma difilter diam-
 * diam, error tetap null, 0 baris kena. Panggil ini setelah `.select(...)`
 * dirantai ke update()/delete() supaya kegagalan izin kelihatan sebagai error,
 * bukan sukses palsu.
 */
export function assertRowsAffected(data, message = 'Tidak ada perubahan tersimpan (cek izin akun admin).') {
  if (!data || data.length === 0) throw new Error(message)
}

/**
 * Pesan error RLS mentah dari Postgres ("new row violates row-level security
 * policy for table ...", kode 42501) sulit dipahami. Ganti dengan pesan yang
 * langsung mengarah ke penyebab paling umum di admin panel ini: akun belum
 * terdaftar di admin_users. Pakai di semua toast/errorMsg admin sebagai
 * pengganti `err?.message || err`.
 */
export function friendlyDbError(err) {
  const msg = err?.message || String(err ?? '')
  if (err?.code === '42501' || /row-level security policy/i.test(msg)) {
    return 'Akun Anda belum terdaftar sebagai admin di database (admin_users) sehingga tidak punya izin untuk aksi ini. Lihat supabase/migrate-latest.sql.'
  }
  return msg
}
