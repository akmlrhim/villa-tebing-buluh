<script setup>
import { onMounted, ref } from 'vue'
import PageHero from '../components/PageHero.vue'
import PhotoLightbox from '../components/PhotoLightbox.vue'
import { useGallery } from '../composables/useGallery'

const { images, loading, fetchGallery } = useGallery()
onMounted(fetchGallery)

// Foto disimpan lokal (bukan hotlink Unsplash) di public/img/gallery/.
const hero = {
  url: '/img/gallery/hero-2000.webp',
  srcset: [640, 1080, 1600, 2000].map((w) => `/img/gallery/hero-${w}.webp ${w}w`).join(', '),
  alt: 'Gazebo bambu dengan tirai putih saat langit ungu senja',
}

const lightboxOpen = ref(false)
const lightboxIndex = ref(0)

function openLightbox(index) {
  lightboxIndex.value = index
  lightboxOpen.value = true
}
</script>

<template>
  <div class="pb-20">
    <PageHero :image="hero.url" :srcset="hero.srcset" :alt="hero.alt" title="Our Gallery"
      subtitle="Suasana vila apa adanya: kamar, pegunungan, dan sekitarnya. Klik foto untuk melihat lebih besar." />

    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <div v-if="loading" class="mt-8 columns-2 gap-4 md:columns-3">
        <div v-for="i in 9" :key="i" class="mb-4 aspect-[4/3] animate-pulse rounded-md bg-surface-strong" />
      </div>

      <p v-else-if="!images.length" class="mt-10 text-center text-sm text-muted">Belum ada foto galeri.</p>

      <div v-else class="mt-8 columns-2 gap-4 md:columns-3">
        <button v-for="(item, index) in images" :key="item.url" type="button"
          class="group mb-4 block w-full cursor-zoom-in overflow-hidden rounded-md bg-surface-strong"
          :aria-label="`Perbesar foto: ${item.alt}`" @click="openLightbox(index)">
          <img :src="item.url" :alt="item.alt" loading="lazy"
            class="w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
        </button>
      </div>

      <PhotoLightbox :items="images" v-model:index="lightboxIndex" :open="lightboxOpen"
        @close="lightboxOpen = false" />
    </div>
  </div>
</template>
