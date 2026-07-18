<script setup>
import WhatsAppGlyph from './WhatsAppGlyph.vue';
import { useSettings } from '../composables/useSettings';
import { waLink, generalMessage } from '../lib/whatsapp';

const { whatsappNumber } = useSettings();
</script>

<template>
  <a
    :href="waLink(whatsappNumber, generalMessage())"
    target="_blank"
    rel="noopener noreferrer"
    class="border-hairline-soft bg-canvas shadow-float fixed right-5 bottom-5 z-30 flex h-12 items-center gap-2.5 rounded-full border pr-3.5 pl-3.5 transition-transform duration-200 hover:-translate-y-0.5 sm:pr-5"
    aria-label="Tanya admin via WhatsApp"
  >
    <WhatsAppGlyph class="text-wa h-6 w-6 shrink-0" />
    <span class="text-ink hidden text-sm font-medium sm:inline"
      >Tanya via WhatsApp</span
    >
  </a>
</template>
