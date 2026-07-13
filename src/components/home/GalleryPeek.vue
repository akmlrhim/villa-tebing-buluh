<script setup>
import { computed, onMounted } from 'vue'
import { useGallery } from '../../composables/useGallery'

const { images, fetchGallery } = useGallery()
onMounted(fetchGallery)

const galleryPeek = computed(() => images.value.slice(0, 5))
</script>

<template>
  <!-- Intip galeri -->
  <section v-if="galleryPeek.length" class="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
    <div class="flex items-end justify-between gap-4">
      <h2 class="text-[22px] font-semibold tracking-tight text-ink md:text-2xl">Suasana di sini</h2>
      <RouterLink to="/gallery"
        class="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-ink underline underline-offset-4 transition-colors hover:text-primary">
        Lihat semua foto
      </RouterLink>
    </div>
    <div
      class="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 mt-6 flex snap-x gap-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
      <RouterLink v-for="(item, index) in galleryPeek" :key="index" to="/gallery"
        class="group w-72 shrink-0 snap-start overflow-hidden rounded-md bg-surface-strong md:w-80"
        :aria-label="`Buka galeri: ${item.alt}`">
        <img :src="item.url" :alt="item.alt" loading="lazy"
          class="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]" />
      </RouterLink>
    </div>
  </section>
</template>
