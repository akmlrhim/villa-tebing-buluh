import { ref } from 'vue'
import { api } from '../lib/api'
import { demoGallery } from '../data/demoData'

const images = ref([])
const loading = ref(false)
const error = ref(null)
let loadPromise = null

async function load() {
  loading.value = true
  error.value = null

  try {
    const rows = await api.get('/gallery')
    images.value = rows.map((row) => ({
      url: row.image_url,
      alt: row.alt || 'Foto galeri Villa Tebing Buluh',
    }))
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(
        '[useGallery] Gagal memuat /api/gallery - jalankan `npm run server` dan impor server/schema.sql. Sementara memakai data demo.',
        err.message,
      )
      images.value = demoGallery
    } else {
      error.value = err
    }
  } finally {
    loading.value = false
  }
}

export function useGallery() {
  function fetchGallery() {
    if (!loadPromise) loadPromise = load()
    return loadPromise
  }

  return { images, loading, error, fetchGallery }
}
