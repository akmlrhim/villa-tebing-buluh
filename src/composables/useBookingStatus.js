import { ref } from 'vue'
import { api, friendlyDbError } from '../lib/api'

export function useBookingStatus() {
  const result = ref(null)
  const loading = ref(false)
  const error = ref('')
  const notFound = ref(false)

  async function checkStatus(code, phone) {
    loading.value = true
    error.value = ''
    notFound.value = false
    result.value = null

    try {
      const data = await api.post('/bookings/status', { code: code.trim(), phone })
      if (data.found) {
        result.value = data.booking
      } else {
        notFound.value = true
      }
    } catch (err) {
      error.value = 'Gagal memeriksa status: ' + friendlyDbError(err)
    } finally {
      loading.value = false
    }
  }

  function reset() {
    result.value = null
    notFound.value = false
    error.value = ''
  }

  return { result, loading, error, notFound, checkStatus, reset }
}
