import { ref } from 'vue'
import { authApi } from '../lib/api'

const rooms = ref([])
const loading = ref(false)
const error = ref(null)

export function useAdminRooms() {
  async function fetchRooms() {
    loading.value = rooms.value.length === 0
    error.value = null
    try {
      rooms.value = await authApi.get('/rooms/admin')
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  async function saveRoom(form) {
    const { id, ...body } = form
    const res = id ? await authApi.put(`/rooms/${id}`, body) : await authApi.post('/rooms', body)
    await fetchRooms()
    return res.id
  }

  async function toggleActive(room) {
    await authApi.patch(`/rooms/${room.id}/active`, { is_active: !room.is_active })
    await fetchRooms()
  }

  async function deleteRoom(id) {
    await authApi.del(`/rooms/${id}`)
    await fetchRooms()
  }

  async function bulkDeleteRooms(ids) {
    await authApi.post('/rooms/bulk-delete', { ids })
    await fetchRooms()
  }

  return { rooms, loading, error, fetchRooms, saveRoom, toggleActive, deleteRoom, bulkDeleteRooms }
}
