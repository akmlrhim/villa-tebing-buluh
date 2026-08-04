<script setup>
import { computed } from 'vue'
import IconGlyph from '../IconGlyph.vue'
import { formatDateID, formatRupiah } from '../../lib/format'
import { STATUSES, STATUS_CLASS } from '../../lib/bookingStatus'

const props = defineProps({
	bookings: { type: Array, default: () => [] },
	busyId: { type: [String, Number], default: null },
	selectedIds: { type: Set, default: () => new Set() },
})
const emit = defineEmits(['status-change', 'edit', 'delete', 'toggle', 'toggle-all'])

const allSelected = computed(
	() => props.bookings.length > 0 && props.bookings.every((b) => props.selectedIds.has(b.id)),
)
</script>

<template>
	<div class="mt-5 hidden overflow-x-auto overflow-hidden border border-hairline bg-canvas lg:block">
		<table class="w-full text-sm border-collapse border border-hairline-soft whitespace-nowrap">
			<thead class="bg-green-800 text-left text-sm text-white">
				<tr>
					<th class="border border-hairline-soft px-4 py-3 font-semibold">
						<input type="checkbox" class="size-4 accent-primary" :checked="allSelected"
							aria-label="Pilih semua booking" @change="emit('toggle-all')" />
					</th>
					<th class="border border-hairline-soft px-4 py-3 font-semibold">Tamu</th>
					<th class="border border-hairline-soft px-4 py-3 font-semibold">Kamar</th>
					<th class="border border-hairline-soft px-4 py-3 font-semibold">Tanggal</th>
					<th class="border border-hairline-soft px-4 py-3 font-semibold">Total</th>
					<th class="border border-hairline-soft px-4 py-3 font-semibold">Status</th>
					<th class="border border-hairline-soft px-4 py-3 text-right font-semibold">Aksi</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="b in bookings" :key="b.id" class="hover:bg-surface-soft/60">
					<td class="border border-hairline-soft px-4 py-3">
						<input type="checkbox" class="size-4 accent-primary" :checked="selectedIds.has(b.id)"
							:aria-label="`Pilih booking ${b.guest_name}`" @change="emit('toggle', b.id)" />
					</td>
					<td class="border border-hairline-soft px-4 py-3">
						<RouterLink :to="{ name: 'admin-booking-detail', params: { id: b.id } }"
							class="block font-medium text-ink hover:underline">{{ b.guest_name }}</RouterLink>
						<p class="text-xs text-muted">{{ b.guest_phone }} · {{ b.guest_count }} tamu</p>
					</td>
					<td class="border border-hairline-soft px-4 py-3 text-body">{{ b.rooms?.name ?? '-' }}</td>
					<td class="border border-hairline-soft px-4 py-3 text-body">
						{{ formatDateID(b.check_in, { weekday: false }) }}<br />
						<span class="text-xs text-muted"> {{ formatDateID(b.check_out, { weekday: false }) }}</span>
					</td>
					<td class="border border-hairline-soft px-4 py-3 text-body">{{ b.total_price ? formatRupiah(b.total_price) :
						'-' }}</td>
					<td class="border border-hairline-soft px-4 py-3">
						<select :value="b.status" :disabled="busyId === b.id"
							class="appearance-none rounded-sm border-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2216%22%20height=%2216%22%20viewBox=%220%200%2024%2024%22%20fill=%22none%22%20stroke=%22%236e6759%22%20stroke-width=%221.8%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22%3E%3Cpath%20d=%22m6%209%206%206%206-6%22/%3E%3C/svg%3E')] bg-[length:14px] bg-no-repeat bg-position-[right_0.5rem_center] pl-2.5 pr-7 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
							:class="STATUS_CLASS[b.status]" @change="emit('status-change', b, $event)">
							<option v-for="s in STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
						</select>
					</td>
					<td class="border border-hairline-soft px-4 py-3">
						<div class="flex items-center justify-end gap-1">
							<RouterLink :to="{ name: 'admin-booking-detail', params: { id: b.id } }"
								class="grid size-9.5 place-items-center rounded-sm transition-colors hover:bg-surface-strong"
								:class="b.payment_proof_url ? 'text-primary' : 'text-muted hover:text-ink'" title="Lihat detail">
								<IconGlyph name="eye" class="h-4.5 w-4.5" />
							</RouterLink>
							<button type="button"
								class="grid size-9.5 place-items-center rounded-sm text-muted transition-colors hover:bg-surface-strong hover:text-ink disabled:opacity-50"
								title="Edit" @click="emit('edit', b)">
								<IconGlyph name="edit" class="h-4.5 w-4.5" />
							</button>
							<button type="button"
								class="grid size-9.5 place-items-center rounded-sm text-muted transition-colors hover:bg-surface-strong disabled:opacity-50 hover:text-error"
								title="Hapus" @click="emit('delete', b)">
								<IconGlyph name="trash" class="h-4.5 w-4.5" />
							</button>
						</div>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>
