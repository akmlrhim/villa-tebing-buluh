
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { computeStay } from '../../shared/pricing.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const cases = JSON.parse(readFileSync(path.join(here, 'pricing-cases.json'), 'utf8'))

const results = cases.map(({ room, checkIn, checkOut, promos }) => {
  const stay = computeStay({ room, checkIn, checkOut, promos })
  return {
    nights: stay.nights,
    baseTotal: stay.baseTotal,
    total: stay.total,
    discount: stay.discount,
    applied: stay.applied.map((p) => p.id),
    lines: stay.lines.map((l) => ({ date: l.date, price: l.price, promo: l.promo?.id ?? null })),
  }
})

process.stdout.write(JSON.stringify(results))
