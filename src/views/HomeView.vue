<script setup>
import { computed, onMounted, ref, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AvailabilitySearch from '../components/AvailabilitySearch.vue';
import EmptyState from '../components/EmptyState.vue';
import MasterCalendar from '../components/MasterCalendar.vue';
import RoomCard from '../components/RoomCard.vue';
import RoomDetailModal from '../components/RoomDetailModal.vue';
import WhatsAppGlyph from '../components/WhatsAppGlyph.vue';
import HeroSection from '../components/home/HeroSection.vue';
import VillaFacilities from '../components/home/VillaFacilities.vue';
import GalleryPeek from '../components/home/GalleryPeek.vue';
import FAQSection from '../components/home/FAQSection.vue';
import BookingCta from '../components/home/BookingCta.vue';
import { useRooms } from '../composables/useRooms';
import { useAvailability } from '../composables/useAvailability';
import { useSettings } from '../composables/useSettings';
import { usePromos } from '../composables/usePromos';
import { formatDateID, nightsBetween } from '../lib/format';
import { askAvailabilityMessage, waLink } from '../lib/whatsapp';

const { rooms, loading, fetchRooms } = useRooms();
const { isRoomAvailable, fetchAvailability } = useAvailability();
const { whatsappNumber } = useSettings();
const { fetchPromos } = usePromos();

onMounted(() => {
  fetchRooms();
  fetchAvailability();
  fetchPromos();
});

const query = ref(null);
const selectedRoom = ref(null);
const roomsSection = ref(null);

const route = useRoute();
const router = useRouter();
watchEffect(() => {
  const slug = route.query.kamar;
  if (slug && rooms.value.length) {
    selectedRoom.value = rooms.value.find((room) => room.slug === slug) ?? null;
  }
});

function closeRoom() {
  selectedRoom.value = null;
  if (route.query.kamar) router.replace({ query: {} });
}

const nights = computed(() =>
  query.value ? nightsBetween(query.value.checkIn, query.value.checkOut) : 0,
);

function roomStatus(room) {
  if (!query.value) return null;
  return isRoomAvailable(room.id, query.value.checkIn, query.value.checkOut)
    ? 'available'
    : 'full';
}

const availableCount = computed(() =>
  query.value
    ? rooms.value.filter((room) => roomStatus(room) === 'available').length
    : 0,
);

async function onSearch(criteria) {
  await fetchAvailability({ refresh: true });
  query.value = criteria;
  roomsSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function onClear() {
  query.value = null;
}
</script>

<template>
  <div>
    <HeroSection />

    <section
      id="cek-ketersediaan"
      class="bg-surface-soft relative z-10 scroll-mt-24 py-14 md:py-20"
    >
      <div class="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <div class="mx-auto max-w-xl text-center">
          <h2
            class="font-display text-ink text-xl font-semibold tracking-tight md:text-2xl"
          >
            Kapan kamu mau menginap?
          </h2>
          <p class="text-muted mt-2 text-sm leading-relaxed md:text-[15px]">
            Pilih tanggal check-in dan check-out untuk melihat kamar yang masih
            kosong di Villa Tebing Buluh.
          </p>
        </div>
        <div class="animate-rise-in motion-reduce:animate-none mt-7 md:mt-9">
          <AvailabilitySearch @search="onSearch" @clear="onClear" />
        </div>
      </div>
    </section>

    <section
      id="kamar"
      ref="roomsSection"
      class="mx-auto max-w-6xl scroll-mt-24 px-4 pt-16 sm:px-6 md:pt-20"
    >
      <div class="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            class="font-display text-ink text-[18px] font-semibold tracking-tight md:text-2xl"
          >
            Pilih kamarmu
          </h2>
          <p v-if="query" class="text-muted mt-1 text-sm" aria-live="polite">
            <strong class="text-ink font-semibold"
              >{{ availableCount }} kamar tersedia</strong
            >
            · {{ formatDateID(query.checkIn, { weekday: false }) }} –
            {{ formatDateID(query.checkOut, { weekday: false }) }}
            · {{ nights }} malam
          </p>
        </div>
        <button
          v-if="query"
          type="button"
          class="text-ink hover:text-primary text-sm font-medium underline underline-offset-4"
          @click="onClear"
        >
          Hapus filter tanggal
        </button>
      </div>

      <div
        v-if="loading"
        class="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div v-for="index in 3" :key="index" class="animate-pulse">
          <div class="bg-surface-strong aspect-[4/3] rounded-md" />
          <div class="bg-surface-strong mt-3 h-4 w-2/3 rounded-xs" />
          <div class="bg-surface-soft mt-2 h-3.5 w-1/2 rounded-xs" />
        </div>
      </div>

      <div
        v-else
        class="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
      >
        <RoomCard
          v-for="room in rooms"
          :key="room.id"
          :room="room"
          :status="roomStatus(room)"
          :nights="nights"
          :check-in="query?.checkIn ?? ''"
          :check-out="query?.checkOut ?? ''"
          @open="selectedRoom = room"
        />
      </div>

      <EmptyState
        v-if="!loading && rooms.length === 0"
        icon="bed"
        title="Daftar kamar sedang disiapkan"
        description="Sementara itu, tanyakan langsung ketersediaan dan harga kamar ke admin."
        class="mt-8"
      >
        <a
          :href="
            waLink(
              whatsappNumber,
              'Halo, saya ingin bertanya tentang kamar di Villa Tebing Buluh.',
            )
          "
          target="_blank"
          rel="noopener noreferrer"
          class="bg-primary hover:bg-primary-active text-md inline-flex h-12 items-center gap-2 rounded-sm px-6 font-medium text-white transition-colors"
        >
          <WhatsAppGlyph class="h-5 w-5" />
          Hubungi Kami
        </a>
      </EmptyState>

      <EmptyState
        v-if="query && rooms.length > 0 && availableCount === 0 && !loading"
        icon="calendar"
        title="Tanggal itu sudah penuh semua"
        description="Coba geser tanggalnya satu atau dua hari, atau tanyakan langsung ke admin. Kadang ada pembatalan yang belum masuk kalender."
        class="mt-10"
      >
        <a
          :href="waLink(whatsappNumber, askAvailabilityMessage(query))"
          target="_blank"
          rel="noopener noreferrer"
          class="bg-primary hover:bg-primary-active inline-flex h-12 items-center gap-2 rounded-sm px-6 text-base font-medium text-white transition-colors"
        >
          <WhatsAppGlyph class="h-5 w-5" />
          Tanya Admin via WhatsApp
        </a>
      </EmptyState>
    </section>

    <section
      v-if="rooms.length"
      id="kalender"
      class="mx-auto max-w-6xl scroll-mt-24 px-4 pt-16 sm:px-6 md:pt-20"
    >
      <h2
        class="font-display text-ink text-[18px] font-semibold tracking-tight md:text-2xl"
      >
        Kalender hunian vila
      </h2>
      <p class="mt-1 max-w-[65ch] text-sm text-black">
        Semua booking yang sudah masuk terlihat di satu kalender. Klik tanggal
        untuk melihat kamar mana saja yang terisi malam itu.
      </p>
      <div class="mt-7">
        <MasterCalendar @open-room="selectedRoom = $event" />
      </div>
    </section>

    <VillaFacilities />

    <GalleryPeek />

    <FAQSection />

    <BookingCta />

    <RoomDetailModal
      :room="selectedRoom"
      :initial-range="
        query ? { checkIn: query.checkIn, checkOut: query.checkOut } : null
      "
      @close="closeRoom"
    />
  </div>
</template>
