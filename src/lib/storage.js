import { supabase } from './supabase'
import { compressToWebp } from './imageCompress'

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

/** Foto kamar (admin) — bucket publik, simpan public URL. */
export async function uploadRoomImage(file) {
  const { publicUrl } = await uploadTo('room-images', file)
  return publicUrl
}

/** Foto galeri publik (admin) — dikompres & dikonversi ke WebP sebelum unggah. */
export async function uploadGalleryImage(file) {
  const compressed = await compressToWebp(file)
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
