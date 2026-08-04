import { ref } from 'vue'
import { authApi } from '../lib/api'

const promos = ref([])
const loading = ref(false)
const error = ref(null)

export function useAdminPromos() {
  async function fetchPromos() {
    loading.value = promos.value.length === 0
    error.value = null
    try {
      promos.value = await authApi.get('/promos')
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  async function savePromo(form) {
    const { id, ...body } = form
    const res = id ? await authApi.put(`/promos/${id}`, body) : await authApi.post('/promos', body)
    await fetchPromos()
    return res.id
  }

  async function toggleActive(promo) {
    await authApi.patch(`/promos/${promo.id}/active`, { is_active: !promo.is_active })
    await fetchPromos()
  }

  async function deletePromo(id) {
    await authApi.del(`/promos/${id}`)
    await fetchPromos()
  }

  async function bulkDeletePromos(ids) {
    await authApi.post('/promos/bulk-delete', { ids })
    await fetchPromos()
  }

  return {
    promos,
    loading,
    error,
    fetchPromos,
    savePromo,
    toggleActive,
    deletePromo,
    bulkDeletePromos,
  }
}
