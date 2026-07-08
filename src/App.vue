<script setup>
import { onMounted } from 'vue'
import SiteNav from './components/SiteNav.vue'
import SiteFooter from './components/SiteFooter.vue'
import WhatsAppFab from './components/WhatsAppFab.vue'
import { useRooms } from './composables/useRooms'
import { useAvailability } from './composables/useAvailability'
import { useSettings } from './composables/useSettings'

const { fetchRooms } = useRooms()
const { fetchAvailability } = useAvailability()
const { fetchSettings } = useSettings()

onMounted(() => {
  fetchRooms()
  fetchAvailability()
  fetchSettings()
})
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <SiteNav />
    <main class="flex-1">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <SiteFooter />
    <WhatsAppFab />
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
