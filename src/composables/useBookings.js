import { ref } from 'vue'
import { supabase } from '../lib/supabase'

// Booking (F-10). createPublicBooking (via RPC) dipakai publik; sisanya admin-only.
const bookings = ref([])
const loading = ref(false)
const error = ref(null)

// Status yang "menahan" tanggal (dipakai untuk cek double-booking / ketersediaan).
const BLOCKING = ['pending', 'confirmed', 'checked_in']

/** '[a,b)' beririsan '[c,d)'? Perbandingan string ISO aman untuk tanggal. */
function overlaps(aIn, aOut, bIn, bOut) {
  return aIn < bOut && aOut > bIn
}

export function useBookings() {
  /**
   * Cek bentrok tanggal untuk satu kamar (F-10.3). `ignoreId` melewati booking
   * yang sedang diedit. Mengembalikan booking yang bentrok, atau null.
   */
  async function findConflict({ roomId, checkIn, checkOut, ignoreId = null }) {
    const { data: rows, error: err } = await supabase
      .from('bookings')
      .select('id, check_in, check_out, status, guest_name')
      .eq('room_id', roomId)
    if (err) throw err
    return (
      rows.find(
        (b) =>
          b.id !== ignoreId &&
          BLOCKING.includes(b.status) &&
          overlaps(checkIn, checkOut, b.check_in, b.check_out),
      ) ?? null
    )
  }

  /**
   * Cek bentrok tanggal dari sisi publik. Anon tidak boleh membaca tabel
   * bookings (data pribadi tamu), jadi lewat view public_availability yang
   * sudah terfilter ke status BLOCKING dan hanya berisi room_id + tanggal.
   */
  async function hasPublicConflict({ roomId, checkIn, checkOut }) {
    const { data: rows, error: err } = await supabase
      .from('public_availability')
      .select('check_in, check_out')
      .eq('room_id', roomId)
    if (err) throw err
    return rows.some((b) => overlaps(checkIn, checkOut, b.check_in, b.check_out))
  }

  /**
   * Booking publik (anon) lewat RPC SECURITY DEFINER: validasi & hitung harga
   * di server, paksa status 'pending', cek bentrok atomik. Mengembalikan id
   * booking. Anon tidak lagi punya INSERT langsung ke tabel bookings.
   */
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
    const { data, error: err } = await supabase.rpc('create_public_booking', {
      p_room_id: roomId,
      p_guest_name: guestName,
      p_guest_phone: guestPhone,
      p_check_in: checkIn,
      p_check_out: checkOut,
      p_guest_count: guestCount,
      p_notes: notes ?? null,
      p_payment_proof_path: paymentProofPath,
    })
    if (err) throw err
    return data // uuid booking
  }

  async function fetchBookings() {
    // Skeleton hanya saat muat pertama; refetch setelah aksi berjalan diam-diam
    // supaya daftar tidak diganti skeleton (bikin scroll lompat ke atas).
    loading.value = bookings.value.length === 0
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('bookings')
        .select('*, rooms(name, slug)')
        .order('check_in', { ascending: false })
      if (err) throw err
      bookings.value = data
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  async function saveBooking(form) {
    const { id, ...fields } = form
    if (id) {
      const { error: err } = await supabase.from('bookings').update(fields).eq('id', id)
      if (err) throw err
    } else {
      const { error: err } = await supabase.from('bookings').insert(fields)
      if (err) throw err
    }
    await fetchBookings()
  }

  async function updateBookingStatus(id, status) {
    const { error: err } = await supabase.from('bookings').update({ status }).eq('id', id)
    if (err) throw err
    await fetchBookings()
  }

  async function deleteBooking(id) {
    const { error: err } = await supabase.from('bookings').delete().eq('id', id)
    if (err) throw err
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
  }
}
