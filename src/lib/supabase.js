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
 * (mis. sesi sudah habis, balik jadi anon) -- baris yang tak lolos `using`
 * cuma difilter diam-diam, error tetap null, 0 baris kena. Panggil ini
 * setelah `.select(...)` dirantai ke update()/delete() supaya kegagalan
 * izin kelihatan sebagai error, bukan sukses palsu.
 */
export function assertRowsAffected(data, message = 'Tidak ada perubahan tersimpan. Coba muat ulang halaman dan login lagi.') {
  if (!data || data.length === 0) throw new Error(message)
}

/**
 * Pesan error RLS mentah dari Postgres ("new row violates row-level security
 * policy for table ...", kode 42501) sulit dipahami. Semua akun yang berhasil
 * login sudah dipercaya penuh (tidak ada allowlist admin lagi) -- kalau error
 * ini tetap muncul, penyebab paling umum adalah sesi sudah habis (request
 * jalan sebagai anon). Pakai di semua toast/errorMsg admin sebagai pengganti
 * `err?.message || err`.
 */
export function friendlyDbError(err) {
  const msg = err?.message || String(err ?? '')
  if (err?.code === '42501' || /row-level security policy/i.test(msg)) {
    return 'Sesi login Anda mungkin sudah habis. Coba muat ulang halaman dan login lagi.'
  }
  return msg
}
