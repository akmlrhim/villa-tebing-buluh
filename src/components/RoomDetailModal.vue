<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import IconGlyph from './IconGlyph.vue'
import AvailabilityCalendar from './AvailabilityCalendar.vue'
import RoomGallery from './RoomGallery.vue'
import RoomAmenities from './RoomAmenities.vue'
import RoomBookingPanel from './RoomBookingPanel.vue'
import { useAvailability } from '../composables/useAvailability'
import { usePromos } from '../composables/usePromos'
import { formatRupiah, nightsBetween } from '../lib/format'

const props = defineProps({
	room: { type: Object, default: null },
	initialRange: { type: Object, default: null },
	initialGuests: { type: Number, default: 2 },
})
const emit = defineEmits(['close'])

const dialogEl = ref(null)
const range = ref(null)
const guests = ref(2)

const router = useRouter()
const { occupiedNights } = useAvailability()
const { stayPrice, promoHighlight } = usePromos()

const occupied = computed(() =>
	props.room ? occupiedNights(props.room.id) : new Set(),
)

watch(
	() => props.room,
	async (room) => {
		if (room) {
			guests.value = Math.min(props.initialGuests, room.max_guests)
			const preset = props.initialRange
			const presetValid =
				preset &&
				![...occupied.value].some((iso) => iso >= preset.checkIn && iso < preset.checkOut)
			range.value = presetValid ? { ...preset } : null
			await nextTick()
			dialogEl.value?.showModal()
			document.documentElement.style.overflow = 'hidden'
		} else {
			dialogEl.value?.close()
			document.documentElement.style.overflow = ''
		}
	},
)

const nights = computed(() =>
	range.value ? nightsBetween(range.value.checkIn, range.value.checkOut) : 0,
)
const belowMinNights = computed(
	() => props.room && nights.value > 0 && nights.value < props.room.min_nights,
)
const stay = computed(() =>
	props.room && range.value
		? stayPrice(props.room, range.value.checkIn, range.value.checkOut)
		: null,
)
const highlight = computed(() => (props.room ? promoHighlight(props.room) : null))
const canBook = computed(() => range.value && !belowMinNights.value)

function goToPayment() {
	if (!props.room || !canBook.value) return
	emit('close')
	router.push({
		name: 'payment',
		query: {
			kamar: props.room.slug,
			checkIn: range.value.checkIn,
			checkOut: range.value.checkOut,
			tamu: guests.value,
		},
	})
}

const metaLine = computed(() => {
	if (!props.room) return ''
	const parts = []
	parts.push(`${props.room.max_guests} tamu`)
	parts.push(
		`${props.room.bed_count} ${props.room.bed_type ? `bed ${props.room.bed_type.toLowerCase()}` : 'bed'}`,
	)
	if (props.room.size_sqm) parts.push(`${props.room.size_sqm} m²`)
	return parts.join(' · ')
})

function onBackdropClick(event) {
	if (event.target === dialogEl.value) emit('close')
}
</script>

<template>
	<dialog ref="dialogEl"
		class="m-0 h-dvh max-h-none w-full max-w-none bg-canvas p-0 md:m-auto md:h-auto md:max-h-[94dvh] md:max-w-4xl rounded-sm"
		@close="emit('close')" @click="onBackdropClick">
		<div v-if="room" class="flex h-full max-h-dvh flex-col overflow-y-auto md:max-h-[94dvh]">
			<div
				class="sticky top-0 z-10 flex items-center justify-between border-b border-hairline-soft bg-canvas px-4 py-3 md:px-8">
				<p class="text-sm font-semibold text-ink">{{ room.name }}</p>
				<button type="button"
					class="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-surface-soft"
					aria-label="Tutup detail kamar" @click="emit('close')">
					<IconGlyph name="x" class="h-5 w-5" />
				</button>
			</div>

			<RoomGallery :images="room.images" />

			<div class="px-4 py-6 md:px-8 md:py-8">
				<div class="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
					<div>
						<h2 class="text-xl font-semibold tracking-tight text-ink md:text-[22px]">{{ room.name }}</h2>
					</div>
					<p class="text-lg">
						<span v-if="highlight?.running" class="mr-1.5 text-base text-muted line-through">{{
							formatRupiah(room.price_per_night) }}</span>
						<span class="font-semibold" :class="highlight?.running ? 'text-primary' : 'text-ink'">{{
							formatRupiah(highlight?.running ? highlight.price : room.price_per_night) }}</span>
						<span class="text-sm text-muted"> / malam</span>
					</p>
				</div>

				<p class="mt-4 max-w-[65ch] text-[14px] leading-relaxed text-body">
					{{ room.description }}
				</p>

				<hr class="my-7 border-hairline-soft" />
				<RoomAmenities :amenities="room.amenities" />

				<hr class="my-7 border-hairline-soft" />
				<h3 class="text-lg font-semibold text-ink">Pilih tanggal menginap</h3>
				<p class="mt-1 text-sm text-muted">
					Klik tanggal check-in lalu tanggal check-out. Tanggal tercoret sudah terisi.
				</p>

				<div class="mt-6 grid items-start gap-8 md:grid-cols-[1fr_310px]">
					<AvailabilityCalendar v-model="range" :occupied="occupied" />

					<RoomBookingPanel :room="room" :range="range" v-model:guests="guests" :nights="nights"
						:stay="stay" :below-min-nights="belowMinNights" :can-book="canBook" @book="goToPayment" />
				</div>
			</div>
		</div>
	</dialog>
</template>

<style scoped>
dialog::backdrop {
	background: rgb(0 0 0 / 0.5);
}
</style>
