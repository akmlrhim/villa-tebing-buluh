<script setup>
import { computed } from 'vue'
import { formatRupiah } from '../lib/format'

const props = defineProps({
	room: { type: Object, required: true },
	/** null = belum ada pencarian tanggal; 'available' | 'full' saat ada */
	status: { type: String, default: null },
	nights: { type: Number, default: 0 },
})

const emit = defineEmits(['open'])

const cover = computed(() => props.room.images?.[0])
const metaLine = computed(() => {
	const parts = [
		`${props.room.max_guests} tamu`,
		`${props.room.bed_count} ${props.room.bed_type ? `bed ${props.room.bed_type.toLowerCase()}` : 'bed'}`,
	]
	if (props.room.size_sqm) parts.push(`${props.room.size_sqm} m²`)
	return parts.join(' · ')
})
const totalEstimate = computed(() =>
	props.nights > 0 ? formatRupiah(props.room.price_per_night * props.nights) : null,
)
</script>

<template>
	<article class="group relative">
		<div class="relative aspect-[4/3] overflow-hidden rounded-md bg-surface-strong">
			<img v-if="cover" :src="cover.url" :alt="cover.alt" loading="lazy"
				class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
				:class="status === 'full' ? 'opacity-55 saturate-[0.6]' : ''" />
			<span v-if="status"
				class="absolute left-3 top-3 rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold shadow-float"
				:class="status === 'available' ? 'text-black' : 'text-error'">
				{{ status === 'available' ? 'Tersedia' : 'Penuh' }}
			</span>
		</div>

		<div class="pt-3">
			<div class="flex items-baseline justify-between gap-3">
				<h3 class="text-base font-semibold text-ink">
					<button type="button" class="text-left font-sans after:absolute after:inset-0 after:cursor-pointer"
						@click="emit('open', room)">
						{{ room.name }}
					</button>
				</h3>
			</div>
			<p class="mt-0.5 text-sm text-black">{{ metaLine }}</p>
			<p class="mt-1.5 text-[15px]">
				<span class="font-semibold text-ink">{{ formatRupiah(room.price_per_night) }}</span>
				<span class="text-black"> / malam</span>
				<span v-if="totalEstimate && status === 'available'" class="text-black">
					· {{ totalEstimate }} untuk {{ nights }} malam
				</span>
			</p>
		</div>
	</article>
</template>
