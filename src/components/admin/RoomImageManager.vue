<script setup>
import IconGlyph from '../IconGlyph.vue'

// Grid foto kamar + unggah. State foto dikelola parent (useRoomForm); komponen
// ini presentasional dan meng-emit intent.
defineProps({
  images: { type: Array, default: () => [] },
  uploading: { type: Boolean, default: false },
})
const emit = defineEmits(['files', 'set-primary', 'remove'])
</script>

<template>
  <div>
    <label class="mb-1.5 block text-[0.8125rem] font-semibold text-ink">Foto kamar</label>
    <div v-if="images.length" class="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
      <div v-for="(img, i) in images" :key="i"
        class="group relative aspect-square overflow-hidden rounded-sm border border-hairline">
        <img :src="img.url" alt="" class="h-full w-full object-cover" />
        <span v-if="img.is_primary"
          class="absolute left-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">
          Utama
        </span>
        <div
          class="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button type="button" class="rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-ink"
            @click="emit('set-primary', i)">Jadikan utama</button>
          <button type="button" class="grid h-6 w-6 place-items-center rounded bg-white/90 text-error"
            aria-label="Hapus foto" @click="emit('remove', i)">
            <IconGlyph name="trash" class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
    <label
      class="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-sm border border-dashed border-border-strong text-sm font-medium text-muted transition-colors hover:border-primary hover:text-primary">
      <IconGlyph name="image" class="h-5 w-5" />
      {{ uploading ? 'Mengunggah…' : 'Tambah foto' }}
      <input type="file" accept="image/*" multiple class="hidden" :disabled="uploading" @change="emit('files', $event)" />
    </label>
  </div>
</template>
