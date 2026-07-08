<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AvailabilitySearch from '../components/AvailabilitySearch.vue'
import MasterCalendar from '../components/MasterCalendar.vue'
import RoomCard from '../components/RoomCard.vue'
import RoomDetailModal from '../components/RoomDetailModal.vue'
import IconGlyph from '../components/IconGlyph.vue'
import WhatsAppGlyph from '../components/WhatsAppGlyph.vue'
import { useRooms } from '../composables/useRooms'
import { useAvailability } from '../composables/useAvailability'
import { useSettings } from '../composables/useSettings'
import { demoGallery, heroImage } from '../data/demoData'
import { formatDateID, nightsBetween } from '../lib/format'
import { askAvailabilityMessage, waLink } from '../lib/whatsapp'

const { rooms, loading } = useRooms()
const { isRoomAvailable, fetchAvailability } = useAvailability()
const { whatsappNumber } = useSettings()

const query = ref(null) // { checkIn, checkOut, guests } | null
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
	if (room.max_guests < query.value.guests) return 'full'
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

const facilities = [
	{ icon: 'bed', label: '2 Kamar Tidur' },
	{ icon: 'utensils', label: 'Ruang Makan' },
	{ icon: 'sun', label: 'Pemanas Air' },
	{ icon: 'droplet', label: 'Kamar Mandi & Toilet' },
	{ icon: 'wind', label: 'Kamar AC' },
	{ icon: 'bath', label: 'Bak Mandi' },
	{ icon: 'net', label: 'Jaring Tali' },
	{ icon: 'coffee', label: 'Sarapan untuk 4 Orang' },
]

const galleryPeek = demoGallery.filter((item) => item.group !== 'Kamar').slice(0, 5)
</script>

<template>
	<div>
		<!-- Hero (F-01.1) -->
		<!-- -mt menarik hero ke bawah navbar (navbar transparan sebelum di-scroll) -->
		<section
			class="relative isolate -mt-14 flex min-h-[540px] flex-col justify-end pb-24 md:-mt-20 md:h-[78vh] md:max-h-[820px] md:pb-28">
			<img :src="heroImage.url" :alt="heroImage.alt" fetchpriority="high"
				class="absolute inset-0 -z-10 h-full w-full object-cover" />
			<div class="absolute inset-0 -z-10 bg-gradient-to-t from-black/60 via-black/25 to-black/15" />
			<!-- Scrim atas: menjaga keterbacaan link navbar putih di atas foto -->
			<div class="absolute inset-x-0 top-0 -z-10 h-36 bg-gradient-to-b from-black/45 to-transparent" />

			<div class="mx-auto w-full max-w-6xl px-4 pt-40 sm:px-6">
				<h1
					class="rise-in max-w-xl text-[clamp(2.1rem,5vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-white">
					Menginap tenang di tepi tebing bambu
				</h1>
				<p class="rise-in-late mt-4 max-w-lg text-sm leading-relaxed text-white/90 md:text-base">
					Vila privat dengan kolam renang, suara sungai, dan udara yang lambat.
					Cek tanggal kosong di bawah, lalu booking cukup lewat WhatsApp.
				</p>
				<div class="rise-in-late mt-8 flex flex-wrap gap-3">
					<a href="#cek-ketersediaan"
						class="flex h-12 items-center rounded-sm bg-primary px-6 text-base font-medium text-white transition-colors hover:bg-primary-active">
						Cek Ketersediaan
					</a>
					<a href="#kamar"
						class="flex h-12 items-center rounded-sm border border-white/70 px-6 text-base font-medium text-white transition-colors hover:bg-white/10">
						Lihat Kamar
					</a>
				</div>
			</div>
		</section>

		<!-- Widget cek ketersediaan (F-01.2) -->
		<section id="cek-ketersediaan" class="relative z-10 mx-auto -mt-12 w-full max-w-4xl scroll-mt-24 px-4 sm:px-6">
			<AvailabilitySearch :max-guests="10" @search="onSearch" @clear="onClear" />
		</section>

		<!-- Daftar kamar (F-01.3) -->
		<section id="kamar" ref="roomsSection" class="mx-auto max-w-6xl scroll-mt-24 px-4 pt-16 sm:px-6 md:pt-20">
			<div class="flex flex-wrap items-end justify-between gap-3">
				<div>
					<h2 class="text-[22px] font-semibold tracking-tight text-ink md:text-2xl">Pilih kamarmu</h2>
					<p v-if="!query" class="mt-1 text-sm text-muted">
						Hanya tiga unit, supaya vila tetap terasa sepi dan personal.
					</p>
					<p v-else class="mt-1 text-sm text-muted" aria-live="polite">
						<strong class="font-semibold text-ink">{{ availableCount }} kamar tersedia</strong>
						· {{ formatDateID(query.checkIn, { weekday: false }) }} –
						{{ formatDateID(query.checkOut, { weekday: false }) }}
						· {{ nights }} malam · {{ query.guests }} tamu
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
				<p class="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
					Sementara itu, tanyakan langsung ketersediaan dan harga kamar ke admin.
				</p>
				<a :href="waLink(whatsappNumber, 'Halo, saya ingin bertanya tentang kamar di Villa Tebing Buluh.')"
					target="_blank" rel="noopener"
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
				<a :href="waLink(whatsappNumber, askAvailabilityMessage(query))" target="_blank" rel="noopener"
					class="mt-5 inline-flex h-12 items-center gap-2 rounded-sm bg-primary px-6 text-base font-medium text-white transition-colors hover:bg-primary-active">
					<WhatsAppGlyph class="h-5 w-5" />
					Tanya Admin via WhatsApp
				</a>
			</div>
		</section>

		<!-- Kalender master: semua booking dalam satu kalender -->
		<section v-if="rooms.length" id="kalender" class="mx-auto max-w-6xl scroll-mt-24 px-4 pt-16 sm:px-6 md:pt-20">
			<h2 class="text-[22px] font-semibold tracking-tight text-ink md:text-2xl">Kalender hunian vila</h2>
			<p class="mt-1 max-w-[65ch] text-sm text-muted">
				Semua booking yang sudah masuk terlihat di satu kalender. Klik tanggal
				untuk melihat kamar mana saja yang terisi malam itu.
			</p>
			<div class="mt-7">
				<MasterCalendar @open-room="selectedRoom = $event" />
			</div>
		</section>

		<!-- Fasilitas vila (F-01.4) -->
		<section class="mt-20 bg-surface-soft py-16 md:mt-24 md:py-20">
			<div class="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[1fr_1.3fr] md:gap-16">
				<div>
					<h2 class="text-[22px] font-semibold tracking-tight text-ink md:text-2xl">
						Semua yang kamu butuhkan, tidak lebih
					</h2>
					<p class="mt-3 max-w-sm text-[15px] leading-relaxed text-body">
						Vila kecil di tepian sungai dengan rumpun bambu di belakangnya.
						Fasilitasnya dipilih supaya kamu betah berlama-lama, bukan sekadar
						panjang di daftar.
					</p>
					<RouterLink to="/about"
						class="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline underline-offset-4 transition-colors hover:text-primary">
						Selengkapnya tentang vila
						<IconGlyph name="arrow-right" class="h-4 w-4" />
					</RouterLink>
				</div>
				<ul class="grid gap-x-8 gap-y-4 sm:grid-cols-2">
					<li v-for="facility in facilities" :key="facility.label"
						class="flex items-center gap-3 text-[15px] text-body">
						<span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-canvas shadow-float">
							<IconGlyph :name="facility.icon" class="h-5 w-5 text-ink" />
						</span>
						{{ facility.label }}
					</li>
				</ul>
			</div>
		</section>

		<!-- Intip galeri -->
		<section class="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
			<div class="flex items-end justify-between gap-4">
				<h2 class="text-[22px] font-semibold tracking-tight text-ink md:text-2xl">Suasana di sini</h2>
				<RouterLink to="/gallery"
					class="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-ink underline underline-offset-4 transition-colors hover:text-primary">
					Lihat semua foto
					<IconGlyph name="arrow-right" class="h-4 w-4" />
				</RouterLink>
			</div>
			<div class="scrollbar-none -mx-4 mt-6 flex snap-x gap-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
				<RouterLink v-for="(item, index) in galleryPeek" :key="index" to="/gallery"
					class="group w-72 shrink-0 snap-start overflow-hidden rounded-md bg-surface-strong md:w-80"
					:aria-label="`Buka galeri: ${item.alt}`">
					<img :src="item.url" :alt="item.alt" loading="lazy"
						class="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]" />
				</RouterLink>
			</div>
		</section>

		<RoomDetailModal :room="selectedRoom"
			:initial-range="query ? { checkIn: query.checkIn, checkOut: query.checkOut } : null"
			:initial-guests="query?.guests ?? 2" @close="closeRoom" />
	</div>
</template>

<style scoped>
.scrollbar-none {
	scrollbar-width: none;
}

.scrollbar-none::-webkit-scrollbar {
	display: none;
}
</style>
