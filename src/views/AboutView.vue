<script setup>
import { ref } from 'vue'
import IconGlyph from '../components/IconGlyph.vue'
import PageHero from '../components/PageHero.vue'
import RoomDetailModal from '../components/RoomDetailModal.vue'
import { useRooms } from '../composables/useRooms'
import { useSettings } from '../composables/useSettings'
import { formatRupiah } from '../lib/format'

const { rooms } = useRooms()
const { settings, villaName } = useSettings()
const selectedRoom = ref(null)

const img = (id, w = 1400) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`

const hero = {
  url: img('1573790387438-4da905039392', 2000),
  alt: 'Tebing dan pantai berpasir putih di pesisir dekat vila',
}

const photos = {
  main: {
    url: img('1559628233-100c798642d4'),
    alt: 'Pemandangan udara sawah dan hutan kelapa di sekitar vila saat matahari terbit',
  },
  top: {
    url: img('1584132967334-10e028bd69f7', 900),
    alt: 'Dek kayu dan kursi santai di tepi kolam renang vila',
  },
  bottom: {
    url: img('1552733407-5d5c46c3bb3b', 900),
    alt: 'Kano meluncur pelan di sungai kecil di antara pohon kelapa',
  },
}

const facilities = [
  { icon: 'bed', label: '2 Kamar Tidur', note: 'Kasur nyaman dengan sprei bersih setiap pergantian tamu' },
  { icon: 'utensils', label: 'Ruang Makan', note: 'Meja makan bersama, cukup untuk 4–6 orang' },
  { icon: 'sun', label: 'Pemanas Air', note: 'Water heater siap dipakai kapan saja' },
  { icon: 'droplet', label: 'Kamar Mandi & Toilet', note: 'Bersih, dengan perlengkapan mandi dasar' },
  { icon: 'wind', label: 'Kamar AC', note: 'Semua kamar tidur ber-AC' },
  { icon: 'bath', label: 'Bak Mandi', note: 'Untuk berendam santai selepas seharian jalan' },
  { icon: 'net', label: 'Jaring Tali', note: 'Bersantai di atas jaring menghadap tebing bambu' },
  { icon: 'coffee', label: 'Sarapan untuk 4 Orang', note: 'Menu rumahan, disiapkan setiap pagi' },
]

const mapsQuery = encodeURIComponent(settings.value.address)
</script>

<template>
  <div class="pb-20">
    <PageHero :image="hero.url" :alt="hero.alt" :title="`Tentang ${villaName}`"
      subtitle="Namanya diambil dari tebing kecil berumpun bambu yang memeluk sungai di belakang vila. Kami sengaja membatasi jumlah kamar: cukup untuk tetap sepi, cukup untuk terasa seperti rumah sendiri." />

    <div class="mx-auto max-w-6xl px-4 pt-8 sm:px-6 md:pt-10">
      <div class="mt-8 grid gap-4 md:grid-cols-[1.8fr_1fr]">
        <img
          :src="photos.main.url"
          :alt="photos.main.alt"
          loading="lazy"
          decoding="async"
          class="h-64 w-full rounded-md object-cover sm:h-80 md:h-[460px]"
        />
        <div class="grid grid-cols-2 gap-4 md:grid-cols-1">
          <img :src="photos.top.url" :alt="photos.top.alt" loading="lazy" class="h-40 w-full rounded-md object-cover sm:h-56 md:h-[222px]" />
          <img :src="photos.bottom.url" :alt="photos.bottom.alt" loading="lazy" class="h-40 w-full rounded-md object-cover sm:h-56 md:h-[222px]" />
        </div>
      </div>

      <div class="mt-12 grid gap-8 md:mt-16 md:grid-cols-2 md:gap-16">
        <div class="space-y-4 text-[15px] leading-relaxed text-body">
          <p>
            Vila ini awalnya rumah keluarga yang sering dipinjam kerabat untuk
            liburan. Lama-lama kami sadar: yang orang cari bukan kamar yang
            banyak fasilitasnya, tapi tempat yang membuat mereka tidak ingin
            cepat-cepat pulang.
          </p>
          <p>
            Jadi kami merawat yang sudah ada: kolam yang airnya dari sumber
            sendiri, gazebo menghadap sungai, dan dapur yang boleh dipakai
            kapan saja. Pagi-pagi, ambil kano dan susuri sungainya; sorenya,
            duduk saja mendengar bambu bergesekan.
          </p>
        </div>
        <div class="space-y-4 text-[15px] leading-relaxed text-body">
          <p>
            Kami sengaja tidak memakai sistem pembayaran online. Semua booking
            dikonfirmasi langsung oleh admin lewat WhatsApp. Memang lebih lambat
            beberapa menit, tapi kamu selalu bicara dengan orang, bukan mesin.
          </p>
          <p>
            Lokasinya sekitar 15 menit dari pusat kota, cukup dekat untuk cari
            makan, cukup jauh untuk tidak dengar suara kendaraan.
          </p>
        </div>
      </div>
    </div>

    <section class="mt-16 bg-surface-soft py-14 md:mt-20 md:py-16">
      <div class="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 class="text-[22px] font-semibold tracking-tight text-ink md:text-2xl">Fasilitas vila</h2>
        <ul class="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
          <li v-for="facility in facilities" :key="facility.label" class="flex items-start gap-4">
            <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-canvas shadow-float">
              <IconGlyph :name="facility.icon" class="h-5 w-5 text-ink" />
            </span>
            <div>
              <p class="text-[15px] font-semibold text-ink">{{ facility.label }}</p>
              <p class="mt-0.5 text-sm leading-relaxed text-muted">{{ facility.note }}</p>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-4 pt-16 sm:px-6 md:pt-20">
      <h2 class="text-[22px] font-semibold tracking-tight text-ink md:text-2xl">Tipe kamar</h2>
      <div class="mt-6 divide-y divide-hairline-soft rounded-md border border-hairline">
        <button
          v-for="room in rooms"
          :key="room.id"
          type="button"
          class="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors first:rounded-t-md last:rounded-b-md hover:bg-surface-soft"
          @click="selectedRoom = room"
        >
          <span>
            <span class="block text-[15px] font-semibold text-ink">{{ room.name }}</span>
            <span class="mt-0.5 block text-sm text-muted">
              {{ room.max_guests }} tamu · {{ formatRupiah(room.price_per_night) }} / malam
            </span>
          </span>
          <span class="flex shrink-0 items-center gap-1.5 text-sm font-medium text-ink">
            Lihat detail
            <IconGlyph name="arrow-right" class="h-4 w-4" />
          </span>
        </button>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-4 pt-16 sm:px-6 md:pt-20">
      <h2 class="text-[22px] font-semibold tracking-tight text-ink md:text-2xl">Lokasi</h2>
      <div class="mt-6 grid gap-8 md:grid-cols-[1fr_1.4fr]">
        <div class="space-y-4 text-[15px] text-body">
          <p class="flex items-start gap-3">
            <IconGlyph name="map-pin" class="mt-0.5 h-5 w-5 shrink-0 text-muted" />
            {{ settings.address }}
          </p>
          <p class="flex items-start gap-3">
            <IconGlyph name="clock" class="mt-0.5 h-5 w-5 shrink-0 text-muted" />
            Check-in mulai {{ settings.check_in_time }} · Check-out sebelum {{ settings.check_out_time }}
          </p>
          <a
            :href="`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline underline-offset-4 transition-colors hover:text-primary"
          >
            Buka di Google Maps
            <IconGlyph name="arrow-right" class="h-4 w-4" />
          </a>
        </div>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3985.0618275304732!2d115.45236177496967!3d-2.797999597178943!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2de59dba146e2ff5%3A0xc5cf7767bd587830!2sVilla%20Tebing%20Buluh!5e0!3m2!1sid!2sid!4v1783431315972!5m2!1sid!2sid"
          class="aspect-[4/3] w-full rounded-md border border-hairline md:aspect-[16/9]"
          loading="lazy"
          allowfullscreen
          referrerpolicy="strict-origin-when-cross-origin"
          title="Peta lokasi Villa Tebing Buluh"
        />
      </div>
    </section>

    <RoomDetailModal :room="selectedRoom" @close="selectedRoom = null" />
  </div>
</template>
