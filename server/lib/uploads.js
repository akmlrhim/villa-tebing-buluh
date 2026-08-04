import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { badRequest, unauthorized } from './http.js'

const here = path.dirname(fileURLToPath(import.meta.url))

/** Akar folder unggahan (bisa dipindah keluar web root lewat UPLOAD_DIR). */
export const UPLOAD_ROOT = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(here, '../../uploads')

/**
 * Pengganti tiga bucket Supabase Storage. `public: true` berarti file boleh
 * dilayani langsung sebagai file statis; payment-proofs TIDAK — berisi data
 * finansial pribadi tamu dan hanya bisa diakses lewat URL bertanda tangan
 * (lihat signProofUrl di bawah), sama seperti bucket privat sebelumnya.
 */
export const BUCKETS = {
  'room-images': { public: true, maxBytes: 8 * 1024 * 1024 },
  'gallery-images': { public: true, maxBytes: 8 * 1024 * 1024 },
  'payment-proofs': { public: false, maxBytes: 5 * 1024 * 1024 },
}

export const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']

const EXT_BY_MIME = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

/** Buat semua folder bucket saat server start. */
export function ensureUploadDirs() {
  for (const bucket of Object.keys(BUCKETS)) {
    fs.mkdirSync(path.join(UPLOAD_ROOT, bucket), { recursive: true })
  }
}

/**
 * Nama file acak `UUID.ext` — ekstensi diturunkan dari MIME hasil deteksi,
 * BUKAN dari nama file kiriman. Nama asli dari klien tidak pernah dipakai
 * supaya tidak ada jalan untuk path traversal ("../../index.html") maupun
 * ekstensi yang bisa dieksekusi (".php", ".html").
 */
export function randomFilename(mimetype) {
  return `${crypto.randomUUID()}.${EXT_BY_MIME[mimetype] ?? 'jpg'}`
}

/**
 * Validasi nama file yang datang dari database/klien sebelum dipakai untuk
 * menyusun path di disk. Pola sama dengan validasi p_payment_proof_path di
 * RPC Postgres lama: 36 karakter UUID + titik + ekstensi alfanumerik.
 */
const FILENAME_RE = /^[0-9a-fA-F-]{36}\.[a-zA-Z0-9]+$/

export function safeFilename(name) {
  if (!name || !FILENAME_RE.test(name)) throw badRequest('Nama berkas tidak valid.', 'INVALID_FILENAME')
  return name
}

/** Path absolut file di dalam bucket, sudah divalidasi. */
export function bucketPath(bucket, filename) {
  if (!BUCKETS[bucket]) throw badRequest('Bucket tidak dikenal.', 'UNKNOWN_BUCKET')
  return path.join(UPLOAD_ROOT, bucket, safeFilename(filename))
}

/** URL publik untuk bucket publik — relatif, jadi ikut domain mana pun. */
export const publicUrl = (bucket, filename) => `/uploads/${bucket}/${filename}`

/** Hapus file bila ada; kegagalan diabaikan (file mungkin sudah hilang). */
export function removeFile(bucket, filename) {
  try {
    fs.unlinkSync(bucketPath(bucket, filename))
  } catch {
    /* sudah tidak ada — tidak perlu digagalkan */
  }
}

// ---------------------------------------------------------------------------
// URL BERTANDA TANGAN untuk bukti bayar (pengganti createSignedUrl Supabase)
// ---------------------------------------------------------------------------
// Bukti bayar ditampilkan lewat <img src="..."> di panel admin, dan tag <img>
// TIDAK bisa mengirim header Authorization. Karena itu izin akses dititipkan
// di query string sebagai HMAC bermasa berlaku: hanya server yang bisa
// membuatnya, tidak bisa ditebak, dan kedaluwarsa sendiri — persis pola
// signed URL Supabase yang digantikannya.

const proofSecret = () => process.env.JWT_SECRET

function sign(filename, exp) {
  return crypto.createHmac('sha256', proofSecret()).update(`${filename}:${exp}`).digest('hex')
}

/** URL sementara untuk satu bukti bayar. `expiresIn` dalam detik. */
export function signProofUrl(filename, expiresIn = 3600) {
  const safe = safeFilename(filename)
  const exp = Math.floor(Date.now() / 1000) + expiresIn
  return `/api/proofs/${safe}?exp=${exp}&sig=${sign(safe, exp)}`
}

/** Verifikasi tanda tangan + masa berlaku; melempar bila tidak sah. */
export function verifyProofSignature(filename, exp, sig) {
  const safe = safeFilename(filename)
  const expNum = Number(exp)
  if (!Number.isFinite(expNum) || expNum < Math.floor(Date.now() / 1000)) {
    throw unauthorized('Tautan bukti bayar sudah kedaluwarsa. Muat ulang halaman.')
  }
  const expected = sign(safe, expNum)
  const given = String(sig ?? '')
  // timingSafeEqual melempar bila panjang beda — cek dulu supaya tidak crash.
  if (given.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    throw unauthorized('Tautan bukti bayar tidak sah.')
  }
  return safe
}
