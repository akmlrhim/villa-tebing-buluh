<script setup>
import { computed, onMounted, ref } from 'vue'
import IconGlyph from '../../components/IconGlyph.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import BookingFormModal from '../../components/admin/BookingFormModal.vue'
import AdminBookingCalendar from '../../components/admin/AdminBookingCalendar.vue'
import BookingListTable from '../../components/admin/BookingListTable.vue'
import BookingListCards from '../../components/admin/BookingListCards.vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { useBookings } from '../../composables/useBookings'
import { useAdminRooms } from '../../composables/useAdminRooms'
import { useToast } from '../../composables/useToast'
import { usePagination } from '../../composables/usePagination'
import { STATUSES, STATUS_LABEL } from '../../lib/bookingStatus'
import { btnPrimary, selectClass } from '../../lib/ui'

const { bookings, loading, fetchBookings, updateBookingStatus, deleteBooking } = useBookings()
const { rooms, fetchRooms } = useAdminRooms()
const toast = useToast()

const view = ref('list') // 'list' | 'calendar'
const editing = ref(undefined)
const confirmDelete = ref(null)
const busyId = ref(null)

const filterStatus = ref('')
const filterRoom = ref('')
const search = ref('')

onMounted(() => {
	fetchBookings()
	fetchRooms()
})

const filtered = computed(() =>
	bookings.value.filter((b) => {
		if (filterStatus.value && b.status !== filterStatus.value) return false
		if (filterRoom.value && b.room_id !== filterRoom.value) return false
		if (search.value && !b.guest_name?.toLowerCase().includes(search.value.toLowerCase())) return false
		return true
	}),
)

const { page, pageCount, pageItems: paged, total, rangeStart, rangeEnd, goTo } = usePagination(filtered, 10)

function openNew() {
	editing.value = null
}
function openEdit(booking) {
	editing.value = booking
}
function onSaved() {
	toast.success(editing.value?.id ? 'Perubahan booking disimpan.' : 'Booking baru ditambahkan.')
	editing.value = undefined
}

async function onStatusChange(booking, event) {
	const status = event.target.value
	busyId.value = booking.id
	try {
		await updateBookingStatus(booking.id, status)
		toast.success(`Status booking ${booking.guest_name} diubah ke ${STATUS_LABEL[status]}.`)
	} catch (err) {
		toast.error('Gagal mengubah status: ' + (err?.message || err))
	} finally {
		busyId.value = null
	}
}

async function onDelete() {
	const booking = confirmDelete.value
	busyId.value = booking.id
	try {
		await deleteBooking(booking.id)
		confirmDelete.value = null
		toast.success(`Booking ${booking.guest_name} dihapus.`)
	} catch (err) {
		toast.error('Gagal menghapus booking: ' + (err?.message || err))
	} finally {
		busyId.value = null
	}
}
</script>

<template>
	<div>
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<h1 class="font-sans text-2xl font-semibold tracking-tight text-ink">Kelola Booking</h1>
				<p class="mt-1 text-sm text-black">Input, ubah status, dan pantau semua reservasi.</p>
			</div>
			<div class="flex items-center gap-2">
				<div class="flex rounded-sm border border-hairline p-0.5">
					<button type="button"
						class="inline-flex items-center gap-1.5 rounded-[6px] px-[0.7rem] py-[0.4rem] text-[0.8125rem] font-medium"
						:class="view === 'list' ? 'bg-primary text-white' : 'text-muted'" @click="view = 'list'">
						<IconGlyph name="menu" class="h-4 w-4" /> List
					</button>
					<button type="button"
						class="inline-flex items-center gap-1.5 rounded-[6px] px-[0.7rem] py-[0.4rem] text-[0.8125rem] font-medium"
						:class="view === 'calendar' ? 'bg-primary text-white' : 'text-muted'" @click="view = 'calendar'">
						<IconGlyph name="calendar" class="h-4 w-4" /> Kalender
					</button>
				</div>
				<button type="button" :class="btnPrimary" @click="openNew">
					<IconGlyph name="plus" class="h-5 w-5" /> Booking Baru
				</button>
			</div>
		</div>

		<!-- Filter -->
		<div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<div class="relative">
				<IconGlyph name="search"
					class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
				<input v-model="search"
					class="h-10.5 w-full rounded-sm border border-hairline bg-canvas px-3.5 text-sm placeholder:text-sm leading-normal text-ink focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15 pl-9"
					placeholder="Cari nama tamu…" />
			</div>
			<select v-model="filterStatus" :class="selectClass">
				<option value="">Semua status</option>
				<option v-for="s in STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
			</select>
			<select v-model="filterRoom" :class="selectClass">
				<option value="">Semua kamar</option>
				<option v-for="r in rooms" :key="r.id" :value="r.id">{{ r.name }}</option>
			</select>
			<div class="flex items-center text-sm text-muted">
				{{ filtered.length }} booking
			</div>
		</div>

		<!-- Kalender -->
		<div v-if="view === 'calendar'" class="mt-5">
			<AdminBookingCalendar :bookings="filtered" @edit="openEdit" />
		</div>

		<!-- List -->
		<template v-else>
			<div v-if="loading" class="mt-5 space-y-3">
				<div v-for="i in 5" :key="i" class="h-16 animate-pulse rounded-md bg-surface-strong" />
			</div>

			<div v-else-if="!filtered.length"
				class="mt-5 rounded-md border border-dashed border-border-strong bg-canvas px-6 py-12 text-center">
				<span class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface-strong">
					<IconGlyph name="calendar" class="h-6 w-6 text-muted" />
				</span>
				<p class="mt-3 font-medium text-ink">Tidak ada booking</p>
				<p class="mx-auto mt-1 max-w-xs text-sm text-muted">Coba ubah filter, atau buat booking baru.</p>
			</div>

			<template v-else>
				<BookingListTable :bookings="paged" :busy-id="busyId" @status-change="onStatusChange" @edit="openEdit"
					@delete="confirmDelete = $event" />
				<BookingListCards :bookings="paged" :busy-id="busyId" @status-change="onStatusChange" @edit="openEdit"
					@delete="confirmDelete = $event" />
				<PaginationBar :page="page" :page-count="pageCount" :total="total" :range-start="rangeStart"
					:range-end="rangeEnd" item-label="booking" @change="goTo" />
			</template>
		</template>

		<BookingFormModal :booking="editing" :rooms="rooms" @close="editing = undefined" @saved="onSaved" />

		<ConfirmDialog :open="Boolean(confirmDelete)" title="Hapus booking?" :busy="busyId === confirmDelete?.id"
			@cancel="confirmDelete = null" @confirm="onDelete">
			Booking <strong class="text-ink">{{ confirmDelete?.guest_name }}</strong> akan dihapus permanen.
		</ConfirmDialog>
	</div>
</template>
