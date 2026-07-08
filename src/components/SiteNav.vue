<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import IconGlyph from './IconGlyph.vue'
import WhatsAppGlyph from './WhatsAppGlyph.vue'
import { useSettings } from '../composables/useSettings'
import { waLink, generalMessage } from '../lib/whatsapp'

const route = useRoute()
const { whatsappNumber, villaName } = useSettings()

const links = [
  { to: '/', label: 'Home' },
  { to: '/gallery', label: 'Our Gallery' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

const menuOpen = ref(false)

// Mode overlay: transparan di atas hero (hanya di Home, sebelum di-scroll).
const scrolled = ref(false)
function onScroll() {
  scrolled.value = window.scrollY > 8
}
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
})

const overlay = computed(() => route.path === '/' && !scrolled.value)

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

watch(menuOpen, (open) => {
  document.documentElement.style.overflow = open ? 'hidden' : ''
})
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b transition-colors duration-300"
    :class="overlay ? 'nav--overlay border-transparent bg-transparent' : 'border-hairline-soft bg-canvas'"
  >
    <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 md:h-20">
      <RouterLink to="/" class="flex items-center gap-2.5" aria-label="Ke halaman utama">
        <img src="/logo.svg" alt="" class="h-7 w-7 shrink-0 object-contain md:h-8 md:w-8" aria-hidden="true" />
        <span
          class="font-display text-base font-semibold tracking-tight transition-colors duration-300 md:text-lg"
          :class="overlay ? 'text-white' : 'text-ink'"
        >
          {{ villaName }}
        </span>
      </RouterLink>

      <nav class="hidden items-center gap-7 md:flex" aria-label="Navigasi utama">
        <RouterLink v-for="link in links" :key="link.to" :to="link.to" class="nav-link">
          {{ link.label }}
        </RouterLink>
      </nav>

      <div class="flex items-center gap-2">
        <RouterLink
          to="/#cek-ketersediaan"
          class="hidden rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-active md:inline-block"
        >
          Cek Ketersediaan
        </RouterLink>
        <button
          type="button"
          class="grid h-11 w-11 place-items-center rounded-full transition-colors md:hidden"
          :class="overlay ? 'text-white hover:bg-white/10' : 'text-ink hover:bg-surface-soft'"
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
      <div v-if="menuOpen" class="fixed inset-0 z-50 flex flex-col bg-canvas md:hidden">
        <div class="flex h-14 items-center justify-between px-4">
          <span class="text-[15px] font-semibold tracking-tight">{{ villaName }}</span>
          <button
            type="button"
            class="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors hover:bg-surface-soft"
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
            class="sheet-link"
          >
            {{ link.label }}
          </RouterLink>
        </nav>
        <div class="space-y-3 px-6 pb-10">
          <RouterLink
            to="/#cek-ketersediaan"
            class="flex h-12 items-center justify-center rounded-full bg-primary text-base font-medium text-white"
          >
            Cek Ketersediaan
          </RouterLink>
          <a
            :href="waLink(whatsappNumber, generalMessage())"
            target="_blank"
            rel="noopener"
            class="flex h-12 items-center justify-center gap-2 rounded-full border border-hairline text-base font-medium text-ink"
          >
            <WhatsAppGlyph class="h-5 w-5 text-wa" />
            Tanya via WhatsApp
          </a>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.nav-link {
  position: relative;
  padding: 6px 2px;
  font-size: 15px;
  font-weight: 500;
  color: var(--color-muted);
  transition: color 0.15s ease;
}
.nav-link:hover {
  color: var(--color-ink);
}
.nav-link.router-link-exact-active {
  color: var(--color-ink);
  font-weight: 600;
}
.nav-link.router-link-exact-active::after {
  content: '';
  position: absolute;
  inset-inline: 2px;
  bottom: -4px;
  height: 2px;
  background: var(--color-ink);
}

/* Mode overlay: teks putih di atas foto hero, sebelum di-scroll */
.nav--overlay .nav-link {
  color: #fff;
}
.nav--overlay .nav-link.router-link-exact-active::after {
  background: #fff;
}
.nav--overlay :focus-visible {
  outline-color: #fff;
}

.sheet-link {
  padding: 15px 0;
  font-size: 17px;
  font-weight: 500;
  color: var(--color-ink);
  border-bottom: 1px solid var(--color-hairline-soft);
}
.sheet-link:last-of-type {
  border-bottom: none;
}
.sheet-link.router-link-exact-active {
  color: var(--color-primary);
  font-weight: 600;
}

.sheet-enter-active {
  transition: opacity 0.25s var(--ease-out-quart), transform 0.25s var(--ease-out-quart);
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
