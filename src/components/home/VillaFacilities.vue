<script setup>
import IconGlyph from '../IconGlyph.vue';

const facilities = [
  { icon: 'bed', label: '2 Kamar Tidur' },
  { icon: 'utensils', label: 'Ruang Makan' },
  { icon: 'sun', label: 'Pemanas Air' },
  { icon: 'droplet', label: 'Kamar Mandi & Toilet' },
  { icon: 'wind', label: 'Kamar AC' },
  { icon: 'bath', label: 'Bak Mandi' },
  { icon: 'net', label: 'Jaring Tali' },
  { icon: 'coffee', label: 'Sarapan untuk 4 Orang' },
];
</script>

<template>
  <!-- Fasilitas vila (F-01.4) -->
  <section class="bg-surface-soft mt-20 py-16 md:mt-24 md:py-20">
    <div
      class="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[1fr_1.3fr] md:gap-16"
    >
      <div>
        <h2
          class="text-ink text-[22px] font-semibold tracking-tight md:text-2xl"
        >
          Semua yang kamu butuhkan, tidak lebih
        </h2>
        <p class="mt-3 max-w-sm text-sm leading-relaxed text-black">
          Fasilitasnya disiapkan supaya keluarga atau rombongan tetap nyaman
          menginap bersama, dari ruang makan yang lega sampai kamar ber-AC untuk
          semua orang.
        </p>
        <RouterLink
          to="/about"
          class="text-ink hover:text-primary mt-5 inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4 transition-colors"
        >
          Selengkapnya tentang vila
        </RouterLink>
      </div>
      <ul class="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <li
          v-for="facility in facilities"
          :key="facility.label"
          class="flex items-center gap-3 text-sm font-medium text-black"
        >
          <span
            class="bg-canvas shadow-float grid h-11 w-11 shrink-0 place-items-center rounded-full"
          >
            <IconGlyph :name="facility.icon" class="text-ink h-5 w-5" />
          </span>
          {{ facility.label }}
        </li>
      </ul>
    </div>
  </section>
</template>
