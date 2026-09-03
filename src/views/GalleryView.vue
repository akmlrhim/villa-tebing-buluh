<script setup>
import { onMounted, ref } from 'vue';
import EmptyState from '../components/EmptyState.vue';
import PageHero from '../components/PageHero.vue';
import PhotoLightbox from '../components/PhotoLightbox.vue';
import { useGallery } from '../composables/useGallery';
import { heroImages } from '../data/demoData';

const { images, loading, fetchGallery } = useGallery();
onMounted(fetchGallery);

const hero = heroImages.gallery;

const lightboxOpen = ref(false);
const lightboxIndex = ref(0);

function openLightbox(index) {
  lightboxIndex.value = index;
  lightboxOpen.value = true;
}
</script>

<template>
  <div class="pb-20">
    <PageHero
      :image="hero.url"
      :srcset="hero.srcset"
      :alt="hero.alt"
      title="Galeri Villa Tebing Buluh"
      subtitle="Suasana vila apa adanya: kamar, gazebo bambu, dan Pegunungan Meratus di sekitarnya. Klik foto untuk melihat lebih besar."
    />

    <div class="mx-auto max-w-6xl px-4 sm:px-6">
      <div v-if="loading" class="mt-8 columns-2 gap-4 md:columns-3">
        <div
          v-for="i in 9"
          :key="i"
          class="bg-surface-strong mb-4 aspect-[4/3] animate-pulse rounded-md"
        />
      </div>

      <EmptyState
        v-else-if="!images.length"
        icon="image"
        title="Belum ada foto galeri"
        description="Foto-foto vila akan muncul di sini begitu admin menambahkannya."
        class="mt-10"
      />

      <div v-else class="mt-8 columns-2 gap-4 md:columns-3">
        <button
          v-for="(item, index) in images"
          :key="item.url"
          type="button"
          class="group bg-surface-strong mb-4 block w-full cursor-zoom-in overflow-hidden rounded-md"
          :aria-label="`Perbesar foto: ${item.alt}`"
          @click="openLightbox(index)"
        >
          <img
            :src="item.url"
            :srcset="item.srcset"
            sizes="(min-width: 768px) 33vw, 50vw"
            :alt="item.alt"
            loading="lazy"
            class="w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        </button>
      </div>

      <PhotoLightbox
        :items="images"
        v-model:index="lightboxIndex"
        :open="lightboxOpen"
        @close="lightboxOpen = false"
      />
    </div>
  </div>
</template>
