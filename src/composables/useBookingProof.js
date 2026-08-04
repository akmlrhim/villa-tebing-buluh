import { ref, watch } from 'vue'
import { signedProofUrl } from '../lib/storage'
import { friendlyDbError } from '../lib/api'

export function useBookingProof(bookingRef) {
  const url = ref('')
  const loading = ref(false)
  const error = ref('')

  watch(
    bookingRef,
    async (booking) => {
      url.value = ''
      error.value = ''
      if (!booking?.id || !booking.payment_proof_url) return
      loading.value = true
      try {
        url.value = await signedProofUrl(booking.id)
      } catch (err) {
        error.value = 'Gagal memuat bukti: ' + friendlyDbError(err)
      } finally {
        loading.value = false
      }
    },
    { immediate: true },
  )

  return { url, loading, error }
}
