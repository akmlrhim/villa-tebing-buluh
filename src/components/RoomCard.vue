<script setup>
import { computed } from 'vue'
import { formatRupiah, formatDateID } from '../lib/format'
import { usePromos } from '../composables/usePromos'
import { promoDiscountLabel } from '../../shared/pricing'

const props = defineProps({
	room: { type: Object, required: true },
	status: { type: String, default: null },
	nights: { type: Number, default: 0 },
	checkIn: { type: String, default: '' },
	checkOut: { type: String, default: '' },
})

const emit = defineEmits(['open'])

const { stayPrice, promoHighlight } = usePromos()

const cover = computed(() => props.room.images?.[0])
const metaLine = computed(() => {
	const parts = [
		`${props.room.max_guests} tamu`,
		`${props.room.bed_count} ${props.room.bed_type ? `bed ${props.room.bed_type.toLowerCase()}` : 'bed'}`,
	]
	if (props.room.size_sqm) parts.push(`${props.room.size_sqm} m²`)
	return parts.join(' · ')
})

const highlight = computed(() => promoHighlight(props.room))

const stay = computed(() =>
	props.checkIn && props.checkOut ? stayPrice(props.room, props.checkIn, props.checkOut) : null,
)
const hasStayDiscount = computed(() => (stay.value?.discount ?? 0) > 0)
</script>

<template>
	<article class="group relative">
		<div class="relative aspect-[4/3] overflow-hidden rounded-md bg-surface-strong">
			<img v-if="cover" :src="cover.url" :srcset="cover.srcset"
				sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" :alt="cover.alt" loading="lazy"
				class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
				:class="status === 'full' ? 'opacity-55 saturate-[0.6]' : ''" />
			<span v-if="status"
				class="absolute left-3 top-3 rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold shadow-float"
				:class="status === 'available' ? 'text-black' : 'text-error'">
				{{ status === 'available' ? 'Tersedia' : 'Penuh' }}
			</span>
			<span v-if="highlight" class="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-white shadow-float">
				{{ highlight.running
					? promoDiscountLabel(highlight.promo)
					: `Promo ${formatDateID(highlight.promo.start_date, { weekday: false })}` }}
			</span>
		</div>

		<div class="pt-3">
			<div class="flex items-baseline justify-between gap-3">
				<h3 class="text-base font-semibold text-ink">
					<button type="button" class="text-left after:absolute after:inset-0 after:cursor-pointer"
						@click="emit('open', room)">
						{{ room.name }}
					</button>
				</h3>
			</div>
			<p class="mt-0.5 text-sm text-black">{{ metaLine }}</p>
			<p class="mt-1.5 text-base">
				<span v-if="highlight?.running" class="mr-1.5 text-black line-through">
					{{ formatRupiah(room.price_per_night) }}
				</span>
				<span class="font-semibold" :class="highlight?.running ? 'text-primary' : 'text-ink'">
					{{ formatRupiah(highlight?.running ? highlight.price : room.price_per_night) }}
				</span>
				<span class="text-black"> / malam</span>
			</p>
			<p v-if="stay?.nights && status === 'available'" class="mt-0.5 text-sm text-black">
				<span v-if="hasStayDiscount" class="mr-1.5 line-through">{{ formatRupiah(stay.baseTotal) }}</span>
				<span :class="hasStayDiscount && 'font-semibold text-primary'">{{ formatRupiah(stay.total) }}</span>
				untuk {{ nights }} malam
			</p>
		</div>
	</article>
</template>
