<script setup>
import IconGlyph from './IconGlyph.vue'
import { btnDanger, btnGhost } from '../lib/ui'

// Dialog konfirmasi generik (mis. hapus). Pesan diisi lewat slot default.
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  confirmLabel: { type: String, default: 'Hapus' },
  confirmIcon: { type: String, default: 'trash' },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 grid place-items-center p-4">
    <div class="absolute inset-0 bg-black/50" @click="emit('cancel')" />
    <div class="relative w-full max-w-sm rounded-md bg-canvas p-6 shadow-float">
      <h2 class="font-sans text-lg font-semibold text-ink">{{ title }}</h2>
      <p class="mt-2 text-sm text-muted"><slot /></p>
      <div class="mt-5 flex justify-end gap-3">
        <button type="button" :class="btnGhost" @click="emit('cancel')">Batal</button>
        <button type="button" :class="btnDanger" :disabled="busy" @click="emit('confirm')">
          <IconGlyph :name="confirmIcon" class="h-5 w-5" />
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>
