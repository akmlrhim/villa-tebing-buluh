<script setup>
import { ref } from 'vue';
import IconGlyph from '../components/IconGlyph.vue';
import PageHero from '../components/PageHero.vue';
import RoomDetailModal from '../components/RoomDetailModal.vue';
import { useRooms } from '../composables/useRooms';
import { useSettings } from '../composables/useSettings';
import { heroImages } from '../data/demoData';
import { formatRupiah } from '../lib/format';

const { rooms } = useRooms();
const { settings, villaName } = useSettings();
const selectedRoom = ref(null);

const hero = heroImages.about;

const facilities = [
  {
    icon: 'bed',
    label: '2 Kamar Tidur',
    note: 'Kasur nyaman dengan sprei bersih setiap pergantian tamu',
  },
  {
    icon: 'utensils',
    label: 'Ruang Makan',
    note: 'Meja makan bersama, cukup untuk 4–6 orang',
  },
  {
    icon: 'sun',
    label: 'Pemanas Air',
    note: 'Water heater siap dipakai kapan saja',
  },
  {
    icon: 'droplet',
    label: 'Kamar Mandi & Toilet',
    note: 'Bersih, dengan perlengkapan mandi dasar',
  },
  { icon: 'wind', label: 'Kamar AC', note: 'Semua kamar tidur ber-AC' },
  {
    icon: 'bath',
    label: 'Bak Mandi',
    note: 'Berendam santai sambil memandang pegunungan',
  },
  {
    icon: 'mountain',
    label: 'Pemandangan Gunung Kantawan',
    note: 'Terlihat langsung dari area vila',
  },
  {
    icon: 'net',
    label: 'Jaring Tali',
    note: 'Bersantai di atas jaring menghadap tebing bambu',
  },
  {
    icon: 'coffee',
    label: 'Sarapan untuk 4 Orang',
    note: 'Menu rumahan, disiapkan setiap pagi',
  },
];

const mapsQuery = encodeURIComponent(settings.value.address);
</script>

<template>
  <div class="pb-20">
    <PageHero
      :image="hero.url"
      :srcset="hero.srcset"
      :alt="hero.alt"
      :title="`Tentang ${villaName}`"
      subtitle="Namanya diambil dari tebing kecil berumpun bambu di lereng Pegunungan Meratus. Kami sengaja membatasi jumlah kamar: cukup untuk tetap sepi, cukup untuk terasa seperti rumah sendiri."
    />

    <div class="mx-auto max-w-6xl px-4 pt-8 sm:px-6 md:pt-10">
      <div class="mt-8 space-y-4 text-base leading-relaxed text-black">
        <p>
          Villa tebing buluh adalah bentuk ekspresi sang pencipta untuk kita.
          Dengan pemandangannya yang memanjakan mata dan deru suara arus sungai
          amandit yang terdengar nyaman di telinga melepas semua pikiran yang
          membebani layaknya sebuah terapi.
        </p>
        <p>
          Bangunan villa terdiri dari bambu berlapis kayu memberikan kesan
          menyatu dengan alam, bagi mereka yang suka berendam kami menyediakan
          bathtub outdoor yang menghadap langsung ke alam.
        </p>
        <p>
          Kalau mau lebih aktif, kamu bisa mengunjungi pemandian air panas dan
          air terjun kilat api yang terletak kurang lebih 1 km dari villa. Kamu
          juga bisa bermain bamboo rafting, river tubing dan wahana sungai
          lainnya.
        </p>
        <p>
          Semua bookingan dikonfirmasi langsung oleh admin lewat whatsapp,
          memang sedikit lebih lambat beberapa menit, tapi kamu selalu berbicara
          dengan orang, bukan mesin.
        </p>
        <p>
          Lokasinya berada sekitar ±32 km dari pusat kota Kandangan, dengan
          jarak tempuh sekitar 45 menit. Villa ini berada di pinggir jalan poros
          utama Kandangan-Loksado sehingga mudah untuk menemukannya.
        </p>
      </div>

      <section class="bg-surface-soft mt-16 rounded-md py-14 md:mt-20 md:py-16">
        <div class="mx-auto max-w-6xl px-8 sm:px-16">
          <h2
            class="font-display text-ink text-[18px] font-semibold tracking-tight md:text-2xl"
          >
            Fasilitas vila
          </h2>
          <ul class="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            <li
              v-for="facility in facilities"
              :key="facility.label"
              class="flex items-start gap-4"
            >
              <span
                class="bg-canvas shadow-float grid h-11 w-11 shrink-0 place-items-center rounded-full"
              >
                <IconGlyph :name="facility.icon" class="text-ink h-5 w-5" />
              </span>
              <div>
                <p class="text-ink text-base font-semibold">
                  {{ facility.label }}
                </p>
                <p class="text-muted mt-0.5 text-sm leading-relaxed">
                  {{ facility.note }}
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section class="mx-auto max-w-6xl px-4 pt-16 sm:px-6 md:pt-20">
        <h2
          class="font-display text-ink text-[18px] font-semibold tracking-tight md:text-2xl"
        >
          Tipe kamar
        </h2>
        <div
          class="divide-hairline-soft border-hairline mt-6 divide-y rounded-md border"
        >
          <button
            v-for="room in rooms"
            :key="room.id"
            type="button"
            class="hover:bg-surface-soft flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors first:rounded-t-md last:rounded-b-md"
            @click="selectedRoom = room"
          >
            <span>
              <span class="text-ink block text-base font-semibold">{{
                room.name
              }}</span>
              <span class="text-muted mt-0.5 block text-sm">
                {{ room.max_guests }} tamu ·
                {{ formatRupiah(room.price_per_night) }} / malam
              </span>
            </span>
            <span
              class="text-ink flex shrink-0 items-center gap-1.5 text-sm font-medium"
            >
              Lihat detail
              <IconGlyph name="arrow-right" class="h-4 w-4" />
            </span>
          </button>
        </div>
      </section>

      <section class="mx-auto max-w-6xl px-4 pt-16 sm:px-6 md:pt-20">
        <h2
          class="font-display text-ink text-[18px] font-semibold tracking-tight md:text-2xl"
        >
          Lokasi
        </h2>
        <div class="mt-6 grid gap-8 md:grid-cols-[1fr_1.4fr]">
          <div class="text-body space-y-4 text-base">
            <p class="flex items-start gap-3">
              <IconGlyph
                name="map-pin"
                class="text-muted mt-0.5 h-5 w-5 shrink-0"
              />
              {{ settings.address }}
            </p>
            <p class="flex items-start gap-3">
              <IconGlyph
                name="clock"
                class="text-muted mt-0.5 h-5 w-5 shrink-0"
              />
              Check-in mulai {{ settings.check_in_time }} · Check-out sebelum
              {{ settings.check_out_time }}
            </p>
            <a
              :href="`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`"
              target="_blank"
              rel="noopener noreferrer"
              class="text-ink hover:text-primary inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4 transition-colors"
            >
              Buka di Google Maps
              <IconGlyph name="arrow-right" class="h-4 w-4" />
            </a>
          </div>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3985.0618275304732!2d115.45236177496967!3d-2.797999597178943!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2de59dba146e2ff5%3A0xc5cf7767bd587830!2sVilla%20Tebing%20Buluh!5e0!3m2!1sid!2sid!4v1783431315972!5m2!1sid!2sid"
            class="border-hairline aspect-[4/3] w-full rounded-md border md:aspect-[16/9]"
            loading="lazy"
            allowfullscreen
            referrerpolicy="strict-origin-when-cross-origin"
            title="Peta lokasi Villa Tebing Buluh"
          />
        </div>
      </section>

      <div
        class="to-primary/15 relative isolate mt-12 overflow-hidden rounded-xl bg-gradient-to-br from-white via-white px-6 py-10 text-center md:mt-24 md:py-14"
      >
        <div
          class="text-primary/25 pointer-events-none absolute -top-10 -right-10 -z-10 h-56 w-56 bg-[radial-gradient(currentColor_1.5px,transparent_1.5px)] [mask-image:radial-gradient(circle,black_0%,transparent_70%)] bg-[length:16px_16px]"
        />
        <div
          class="text-primary/20 pointer-events-none absolute -bottom-10 -left-10 -z-10 h-48 w-48 bg-[radial-gradient(currentColor_1.5px,transparent_1.5px)] [mask-image:radial-gradient(circle,black_0%,transparent_70%)] bg-[length:16px_16px]"
        />

        <h2
          class="font-display text-ink mt-3 text-[18px] font-semibold tracking-tight md:text-2xl"
        >
          Kata-kata ada batasnya
        </h2>
        <p class="text-body mx-auto mt-2 max-w-md text-sm leading-relaxed">
          Foto kamar, gazebo bambu, sampai pemandangan Gunung Kantawan -
          semuanya ada di galeri kami. Lihat sendiri suasananya sebelum booking.
        </p>
        <RouterLink
          to="/gallery"
          class="bg-ink mt-6 inline-flex h-12 items-center gap-2 rounded-full px-6 text-base font-medium text-white transition-colors hover:bg-black"
        >
          Lihat Galeri
          <IconGlyph name="arrow-right" class="h-4 w-4" />
        </RouterLink>
      </div>
    </div>

    <RoomDetailModal :room="selectedRoom" @close="selectedRoom = null" />
  </div>
</template>
