const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export function formatRupiah(value) {
  return rupiah.format(value)
}

/** 'YYYY-MM-DD' -> Date lokal (hindari pergeseran zona waktu dari parsing ISO murni) */
export function parseISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO() {
  return toISODate(new Date())
}

export function addDaysISO(iso, days) {
  const date = parseISODate(iso)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

export function nightsBetween(checkInISO, checkOutISO) {
  const ms = parseISODate(checkOutISO) - parseISODate(checkInISO)
  return Math.round(ms / 86400000)
}

/** '2026-07-10' -> 'Jum, 10 Jul 2026' */
export function formatDateID(iso, { weekday = true } = {}) {
  return parseISODate(iso).toLocaleDateString('id-ID', {
    ...(weekday ? { weekday: 'short' } : {}),
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** '2026-07-10' -> '10 Juli 2026' */
export function formatDateLongID(iso) {
  return parseISODate(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
