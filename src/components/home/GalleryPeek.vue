<script setup>
import IconGlyph from '../IconGlyph.vue';

const cover = {
  url: '/img/gallery_heros.webp',
  srcset: '/img/gallery_heros-mobile.webp 750w, /img/gallery_heros.webp 1500w',
  alt: 'Suasana galeri Villa Tebing Buluh',
};
</script>

<template>
  <section
    class="bg-ink relative isolate mt-20 flex min-h-[420px] items-center overflow-hidden md:mt-24 md:min-h-[480px]"
  >
    <img
      :src="cover.url"
      :srcset="cover.srcset"
      sizes="100vw"
      :alt="cover.alt"
      loading="lazy"
      decoding="async"
      width="1500"
      height="844"
      class="absolute inset-0 -z-10 h-full w-full object-cover"
    />
    <div
      class="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/40 to-black/10"
    />

    <div class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <div class="max-w-md">
        <h2
          class="text-[24px] font-semibold tracking-tight text-white md:text-4xl"
        >
          Galeri
        </h2>
        <p class="mt-3 text-sm leading-relaxed text-white/85">
          Lihat suasana kamar, kolam renang, dan sekitar vila lewat kumpulan
          foto lengkap kami.
        </p>
        <RouterLink
          to="/gallery"
          class="mt-6 inline-flex h-12 items-center gap-2 rounded-full border border-white/70 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          Lihat Galeri
          <IconGlyph name="arrow-right" class="h-4 w-4 -rotate-45" />
        </RouterLink>
      </div>
    </div>
  </section>
</template>
