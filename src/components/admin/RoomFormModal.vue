<script setup>
import { toRef } from 'vue'
import IconGlyph from '../IconGlyph.vue'
import RoomImageManager from './RoomImageManager.vue'
import AmenityTagsInput from './AmenityTagsInput.vue'
import { useRoomForm } from '../../composables/useRoomForm'
import { fieldClass, btnGhost, btnPrimary } from '../../lib/ui'

// Modal tambah/edit kamar (F-09). prop.room: null = tambah, object = edit,
// undefined = tersembunyi.
const props = defineProps({
  room: { type: Object, default: undefined },
})
const emit = defineEmits(['close', 'saved'])

const {
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
} = useRoomForm(toRef(props, 'room'), emit)
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    @keydown.esc="emit('close')">
    <div class="absolute inset-0 bg-black/50" @click="emit('close')" />

    <div
      class="relative flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-lg bg-canvas shadow-float sm:rounded-lg">
      <header class="flex items-center justify-between border-b border-hairline-soft px-5 py-4">
        <h2 class="font-sans text-lg font-semibold text-ink">{{ isEdit ? 'Edit Kamar' : 'Tambah Kamar' }}</h2>
        <button type="button" class="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-strong"
          aria-label="Tutup" @click="emit('close')">
          <IconGlyph name="x" class="h-5 w-5" />
        </button>
      </header>

      <form class="flex-1 space-y-5 overflow-y-auto px-5 py-5" @submit.prevent="onSubmit">
        <div v-if="errorMsg" class="flex items-start gap-2 rounded-sm bg-error/10 px-3 py-2.5 text-sm text-error"
          role="alert">
          <IconGlyph name="alert" class="mt-0.5 h-4 w-4 shrink-0" />
          <span>{{ errorMsg }}</span>
        </div>

        <div>
          <label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Nama kamar *</label>
          <input v-model="form.name" :class="fieldClass" placeholder="Masukkan nama kamar..." />
        </div>

        <div>
          <label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Deskripsi</label>
          <textarea v-model="form.description"
            class="min-h-21 w-full resize-y rounded-sm border border-hairline bg-canvas px-3.5 py-2.5 text-sm placeholder:text-sm leading-normal text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
            placeholder="Deskripsikan tempat" />
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Harga / malam (Rp) *</label>
            <input v-model="form.price_per_night" type="number" min="0" :class="fieldClass" placeholder="850000" />
          </div>
          <div>
            <label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Min. malam</label>
            <input v-model="form.min_nights" type="number" min="1" :class="fieldClass" />
          </div>
          <div>
            <label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Maks. tamu</label>
            <input v-model="form.max_guests" type="number" min="1" :class="fieldClass" />
          </div>
          <div>
            <label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Luas (m²)</label>
            <input v-model="form.size_sqm" type="number" min="0" :class="fieldClass" placeholder="28" />
          </div>
          <div>
            <label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Jumlah bed</label>
            <input v-model="form.bed_count" type="number" min="1" :class="fieldClass" />
          </div>
        </div>

        <div>
          <label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Tipe bed</label>
          <input v-model="form.bed_type" :class="fieldClass" placeholder="King / Queen" />
        </div>

        <AmenityTagsInput v-model="amenityInput" :amenities="form.amenities" @add="addAmenity"
          @remove="removeAmenity" />

        <RoomImageManager :images="form.images" :uploading="uploading" @files="onFiles" @set-primary="setPrimary"
          @remove="removeImage" />

        <label class="flex items-center gap-2.5">
          <input v-model="form.is_active" type="checkbox" class="h-4 w-4 accent-[var(--color-primary)]" />
          <span class="text-sm text-ink">Kamar aktif (tampil di situs publik)</span>
        </label>
      </form>

      <footer class="flex items-center justify-end gap-3 border-t border-hairline-soft px-5 py-4">
        <button type="button" :class="btnGhost" @click="emit('close')">Batal</button>
        <button type="button" :class="btnPrimary" :disabled="saving || uploading" @click="onSubmit">
          <IconGlyph name="save" class="h-5 w-5" />
          {{ saving ? 'Menyimpan…' : 'Simpan' }}
        </button>
      </footer>
    </div>
  </div>
</template>
