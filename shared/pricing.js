
export const PROMO_TYPES = ['percent', 'nominal']

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export function stayNights(checkIn, checkOut) {
  const out = []
  const [y, m, d] = checkIn.split('-').map(Number)
  const cursor = new Date(Date.UTC(y, m - 1, d))
  while (true) {
    const iso = cursor.toISOString().slice(0, 10)
    if (iso >= checkOut) break
    out.push(iso)
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return out
}

export function promoAppliesTo(promo, roomId, nightISO) {
  if (!promo?.is_active) return false
  if (nightISO < promo.start_date || nightISO > promo.end_date) return false
  if (promo.applies_to_all) return true
  return Array.isArray(promo.room_ids) && promo.room_ids.includes(roomId)
}

export function promoNightPrice(basePrice, promo) {
  const value = Number(promo.discount_value)
  if (promo.discount_type === 'percent') {
    return Math.round(basePrice * (1 - value / 100))
  }
  return Math.max(0, Math.round(basePrice - value))
}

export function priceForNight(basePrice, roomId, nightISO, promos = []) {
  let best = { price: basePrice, promo: null }
  for (const promo of promos) {
    if (!promoAppliesTo(promo, roomId, nightISO)) continue
    const price = promoNightPrice(basePrice, promo)
    if (price < best.price) best = { price, promo }
  }
  return best
}

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

export function promoDiscountLabel(promo) {
  const value = Number(promo.discount_value)
  if (promo.discount_type === 'percent') {
    return `Diskon ${String(value).replace('.', ',')}%`
  }
  return `Diskon ${rupiah.format(value)}`
}
