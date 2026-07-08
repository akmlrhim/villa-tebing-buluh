<script setup>
import { computed, ref } from 'vue'
import IconGlyph from './IconGlyph.vue'
import { addDaysISO, todayISO } from '../lib/format'

// F-02: widget cek ketersediaan - check-in, check-out, jumlah tamu.
const emit = defineEmits(['search', 'clear'])
const props = defineProps({
	maxGuests: { type: Number, default: 10 },
})

const checkIn = ref('')
const checkOut = ref('')
const guests = ref(2)
const errorMessage = ref('')
const hasSearched = ref(false)

const today = todayISO()
const minCheckOut = computed(() =>
	checkIn.value ? addDaysISO(checkIn.value, 1) : addDaysISO(today, 1),
)

function submit() {
	errorMessage.value = ''

	if (!checkIn.value || !checkOut.value) {
		errorMessage.value = 'Pilih tanggal check-in dan check-out dulu, ya.'
		return
	}
	if (checkIn.value < today) {
		errorMessage.value = 'Tanggal check-in tidak boleh di masa lalu.'
		return
	}
	if (checkOut.value <= checkIn.value) {
		errorMessage.value = 'Tanggal check-out harus setelah check-in.'
		return
	}

	hasSearched.value = true
	emit('search', { checkIn: checkIn.value, checkOut: checkOut.value, guests: guests.value })
}

function clear() {
	checkIn.value = ''
	checkOut.value = ''
	guests.value = 2
	errorMessage.value = ''
	hasSearched.value = false
	emit('clear')
}

defineExpose({ clear })
</script>

<template>
	<form class="rounded-md border border-hairline bg-canvas shadow-float" novalidate @submit.prevent="submit">
		<div class="flex flex-col md:flex-row md:items-stretch">
			<label class="segment md:flex-1">
				<span class="segment-label">Check-in</span>
				<input v-model="checkIn" type="date" :min="today" class="segment-input" aria-label="Tanggal check-in" />
			</label>

			<label class="segment md:flex-1">
				<span class="segment-label">Check-out</span>
				<input v-model="checkOut" type="date" :min="minCheckOut" class="segment-input" aria-label="Tanggal check-out" />
			</label>

			<div class="segment md:w-52">
				<span class="segment-label" id="label-tamu">Tamu</span>
				<div class="mt-0.5 flex items-center gap-3">
					<button type="button" class="stepper" aria-label="Kurangi jumlah tamu" :disabled="guests <= 1"
						@click="guests--">
						−
					</button>
					<span class="min-w-10 text-center text-sm text-ink" aria-labelledby="label-tamu">
						{{ guests }} tamu
					</span>
					<button type="button" class="stepper" aria-label="Tambah jumlah tamu" :disabled="guests >= props.maxGuests"
						@click="guests++">
						+
					</button>
				</div>
			</div>

			<div class="flex items-center gap-2 p-3 md:p-2">
				<button v-if="hasSearched" type="button"
					class="hidden h-12 items-center rounded-full px-4 text-sm font-medium text-muted transition-colors hover:text-ink md:flex"
					@click="clear">
					Hapus
				</button>
				<button type="submit"
					class="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-white transition-colors hover:bg-primary-active md:w-12"
					aria-label="Cek ketersediaan kamar">
					<IconGlyph name="search" class="h-5 w-5" />
					<span class="text-base font-medium md:hidden">Cek Ketersediaan</span>
				</button>
			</div>
		</div>

		<p v-if="errorMessage" class="px-6 pb-4 pt-1 text-sm text-error md:pt-2" role="alert">
			{{ errorMessage }}
		</p>
	</form>
</template>

<style scoped>
.segment {
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding: 12px 24px;
}

.segment-label {
	font-size: 13px;
	font-weight: 600;
	color: var(--color-ink);
}

.segment-input {
	margin-top: 2px;
	width: 100%;
	border: none;
	background: transparent;
	padding: 0;
	font-size: 14px;
	font-family: inherit;
	color: var(--color-ink);
}

.segment-input:focus {
	outline: none;
}

.segment-input::-webkit-calendar-picker-indicator {
	opacity: 0.55;
	cursor: pointer;
}

.stepper {
	display: grid;
	place-items: center;
	height: 32px;
	width: 32px;
	border-radius: 9999px;
	border: 1px solid var(--color-border-strong);
	color: var(--color-ink);
	font-size: 16px;
	line-height: 1;
	transition: border-color 0.15s ease;
}

.stepper:hover:not(:disabled) {
	border-color: var(--color-ink);
}

.stepper:disabled {
	border-color: var(--color-hairline-soft);
	color: var(--color-muted-soft);
	cursor: not-allowed;
}
</style>
