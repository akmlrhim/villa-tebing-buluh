import { ref } from 'vue'
import { api, authApi } from '../lib/api'

const images = ref([])
const loading = ref(false)
const error = ref(null)

export function useAdminGallery() {
  async function fetchGallery() {
    loading.value = images.value.length === 0
    error.value = null
    try {
      images.value = await api.get('/gallery')
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  async function addImages(urls) {
    await authApi.post('/gallery', { urls })
    await fetchGallery()
  }

  async function deleteImage(id) {
    await authApi.del(`/gallery/${id}`)
    await fetchGallery()
  }

  async function bulkDeleteImages(ids) {
    await authApi.post('/gallery/bulk-delete', { ids })
    await fetchGallery()
  }

  return { images, loading, error, fetchGallery, addImages, deleteImage, bulkDeleteImages }
}
