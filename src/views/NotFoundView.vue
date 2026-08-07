<script setup>
import IconGlyph from '../components/IconGlyph.vue';

const links = [
  { to: '/', label: 'Beranda' },
  { to: '/gallery', label: 'Galeri' },
  { to: '/about', label: 'Tentang Vila' },
  { to: '/contact', label: 'Kontak' },
];
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 pt-32 pb-24 sm:px-6">
    <div
      class="border-hairline bg-surface-soft mx-auto max-w-md rounded-md border px-6 py-10 text-center"
    >
      <span
        class="bg-canvas shadow-float mx-auto grid h-12 w-12 place-items-center rounded-full"
      >
        <IconGlyph name="map-pin" class="text-muted h-6 w-6" />
      </span>
      <h1 class="text-ink mt-4 text-xl font-semibold">
        Halaman tidak ditemukan
      </h1>
      <p class="text-muted mx-auto mt-2 max-w-sm text-sm leading-relaxed">
        Tautan yang kamu buka sudah tidak ada atau alamatnya keliru. Coba salah
        satu halaman di bawah ini.
      </p>
      <ul class="mt-6 flex flex-wrap justify-center gap-2">
        <li v-for="link in links" :key="link.to">
          <RouterLink
            :to="link.to"
            class="border-hairline bg-canvas hover:border-ink inline-flex h-11 items-center rounded-sm border px-5 text-sm font-medium transition-colors"
          >
            {{ link.label }}
          </RouterLink>
        </li>
      </ul>
    </div>
  </div>
</template>
