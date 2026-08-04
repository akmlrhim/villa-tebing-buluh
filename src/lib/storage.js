import { authApi, uploadPublic } from './api'
import { compressToWebp } from './imageCompress'

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024

function assertMaxSize(file) {
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1)
    throw new Error(
      `Ukuran gambar ${mb}MB setelah dikompres, masih di atas batas 2MB. Gunakan gambar dengan resolusi/ukuran lebih kecil.`,
    )
  }
}

function formDataOf(file) {
  const fd = new FormData()
  fd.append('file', file)
  return fd
}

export async function uploadRoomImage(file) {
  const compressed = await compressToWebp(file)
  assertMaxSize(compressed)
  const { publicUrl } = await authApi.upload('/upload/room-image', formDataOf(compressed))
  return publicUrl
}

export async function uploadGalleryImage(file) {
  const compressed = await compressToWebp(file)
  assertMaxSize(compressed)
  const { publicUrl } = await authApi.upload('/upload/gallery-image', formDataOf(compressed))
  return publicUrl
}

export async function uploadPaymentProof(file) {
  const { path } = await uploadPublic('/upload/payment-proof', formDataOf(file))
  return path
}

export async function signedProofUrl(bookingId) {
  if (!bookingId) return ''
  if (/^https?:\/\//i.test(bookingId)) return bookingId
  const { url } = await authApi.get(`/bookings/${bookingId}/proof-url`)
  return url
}
