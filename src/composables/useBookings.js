import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export function useBookings() {
  const bookings = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function createBooking(booking) {
    const { data, error: err } = await supabase.from('bookings').insert(booking).select().single()
    if (err) throw err
    return data
  }

  // Admin only (requires authenticated session, enforced by RLS)
  async function fetchBookings() {
    loading.value = true
    error.value = null
    const { data, error: err } = await supabase
      .from('bookings')
      .select('*, rooms(name, slug)')
      .order('created_at', { ascending: false })
    if (err) error.value = err
    else bookings.value = data
    loading.value = false
  }

  async function updateBookingStatus(id, status) {
    const { data, error: err } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    return data
  }

  return { bookings, loading, error, createBooking, fetchBookings, updateBookingStatus }
}
