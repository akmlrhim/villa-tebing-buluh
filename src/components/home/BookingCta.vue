<script setup>
import WhatsAppGlyph from '../WhatsAppGlyph.vue';
import IconGlyph from '../IconGlyph.vue';
import { useSettings } from '../../composables/useSettings';
import { generalMessage, waLink } from '../../lib/whatsapp';

const { whatsappNumber } = useSettings();
</script>

<template>
  <section class="mx-auto mt-20 max-w-6xl scroll-mt-24 px-4 sm:px-6 md:mt-24">
    <div
      class="to-primary/15 relative isolate overflow-hidden rounded-xl bg-gradient-to-br from-white via-white px-6 py-16 text-center sm:px-10 md:py-24"
    >
      <div
        class="text-primary/25 pointer-events-none absolute -top-10 -right-10 -z-10 h-64 w-64 bg-[radial-gradient(currentColor_1.5px,transparent_1.5px)] [mask-image:radial-gradient(circle,black_0%,transparent_70%)] bg-[length:16px_16px]"
      />
      <div
        class="text-primary/20 pointer-events-none absolute -bottom-10 -left-10 -z-10 h-56 w-56 bg-[radial-gradient(currentColor_1.5px,transparent_1.5px)] [mask-image:radial-gradient(circle,black_0%,transparent_70%)] bg-[length:16px_16px]"
      />

      <h2
        class="animate-rise-in font-display text-ink mx-auto mt-4 max-w-xl text-[clamp(1.45rem,4vw,2.75rem)] leading-[1.15] font-semibold tracking-[-0.02em] text-balance motion-reduce:animate-none"
      >
        Kamarnya sudah menunggu, tinggal kamu yang pilih tanggal
      </h2>
      <p
        class="animate-rise-in-late text-body mx-auto mt-4 max-w-md text-sm leading-relaxed motion-reduce:animate-none"
      >
        Cek kalender di atas, atau langsung tanya admin booking selesai dalam
        hitungan menit lewat WhatsApp, tanpa perlu bikin akun.
      </p>

      <div
        class="animate-rise-in-late mt-8 flex flex-wrap items-center justify-center gap-3 motion-reduce:animate-none"
      >
        <a
          href="#cek-ketersediaan"
          class="bg-ink flex h-12 items-center gap-2 rounded-full px-6 text-base font-medium text-white transition-colors hover:bg-black"
        >
          Cek Ketersediaan
          <IconGlyph name="arrow-right" class="h-4 w-4" />
        </a>
        <a
          :href="waLink(whatsappNumber, generalMessage())"
          target="_blank"
          rel="noopener noreferrer"
          class="bg-canvas shadow-float text-ink hover:bg-surface-soft flex h-12 items-center gap-2 rounded-full px-6 text-base font-medium transition-colors"
        >
          <WhatsAppGlyph class="text-wa h-5 w-5" />
          Tanya via WhatsApp
        </a>
      </div>
    </div>
  </section>
</template>
