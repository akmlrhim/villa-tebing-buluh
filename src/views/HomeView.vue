<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AvailabilitySearch from '../components/AvailabilitySearch.vue'
import MasterCalendar from '../components/MasterCalendar.vue'
import RoomCard from '../components/RoomCard.vue'
import RoomDetailModal from '../components/RoomDetailModal.vue'
import WhatsAppGlyph from '../components/WhatsAppGlyph.vue'
import HeroSection from '../components/home/HeroSection.vue'
import VillaFacilities from '../components/home/VillaFacilities.vue'
import GalleryPeek from '../components/home/GalleryPeek.vue'
import { useRooms } from '../composables/useRooms'
import { useAvailability } from '../composables/useAvailability'
import { useSettings } from '../composables/useSettings'
import { formatDateID, nightsBetween } from '../lib/format'
import { askAvailabilityMessage, waLink } from '../lib/whatsapp'

const { rooms, loading } = useRooms()
const { isRoomAvailable, fetchAvailability } = useAvailability()
const { whatsappNumber } = useSettings()

const query = ref(null) // { checkIn, checkOut } | null
const selectedRoom = ref(null)
const roomsSection = ref(null)

// Deep-link: /?kamar=<slug> langsung membuka modal detail kamar.
const route = useRoute()
const router = useRouter()
watchEffect(() => {
	const slug = route.query.kamar
	if (slug && rooms.value.length) {
		selectedRoom.value = rooms.value.find((room) => room.slug === slug) ?? null
	}
})

function closeRoom() {
	selectedRoom.value = null
	if (route.query.kamar) router.replace({ query: {} })
}

const nights = computed(() =>
	query.value ? nightsBetween(query.value.checkIn, query.value.checkOut) : 0,
)

// F-01.3: badge Tersedia/Penuh mengikuti tanggal yang dipilih.
function roomStatus(room) {
	if (!query.value) return null
	return isRoomAvailable(room.id, query.value.checkIn, query.value.checkOut)
		? 'available'
		: 'full'
}

const availableCount = computed(() =>
	query.value ? rooms.value.filter((room) => roomStatus(room) === 'available').length : 0,
)

async function onSearch(criteria) {
	await fetchAvailability({ refresh: true }) // data real-time, tanpa cache basi
	query.value = criteria
	roomsSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function onClear() {
	query.value = null
}
</script>

<template>
	<div>
		<HeroSection />

		<!-- Widget cek ketersediaan (F-01.2) -->
		<section id="cek-ketersediaan" class="relative z-10 mx-auto -mt-12 w-full max-w-4xl scroll-mt-24 px-4 sm:px-6">
			<AvailabilitySearch @search="onSearch" @clear="onClear" />
		</section>

		<!-- Daftar kamar (F-01.3) -->
		<section id="kamar" ref="roomsSection" class="mx-auto max-w-6xl scroll-mt-24 px-4 pt-16 sm:px-6 md:pt-20">
			<div class="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h2 class="text-[22px] font-semibold tracking-tight text-ink md:text-2xl">Pilih kamarmu</h2>
					<p v-if="query" class="mt-1 text-sm text-muted" aria-live="polite">
						<strong class="font-semibold text-ink">{{ availableCount }} kamar tersedia</strong>
						· {{ formatDateID(query.checkIn, { weekday: false }) }} –
						{{ formatDateID(query.checkOut, { weekday: false }) }}
						· {{ nights }} malam
					</p>
				</div>
				<button v-if="query" type="button"
					class="text-sm font-medium text-ink underline underline-offset-4 hover:text-primary" @click="onClear">
					Hapus filter tanggal
				</button>
			</div>

			<!-- Skeleton saat memuat -->
			<div v-if="loading" class="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
				<div v-for="index in 3" :key="index" class="animate-pulse">
					<div class="aspect-[4/3] rounded-md bg-surface-strong" />
					<div class="mt-3 h-4 w-2/3 rounded-xs bg-surface-strong" />
					<div class="mt-2 h-3.5 w-1/2 rounded-xs bg-surface-soft" />
				</div>
			</div>

			<div v-else class="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
				<RoomCard v-for="room in rooms" :key="room.id" :room="room" :status="roomStatus(room)" :nights="nights"
					@open="selectedRoom = room" />
			</div>

			<!-- Data kamar belum tersedia (mis. tabel belum diisi) -->
			<div v-if="!loading && rooms.length === 0"
				class="mt-8 rounded-md border border-hairline bg-surface-soft px-6 py-8 text-center">
				<p class="text-base font-semibold text-ink">Daftar kamar sedang disiapkan</p>
				<p class="mx-auto mt-2 max-w-md text-sm leading-relaxed text-black">
					Sementara itu, tanyakan langsung ketersediaan dan harga kamar ke admin.
				</p>
				<a :href="waLink(whatsappNumber, 'Halo, saya ingin bertanya tentang kamar di Villa Tebing Buluh.')"
					target="_blank" rel="noopener noreferrer"
					class="mt-5 inline-flex h-12 items-center gap-2 rounded-sm bg-primary px-6 text-base font-medium text-white transition-colors hover:bg-primary-active">
					<WhatsAppGlyph class="h-5 w-5" />
					Tanya Admin via WhatsApp
				</a>
			</div>

			<!-- Tidak ada kamar tersedia (F-02.5) -->
			<div v-if="query && rooms.length > 0 && availableCount === 0 && !loading"
				class="mt-10 rounded-md border border-hairline bg-surface-soft px-6 py-8 text-center">
				<p class="text-base font-semibold text-ink">Tanggal itu sudah penuh semua 😔</p>
				<p class="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
					Coba geser tanggalnya satu atau dua hari, atau tanyakan langsung ke
					admin. Kadang ada pembatalan yang belum masuk kalender.
				</p>
				<a :href="waLink(whatsappNumber, askAvailabilityMessage(query))" target="_blank" rel="noopener noreferrer"
					class="mt-5 inline-flex h-12 items-center gap-2 rounded-sm bg-primary px-6 text-base font-medium text-white transition-colors hover:bg-primary-active">
					<WhatsAppGlyph class="h-5 w-5" />
					Tanya Admin via WhatsApp
				</a>
			</div>
		</section>

		<!-- Kalender master: semua booking dalam satu kalender -->
		<section v-if="rooms.length" id="kalender" class="mx-auto max-w-6xl scroll-mt-24 px-4 pt-16 sm:px-6 md:pt-20">
			<h2 class="text-[22px] font-semibold tracking-tight text-black md:text-2xl">Kalender hunian vila</h2>
			<p class="mt-1 max-w-[65ch] text-sm text-black">
				Semua booking yang sudah masuk terlihat di satu kalender. Klik tanggal
				untuk melihat kamar mana saja yang terisi malam itu.
			</p>
			<div class="mt-7">
				<MasterCalendar @open-room="selectedRoom = $event" />
			</div>
		</section>

		<VillaFacilities />

		<GalleryPeek />

		<RoomDetailModal :room="selectedRoom"
			:initial-range="query ? { checkIn: query.checkIn, checkOut: query.checkOut } : null" @close="closeRoom" />
	</div>
</template>
