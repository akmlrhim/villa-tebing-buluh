<script setup>
import { computed, onMounted, ref } from 'vue'
import IconGlyph from '../../components/IconGlyph.vue'
import PromoFormModal from '../../components/admin/PromoFormModal.vue'
import BulkActionBar from '../../components/admin/BulkActionBar.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import PaginationBar from '../../components/PaginationBar.vue'
import { useAdminPromos } from '../../composables/useAdminPromos'
import { useAdminRooms } from '../../composables/useAdminRooms'
import { useToast } from '../../composables/useToast'
import { usePagination } from '../../composables/usePagination'
import { formatDateID, todayISO } from '../../lib/format'
import { promoDiscountLabel } from '../../../shared/pricing'
import { friendlyDbError } from '../../lib/api'
import { btnPrimary } from '../../lib/ui'

const { promos, loading, fetchPromos, toggleActive, deletePromo, bulkDeletePromos } =
  useAdminPromos()
const { rooms, fetchRooms } = useAdminRooms()
const toast = useToast()

const { page, pageCount, pageItems: pagedPromos, total, rangeStart, rangeEnd, goTo } =
  usePagination(promos, 10)

const editing = ref(undefined)
const confirmDelete = ref(null)
const busyId = ref(null)

const selectedIds = ref(new Set())
const confirmBulkDelete = ref(false)
const bulkBusy = ref(false)
const allSelected = computed(
  () => pagedPromos.value.length > 0 && pagedPromos.value.every((p) => selectedIds.value.has(p.id)),
)

onMounted(() => {
  fetchPromos()
  fetchRooms()
})

const today = todayISO()

function statusOf(promo) {
  if (!promo.is_active) return { label: 'Nonaktif', class: 'bg-surface-strong text-muted' }
  if (promo.end_date < today) return { label: 'Selesai', class: 'bg-surface-strong text-muted' }
  if (promo.start_date > today) return { label: 'Terjadwal', class: 'bg-sand/25 text-bronze' }
  return { label: 'Sedang berjalan', class: 'bg-primary/12 text-primary' }
}

function scopeOf(promo) {
  if (promo.applies_to_all) return 'Semua kamar'
  const names = promo.room_ids
    .map((id) => rooms.value.find((r) => r.id === id)?.name)
    .filter(Boolean)
  if (names.length === 0) return `${promo.room_ids.length} kamar`
  return names.join(', ')
}

function toggleSelect(id) {
  const next = new Set(selectedIds.value)
  next.has(id) ? next.delete(id) : next.add(id)
  selectedIds.value = next
}
function toggleSelectAll() {
  const next = new Set(selectedIds.value)
  if (allSelected.value) pagedPromos.value.forEach((p) => next.delete(p.id))
  else pagedPromos.value.forEach((p) => next.add(p.id))
  selectedIds.value = next
}
function clearSelection() {
  selectedIds.value = new Set()
}

function onSaved() {
  toast.success(editing.value?.id ? 'Perubahan promo disimpan.' : 'Promo baru ditambahkan.')
  editing.value = undefined
}

async function onToggle(promo) {
  busyId.value = promo.id
  try {
    await toggleActive(promo)
    toast.success(promo.is_active ? `Promo ${promo.name} dinonaktifkan.` : `Promo ${promo.name} diaktifkan.`)
  } catch (err) {
    toast.error('Gagal mengubah status promo: ' + friendlyDbError(err))
  } finally {
    busyId.value = null
  }
}

async function onDelete() {
  const promo = confirmDelete.value
  busyId.value = promo.id
  try {
    await deletePromo(promo.id)
    confirmDelete.value = null
    toast.success(`Promo ${promo.name} dihapus.`)
  } catch (err) {
    toast.error('Gagal menghapus promo: ' + friendlyDbError(err))
  } finally {
    busyId.value = null
  }
}

async function onBulkDelete() {
  bulkBusy.value = true
  try {
    const ids = [...selectedIds.value]
    await bulkDeletePromos(ids)
    toast.success(`${ids.length} promo dihapus.`)
    confirmBulkDelete.value = false
    clearSelection()
  } catch (err) {
    toast.error('Gagal menghapus promo: ' + friendlyDbError(err))
  } finally {
    bulkBusy.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-ink">Kelola Promo</h1>
        <p class="mt-1 text-sm text-muted">Atur potongan harga kamar untuk periode menginap tertentu.</p>
      </div>
      <button type="button" :class="btnPrimary" @click="editing = null">
        <IconGlyph name="plus" class="h-5 w-5" /> Tambah Promo
      </button>
    </div>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="i in 3" :key="i" class="h-24 animate-pulse rounded-md bg-surface-strong" />
    </div>

    <div v-else-if="!promos.length"
      class="mt-6 rounded-md border border-dashed border-border-strong bg-canvas px-6 py-12 text-center">
      <span class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-surface-strong">
        <IconGlyph name="tag" class="h-6 w-6 text-muted" />
      </span>
      <p class="mt-3 font-medium text-ink">Belum ada promo</p>
      <p class="mx-auto mt-1 max-w-xs text-sm text-muted">
        Buat promo untuk memberi potongan harga pada periode menginap tertentu.
      </p>
      <button type="button" :class="[btnPrimary, 'mx-auto mt-5']" @click="editing = null">
        <IconGlyph name="plus" class="h-5 w-5" /> Tambah Promo
      </button>
    </div>

    <template v-else>
      <label class="mt-6 flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" class="size-4 accent-primary" :checked="allSelected"
          aria-label="Pilih semua promo" @change="toggleSelectAll" />
        Pilih semua di halaman ini
      </label>

      <BulkActionBar :count="selectedIds.size" item-label="promo" @cancel="clearSelection"
        @delete="confirmBulkDelete = true" />

      <ul class="mt-3 space-y-3">
        <li v-for="promo in pagedPromos" :key="promo.id"
          class="flex flex-col gap-4 rounded-md border border-hairline bg-canvas p-3 shadow-sm sm:flex-row sm:items-center"
          :class="!promo.is_active && 'bg-surface-soft/60'">
          <input type="checkbox" class="size-4 shrink-0 accent-primary sm:self-center"
            :checked="selectedIds.has(promo.id)" :aria-label="`Pilih promo ${promo.name}`"
            @change="toggleSelect(promo.id)" />

          <div class="min-w-0 flex-1" :class="!promo.is_active && 'opacity-70'">
            <div class="flex flex-wrap items-center gap-2">
              <button type="button" class="cursor-pointer font-semibold text-ink hover:underline"
                @click="editing = promo">{{ promo.name }}</button>
              <span class="rounded-full px-2 py-0.5 text-[11px] font-medium" :class="statusOf(promo).class">
                {{ statusOf(promo).label }}
              </span>
              <span class="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {{ promoDiscountLabel(promo) }}
              </span>
            </div>
            <p class="mt-1 truncate text-sm text-muted">
              {{ formatDateID(promo.start_date, { weekday: false }) }} –
              {{ formatDateID(promo.end_date, { weekday: false }) }}
              <span class="px-1 text-muted-soft">·</span>{{ scopeOf(promo) }}
            </p>
          </div>

          <div class="flex items-center gap-1.5 sm:shrink-0">
            <button type="button"
              class="grid size-10 place-items-center rounded-sm transition-colors hover:bg-surface-strong disabled:opacity-50"
              :class="promo.is_active ? 'text-primary' : 'text-muted-soft hover:text-ink'"
              :title="promo.is_active ? 'Nonaktifkan promo' : 'Aktifkan promo'" :disabled="busyId === promo.id"
              @click="onToggle(promo)">
              <IconGlyph name="power" class="h-5 w-5" />
            </button>
            <button type="button"
              class="grid size-10 place-items-center rounded-sm text-muted transition-colors hover:bg-surface-strong hover:text-ink"
              title="Edit" @click="editing = promo">
              <IconGlyph name="edit" class="h-5 w-5" />
            </button>
            <button type="button"
              class="grid size-10 place-items-center rounded-sm text-muted transition-colors hover:bg-surface-strong hover:text-error"
              title="Hapus" @click="confirmDelete = promo">
              <IconGlyph name="trash" class="h-5 w-5" />
            </button>
          </div>
        </li>
      </ul>
    </template>

    <PaginationBar v-if="promos.length" :page="page" :page-count="pageCount" :total="total"
      :range-start="rangeStart" :range-end="rangeEnd" item-label="promo" @change="goTo" />

    <PromoFormModal :promo="editing" :rooms="rooms" @close="editing = undefined" @saved="onSaved" />

    <ConfirmDialog :open="Boolean(confirmDelete)" title="Hapus promo?" :busy="busyId === confirmDelete?.id"
      @cancel="confirmDelete = null" @confirm="onDelete">
      Promo <strong class="text-ink">{{ confirmDelete?.name }}</strong> akan dihapus permanen. Booking
      yang sudah terlanjur dibuat tidak berubah karena harganya sudah tersimpan saat pemesanan.
    </ConfirmDialog>

    <ConfirmDialog :open="confirmBulkDelete" title="Hapus promo terpilih?" :busy="bulkBusy"
      @cancel="confirmBulkDelete = false" @confirm="onBulkDelete">
      <strong class="text-ink">{{ selectedIds.size }} promo</strong> akan dihapus permanen. Booking yang
      sudah terlanjur dibuat tidak berubah.
    </ConfirmDialog>
  </div>
</template>
