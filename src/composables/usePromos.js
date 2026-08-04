import { ref } from 'vue'
import { api } from '../lib/api'
import { computeStay, roomPromoHighlight } from '../../shared/pricing'
import { todayISO } from '../lib/format'

const promos = ref([])
let loadPromise = null

async function load() {
  try {
    promos.value = await api.get('/promos/active')
  } catch {
    promos.value = []
  }
}

const EMPTY_STAY = { nights: 0, lines: [], baseTotal: 0, total: 0, discount: 0, applied: [] }

export function usePromos() {
  function fetchPromos() {
    if (!loadPromise) loadPromise = load()
    return loadPromise
  }

  function stayPrice(room, checkIn, checkOut) {
    if (!room || !checkIn || !checkOut || checkOut <= checkIn) return EMPTY_STAY
    return computeStay({ room, checkIn, checkOut, promos: promos.value })
  }

  function promoHighlight(room) {
    return room ? roomPromoHighlight(room, promos.value, todayISO()) : null
  }

  return { promos, fetchPromos, stayPrice, promoHighlight }
}
