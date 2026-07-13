import { ref } from 'vue'
import { supabase } from '../lib/supabase'

// CRUD galeri publik untuk admin (bebas unggah multi-foto, tanpa kategori).
const images = ref([])
const loading = ref(false)
const error = ref(null)

export function useAdminGallery() {
  async function fetchGallery() {
    loading.value = images.value.length === 0
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('gallery_images')
        .select('*')
        .order('sort_order', { ascending: true })
      if (err) throw err
      images.value = data
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  /** `urls`: array of public URL string hasil upload. */
  async function addImages(urls) {
    const startOrder = images.value.length
    const rows = urls.map((url, i) => ({ image_url: url, sort_order: startOrder + i }))
    const { error: err } = await supabase.from('gallery_images').insert(rows)
    if (err) throw err
    await fetchGallery()
  }

  async function deleteImage(id) {
    const { error: err } = await supabase.from('gallery_images').delete().eq('id', id)
    if (err) throw err
    await fetchGallery()
  }

  return { images, loading, error, fetchGallery, addImages, deleteImage }
}
