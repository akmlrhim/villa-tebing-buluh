<script setup>
import { ref, watch } from 'vue'
import IconGlyph from '../IconGlyph.vue'
import { formatRupiah } from '../../lib/format'

// Detail kamar read-only untuk admin (F-09): semua field kamar tanpa alur
// booking publik. prop.room: null = tersembunyi, object = tampil.
const props = defineProps({
	room: { type: Object, default: null },
})
const emit = defineEmits(['close', 'edit'])

const photoIndex = ref(0)

watch(
	() => props.room,
	() => {
		photoIndex.value = 0
	},
)

function prevPhoto() {
	const count = props.room.images.length
	photoIndex.value = (photoIndex.value - 1 + count) % count
}
function nextPhoto() {
	const count = props.room.images.length
	photoIndex.value = (photoIndex.value + 1) % count
}
</script>

<template>
	<div v-if="room" class="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
		@keydown.esc="emit('close')">
		<div class="absolute inset-0 bg-black/50" @click="emit('close')" />

		<div
			class="relative flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-lg bg-canvas shadow-float sm:rounded-lg">
			<header class="flex items-center justify-between border-b border-hairline-soft px-5 py-4">
				<div class="flex items-center gap-2.5">
					<h2 class="font-sans text-lg font-semibold text-ink">{{ room.name }}</h2>
					<span class="rounded-full px-2 py-0.5 text-[11px] font-medium"
						:class="room.is_active ? 'bg-primary/10 text-primary' : 'bg-surface-strong text-muted'">
						{{ room.is_active ? 'Aktif' : 'Nonaktif' }}
					</span>
				</div>
				<button type="button" class="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-strong"
					aria-label="Tutup detail kamar" @click="emit('close')">
					<IconGlyph name="x" class="h-5 w-5" />
				</button>
			</header>

			<div class="flex-1 overflow-y-auto">
				<!-- Galeri foto -->
				<div class="relative aspect-[16/9] overflow-hidden bg-surface-strong">
					<img v-if="room.images.length" :src="room.images[photoIndex]?.url"
						:alt="room.images[photoIndex]?.alt" class="h-full w-full object-cover" />
					<div v-else class="grid h-full w-full place-items-center text-muted-soft">
						<IconGlyph name="image" class="h-8 w-8" />
					</div>

					<template v-if="room.images.length > 1">
						<button type="button" class="absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-canvas text-ink shadow-float transition-transform hover:scale-105 left-3" aria-label="Foto sebelumnya" @click="prevPhoto">
							<IconGlyph name="chevron-left" class="h-5 w-5" />
						</button>
						<button type="button" class="absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-canvas text-ink shadow-float transition-transform hover:scale-105 right-3" aria-label="Foto berikutnya" @click="nextPhoto">
							<IconGlyph name="chevron-right" class="h-5 w-5" />
						</button>
						<span class="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">
							{{ photoIndex + 1 }}/{{ room.images.length }}
						</span>
					</template>
				</div>

				<div class="space-y-5 px-5 py-5">
					<p class="text-lg">
						<span class="font-semibold text-ink">{{ formatRupiah(room.price_per_night) }}</span>
						<span class="text-sm text-muted"> / malam</span>
					</p>

					<dl class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
						<div>
							<dt class="text-muted">Slug</dt>
							<dd class="mt-0.5 font-medium text-ink">{{ room.slug }}</dd>
						</div>
						<div>
							<dt class="text-muted">Maks. tamu</dt>
							<dd class="mt-0.5 font-medium text-ink">{{ room.max_guests }} tamu</dd>
						</div>
						<div>
							<dt class="text-muted">Min. menginap</dt>
							<dd class="mt-0.5 font-medium text-ink">{{ room.min_nights }} malam</dd>
						</div>
						<div>
							<dt class="text-muted">Tempat tidur</dt>
							<dd class="mt-0.5 font-medium text-ink">
								{{ room.bed_count }}{{ room.bed_type ? ` × ${room.bed_type}` : ' bed' }}
							</dd>
						</div>
						<div>
							<dt class="text-muted">Luas</dt>
							<dd class="mt-0.5 font-medium text-ink">{{ room.size_sqm ? `${room.size_sqm} m²` : '-' }}</dd>
						</div>
					</dl>

					<div v-if="room.description">
						<h3 class="font-sans text-sm font-semibold text-ink">Deskripsi</h3>
						<p class="mt-1.5 text-sm leading-relaxed text-body">{{ room.description }}</p>
					</div>

					<div v-if="room.amenities?.length">
						<h3 class="font-sans text-sm font-semibold text-ink">Fasilitas</h3>
						<ul class="mt-2 flex flex-wrap gap-2">
							<li v-for="amenity in room.amenities" :key="amenity"
								class="rounded-full bg-surface-strong px-3 py-1 text-sm text-body">
								{{ amenity }}
							</li>
						</ul>
					</div>
				</div>
			</div>

			<footer class="flex items-center justify-end gap-3 border-t border-hairline-soft px-5 py-4">
				<button type="button" class="inline-flex h-10.5 items-center justify-center gap-2 rounded-sm border border-hairline bg-canvas px-[1.1rem] text-[0.9375rem] font-medium text-ink transition-colors hover:border-border-strong" @click="emit('close')">Tutup</button>
				<button type="button" class="inline-flex h-10.5 items-center justify-center gap-2 rounded-sm bg-primary px-[1.1rem] text-[0.9375rem] font-medium text-white transition-colors hover:bg-primary-active disabled:opacity-60" @click="emit('edit', room)">
					<IconGlyph name="edit" class="h-5 w-5" /> Edit Kamar
				</button>
			</footer>
		</div>
	</div>
</template>
