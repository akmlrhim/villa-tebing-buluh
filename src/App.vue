<script setup>
import { computed, onMounted, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import SiteNav from './components/SiteNav.vue'
import SiteFooter from './components/SiteFooter.vue'
import WhatsAppFab from './components/WhatsAppFab.vue'
import ToastHost from './components/ToastHost.vue'
import { useSettings } from './composables/useSettings'
import { patchLodgingJsonLd } from './lib/seo'

const { settings, loaded, fetchSettings } = useSettings()

const route = useRoute()
const isAdmin = computed(() => route.path.startsWith('/admin'))

onMounted(() => {
  fetchSettings()
})

watchEffect(() => {
  if (loaded.value) patchLodgingJsonLd(settings.value)
})
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <SiteNav v-if="!isAdmin" />
    <main class="flex-1">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <SiteFooter v-if="!isAdmin" />
    <WhatsAppFab v-if="!isAdmin" />
    <ToastHost />
  </div>
</template>

<style>
.page-enter-active {
  transition: opacity 0.25s var(--ease-out-quart), transform 0.25s var(--ease-out-quart);
}
.page-leave-active {
  transition: opacity 0.15s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .page-enter-from {
    transform: none;
  }
}
</style>
