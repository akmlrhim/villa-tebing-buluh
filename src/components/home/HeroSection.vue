<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { heroImage } from '../../data/demoData';

const heroImg = ref(null);
let ticking = false;

function applyParallax() {
  ticking = false;
  if (!heroImg.value) return;
  const offset = Math.min(Math.max(window.scrollY * 0.25, -60), 60);
  heroImg.value.style.transform = `translate3d(0, ${offset}px, 0)`;
}

function onScroll() {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(applyParallax);
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  window.addEventListener('scroll', onScroll, { passive: true });
  applyParallax();
});
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll));
</script>

<template>
  <section
    class="bg-ink relative isolate -mt-14 flex min-h-[640px] flex-col justify-end overflow-hidden pb-24 md:-mt-20 md:h-[78vh] md:max-h-[820px] md:pb-28"
  >
    <img
      ref="heroImg"
      :src="heroImage.url"
      :srcset="heroImage.srcset"
      sizes="100vw"
      :alt="heroImage.alt"
      fetchpriority="high"
      class="absolute inset-0 -z-10 h-full w-full scale-110 object-cover will-change-transform"
    />
    <div
      class="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/40 to-black/25"
    />
    <div
      class="absolute inset-x-0 top-0 -z-10 h-36 bg-gradient-to-b from-black/45 to-transparent"
    />

    <div class="mx-auto w-full max-w-6xl px-4 pt-40 sm:px-6">
      <h1
        class="animate-rise-in max-w-xl text-[clamp(1.9rem,5vw,3.25rem)] leading-[1.08] font-semibold tracking-[-0.02em] text-white motion-reduce:animate-none"
      >
        Menginap tenang di lereng Meratus, Loksado
      </h1>
      <p
        class="animate-rise-in-late mt-4 max-w-lg text-sm leading-relaxed text-white motion-reduce:animate-none"
      >
        Villa Tebing Buluh — vila bambu privat di Hulu Banyu, Loksado,
        menghadap Gunung Kantawan. Cek tanggal kosong di bawah, lalu booking
        cukup lewat WhatsApp.
      </p>
      <div
        class="animate-rise-in-late mt-8 flex flex-wrap gap-3 motion-reduce:animate-none"
      >
        <a
          href="#cek-ketersediaan"
          class="bg-primary hover:bg-primary-active flex h-12 items-center rounded-sm px-6 text-base font-medium text-white transition-colors"
        >
          Cek Ketersediaan
        </a>
        <a
          href="#kamar"
          class="flex h-12 items-center rounded-sm border border-white/70 px-6 text-base font-medium text-white transition-colors hover:bg-white/10"
        >
          Lihat Kamar
        </a>
      </div>
    </div>
  </section>
</template>
