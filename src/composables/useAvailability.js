import { ref } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { demoBookings } from '../data/demoData'
import { addDaysISO, nightsBetween } from '../lib/format'

// Baris { room_id, check_in, check_out } dari view public_availability -
// tanpa data pribadi tamu (PRD F-03.6).
const occupancies = ref([])
const loading = ref(false)
const error = ref(null)
let loadPromise = null

async function load() {
  loading.value = true
  error.value = null

  if (!isSupabaseConfigured) {
    occupancies.value = demoBookings
    loading.value = false
    return
  }

  const { data, error: err } = await supabase
    .from('public_availability')
    .select('room_id, check_in, check_out')

  if (err) {
    if (import.meta.env.DEV) {
      console.warn(
        '[useAvailability] Gagal membaca public_availability - jalankan supabase/schema.sql. Sementara memakai data demo.',
        err.message,
      )
      occupancies.value = demoBookings
    } else {
      error.value = err
    }
  } else {
    occupancies.value = data
  }
  loading.value = false
}

/** Malam [check_in, check_out) beririsan - perbandingan string ISO aman untuk tanggal. */
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

  /** Set tanggal ISO yang malamnya sudah terisi untuk satu kamar (untuk kalender). */
  function occupiedNights(roomId) {
    const nights = new Set()
    for (const row of occupancies.value) {
      if (row.room_id !== roomId) continue
      const count = nightsBetween(row.check_in, row.check_out)
      for (let i = 0; i < count; i++) nights.add(addDaysISO(row.check_in, i))
    }
    return nights
  }

  return { occupancies, loading, error, fetchAvailability, isRoomAvailable, occupiedNights }
}
