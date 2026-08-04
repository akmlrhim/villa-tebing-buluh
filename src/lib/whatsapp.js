import { formatDateLongID, nightsBetween } from './format'

export function waLink(number, message) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export function normalizePhone(input) {
  let digits = (input || '').replace(/\D/g, '')
  if (digits.startsWith('0')) digits = '62' + digits.slice(1)
  return digits
}

export function bookingMessage({ roomName, checkIn, checkOut, guests }) {
  const nights = nightsBetween(checkIn, checkOut)
  return (
    `Halo, saya ingin booking *${roomName}* untuk tanggal ` +
    `*${formatDateLongID(checkIn)} s/d ${formatDateLongID(checkOut)}* ` +
    `(${nights} malam, ${guests} tamu). Apakah masih tersedia?`
  )
}

export function askAvailabilityMessage({ checkIn, checkOut, guests }) {
  return (
    `Halo, apakah ada kamar yang tersedia untuk tanggal ` +
    `*${formatDateLongID(checkIn)} s/d ${formatDateLongID(checkOut)}* ` +
    `(${guests} tamu)?`
  )
}

export function paymentSubmittedMessage({ guestName, roomName, checkIn, checkOut, bookingCode }) {
  return (
    `Halo, saya *${guestName}*. Saya sudah membayar via QRIS dan mengisi ` +
    `form konfirmasi untuk booking:\n\n` +
    `• Kode: ${bookingCode}\n` +
    `• Kamar: ${roomName}\n` +
    `• ${formatDateLongID(checkIn)} s/d ${formatDateLongID(checkOut)}\n\n` +
    `Bukti pembayaran sudah saya unggah lewat website. Mohon diverifikasi ya, terima kasih 🙏`
  )
}

export function generalMessage() {
  return 'Halo, saya ingin bertanya tentang Villa Tebing Buluh.'
}
