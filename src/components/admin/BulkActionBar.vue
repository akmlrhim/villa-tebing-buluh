<script setup>
import IconGlyph from '../IconGlyph.vue'
import { btnGhost } from '../../lib/ui'

// Toolbar aksi massal (muncul saat ada item tercentang). Dipakai di
// Kelola Booking, Kelola Kamar, dan Kelola Galeri.
defineProps({
  count: { type: Number, default: 0 },
  itemLabel: { type: String, default: 'item' },
})
const emit = defineEmits(['cancel', 'delete'])
</script>

<template>
  <div v-if="count > 0"
    class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 px-4 py-3">
    <p class="text-sm font-medium text-ink">{{ count }} {{ itemLabel }} dipilih</p>
    <div class="flex items-center gap-2">
      <button type="button" :class="btnGhost" @click="emit('cancel')">Batal</button>
      <button type="button"
        class="inline-flex h-10.5 items-center gap-2 rounded-sm bg-error px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        @click="emit('delete')">
        <IconGlyph name="trash" class="h-4.5 w-4.5" /> Hapus Terpilih
      </button>
    </div>
  </div>
</template>
