import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useRooms } from './useRooms'
import { nightsBetween, parseISODate } from '../lib/format'

const ISO = /^\d{4}-\d{2}-\d{2}$/

/**
 * Membaca & memvalidasi parameter booking dari query (?kamar,checkIn,checkOut,tamu)
 * halaman /pembayaran, lalu menurunkan kamar, jumlah malam, dan total harga.
 */
export function usePaymentBooking() {
  const route = useRoute()
  const { rooms, loading, roomBySlug } = useRooms()

  const params = computed(() => ({
    slug: route.query.kamar,
    checkIn: route.query.checkIn,
    checkOut: route.query.checkOut,
    guests: Number(route.query.tamu) || 0,
  }))

  const room = computed(() =>
    params.value.slug ? roomBySlug.value(params.value.slug) : undefined,
  )

  const datesValid = computed(() => {
    const { checkIn, checkOut } = params.value
    return (
      ISO.test(checkIn ?? '') &&
      ISO.test(checkOut ?? '') &&
      parseISODate(checkOut) > parseISODate(checkIn)
    )
  })

  const nights = computed(() =>
    datesValid.value ? nightsBetween(params.value.checkIn, params.value.checkOut) : 0,
  )
  const total = computed(() =>
    room.value ? room.value.price_per_night * nights.value : 0,
  )

  // Masih memuat data kamar (mis. refresh langsung di /pembayaran).
  const stillLoading = computed(() => loading.value || rooms.value.length === 0)
  const invalid = computed(
    () => !stillLoading.value && (!room.value || !datesValid.value || params.value.guests < 1),
  )

  return { params, room, datesValid, nights, total, stillLoading, invalid }
}
