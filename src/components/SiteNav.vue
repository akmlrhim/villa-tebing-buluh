<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import IconGlyph from './IconGlyph.vue';
import WhatsAppGlyph from './WhatsAppGlyph.vue';
import { useSettings } from '../composables/useSettings';
import { waLink, generalMessage } from '../lib/whatsapp';

const route = useRoute();
const { whatsappNumber, villaName } = useSettings();

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/contact', label: 'Contact' },
];

const menuOpen = ref(false);

// Mode overlay: transparan di atas hero (hanya di Home, sebelum di-scroll).
const scrolled = ref(false);
function onScroll() {
  scrolled.value = window.scrollY > 8;
}
onMounted(() => {
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
});
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
});

// Halaman publik yang punya hero berfoto - navbar transparan sebelum di-scroll.
const HERO_PATHS = new Set(['/', '/gallery', '/about', '/contact']);
const overlay = computed(() => HERO_PATHS.has(route.path) && !scrolled.value);

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false;
  },
);

watch(menuOpen, (open) => {
  document.documentElement.style.overflow = open ? 'hidden' : '';
});
</script>

<template>
  <header
    class="sticky top-0 z-40 transition-colors duration-300"
    :class="
      overlay
        ? 'border-b-0 bg-transparent [&_:focus-visible]:outline-white'
        : 'border-hairline-soft bg-canvas border-b'
    "
  >
    <div
      class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 md:h-20"
    >
      <RouterLink
        to="/"
        class="flex items-center gap-2.5"
        aria-label="Ke halaman utama"
      >
        <img
          src="/logo.png"
          alt=""
          width="168"
          height="158"
          class="h-7 w-7 shrink-0 object-contain md:h-8 md:w-8"
          aria-hidden="true"
        />
        <span
          class="font-display text-base font-semibold tracking-tight transition-colors duration-300 md:text-lg"
          :class="overlay ? 'text-white' : 'text-ink'"
        >
          {{ villaName }}
        </span>
      </RouterLink>

      <nav
        class="hidden items-center gap-7 md:flex"
        aria-label="Navigasi utama"
      >
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="relative px-0.5 py-1.5 text-[15px] font-medium transition-colors [&.router-link-exact-active]:font-semibold [&.router-link-exact-active]:after:absolute [&.router-link-exact-active]:after:inset-x-0.5 [&.router-link-exact-active]:after:-bottom-1 [&.router-link-exact-active]:after:h-0.5 [&.router-link-exact-active]:after:content-['']"
          :class="
            overlay
              ? 'text-white [&.router-link-exact-active]:after:bg-white'
              : 'text-muted hover:text-ink [&.router-link-exact-active]:text-ink [&.router-link-exact-active]:after:bg-ink'
          "
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <div class="flex items-center gap-2">
        <RouterLink
          to="/#cek-ketersediaan"
          class="bg-primary hover:bg-primary-active hidden rounded-full px-5 py-2.5 text-sm font-medium text-white transition-colors md:inline-block"
        >
          Cek Ketersediaan
        </RouterLink>
        <button
          type="button"
          class="grid h-11 w-11 place-items-center rounded-full transition-colors md:hidden"
          :class="
            overlay
              ? 'text-white hover:bg-white/10'
              : 'text-ink hover:bg-surface-soft'
          "
          aria-label="Buka menu"
          :aria-expanded="menuOpen"
          @click="menuOpen = true"
        >
          <IconGlyph name="menu" class="h-5 w-5" />
        </button>
      </div>
    </div>

    <!-- Menu layar penuh (mobile) -->
    <Transition name="sheet">
      <div
        v-if="menuOpen"
        class="bg-canvas fixed inset-0 z-50 flex flex-col md:hidden"
      >
        <div class="flex h-14 items-center justify-between px-4">
          <span class="text-[15px] font-semibold tracking-tight">{{
            villaName
          }}</span>
          <button
            type="button"
            class="text-ink hover:bg-surface-soft grid h-11 w-11 place-items-center rounded-full transition-colors"
            aria-label="Tutup menu"
            @click="menuOpen = false"
          >
            <IconGlyph name="x" class="h-5 w-5" />
          </button>
        </div>
        <nav class="flex flex-1 flex-col px-6 pt-3" aria-label="Navigasi utama">
          <RouterLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            class="border-hairline-soft text-ink [&.router-link-exact-active]:text-primary border-b py-[15px] text-[17px] font-medium last-of-type:border-b-0 [&.router-link-exact-active]:font-semibold"
          >
            {{ link.label }}
          </RouterLink>
        </nav>
        <div class="space-y-3 px-6 pb-10">
          <RouterLink
            to="/#cek-ketersediaan"
            class="bg-primary flex h-12 items-center justify-center rounded-full text-base font-medium text-white"
          >
            Cek Ketersediaan
          </RouterLink>
          <a
            :href="waLink(whatsappNumber, generalMessage())"
            target="_blank"
            rel="noopener noreferrer"
            class="border-hairline text-ink flex h-12 items-center justify-center gap-2 rounded-full border text-base font-medium"
          >
            <WhatsAppGlyph class="text-wa h-5 w-5" />
            Tanya via WhatsApp
          </a>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.sheet-enter-active {
  transition:
    opacity 0.25s var(--ease-out-quart),
    transform 0.25s var(--ease-out-quart);
}
.sheet-leave-active {
  transition: opacity 0.15s ease;
}
.sheet-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.sheet-leave-to {
  opacity: 0;
}
</style>
