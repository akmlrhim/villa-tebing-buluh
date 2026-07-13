import { ref } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { demoGallery } from '../data/demoData'

// Galeri publik: bebas unggah dari admin, tanpa kategori (F-05, disederhanakan).
const images = ref([])
const loading = ref(false)
const error = ref(null)
let loadPromise = null

async function load() {
  loading.value = true
  error.value = null

  if (!isSupabaseConfigured) {
    images.value = demoGallery
    loading.value = false
    return
  }

  const { data, error: err } = await supabase
    .from('gallery_images')
    .select('*')
    .order('sort_order', { ascending: true })

  if (err) {
    // Saat development, jangan biarkan halaman kosong hanya karena
    // supabase/migrate-gallery.sql belum dijalankan - pakai data demo.
    if (import.meta.env.DEV) {
      console.warn(
        '[useGallery] Gagal membaca tabel gallery_images - jalankan supabase/migrate-gallery.sql di SQL Editor. Sementara memakai data demo.',
        err.message,
      )
      images.value = demoGallery
    } else {
      error.value = err
    }
  } else {
    images.value = data.map((row) => ({
      url: row.image_url,
      alt: row.alt || 'Foto galeri Villa Tebing Buluh',
    }))
  }
  loading.value = false
}

export function useGallery() {
  function fetchGallery() {
    if (!loadPromise) loadPromise = load()
    return loadPromise
  }

  return { images, loading, error, fetchGallery }
}
