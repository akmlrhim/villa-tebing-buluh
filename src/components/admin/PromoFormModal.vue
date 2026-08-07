<script setup>
import { computed, toRef } from 'vue'
import IconGlyph from '../IconGlyph.vue'
import CurrencyInput from './CurrencyInput.vue'
import { usePromoForm } from '../../composables/usePromoForm'
import { fieldClass, btnGhost, btnPrimary } from '../../lib/ui'
import { formatRupiah } from '../../lib/format'

const props = defineProps({
  promo: { type: Object, default: undefined },
  rooms: { type: Array, default: () => [] },
})
const emit = defineEmits(['close', 'saved'])

const { form, saving, errorMsg, isOpen, isEdit, toggleRoom, preview, onSubmit } = usePromoForm(
  toRef(props, 'promo'),
  toRef(props, 'rooms'),
  emit,
)

const isPercent = computed(() => form.value.discount_type === 'percent')
const labelClass = 'mb-1.5 block text-[0.8125rem] font-medium text-body'
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
    @keydown.esc="emit('close')">
    <div class="absolute inset-0 bg-black/50" @click="emit('close')" />

    <div
      class="relative flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-lg bg-canvas shadow-float sm:rounded-lg">
      <header class="flex items-center justify-between border-b border-hairline-soft px-5 py-4">
        <h2 class="text-lg font-semibold text-ink">{{ isEdit ? 'Edit Promo' : 'Tambah Promo' }}</h2>
        <button type="button" class="grid h-9 w-9 place-items-center rounded-full hover:bg-surface-strong"
          aria-label="Tutup" @click="emit('close')">
          <IconGlyph name="x" class="h-5 w-5" />
        </button>
      </header>

      <form class="flex-1 space-y-4 overflow-y-auto px-5 py-5" @submit.prevent="onSubmit">
        <div v-if="errorMsg" class="flex items-start gap-2 rounded-sm bg-error/10 px-3 py-2.5 text-sm text-error"
          role="alert">
          <IconGlyph name="alert" class="mt-0.5 h-4 w-4 shrink-0" />
          <span>{{ errorMsg }}</span>
        </div>

        <div>
          <label :class="labelClass">Nama promo *</label>
          <input v-model="form.name" :class="fieldClass" placeholder="Promo Kemerdekaan" />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label :class="labelClass">Malam pertama *</label>
            <input v-model="form.start_date" type="date" :class="fieldClass" />
          </div>
          <div>
            <label :class="labelClass">Malam terakhir *</label>
            <input v-model="form.end_date" type="date" :class="fieldClass" />
          </div>
        </div>
        <p class="-mt-2.5 text-xs leading-relaxed text-muted">
          Tanggal <strong class="text-body">menginap</strong>, bukan tanggal pesan. Malam terakhir ikut
          dapat promo; malam di luar periode tetap harga normal.
        </p>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label :class="labelClass">Jenis potongan *</label>
            <div class="flex h-10.5 gap-0.5 rounded-sm border border-hairline p-0.5">
              <button type="button" class="flex-1 rounded-xs text-sm transition-colors"
                :class="isPercent ? 'bg-primary font-medium text-white' : 'text-muted hover:text-ink'"
                @click="form.discount_type = 'percent'">Persen</button>
              <button type="button" class="flex-1 rounded-xs text-sm transition-colors"
                :class="!isPercent ? 'bg-primary font-medium text-white' : 'text-muted hover:text-ink'"
                @click="form.discount_type = 'nominal'">Nominal</button>
            </div>
          </div>
          <div>
            <label :class="labelClass">{{ isPercent ? 'Besar diskon (%) *' : 'Potongan per malam *' }}</label>
            <input v-if="isPercent" v-model="form.discount_value" type="number" min="1" max="99" step="1"
              :class="fieldClass" placeholder="20" />
            <CurrencyInput v-else v-model="form.discount_value" placeholder="150.000" />
          </div>
        </div>

        <div>
          <label :class="labelClass">Berlaku untuk *</label>
          <label class="flex cursor-pointer items-center gap-2.5">
            <input v-model="form.applies_to_all" type="checkbox" class="size-4 accent-primary" />
            <span class="text-sm text-ink">Semua kamar, termasuk yang ditambahkan nanti</span>
          </label>

          <div v-if="!form.applies_to_all" class="mt-2.5">
            <p v-if="!rooms.length" class="rounded-sm bg-surface-soft px-3 py-2.5 text-sm text-muted">
              Belum ada kamar. Tambahkan dulu di menu Kelola Kamar.
            </p>
            <ul v-else class="max-h-52 space-y-1 overflow-y-auto rounded-sm border border-hairline-soft p-1.5">
              <li v-for="room in rooms" :key="room.id">
                <label
                  class="flex cursor-pointer items-center justify-between gap-3 rounded-xs px-2.5 py-2 transition-colors hover:bg-surface-soft">
                  <span class="flex min-w-0 items-center gap-2.5">
                    <input type="checkbox" class="size-4 shrink-0 accent-primary"
                      :checked="form.room_ids.includes(room.id)" @change="toggleRoom(room.id)" />
                    <span class="truncate text-sm text-ink">{{ room.name }}</span>
                  </span>
                  <span class="shrink-0 text-xs text-muted">{{ formatRupiah(room.price_per_night) }}</span>
                </label>
              </li>
            </ul>
          </div>
        </div>

        <div>
          <label :class="labelClass">Deskripsi</label>
          <textarea v-model="form.description" rows="2"
            class="w-full resize-y rounded-sm border border-hairline bg-canvas px-3.5 py-2.5 text-sm leading-normal text-ink placeholder:text-sm focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15"
            placeholder="Catatan internal, mis. kanal promosinya." />
        </div>

        <section v-if="preview.length" class="rounded-sm bg-surface-soft px-4 py-3">
          <h3 class="text-[0.8125rem] font-semibold text-ink">Harga setelah promo</h3>
          <ul class="mt-2 space-y-1">
            <li v-for="row in preview" :key="row.id" class="flex items-baseline justify-between gap-3 text-sm">
              <span class="truncate text-body">{{ row.name }}</span>
              <span class="shrink-0">
                <span class="text-muted line-through">{{ formatRupiah(row.base) }}</span>
                <span class="ml-2 font-semibold" :class="row.free ? 'text-error' : 'text-primary'">
                  {{ formatRupiah(row.price) }}
                </span>
              </span>
            </li>
          </ul>
          <p v-if="preview.some((r) => r.free)" class="mt-2 text-xs leading-relaxed text-error">
            Potongannya melebihi harga kamar, jadi kamar itu gratis. Kecilkan nilainya bila tidak disengaja.
          </p>
        </section>

        <label class="flex cursor-pointer items-center gap-2.5">
          <input v-model="form.is_active" type="checkbox" class="size-4 accent-primary" />
          <span class="text-sm text-ink">Promo aktif (berlaku di situs publik)</span>
        </label>
      </form>

      <footer class="flex items-center justify-end gap-3 border-t border-hairline-soft px-5 py-4">
        <button type="button" :class="btnGhost" @click="emit('close')">Batal</button>
        <button type="button" :class="btnPrimary" :disabled="saving" @click="onSubmit">
          <IconGlyph name="save" class="h-5 w-5" />
          {{ saving ? 'Menyimpan…' : 'Simpan' }}
        </button>
      </footer>
    </div>
  </div>
</template>
