import { ref } from 'vue'
import { api, authApi } from '../lib/api'

const bookings = ref([])
const loading = ref(false)
const error = ref(null)

const BLOCKING = ['pending', 'confirmed', 'checked_in']

function overlaps(aIn, aOut, bIn, bOut) {
  return aIn < bOut && aOut > bIn
}

export function useBookings() {
  async function findConflict({ roomId, checkIn, checkOut, ignoreId = null }) {
    const rows = await authApi.get('/bookings')
    return (
      rows.find(
        (b) =>
          b.room_id === roomId &&
          b.id !== ignoreId &&
          BLOCKING.includes(b.status) &&
          overlaps(checkIn, checkOut, b.check_in, b.check_out),
      ) ?? null
    )
  }

  async function hasPublicConflict({ roomId, checkIn, checkOut }) {
    const rows = await api.get('/bookings/availability')
    return rows.some(
      (b) => b.room_id === roomId && overlaps(checkIn, checkOut, b.check_in, b.check_out),
    )
  }

  async function createPublicBooking({
    roomId,
    guestName,
    guestPhone,
    checkIn,
    checkOut,
    guestCount,
    notes,
    paymentProofPath,
  }) {
    const { id } = await api.post('/bookings/public', {
      room_id: roomId,
      guest_name: guestName,
      guest_phone: guestPhone,
      check_in: checkIn,
      check_out: checkOut,
      guest_count: guestCount,
      notes: notes ?? null,
      payment_proof_path: paymentProofPath,
    })
    return id
  }

  async function fetchBookings() {
    loading.value = bookings.value.length === 0
    error.value = null
    try {
      bookings.value = await authApi.get('/bookings')
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  async function saveBooking(form) {
    const { id, ...fields } = form
    if (id) {
      await authApi.put(`/bookings/${id}`, fields)
    } else {
      await authApi.post('/bookings', fields)
    }
    await fetchBookings()
  }

  async function updateBookingStatus(id, status) {
    await authApi.patch(`/bookings/${id}/status`, { status })
    await fetchBookings()
  }

  async function deleteBooking(id) {
    await authApi.del(`/bookings/${id}`)
    await fetchBookings()
  }

  async function bulkDeleteBookings(ids) {
    await authApi.post('/bookings/bulk-delete', { ids })
    await fetchBookings()
  }

  return {
    bookings,
    loading,
    error,
    findConflict,
    hasPublicConflict,
    createPublicBooking,
    fetchBookings,
    saveBooking,
    updateBookingStatus,
    deleteBooking,
    bulkDeleteBookings,
  }
}
