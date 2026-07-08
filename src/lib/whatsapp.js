import { formatDateLongID, nightsBetween } from './format'

export function waLink(number, message) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

/** Template pesan booking per PRD F-04.2 */
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

export function generalMessage() {
  return 'Halo, saya ingin bertanya tentang Villa Tebing Buluh.'
}
