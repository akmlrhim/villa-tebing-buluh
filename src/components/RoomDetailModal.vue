<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import IconGlyph from './IconGlyph.vue'
import WhatsAppGlyph from './WhatsAppGlyph.vue'
import AvailabilityCalendar from './AvailabilityCalendar.vue'
import { useAvailability } from '../composables/useAvailability'
import { useSettings } from '../composables/useSettings'
import { formatDateID, formatRupiah, nightsBetween } from '../lib/format'
import { bookingMessage, waLink } from '../lib/whatsapp'

// F-03: detail kamar sebagai modal - galeri, fasilitas, kalender, booking WA.
const props = defineProps({
	room: { type: Object, default: null },
	/** Rentang dari widget pencarian Home, dipakai sebagai pra-pilihan */
	initialRange: { type: Object, default: null },
	initialGuests: { type: Number, default: 2 },
})
const emit = defineEmits(['close'])

const dialogEl = ref(null)
const photoIndex = ref(0)
const range = ref(null)
const guests = ref(2)

const { occupiedNights } = useAvailability()
const { whatsappNumber } = useSettings()

const occupied = computed(() =>
	props.room ? occupiedNights(props.room.id) : new Set(),
)

watch(
	() => props.room,
	async (room) => {
		if (room) {
			photoIndex.value = 0
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
const total = computed(() =>
	props.room && nights.value > 0 ? props.room.price_per_night * nights.value : 0,
)
const canBook = computed(() => range.value && !belowMinNights.value)

const bookingUrl = computed(() => {
	if (!props.room || !canBook.value) return '#'
	return waLink(
		whatsappNumber.value,
		bookingMessage({
			roomName: props.room.name,
			checkIn: range.value.checkIn,
			checkOut: range.value.checkOut,
			guests: guests.value,
		}),
	)
})

const metaLine = computed(() => {
	if (!props.room) return ''
	const parts = []
	if (props.room.floor_number) parts.push(`Lantai ${props.room.floor_number}`)
	parts.push(`${props.room.max_guests} tamu`)
	parts.push(
		`${props.room.bed_count} ${props.room.bed_type ? `bed ${props.room.bed_type.toLowerCase()}` : 'bed'}`,
	)
	if (props.room.size_sqm) parts.push(`${props.room.size_sqm} m²`)
	return parts.join(' · ')
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

function prevPhoto() {
	const count = props.room.images.length
	photoIndex.value = (photoIndex.value - 1 + count) % count
}
function nextPhoto() {
	const count = props.room.images.length
	photoIndex.value = (photoIndex.value + 1) % count
}

function onBackdropClick(event) {
	if (event.target === dialogEl.value) emit('close')
}
</script>

<template>
	<dialog ref="dialogEl"
		class="m-0 h-dvh max-h-none w-full max-w-none bg-canvas p-0 md:m-auto md:h-auto md:max-h-[94dvh] md:max-w-4xl rounded-sm"
		@close="emit('close')" @click="onBackdropClick">
		<div v-if="room" class="flex h-full max-h-dvh flex-col overflow-y-auto md:max-h-[94dvh]">
			<!-- Header -->
			<div
				class="sticky top-0 z-10 flex items-center justify-between border-b border-hairline-soft bg-canvas px-4 py-3 md:px-8">
				<p class="text-sm font-semibold text-ink">{{ room.name }}</p>
				<button type="button"
					class="grid h-10 w-10 place-items-center rounded-full transition-colors hover:bg-surface-soft"
					aria-label="Tutup detail kamar" @click="emit('close')">
					<IconGlyph name="x" class="h-5 w-5" />
				</button>
			</div>

			<!-- Galeri foto (F-03.2) -->
			<div class="relative aspect-[16/10] shrink-0 overflow-hidden bg-surface-strong md:aspect-[2/1]">
				<Transition name="photo-fade">
					<img :key="photoIndex" :src="room.images[photoIndex]?.url" :alt="room.images[photoIndex]?.alt"
						class="absolute inset-0 h-full w-full object-cover" />
				</Transition>

				<template v-if="room.images.length > 1">
					<button type="button" class="photo-nav left-3" aria-label="Foto sebelumnya" @click="prevPhoto">
						<IconGlyph name="chevron-left" class="h-5 w-5" />
					</button>
					<button type="button" class="photo-nav right-3" aria-label="Foto berikutnya" @click="nextPhoto">
						<IconGlyph name="chevron-right" class="h-5 w-5" />
					</button>
					<div class="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
						<button v-for="(image, index) in room.images" :key="index" type="button"
							class="h-2 w-2 rounded-full transition-colors"
							:class="index === photoIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/75'"
							:aria-label="`Lihat foto ${index + 1}`" @click="photoIndex = index" />
					</div>
					<span class="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
						{{ photoIndex + 1 }}/{{ room.images.length }}
					</span>
				</template>
			</div>

			<div class="px-4 py-6 md:px-8 md:py-8">
				<!-- Info kamar (F-03.3) -->
				<div class="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
					<div>
						<h2 class="text-xl font-semibold tracking-tight text-ink md:text-[22px]">{{ room.name }}</h2>
					</div>
					<p class="text-lg">
						<span class="font-semibold text-ink">{{ formatRupiah(room.price_per_night) }}</span>
						<span class="text-sm text-muted"> / malam</span>
					</p>
				</div>

				<p class="mt-4 max-w-[65ch] text-[15px] leading-relaxed text-body">
					{{ room.description }}
				</p>

				<!-- Fasilitas (F-03.4) -->
				<hr class="my-7 border-hairline-soft" />
				<h3 class="text-lg font-semibold text-ink">Fasilitas kamar</h3>
				<ul class="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
					<li v-for="amenity in room.amenities" :key="amenity" class="flex items-center gap-3 text-[15px] text-body">
						<IconGlyph :name="amenityIcon(amenity)" class="h-5 w-5 shrink-0 text-muted" />
						{{ amenity }}
					</li>
				</ul>

				<!-- Kalender + booking (F-03.5, F-03.7) -->
				<hr class="my-7 border-hairline-soft" />
				<h3 class="text-lg font-semibold text-ink">Pilih tanggal menginap</h3>
				<p class="mt-1 text-sm text-muted">
					Klik tanggal check-in lalu tanggal check-out. Tanggal tercoret sudah terisi.
				</p>

				<div class="mt-6 grid items-start gap-8 md:grid-cols-[1fr_310px]">
					<AvailabilityCalendar v-model="range" :occupied="occupied" />

					<div class="rounded-md border border-hairline bg-canvas p-5 shadow-float">
						<div class="grid grid-cols-2 gap-2">
							<div class="rounded-sm border border-hairline px-3 py-2">
								<p class="text-[11px] font-semibold uppercase tracking-wide text-muted">Check-in</p>
								<p class="mt-0.5 text-sm" :class="range ? 'text-ink' : 'text-muted-soft'">
									{{ range ? formatDateID(range.checkIn) : 'Pilih tanggal' }}
								</p>
							</div>
							<div class="rounded-sm border border-hairline px-3 py-2">
								<p class="text-[11px] font-semibold uppercase tracking-wide text-muted">Check-out</p>
								<p class="mt-0.5 text-sm" :class="range ? 'text-ink' : 'text-muted-soft'">
									{{ range ? formatDateID(range.checkOut) : 'Pilih tanggal' }}
								</p>
							</div>
						</div>

						<div class="mt-3 flex items-center justify-between rounded-sm border border-hairline px-3 py-2">
							<p class="text-sm text-ink">Jumlah tamu</p>
							<div class="flex items-center gap-2.5">
								<button type="button" class="mini-stepper" aria-label="Kurangi tamu" :disabled="guests <= 1"
									@click="guests--">−</button>
								<span class="min-w-5 text-center text-sm font-medium">{{ guests }}</span>
								<button type="button" class="mini-stepper" aria-label="Tambah tamu"
									:disabled="guests >= room.max_guests" @click="guests++">+</button>
							</div>
						</div>
						<p class="mt-1.5 text-xs text-muted">Maksimal {{ room.max_guests }} tamu untuk kamar ini.</p>

						<div v-if="nights > 0" class="mt-4 space-y-1.5 border-t border-hairline-soft pt-4 text-sm">
							<div class="flex justify-between text-body">
								<span>{{ formatRupiah(room.price_per_night) }} × {{ nights }} malam</span>
								<span>{{ formatRupiah(total) }}</span>
							</div>
							<div class="flex justify-between font-semibold text-ink">
								<span>Estimasi total</span>
								<span>{{ formatRupiah(total) }}</span>
							</div>
						</div>

						<p v-if="belowMinNights" class="mt-3 text-sm text-error" role="alert">
							Kamar ini minimal menginap {{ room.min_nights }} malam.
						</p>

						<a v-if="canBook" :href="bookingUrl" target="_blank" rel="noopener"
							class="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-primary text-base font-medium text-white transition-colors hover:bg-primary-active">
							<WhatsAppGlyph class="h-5 w-5" />
							Booking via WhatsApp
						</a>
						<button v-else type="button" disabled
							class="mt-4 flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-sm bg-primary-disabled text-base font-medium text-white">
							<WhatsAppGlyph class="h-5 w-5" />
							Booking via WhatsApp
						</button>
						<p class="mt-3 text-xs leading-relaxed text-muted">
							Tanpa pembayaran online. Ketersediaan dikonfirmasi dan pembayaran
							diproses oleh admin melalui WhatsApp.
						</p>
					</div>
				</div>
			</div>
		</div>
	</dialog>
</template>

<style scoped>
dialog::backdrop {
	background: rgb(0 0 0 / 0.5);
}

.photo-nav {
	position: absolute;
	top: 50%;
	translate: 0 -50%;
	display: grid;
	place-items: center;
	height: 40px;
	width: 40px;
	border-radius: 9999px;
	background: var(--color-canvas);
	color: var(--color-ink);
	box-shadow: var(--shadow-float);
	transition: transform 0.15s ease;
}

.photo-nav:hover {
	transform: translateY(0) scale(1.05);
}

.mini-stepper {
	display: grid;
	place-items: center;
	height: 28px;
	width: 28px;
	border-radius: 9999px;
	border: 1px solid var(--color-border-strong);
	color: var(--color-ink);
	font-size: 14px;
	line-height: 1;
}

.mini-stepper:hover:not(:disabled) {
	border-color: var(--color-ink);
}

.mini-stepper:disabled {
	border-color: var(--color-hairline-soft);
	color: var(--color-muted-soft);
	cursor: not-allowed;
}

.photo-fade-enter-active {
	transition: opacity 0.3s ease;
}

.photo-fade-leave-active {
	transition: opacity 0.3s ease;
}

.photo-fade-enter-from,
.photo-fade-leave-to {
	opacity: 0;
}
</style>
