<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import IconGlyph from './IconGlyph.vue'

const props = defineProps({
	items: { type: Array, required: true },
	index: { type: Number, default: 0 },
	open: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'update:index'])

const dialogEl = ref(null)
const current = computed(() => props.items[props.index])

watch(
	() => props.open,
	async (open) => {
		if (open) {
			await nextTick()
			dialogEl.value?.showModal()
			document.documentElement.style.overflow = 'hidden'
		} else {
			dialogEl.value?.close()
			document.documentElement.style.overflow = ''
		}
	},
)

function prev() {
	emit('update:index', (props.index - 1 + props.items.length) % props.items.length)
}
function next() {
	emit('update:index', (props.index + 1) % props.items.length)
}

function onKeydown(event) {
	if (event.key === 'ArrowLeft') prev()
	else if (event.key === 'ArrowRight') next()
}

function onBackdropClick(event) {
	if (event.target === dialogEl.value) emit('close')
}
</script>

<template>
	<dialog ref="dialogEl" class="m-0 h-dvh max-h-none w-screen max-w-none bg-black/95 p-0" @close="emit('close')"
		@keydown="onKeydown" @click="onBackdropClick">
		<div v-if="open && current" class="relative flex h-full flex-col">
			<div class="flex items-center justify-between px-4 py-3">
				<span class="text-sm text-white/70">{{ index + 1 }} / {{ items.length }}</span>
				<button type="button"
					class="grid h-11 w-11 place-items-center rounded-full text-white transition-colors hover:bg-white/10"
					aria-label="Tutup galeri" @click="emit('close')">
					<IconGlyph name="x" class="h-5 w-5" />
				</button>
			</div>

			<div class="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4 md:px-20">
				<img :key="index" :src="current.url" :alt="current.alt"
					class="max-h-full max-w-full rounded-sm object-contain" />

				<template v-if="items.length > 1">
					<button type="button"
						class="absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/24 left-3 md:left-6"
						aria-label="Foto sebelumnya" @click="prev">
						<IconGlyph name="chevron-left" class="h-5 w-5" />
					</button>
					<button type="button"
						class="absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/12 text-white transition-colors hover:bg-white/24 right-3 md:right-6"
						aria-label="Foto berikutnya" @click="next">
						<IconGlyph name="chevron-right" class="h-5 w-5" />
					</button>
				</template>
			</div>
		</div>
	</dialog>
</template>

<style scoped>
dialog::backdrop {
	background: transparent;
}
</style>
