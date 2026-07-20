<script setup>
import { heroImage } from '../../data/demoData';
</script>

<template>
  <section
    class="bg-ink relative isolate -mt-14 flex min-h-[640px] flex-col justify-end pb-24 md:-mt-20 md:h-[78vh] md:max-h-[820px] md:pb-28"
  >
    <img
      :src="heroImage.url"
      :srcset="heroImage.srcset"
      sizes="100vw"
      :alt="heroImage.alt"
      fetchpriority="high"
      class="absolute inset-0 -z-10 h-full w-full object-cover"
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
        Menginap tenang di tebing buluh
      </h1>
      <p
        class="animate-rise-in-late mt-4 max-w-lg text-sm leading-relaxed text-white motion-reduce:animate-none"
      >
        Vila bambu privat di lereng Pegunungan Meratus, menghadap Gunung
        Kantawan. Cek tanggal kosong di bawah, lalu booking cukup lewat
        WhatsApp.
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
