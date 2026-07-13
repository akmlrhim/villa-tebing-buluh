/**
 * Kompres & konversi foto ke WebP di browser sebelum diunggah (hemat storage
 * & bandwidth). Turunkan resolusi bila melebihi maxDimension; kembalikan file
 * asli bila browser tak mendukung encode WebP atau file bukan gambar.
 */
export async function compressToWebp(file, { maxDimension = 1920, quality = 0.82 } = {}) {
  if (!file.type?.startsWith('image/')) return file

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
  if (!blob) return file

  const name = file.name.replace(/\.[^./\\]+$/, '') + '.webp'
  return new File([blob], name, { type: 'image/webp' })
}
