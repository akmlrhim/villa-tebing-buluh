<script setup>
import { computed, ref } from 'vue'
import PhotoLightbox from '../components/PhotoLightbox.vue'
import RoomDetailModal from '../components/RoomDetailModal.vue'
import IconGlyph from '../components/IconGlyph.vue'
import { useRooms } from '../composables/useRooms'
import { demoGallery } from '../data/demoData'

// F-05: Our Gallery - grid foto dengan filter kelompok + lightbox.
const { rooms } = useRooms()

const groups = ['Semua', 'Area Vila', 'Kamar', 'Sekitar Vila']
const activeGroup = ref('Semua')

const items = computed(() =>
  activeGroup.value === 'Semua'
    ? demoGallery
    : demoGallery.filter((item) => item.group === activeGroup.value),
)

const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const selectedRoom = ref(null)

function openLightbox(index) {
  lightboxIndex.value = index
  lightboxOpen.value = true
}

// F-05.4: dari foto kamar bisa langsung buka detail kamarnya.
function openRoom(slug) {
  const room = rooms.value.find((entry) => entry.slug === slug)
  if (room) selectedRoom.value = room
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 md:pt-14">
    <h1 class="text-[26px] font-semibold tracking-tight text-ink md:text-3xl">Our Gallery</h1>
    <p class="mt-2 max-w-xl text-[15px] leading-relaxed text-body">
      Suasana vila apa adanya: kolam, kamar, sungai, dan sekitarnya.
      Klik foto untuk melihat lebih besar.
    </p>

    <!-- Filter kelompok (F-05.2) -->
    <div class="mt-7 flex flex-wrap gap-2" role="tablist" aria-label="Filter galeri">
      <button
        v-for="group in groups"
        :key="group"
        type="button"
        role="tab"
        :aria-selected="activeGroup === group"
        class="rounded-full border px-4 py-2 text-sm font-medium transition-colors"
        :class="
          activeGroup === group
            ? 'border-ink bg-ink text-white'
            : 'border-hairline text-muted hover:border-ink hover:text-ink'
        "
        @click="activeGroup = group"
      >
        {{ group }}
      </button>
    </div>

    <!-- Grid masonry ringan via CSS columns -->
    <div class="mt-8 columns-2 gap-4 md:columns-3">
      <figure
        v-for="(item, index) in items"
        :key="item.url"
        class="group relative mb-4 break-inside-avoid overflow-hidden rounded-md bg-surface-strong"
      >
        <button
          type="button"
          class="block w-full cursor-zoom-in"
          :aria-label="`Perbesar foto: ${item.alt}`"
          @click="openLightbox(index)"
        >
          <img
            :src="item.url"
            :alt="item.alt"
            loading="lazy"
            class="w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            :class="item.tall ? 'aspect-[3/4]' : 'aspect-[4/3]'"
          />
        </button>
        <figcaption v-if="item.roomSlug" class="absolute bottom-3 left-3">
          <button
            type="button"
            class="flex items-center gap-1 rounded-full bg-canvas/95 py-1.5 pl-3 pr-2.5 text-xs font-semibold text-ink shadow-float transition-colors hover:bg-canvas"
            @click.stop="openRoom(item.roomSlug)"
          >
            Lihat kamar
            <IconGlyph name="arrow-right" class="h-3.5 w-3.5" />
          </button>
        </figcaption>
      </figure>
    </div>

    <PhotoLightbox
      :items="items"
      v-model:index="lightboxIndex"
      :open="lightboxOpen"
      @close="lightboxOpen = false"
    />
    <RoomDetailModal :room="selectedRoom" @close="selectedRoom = null" />
  </div>
</template>
