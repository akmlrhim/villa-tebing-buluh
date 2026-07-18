import { ref } from 'vue'
import { supabase, isSupabaseConfigured, friendlyDbError } from '../lib/supabase'

/**
 * Cek status booking publik (halaman /cek-booking) lewat RPC SECURITY DEFINER
 * get_booking_status: cocokkan kode booking + nomor WA, tanpa perlu akses
 * langsung ke tabel bookings dari sisi anon.
 */
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

    if (!isSupabaseConfigured) {
      error.value = 'Cek status booking belum tersedia di mode demo.'
      loading.value = false
      return
    }

    try {
      const { data, error: err } = await supabase.rpc('get_booking_status', {
        p_code: code.trim(),
        p_phone: phone,
      })
      if (err) throw err
      if (!data?.length) {
        notFound.value = true
      } else {
        result.value = data[0]
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
