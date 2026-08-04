import { computed, ref, watch } from 'vue'
import { useAdminPromos } from './useAdminPromos'
import { promoNightPrice } from '../../shared/pricing'
import { friendlyDbError } from '../lib/api'

const blank = () => ({
  id: undefined,
  name: '',
  description: '',
  discount_type: 'percent',
  discount_value: null,
  start_date: '',
  end_date: '',
  applies_to_all: true,
  room_ids: [],
  is_active: true,
})

export function usePromoForm(promoRef, roomsRef, emit) {
  const { savePromo } = useAdminPromos()

  const form = ref(blank())
  const saving = ref(false)
  const errorMsg = ref('')

  const isOpen = computed(() => promoRef.value !== undefined)
  const isEdit = computed(() => Boolean(promoRef.value?.id))

  watch(
    promoRef,
    (promo) => {
      if (promo === undefined) return
      errorMsg.value = ''
      form.value = promo
        ? {
            ...blank(),
            ...promo,
            description: promo.description ?? '',
            room_ids: [...(promo.room_ids ?? [])],
          }
        : blank()
    },
    { immediate: true },
  )

  function toggleRoom(roomId) {
    const ids = form.value.room_ids
    form.value.room_ids = ids.includes(roomId)
      ? ids.filter((id) => id !== roomId)
      : [...ids, roomId]
  }

  const affectedRooms = computed(() => {
    if (form.value.applies_to_all) return roomsRef.value
    return roomsRef.value.filter((room) => form.value.room_ids.includes(room.id))
  })

  const preview = computed(() => {
    const value = Number(form.value.discount_value)
    if (!Number.isFinite(value) || value <= 0) return []
    return affectedRooms.value.map((room) => {
      const base = Number(room.price_per_night)
      const price = promoNightPrice(base, {
        discount_type: form.value.discount_type,
        discount_value: value,
      })
      return { id: room.id, name: room.name, base, price, free: price <= 0 }
    })
  })

  async function onSubmit() {
    errorMsg.value = ''
    const f = form.value
    const value = Number(f.discount_value)

    if (!f.name.trim()) {
      errorMsg.value = 'Nama promo wajib diisi.'
      return
    }
    if (!Number.isFinite(value) || value <= 0) {
      errorMsg.value =
        f.discount_type === 'percent'
          ? 'Persentase diskon wajib diisi.'
          : 'Potongan rupiah per malam wajib diisi.'
      return
    }
    if (f.discount_type === 'percent' && value >= 100) {
      errorMsg.value = 'Diskon persen harus di bawah 100%.'
      return
    }
    if (!f.start_date || !f.end_date) {
      errorMsg.value = 'Tanggal mulai dan tanggal berakhir wajib diisi.'
      return
    }
    if (f.end_date < f.start_date) {
      errorMsg.value = 'Tanggal berakhir tidak boleh sebelum tanggal mulai.'
      return
    }
    if (!f.applies_to_all && f.room_ids.length === 0) {
      errorMsg.value = 'Pilih minimal satu kamar, atau centang "Semua kamar".'
      return
    }

    saving.value = true
    try {
      await savePromo({
        id: f.id,
        name: f.name.trim(),
        description: f.description?.trim() || null,
        discount_type: f.discount_type,
        discount_value: value,
        start_date: f.start_date,
        end_date: f.end_date,
        applies_to_all: f.applies_to_all,
        room_ids: f.applies_to_all ? [] : f.room_ids,
        is_active: f.is_active,
      })
      emit('saved')
    } catch (err) {
      errorMsg.value = 'Gagal menyimpan: ' + friendlyDbError(err)
    } finally {
      saving.value = false
    }
  }

  return { form, saving, errorMsg, isOpen, isEdit, toggleRoom, preview, onSubmit }
}
