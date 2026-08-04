import { computed, ref, watch } from 'vue'
import { useAdminRooms } from './useAdminRooms'
import { uploadRoomImage } from '../lib/storage'
import { friendlyDbError } from '../lib/api'

const blank = () => ({
  id: undefined,
  name: '',
  slug: '',
  description: '',
  price_per_night: null,
  min_nights: 1,
  max_guests: 2,
  size_sqm: null,
  bed_count: 1,
  bed_type: '',
  amenities: [],
  is_active: true,
  images: [],
})

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function useRoomForm(roomRef, emit) {
  const { saveRoom } = useAdminRooms()

  const form = ref(blank())
  const amenityInput = ref('')
  const uploading = ref(false)
  const saving = ref(false)
  const errorMsg = ref('')

  const isOpen = computed(() => roomRef.value !== undefined)
  const isEdit = computed(() => Boolean(roomRef.value?.id))

  watch(
    roomRef,
    (room) => {
      if (room === undefined) return
      errorMsg.value = ''
      amenityInput.value = ''
      form.value = room
        ? {
            ...blank(),
            ...room,
            amenities: [...(room.amenities ?? [])],
            images: (room.images ?? []).map((img) => ({ url: img.url, is_primary: img.is_primary })),
          }
        : blank()
    },
    { immediate: true },
  )

  watch(
    () => form.value.name,
    (name) => {
      form.value.slug = slugify(name)
    },
  )

  function addAmenity() {
    const value = amenityInput.value.trim()
    if (value && !form.value.amenities.includes(value)) form.value.amenities.push(value)
    amenityInput.value = ''
  }
  function removeAmenity(i) {
    form.value.amenities.splice(i, 1)
  }

  async function onFiles(event) {
    const files = [...event.target.files]
    event.target.value = ''
    if (!files.length) return
    uploading.value = true
    errorMsg.value = ''
    try {
      for (const file of files) {
        const url = await uploadRoomImage(file)
        form.value.images.push({ url, is_primary: form.value.images.length === 0 })
      }
    } catch (err) {
      errorMsg.value = 'Gagal mengunggah foto: ' + friendlyDbError(err)
    } finally {
      uploading.value = false
    }
  }

  function setPrimary(i) {
    form.value.images.forEach((img, idx) => (img.is_primary = idx === i))
  }
  function removeImage(i) {
    const wasPrimary = form.value.images[i].is_primary
    form.value.images.splice(i, 1)
    if (wasPrimary && form.value.images.length) form.value.images[0].is_primary = true
  }

  async function onSubmit() {
    errorMsg.value = ''
    if (!form.value.name.trim() || !form.value.price_per_night) {
      errorMsg.value = 'Nama dan harga per malam wajib diisi.'
      return
    }
    if (!form.value.slug.trim()) form.value.slug = slugify(form.value.name)
    saving.value = true
    try {
      await saveRoom({
        id: form.value.id,
        name: form.value.name.trim(),
        slug: form.value.slug.trim(),
        description: form.value.description?.trim() || null,
        price_per_night: Number(form.value.price_per_night),
        min_nights: Number(form.value.min_nights) || 1,
        max_guests: Number(form.value.max_guests) || 1,
        size_sqm: form.value.size_sqm ? Number(form.value.size_sqm) : null,
        bed_count: Number(form.value.bed_count) || 1,
        bed_type: form.value.bed_type?.trim() || null,
        amenities: form.value.amenities,
        is_active: form.value.is_active,
        images: form.value.images,
      })
      emit('saved')
    } catch (err) {
      errorMsg.value = 'Gagal menyimpan: ' + friendlyDbError(err)
    } finally {
      saving.value = false
    }
  }

  return {
    form,
    amenityInput,
    uploading,
    saving,
    errorMsg,
    isOpen,
    isEdit,
    addAmenity,
    removeAmenity,
    onFiles,
    setPrimary,
    removeImage,
    onSubmit,
  }
}
