/**
 * Error dengan status HTTP + kode mesin. `code` menggantikan SQLSTATE yang
 * dulu dilempar RPC Postgres (mis. 'DATE_TAKEN' errcode P0001) dan tetap
 * dikirim ke frontend supaya pesan bisa dipetakan per-kasus, bukan cuma
 * ditampilkan mentah.
 */
export class HttpError extends Error {
  constructor(status, message, code = null) {
    super(message)
    this.status = status
    this.code = code
  }
}

export const badRequest = (message, code) => new HttpError(400, message, code)
export const unauthorized = (message = 'Sesi tidak valid atau sudah berakhir. Silakan login lagi.') =>
  new HttpError(401, message, 'UNAUTHORIZED')
export const notFound = (message = 'Data tidak ditemukan.') => new HttpError(404, message, 'NOT_FOUND')
export const conflict = (message, code) => new HttpError(409, message, code)

/**
 * Membungkus handler async supaya error yang dilempar di dalamnya sampai ke
 * error middleware Express. Tanpa ini, Promise reject di handler async
 * menggantung diam-diam dan request tidak pernah dibalas (Express 4).
 */
export const wrap = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next)

/**
 * Padanan assertRowsAffected() versi Supabase, tapi kini bekerja dengan
 * benar: MySQL melaporkan affectedRows apa adanya, jadi 0 baris = data
 * memang tidak ada (bukan "diblokir diam-diam oleh RLS" seperti dulu).
 */
export function assertAffected(result, message = 'Data tidak ditemukan atau sudah dihapus.') {
  if (!result || result.affectedRows === 0) throw notFound(message)
}

/** Ambil daftar id dari body dan pastikan bentuknya array UUID yang wajar. */
export function requireIdList(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw badRequest('Tidak ada data yang dipilih.', 'EMPTY_SELECTION')
  }
  if (ids.length > 200) {
    throw badRequest('Terlalu banyak data dipilih sekaligus (maks 200).', 'TOO_MANY')
  }
  return ids.map(String)
}

/**
 * Placeholder `IN (?, ?, ...)`. mysql2 tidak mengembangkan array pada
 * execute() (prepared statement), jadi placeholder harus dibuat manual.
 */
export const placeholders = (n) => Array(n).fill('?').join(', ')
