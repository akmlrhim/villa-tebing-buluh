<script setup>
import IconGlyph from './IconGlyph.vue';
import WhatsAppGlyph from './WhatsAppGlyph.vue';
import { useSettings } from '../composables/useSettings';
import { waLink, generalMessage } from '../lib/whatsapp';

const { settings, whatsappNumber, villaName } = useSettings();

const links = [
  { to: '/', label: 'Home' },
  { to: '/gallery', label: 'Our Gallery' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/cek-booking', label: 'Cek Status Booking' },
];

const year = new Date().getFullYear();

function formatPhone(number) {
  const rest = number.slice(2);
  return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
}
</script>

<template>
  <footer class="border-hairline-soft border-t">
    <div
      class="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1.2fr] md:py-16"
    >
      <div>
        <img
          src="/logo.png"
          :alt="villaName"
          width="168"
          height="158"
          loading="lazy"
          class="h-14 w-14 object-contain"
        />
        <p class="mt-4 flex max-w-xs items-start gap-2 text-sm text-black">
          <IconGlyph name="map-pin" class="mt-0.5 h-4 w-4 shrink-0" />
          {{ settings.address }}
        </p>
      </div>

      <nav aria-label="Halaman">
        <p class="text-ink text-sm font-semibold">Halaman</p>
        <ul class="mt-3 space-y-1">
          <li v-for="link in links" :key="link.to">
            <RouterLink
              :to="link.to"
              class="hover:text-ink text-sm text-black transition-colors hover:underline"
            >
              {{ link.label }}
            </RouterLink>
          </li>
        </ul>
      </nav>

      <div>
        <p class="text-ink text-sm font-semibold">Kontak</p>
        <ul class="mt-3 space-y-1 text-sm font-bold text-black">
          <li>
            <a
              :href="waLink(whatsappNumber, generalMessage())"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-ink inline-flex items-center gap-2 transition-colors hover:underline"
            >
              <WhatsAppGlyph class="text-wa h-4 w-4" />
              {{ formatPhone(whatsappNumber) }}
            </a>
          </li>
          <li class="flex items-center gap-2">
            <IconGlyph name="clock" class="h-4 w-4" />
            Check-in {{ settings.check_in_time }} · Check-out
            {{ settings.check_out_time }}
          </li>
          <li>
            <a
              :href="`https://instagram.com/${settings.instagram}`"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-ink inline-flex items-center gap-2 transition-colors hover:underline"
            >
              <IconGlyph name="instagram" class="h-4 w-4" />
              @{{ settings.instagram }}
            </a>
          </li>
        </ul>
      </div>
    </div>

    <div class="border-hairline-soft border-t">
      <div
        class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 sm:px-6"
      >
        <p class="text-[13px] text-black">
          © {{ year }} {{ villaName }}. Semua hak dilindungi.
        </p>
      </div>
    </div>
  </footer>
</template>
