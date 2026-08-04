import { computed, ref } from 'vue'
import { api } from '../lib/api'
import { demoRooms } from '../data/demoData'

const rooms = ref([])
const loading = ref(false)
const error = ref(null)
let loadPromise = null

async function load() {
  loading.value = true
  error.value = null

  try {
    rooms.value = await api.get('/rooms')
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(
        '[useRooms] Gagal memuat /api/rooms - jalankan `npm run server` dan impor server/schema.sql. Sementara memakai data demo.',
        err.message,
      )
      rooms.value = demoRooms
    } else {
      error.value = err
    }
  } finally {
    loading.value = false
  }
}

export function useRooms() {
  function fetchRooms() {
    if (!loadPromise) loadPromise = load()
    return loadPromise
  }

  const roomBySlug = computed(
    () => (slug) => rooms.value.find((room) => room.slug === slug),
  )

  return { rooms, loading, error, fetchRooms, roomBySlug }
}
