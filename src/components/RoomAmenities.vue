<script setup>
import IconGlyph from './IconGlyph.vue'

defineProps({
  amenities: { type: Array, default: () => [] },
})

const AMENITY_ICONS = [
  ['wifi', 'wifi'],
  ['ac', 'wind'],
  ['water heater', 'droplet'],
  ['air panas', 'droplet'],
  ['teras', 'sun'],
  ['balkon', 'mountain'],
  ['view', 'mountain'],
  ['kolam', 'waves'],
  ['kano', 'canoe'],
  ['dapur', 'utensils'],
  ['sarapan', 'coffee'],
  ['kopi', 'coffee'],
  ['ruang duduk', 'sofa'],
  ['sofa', 'sofa'],
  ['gazebo', 'umbrella'],
  ['meja kerja', 'monitor'],
  ['tv', 'monitor'],
  ['parkir', 'car'],
]

function amenityIcon(label) {
  const key = label.toLowerCase()
  return AMENITY_ICONS.find(([match]) => key.includes(match))?.[1] ?? 'check'
}
</script>

<template>
  <div>
    <h3 class="text-lg font-semibold text-ink">Fasilitas kamar</h3>
    <ul class="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
      <li v-for="amenity in amenities" :key="amenity" class="flex items-center gap-3 text-[14px] text-body">
        <IconGlyph :name="amenityIcon(amenity)" class="h-5 w-5 shrink-0 text-muted" />
        {{ amenity }}
      </li>
    </ul>
  </div>
</template>
