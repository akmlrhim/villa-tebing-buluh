<script setup>
import IconGlyph from '../IconGlyph.vue'

const facilities = [
  { icon: 'bed', label: '2 Kamar Tidur' },
  { icon: 'utensils', label: 'Ruang Makan' },
  { icon: 'sun', label: 'Pemanas Air' },
  { icon: 'droplet', label: 'Kamar Mandi & Toilet' },
  { icon: 'wind', label: 'Kamar AC' },
  { icon: 'bath', label: 'Bak Mandi' },
  { icon: 'net', label: 'Jaring Tali' },
  { icon: 'coffee', label: 'Sarapan untuk 4 Orang' },
]
</script>

<template>
  <!-- Fasilitas vila (F-01.4) -->
  <section class="mt-20 bg-surface-soft py-16 md:mt-24 md:py-20">
    <div class="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[1fr_1.3fr] md:gap-16">
      <div>
        <h2 class="text-[22px] font-semibold tracking-tight text-ink md:text-2xl">
          Semua yang kamu butuhkan, tidak lebih
        </h2>
        <p class="mt-3 max-w-sm text-sm leading-relaxed text-black">
          Vila kecil di tepian sungai dengan rumpun bambu di belakangnya.
          Fasilitasnya dipilih supaya kamu betah berlama-lama, bukan sekadar
          panjang di daftar.
        </p>
        <RouterLink to="/about"
          class="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline underline-offset-4 transition-colors hover:text-primary">
          Selengkapnya tentang vila
        </RouterLink>
      </div>
      <ul class="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <li v-for="facility in facilities" :key="facility.label"
          class="flex items-center gap-3 text-sm font-medium text-black">
          <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-canvas shadow-float">
            <IconGlyph :name="facility.icon" class="h-5 w-5 text-ink" />
          </span>
          {{ facility.label }}
        </li>
      </ul>
    </div>
  </section>
</template>
