<script setup>
import IconGlyph from '../IconGlyph.vue'

// Grid foto galeri (tampilan admin). Presentasional; parent mengelola data & aksi.
defineProps({
  images: { type: Array, default: () => [] },
  busyId: { type: [String, Number], default: null },
  selectedIds: { type: Set, default: () => new Set() },
})
const emit = defineEmits(['delete', 'toggle'])
</script>

<template>
  <ul class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
    <li v-for="img in images" :key="img.id"
      class="group relative aspect-square overflow-hidden rounded-md border border-hairline bg-surface-strong">
      <img :src="img.image_url" :alt="img.alt || ''" loading="lazy" class="h-full w-full object-cover" />
      <div
        class="absolute inset-0 flex items-start justify-between bg-gradient-to-b from-black/55 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
        :class="selectedIds.has(img.id) && 'opacity-100'">
        <input type="checkbox" class="size-4 accent-primary" :checked="selectedIds.has(img.id)"
          aria-label="Pilih foto" @change="emit('toggle', img.id)" />
        <button type="button"
          class="grid h-8 w-8 place-items-center rounded-sm bg-white/90 text-error transition-colors hover:bg-white disabled:opacity-50"
          :disabled="busyId === img.id" aria-label="Hapus foto" @click="emit('delete', img)">
          <IconGlyph name="trash" class="h-4 w-4" />
        </button>
      </div>
    </li>
  </ul>
</template>
