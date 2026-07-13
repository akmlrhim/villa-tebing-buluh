<script setup>
import { ref, watch } from 'vue'
import IconGlyph from './IconGlyph.vue'

// Galeri foto kamar (F-03.2) dengan navigasi + dot indikator.
const props = defineProps({
  images: { type: Array, default: () => [] },
})

const index = ref(0)
watch(() => props.images, () => (index.value = 0))

function prev() {
  const count = props.images.length
  index.value = (index.value - 1 + count) % count
}
function next() {
  const count = props.images.length
  index.value = (index.value + 1) % count
}
</script>

<template>
  <div class="relative aspect-[16/10] shrink-0 overflow-hidden bg-surface-strong md:aspect-[2/1]">
    <Transition name="photo-fade">
      <img :key="index" :src="images[index]?.url" :alt="images[index]?.alt"
        class="absolute inset-0 h-full w-full object-cover" />
    </Transition>

    <template v-if="images.length > 1">
      <button type="button"
        class="absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-canvas text-ink shadow-float transition-transform hover:scale-105 left-3"
        aria-label="Foto sebelumnya" @click="prev">
        <IconGlyph name="chevron-left" class="h-5 w-5" />
      </button>
      <button type="button"
        class="absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-canvas text-ink shadow-float transition-transform hover:scale-105 right-3"
        aria-label="Foto berikutnya" @click="next">
        <IconGlyph name="chevron-right" class="h-5 w-5" />
      </button>
      <div class="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        <button v-for="(image, i) in images" :key="i" type="button" class="h-2 w-2 rounded-full transition-colors"
          :class="i === index ? 'bg-white' : 'bg-white/50 hover:bg-white/75'" :aria-label="`Lihat foto ${i + 1}`"
          @click="index = i" />
      </div>
      <span class="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
        {{ index + 1 }}/{{ images.length }}
      </span>
    </template>
  </div>
</template>

<style scoped>
.photo-fade-enter-active,
.photo-fade-leave-active {
  transition: opacity 0.3s ease;
}

.photo-fade-enter-from,
.photo-fade-leave-to {
  opacity: 0;
}
</style>
