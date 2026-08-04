// ============================================================================
// Mesin harga menginap + promo — SATU sumber kebenaran, dipakai dua sisi:
//
//   server/routes/bookings.js  -> OTORITAS. Total yang benar-benar disimpan.
//   src/composables/usePromoPricing.js -> hanya untuk MENAMPILKAN estimasi.
//
// Karena keduanya menjalankan kode yang sama persis, angka di layar tamu tidak
// akan pernah berbeda dari angka yang ditagihkan. Modul ini sengaja murni:
// tidak menyentuh database, jaringan, maupun jam sistem (tanggal "hari ini"
// selalu dikirim pemanggil), supaya bisa diimpor Node maupun bundler browser.
//
// Folder shared/ HARUS ikut terunggah saat deploy — server/index.js tidak bisa
// start tanpanya (lihat README, bagian Deploy).
// ============================================================================

/** Tipe diskon yang dikenal. `fixed_price` = harga khusus per malam. */
export const PROMO_TYPES = ['percent', 'fixed_price']

/**
 * Daftar tanggal MALAM dari sebuah masa inap: check-in sampai check-out - 1.
 * Menginap 18 -> 22 Agustus berarti malam 18, 19, 20, 21 (4 malam); tanggal
 * check-out tidak pernah dihitung karena tamu sudah pulang pagi itu.
 */
export function stayNights(checkIn, checkOut) {
  const out = []
  const [y, m, d] = checkIn.split('-').map(Number)
  const cursor = new Date(Date.UTC(y, m - 1, d))
  // UTC dipakai supaya penambahan hari tidak pernah tergelincir oleh DST atau
  // zona waktu server — di sini tanggal murni label, bukan titik waktu.
  while (true) {
    const iso = cursor.toISOString().slice(0, 10)
    if (iso >= checkOut) break
    out.push(iso)
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return out
}

/**
 * Apakah `promo` menyentuh satu malam di kamar tertentu?
 *
 * `end_date` bersifat INKLUSIF: promo "10-20 Agustus" ikut memberi harga promo
 * untuk malam 20 Agustus. Ini bentuk yang paling sesuai dengan cara admin
 * menuliskan periode promo di materi pemasaran.
 */
export function promoAppliesTo(promo, roomId, nightISO) {
  if (!promo?.is_active) return false
  if (nightISO < promo.start_date || nightISO > promo.end_date) return false
  if (promo.applies_to_all) return true
  return Array.isArray(promo.room_ids) && promo.room_ids.includes(roomId)
}

/** Harga satu malam bila `promo` diterapkan ke harga normal `basePrice`. */
export function promoNightPrice(basePrice, promo) {
  if (promo.discount_type === 'percent') {
    return Math.round(basePrice * (1 - Number(promo.discount_value) / 100))
  }
  return Math.round(Number(promo.discount_value))
}

/**
 * Harga satu malam setelah mempertimbangkan SEMUA promo yang berlaku.
 *
 * Bila beberapa promo menutupi malam yang sama, yang dipakai adalah yang
 * paling murah bagi tamu. Aturan "ambil termurah" ini juga otomatis menjaga
 * promo tidak pernah menaikkan harga: harga normal ikut jadi kandidat, jadi
 * promo harga-tetap yang keliru diisi di atas harga normal tidak berefek.
 */
export function priceForNight(basePrice, roomId, nightISO, promos = []) {
  let best = { price: basePrice, promo: null }
  for (const promo of promos) {
    if (!promoAppliesTo(promo, roomId, nightISO)) continue
    const price = promoNightPrice(basePrice, promo)
    if (price < best.price) best = { price, promo }
  }
  return best
}

/**
 * Hitung rincian harga satu masa inap, malam per malam.
 *
 * Perhitungannya PRORATA: hanya malam yang jatuh di dalam periode promo yang
 * mendapat harga promo, malam lain tetap harga normal. Tamu yang menginap
 * melewati batas periode jadi membayar campuran keduanya.
 *
 * Mengembalikan:
 *   nights     jumlah malam
 *   lines      [{ date, price, basePrice, promo }] satu entri per malam
 *   baseTotal  total bila tanpa promo sama sekali
 *   total      total yang harus dibayar
 *   discount   selisih keduanya (0 bila tak ada promo)
 *   applied    daftar promo unik yang benar-benar terpakai
 */
export function computeStay({ room, checkIn, checkOut, promos = [] }) {
  const basePrice = Number(room?.price_per_night) || 0
  const dates = stayNights(checkIn, checkOut)

  const lines = dates.map((date) => {
    const { price, promo } = priceForNight(basePrice, room.id, date, promos)
    return { date, price, basePrice, promo }
  })

  const baseTotal = basePrice * dates.length
  const total = lines.reduce((sum, line) => sum + line.price, 0)

  const applied = []
  for (const line of lines) {
    if (line.promo && !applied.some((p) => p.id === line.promo.id)) applied.push(line.promo)
  }

  return { nights: dates.length, lines, baseTotal, total, discount: baseTotal - total, applied }
}

/**
 * Promo yang layak disorot di kartu/detail kamar SAAT TAMU BELUM MEMILIH
 * TANGGAL. Mengutamakan promo yang sedang berjalan hari ini; kalau tidak ada,
 * jatuh ke promo terdekat yang akan datang supaya tetap bisa dipromosikan.
 *
 * Mengembalikan { promo, price, running } atau null bila kamar tidak punya
 * promo yang masih relevan. `running` false = promo baru mulai nanti.
 */
export function roomPromoHighlight(room, promos = [], todayISO) {
  const basePrice = Number(room?.price_per_night) || 0

  const relevant = promos.filter(
    (p) =>
      p.is_active &&
      p.end_date >= todayISO &&
      (p.applies_to_all || (Array.isArray(p.room_ids) && p.room_ids.includes(room.id))) &&
      promoNightPrice(basePrice, p) < basePrice,
  )
  if (relevant.length === 0) return null

  const running = relevant.filter((p) => p.start_date <= todayISO)
  if (running.length > 0) {
    const promo = running.reduce((a, b) =>
      promoNightPrice(basePrice, b) < promoNightPrice(basePrice, a) ? b : a,
    )
    return { promo, price: promoNightPrice(basePrice, promo), running: true }
  }

  const promo = relevant.reduce((a, b) => (b.start_date < a.start_date ? b : a))
  return { promo, price: promoNightPrice(basePrice, promo), running: false }
}

/** Label ringkas potongan sebuah promo, mis. "Diskon 20%". */
export function promoDiscountLabel(promo) {
  if (promo.discount_type === 'percent') {
    // Buang nol desimal: 20.00 -> "20", 12.50 -> "12,5" (gaya angka Indonesia).
    const value = String(Number(promo.discount_value)).replace('.', ',')
    return `Diskon ${value}%`
  }
  return 'Harga khusus'
}
