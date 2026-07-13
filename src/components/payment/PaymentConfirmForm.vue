<script setup>
import { computed, ref } from 'vue'
import IconGlyph from '../IconGlyph.vue'
import ProofUpload from './ProofUpload.vue'
import { useBookings } from '../../composables/useBookings'
import { useToast } from '../../composables/useToast'
import { uploadPaymentProof } from '../../lib/storage'
import { normalizePhone } from '../../lib/whatsapp'

const props = defineProps({
  room: { type: Object, required: true },
  checkIn: { type: String, required: true },
  checkOut: { type: String, required: true },
  guests: { type: Number, required: true },
})
const emit = defineEmits(['submitted'])

const { hasPublicConflict, createPublicBooking } = useBookings()
const toast = useToast()

const guestName = ref('')
const guestPhone = ref('')
const notes = ref('')
const proofFile = ref(null)
const triedSubmit = ref(false)
const submitting = ref(false)

const phoneNormalized = computed(() => normalizePhone(guestPhone.value))
const nameValid = computed(() => guestName.value.trim().length >= 3)
const phoneValid = computed(() => /^62\d{8,13}$/.test(phoneNormalized.value))

// Pesan ramah untuk error tervalidasi dari fungsi RPC create_public_booking.
const RPC_ERRORS = {
  DATE_TAKEN: 'Maaf, tanggal ini baru saja dipesan tamu lain. Hubungi admin via WhatsApp untuk solusinya.',
  DUPLICATE_PENDING: 'Konfirmasi untuk tanggal ini sudah pernah dikirim dari nomor ini dan sedang diproses.',
  ROOM_NOT_FOUND: 'Kamar tidak tersedia. Silakan pilih kamar lain.',
  BELOW_MIN_NIGHTS: 'Durasi menginap kurang dari minimum kamar ini.',
  INVALID_GUEST_COUNT: 'Jumlah tamu melebihi kapasitas kamar.',
}
function friendlyError(err) {
  const msg = err?.message || String(err)
  for (const key of Object.keys(RPC_ERRORS)) if (msg.includes(key)) return RPC_ERRORS[key]
  return 'Gagal mengirim konfirmasi: ' + msg
}

async function submitConfirmation() {
  triedSubmit.value = true
  if (!nameValid.value || !phoneValid.value || !proofFile.value) {
    toast.error('Lengkapi nama, nomor WhatsApp, dan bukti pembayaran dulu ya.')
    return
  }
  submitting.value = true
  try {
    // Cek ulang ketersediaan tepat sebelum menyimpan (server tetap cek atomik).
    const conflict = await hasPublicConflict({
      roomId: props.room.id,
      checkIn: props.checkIn,
      checkOut: props.checkOut,
    })
    if (conflict) {
      toast.error(RPC_ERRORS.DATE_TAKEN)
      return
    }

    const proofPath = await uploadPaymentProof(proofFile.value)
    const id = await createPublicBooking({
      roomId: props.room.id,
      guestName: guestName.value.trim(),
      guestPhone: phoneNormalized.value,
      checkIn: props.checkIn,
      checkOut: props.checkOut,
      guestCount: props.guests,
      notes: notes.value.trim() || null,
      paymentProofPath: proofPath,
    })
    emit('submitted', {
      code: String(id).slice(0, 8).toUpperCase(),
      guestName: guestName.value.trim(),
    })
  } catch (err) {
    toast.error(friendlyError(err))
  } finally {
    submitting.value = false
  }
}

const INPUT_CLASS =
  'h-11 w-full rounded-sm border border-hairline bg-canvas px-3.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15'
</script>

<template>
  <section id="form-konfirmasi" class="scroll-mt-24">
    <h2 class="text-lg font-semibold text-ink">Konfirmasi pembayaran</h2>
    <p class="mt-1 text-sm leading-relaxed text-muted">
      Sudah membayar? Isi data di bawah dan unggah bukti pembayaranmu.
      Booking langsung tercatat dan admin akan memverifikasinya.
    </p>

    <form class="mt-4 space-y-5 rounded-md border border-hairline bg-canvas p-5 shadow-float" novalidate
      @submit.prevent="submitConfirmation">
      <div>
        <label for="nama" class="text-sm font-medium text-ink">Nama lengkap</label>
        <input id="nama" v-model="guestName" type="text" autocomplete="name"
          placeholder="Sesuai identitas saat check-in" class="mt-1.5" :class="INPUT_CLASS" />
        <p v-if="triedSubmit && !nameValid" class="mt-1.5 text-xs text-error">
          Masukkan nama lengkap (minimal 3 huruf).
        </p>
      </div>

      <div>
        <label for="wa" class="text-sm font-medium text-ink">Nomor WhatsApp</label>
        <input id="wa" v-model="guestPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="08xxxxxxxxxx"
          class="mt-1.5" :class="INPUT_CLASS" />
        <p v-if="triedSubmit && !phoneValid" class="mt-1.5 text-xs text-error">
          Nomor tidak valid - gunakan format 08xx atau 62xx.
        </p>
        <p v-else class="mt-1.5 text-xs text-muted">
          Admin menghubungi nomor ini untuk konfirmasi booking.
        </p>
      </div>

      <ProofUpload v-model:file="proofFile" :invalid="triedSubmit && !proofFile" />

      <div>
        <label for="catatan" class="text-sm font-medium text-ink">
          Catatan <span class="font-normal text-muted">(opsional)</span>
        </label>
        <textarea id="catatan" v-model="notes" rows="2" placeholder="Perkiraan jam tiba, permintaan khusus, dll."
          class="mt-1.5 w-full rounded-sm border border-hairline bg-canvas px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/15" />
      </div>

      <button type="submit" :disabled="submitting"
        class="flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-primary text-base font-medium text-white transition-colors hover:bg-primary-active disabled:opacity-60">
        <svg v-if="submitting" class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
        <IconGlyph v-else name="upload" class="h-5 w-5" />
        {{ submitting ? 'Mengirim…' : 'Kirim Konfirmasi Pembayaran' }}
      </button>
      <p class="text-center text-xs leading-relaxed text-muted">
        Data dan bukti pembayaranmu hanya dapat dilihat oleh admin vila.
      </p>
    </form>
  </section>
</template>
