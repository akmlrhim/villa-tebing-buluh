import { ref } from 'vue'
import { api } from '../lib/api'
import { demoBookings } from '../data/demoData'
import { addDaysISO, nightsBetween, todayISO } from '../lib/format'

const occupancies = ref([])
const loading = ref(false)
const error = ref(null)
let loadPromise = null

async function load() {
  loading.value = true
  error.value = null

  try {
    occupancies.value = await api.get('/bookings/availability')
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(
        '[useAvailability] Gagal memuat /api/bookings/availability - jalankan `npm run server`. Sementara memakai data demo.',
        err.message,
      )
      occupancies.value = demoBookings
    } else {
      error.value = err
    }
  } finally {
    loading.value = false
  }
}

function overlaps(row, checkIn, checkOut) {
  return row.check_in < checkOut && row.check_out > checkIn
}

export function useAvailability() {
  function fetchAvailability({ refresh = false } = {}) {
    if (!loadPromise || refresh) loadPromise = load()
    return loadPromise
  }

  function isRoomAvailable(roomId, checkIn, checkOut) {
    return !occupancies.value.some(
      (row) => row.room_id === roomId && overlaps(row, checkIn, checkOut),
    )
  }

  function occupiedNights(roomId) {
    const nights = new Set()
    for (const row of occupancies.value) {
      if (row.room_id !== roomId) continue
      const count = nightsBetween(row.check_in, row.check_out)
      for (let i = 0; i < count; i++) nights.add(addDaysISO(row.check_in, i))
    }
    return nights
  }

  function fullyOccupiedNights(roomIds, monthsAhead = 5) {
    const nights = new Set()
    if (!roomIds.length) return nights

    const perRoom = roomIds.map((id) => occupiedNights(id))
    const end = addDaysISO(todayISO(), monthsAhead * 31)
    for (let iso = todayISO(); iso < end; iso = addDaysISO(iso, 1)) {
      if (perRoom.every((set) => set.has(iso))) nights.add(iso)
    }
    return nights
  }

  return {
    occupancies,
    loading,
    error,
    fetchAvailability,
    isRoomAvailable,
    occupiedNights,
    fullyOccupiedNights,
  }
}
