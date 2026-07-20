<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import IconGlyph from '../../components/IconGlyph.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import BookingFormModal from '../../components/admin/BookingFormModal.vue'
import BookingDetailContent from '../../components/admin/BookingDetailContent.vue'
import { useBookings } from '../../composables/useBookings'
import { useAdminRooms } from '../../composables/useAdminRooms'
import { useBookingProof } from '../../composables/useBookingProof'
import { useToast } from '../../composables/useToast'
import { STATUSES, STATUS_LABEL } from '../../lib/bookingStatus'
import { btnDanger, btnGhost, selectClass } from '../../lib/ui'
import { friendlyDbError } from '../../lib/supabase'

const route = useRoute()
const router = useRouter()
const { bookings, loading, fetchBookings, updateBookingStatus, deleteBooking } = useBookings()
const { rooms, fetchRooms } = useAdminRooms()
const toast = useToast()

onMounted(() => {
  fetchBookings()
  fetchRooms()
})

const booking = computed(() => bookings.value.find((b) => b.id === route.params.id) ?? null)
const { url: proofUrl, loading: proofLoading, error: proofError } = useBookingProof(booking)

const editing = ref(undefined)
const confirmDelete = ref(false)
const busy = ref(false)

async function onStatusChange(event) {
  const status = event.target.value
  busy.value = true
  try {
    await updateBookingStatus(booking.value.id, status)
    toast.success(`Status diubah ke ${STATUS_LABEL[status]}.`)
  } catch (err) {
    toast.error('Gagal mengubah status: ' + friendlyDbError(err))
  } finally {
    busy.value = false
  }
}

function onSaved() {
  toast.success('Perubahan booking disimpan.')
  editing.value = undefined
}

async function onDelete() {
  busy.value = true
  try {
    await deleteBooking(booking.value.id)
    toast.success('Booking dihapus.')
    router.replace({ name: 'admin-bookings' })
  } catch (err) {
    toast.error('Gagal menghapus booking: ' + friendlyDbError(err))
  } finally {
    busy.value = false
    confirmDelete.value = false
  }
}
</script>

<template>
  <div>
    <RouterLink :to="{ name: 'admin-bookings' }"
      class="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink">
      <IconGlyph name="arrow-left" class="h-4 w-4" />
      Kembali ke daftar booking
    </RouterLink>

    <div v-if="loading && !booking" class="mt-5 h-72 animate-pulse rounded-md bg-surface-strong" />

    <div v-else-if="!booking"
      class="mt-5 rounded-md border border-dashed border-border-strong bg-canvas px-6 py-12 text-center">
      <p class="font-medium text-ink">Booking tidak ditemukan</p>
      <p class="mt-1 text-sm text-muted">Booking mungkin sudah dihapus atau tautannya salah.</p>
    </div>

    <template v-else>
      <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="font-sans text-2xl font-semibold tracking-tight text-ink">{{ booking.guest_name }}</h1>
          <p class="mt-1 text-sm text-muted">{{ booking.rooms?.name ?? '-' }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div class="w-44">
            <select :value="booking.status" :disabled="busy" :class="selectClass" @change="onStatusChange">
              <option v-for="s in STATUSES" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>
          <button type="button" :class="btnGhost" @click="editing = booking">
            <IconGlyph name="edit" class="h-5 w-5" /> Edit
          </button>
          <button type="button" :class="btnDanger" @click="confirmDelete = true">
            <IconGlyph name="trash" class="h-5 w-5" /> Hapus
          </button>
        </div>
      </div>

      <div class="mt-5 rounded-md border border-hairline bg-canvas shadow-sm">
        <BookingDetailContent :booking="booking" :proof-url="proofUrl" :proof-loading="proofLoading"
          :proof-error="proofError" />
      </div>
    </template>

    <BookingFormModal :booking="editing" :rooms="rooms" @close="editing = undefined" @saved="onSaved" />

    <ConfirmDialog :open="confirmDelete" title="Hapus booking?" :busy="busy" @cancel="confirmDelete = false"
      @confirm="onDelete">
      Booking <strong class="text-ink">{{ booking?.guest_name }}</strong> akan dihapus permanen.
    </ConfirmDialog>
  </div>
</template>
