import { ref, watch } from 'vue'
import { signedProofUrl } from '../lib/storage'

/**
 * URL bertanda-tangan sementara untuk bukti bayar booking. `bookingRef` =
 * ref/computed ke booking (null/undefined = tak ada apa-apa dimuat). Dipakai
 * oleh BookingDetailView (halaman detail booking admin).
 */
export function useBookingProof(bookingRef) {
  const url = ref('')
  const loading = ref(false)
  const error = ref('')

  watch(
    bookingRef,
    async (booking) => {
      url.value = ''
      error.value = ''
      if (!booking?.payment_proof_url) return
      loading.value = true
      try {
        url.value = await signedProofUrl(booking.payment_proof_url)
      } catch (err) {
        error.value = 'Gagal memuat bukti: ' + (err?.message || err)
      } finally {
        loading.value = false
      }
    },
    { immediate: true },
  )

  return { url, loading, error }
}
