<script setup>
import WhatsAppGlyph from './WhatsAppGlyph.vue'
import { useSettings } from '../composables/useSettings'
import { waLink, generalMessage } from '../lib/whatsapp'

const { whatsappNumber } = useSettings()
</script>

<template>
  <!-- F-01.7: tombol WhatsApp melayang, terlihat di semua halaman -->
  <a
    :href="waLink(whatsappNumber, generalMessage())"
    target="_blank"
    rel="noopener noreferrer"
    class="fixed bottom-5 right-5 z-30 flex h-12 items-center gap-2.5 rounded-full border border-hairline-soft bg-canvas pl-3.5 pr-3.5 shadow-float transition-transform duration-200 hover:-translate-y-0.5 sm:pr-5"
    aria-label="Tanya admin via WhatsApp"
  >
    <WhatsAppGlyph class="h-6 w-6 shrink-0 text-wa" />
    <span class="hidden text-sm font-medium text-ink sm:inline">Tanya via WhatsApp</span>
  </a>
</template>
