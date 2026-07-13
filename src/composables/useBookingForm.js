import { computed, ref, watch } from 'vue'
import { useBookings } from './useBookings'
import { nightsBetween } from '../lib/format'

const BLOCKING = ['pending', 'confirmed', 'checked_in']

const blank = () => ({
  id: undefined,
  room_id: '',
  guest_name: '',
  guest_phone: '',
  check_in: '',
  check_out: '',
  guest_count: 2,
  status: 'confirmed',
  total_price: null,
  notes: '',
})

/**
 * State & logika form booking admin (F-10). `bookingRef` = ref ke prop.booking
 * (null = baru, object = edit, undefined = tersembunyi); `roomsRef` = ref daftar kamar.
 */
export function useBookingForm(bookingRef, roomsRef, emit) {
  const { findConflict, saveBooking } = useBookings()

  const form = ref(blank())
  const totalTouched = ref(false)
  const saving = ref(false)
  const errorMsg = ref('')

  const isOpen = computed(() => bookingRef.value !== undefined)
  const isEdit = computed(() => Boolean(bookingRef.value?.id))

  watch(
    bookingRef,
    (booking) => {
      if (booking === undefined) return
      errorMsg.value = ''
      totalTouched.value = Boolean(booking?.total_price)
      form.value = booking
        ? { ...blank(), ...booking }
        : { ...blank(), room_id: roomsRef.value[0]?.id ?? '' }
    },
    { immediate: true },
  )

  const selectedRoom = computed(() => roomsRef.value.find((r) => r.id === form.value.room_id))
  const nights = computed(() =>
    form.value.check_in && form.value.check_out && form.value.check_out > form.value.check_in
      ? nightsBetween(form.value.check_in, form.value.check_out)
      : 0,
  )

  // Auto-hitung total dari harga kamar × malam, kecuali admin mengubah manual.
  watch([selectedRoom, nights], () => {
    if (!totalTouched.value && selectedRoom.value && nights.value > 0) {
      form.value.total_price = selectedRoom.value.price_per_night * nights.value
    }
  })

  function markTotalTouched() {
    totalTouched.value = true
  }

  async function onSubmit() {
    errorMsg.value = ''
    const f = form.value
    if (!f.room_id || !f.guest_name.trim() || !f.guest_phone.trim() || !f.check_in || !f.check_out) {
      errorMsg.value = 'Kamar, nama tamu, nomor WA, dan tanggal wajib diisi.'
      return
    }
    if (f.check_out <= f.check_in) {
      errorMsg.value = 'Tanggal check-out harus setelah check-in.'
      return
    }
    saving.value = true
    try {
      // Anti double-booking (F-10.3) — hanya jika status menahan tanggal.
      if (BLOCKING.includes(f.status)) {
        const conflict = await findConflict({
          roomId: f.room_id,
          checkIn: f.check_in,
          checkOut: f.check_out,
          ignoreId: f.id ?? null,
        })
        if (conflict) {
          errorMsg.value = `Tanggal bentrok dengan booking lain (${conflict.guest_name ?? 'tamu'}) di kamar ini.`
          saving.value = false
          return
        }
      }
      await saveBooking({
        id: f.id,
        room_id: f.room_id,
        guest_name: f.guest_name.trim(),
        guest_phone: f.guest_phone.trim(),
        check_in: f.check_in,
        check_out: f.check_out,
        guest_count: Number(f.guest_count) || 1,
        status: f.status,
        total_price: f.total_price ? Number(f.total_price) : null,
        notes: f.notes?.trim() || null,
      })
      emit('saved')
    } catch (err) {
      errorMsg.value = 'Gagal menyimpan: ' + (err?.message || err)
    } finally {
      saving.value = false
    }
  }

  return { form, saving, errorMsg, isOpen, isEdit, nights, markTotalTouched, onSubmit }
}
