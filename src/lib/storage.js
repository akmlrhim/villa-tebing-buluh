import { supabase } from './supabase'
import { compressToWebp } from './imageCompress'

/** Batas ukuran gambar SETELAH dikompres — dicek sebelum diunggah ke storage. */
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 // 2MB

function assertMaxSize(file) {
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1)
    throw new Error(
      `Ukuran gambar ${mb}MB setelah dikompres, masih di atas batas 2MB. Gunakan gambar dengan resolusi/ukuran lebih kecil.`,
    )
  }
}

/**
 * Unggah satu file ke bucket dengan nama acak (UUID.ext).
 * Mengembalikan { path, publicUrl }.
 */
async function uploadTo(bucket, file) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}

/** Foto kamar / gambar QRIS (admin) — dikompres & dikonversi ke WebP, lalu
 * divalidasi maks 2MB sebelum diunggah supaya tidak memakan storage. */
export async function uploadRoomImage(file) {
  const compressed = await compressToWebp(file)
  assertMaxSize(compressed)
  const { publicUrl } = await uploadTo('room-images', compressed)
  return publicUrl
}

/** Foto galeri publik (admin) — dikompres & dikonversi ke WebP, lalu
 * divalidasi maks 2MB sebelum diunggah. */
export async function uploadGalleryImage(file) {
  const compressed = await compressToWebp(file)
  assertMaxSize(compressed)
  const { publicUrl } = await uploadTo('gallery-images', compressed)
  return publicUrl
}

/**
 * Bukti pembayaran QRIS (tamu, anon). Bucket privat: kembalikan PATH objek
 * (bukan URL). Admin membacanya lewat signedProofUrl().
 */
export async function uploadPaymentProof(file) {
  const { path } = await uploadTo('payment-proofs', file)
  return path
}

/**
 * URL bertanda-tangan sementara untuk bukti bayar (admin). Menerima path objek
 * privat; menoleransi nilai lama yang berupa URL publik penuh (http...) demi
 * kompatibilitas baris booking lama.
 */
export async function signedProofUrl(pathOrUrl, expiresIn = 3600) {
  if (!pathOrUrl) return ''
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  const { data, error } = await supabase.storage
    .from('payment-proofs')
    .createSignedUrl(pathOrUrl, expiresIn)
  if (error) throw error
  return data.signedUrl
}
