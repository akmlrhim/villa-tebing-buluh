<script setup>
import { onBeforeUnmount, ref } from 'vue'
import IconGlyph from '../IconGlyph.vue'

// Dropzone + pratinjau bukti pembayaran. Mengelola object URL & validasi
// tipe/ukuran sendiri; file terpilih diekspos lewat v-model:file.
const props = defineProps({
  file: { type: Object, default: null },
  invalid: { type: Boolean, default: false }, // ditandai wajib oleh induk saat submit
})
const emit = defineEmits(['update:file'])

const preview = ref('')
const error = ref('')

const PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const PROOF_MAX = 5 * 1024 * 1024

function setProof(file) {
  if (!file) return
  if (!PROOF_TYPES.includes(file.type)) {
    error.value = 'Format harus gambar JPG, PNG, atau WebP.'
    return
  }
  if (file.size > PROOF_MAX) {
    error.value = 'Ukuran file maksimal 5 MB.'
    return
  }
  error.value = ''
  if (preview.value) URL.revokeObjectURL(preview.value)
  preview.value = URL.createObjectURL(file)
  emit('update:file', file)
}

function onChange(event) {
  setProof(event.target.files?.[0])
  event.target.value = '' // Reset supaya file sama bisa dipilih ulang.
}

function remove() {
  if (preview.value) URL.revokeObjectURL(preview.value)
  preview.value = ''
  error.value = ''
  emit('update:file', null)
}

onBeforeUnmount(() => {
  if (preview.value) URL.revokeObjectURL(preview.value)
})
</script>

<template>
  <div>
    <span class="text-sm font-medium text-ink">Bukti pembayaran</span>

    <label v-if="!file" for="bukti"
      class="mt-1.5 flex cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-border-strong bg-surface-soft px-4 py-7 text-center transition-colors hover:border-primary"
      @dragover.prevent @drop.prevent="setProof($event.dataTransfer.files?.[0])">
      <span class="grid h-11 w-11 place-items-center rounded-full bg-canvas shadow-float">
        <IconGlyph name="upload" class="h-5 w-5 text-primary" />
      </span>
      <span class="text-sm font-medium text-ink">Pilih atau seret gambar ke sini</span>
      <span class="text-xs text-muted">Screenshot bukti pembayaran - JPG, PNG, atau WebP, maks. 5 MB</span>
    </label>
    <input id="bukti" type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" @change="onChange" />

    <div v-if="file" class="mt-1.5 flex items-center gap-3.5 rounded-md border border-hairline bg-surface-soft p-3">
      <img :src="preview" alt="Pratinjau bukti pembayaran"
        class="h-16 w-16 shrink-0 rounded-sm border border-hairline bg-white object-cover" />
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-medium text-ink">{{ file.name }}</p>
        <p class="mt-0.5 text-xs text-muted">{{ (file.size / 1024 / 1024).toFixed(2) }} MB</p>
      </div>
      <button type="button" title="Hapus bukti"
        class="grid size-9.5 shrink-0 place-items-center rounded-sm text-muted transition-colors hover:bg-surface-strong hover:text-error"
        @click="remove">
        <IconGlyph name="trash" class="h-4.5 w-4.5" />
      </button>
    </div>

    <p v-if="error" class="mt-1.5 text-xs text-error">{{ error }}</p>
    <p v-else-if="invalid" class="mt-1.5 text-xs text-error">Unggah screenshot bukti pembayaranmu.</p>
  </div>
</template>
