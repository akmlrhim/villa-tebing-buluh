<script setup>
import { computed } from 'vue'
import { formatRupiah } from '../lib/format'

const props = defineProps({
  stay: { type: Object, default: null },
  totalLabel: { type: String, default: 'Total' },
})

const groups = computed(() => {
  const byKey = new Map()
  for (const line of props.stay?.lines ?? []) {
    const key = `${line.price}|${line.promo?.id ?? ''}`
    const found = byKey.get(key)
    if (found) found.nights += 1
    else byKey.set(key, { key, price: line.price, promo: line.promo, nights: 1 })
  }
  return [...byKey.values()]
})
</script>

<template>
  <div v-if="stay?.nights" class="space-y-1.5 text-sm">
    <div v-for="group in groups" :key="group.key" class="flex justify-between gap-3 text-body">
      <span>
        {{ formatRupiah(group.price) }} × {{ group.nights }} malam
        <span v-if="group.promo" class="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {{ group.promo.name }}
        </span>
      </span>
      <span class="shrink-0">{{ formatRupiah(group.price * group.nights) }}</span>
    </div>

    <div v-if="stay.discount > 0" class="flex justify-between gap-3 font-medium text-primary">
      <span>Hemat dari promo</span>
      <span class="shrink-0">−{{ formatRupiah(stay.discount) }}</span>
    </div>

    <div class="flex justify-between gap-3 pt-1 text-base font-semibold text-ink">
      <span>{{ totalLabel }}</span>
      <span class="shrink-0">{{ formatRupiah(stay.total) }}</span>
    </div>
  </div>
</template>
