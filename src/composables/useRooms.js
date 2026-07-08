import { computed, ref } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { demoRooms } from '../data/demoData'

// State modul (dibagikan antar komponen) - kamar cukup dimuat sekali per sesi.
const rooms = ref([])
const loading = ref(false)
const error = ref(null)
let loadPromise = null

async function load() {
  loading.value = true
  error.value = null

  if (!isSupabaseConfigured) {
    rooms.value = demoRooms
    loading.value = false
    return
  }

  const { data, error: err } = await supabase
    .from('rooms')
    .select('*, room_images(image_url, is_primary, sort_order)')
    .eq('is_active', true)
    .order('price_per_night', { ascending: true })

  if (err) {
    // Saat development, jangan biarkan halaman kosong hanya karena
    // supabase/schema.sql belum dijalankan - pakai data demo.
    if (import.meta.env.DEV) {
      console.warn(
        '[useRooms] Gagal membaca tabel rooms - jalankan supabase/schema.sql di SQL Editor. Sementara memakai data demo.',
        err.message,
      )
      rooms.value = demoRooms
    } else {
      error.value = err
    }
  } else {
    rooms.value = data.map((room) => ({
      ...room,
      images: [...(room.room_images ?? [])]
        .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)
        .map((image) => ({ url: image.image_url, alt: `Foto kamar ${room.name}` })),
    }))
  }
  loading.value = false
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
