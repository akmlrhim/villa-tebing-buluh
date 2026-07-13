import { computed, ref } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { demoSettings } from '../data/demoData'

// Nilai demo dipakai sebagai fallback per-key supaya halaman tetap utuh
// walau tabel settings baru terisi sebagian.
const settings = ref({ ...demoSettings })
let loadPromise = null

async function load() {
  if (!isSupabaseConfigured) return
  const { data, error } = await supabase.from('settings').select('key, value')
  if (!error && data) {
    for (const row of data) settings.value[row.key] = row.value
  }
}

export function useSettings() {
  function fetchSettings() {
    if (!loadPromise) loadPromise = load()
    return loadPromise
  }

  /** Simpan sebagian setting (F-11.2). `patch` = { key: value, ... }. */
  async function saveSettings(patch) {
    const rows = Object.entries(patch).map(([key, value]) => ({
      key,
      value: value == null ? '' : String(value),
    }))
    const { error } = await supabase.from('settings').upsert(rows)
    if (error) throw error
    // Perbarui state lokal supaya UI langsung ikut berubah.
    for (const [key, value] of Object.entries(patch)) settings.value[key] = value
  }

  const whatsappNumber = computed(() => settings.value.whatsapp_number)
  const villaName = computed(() => settings.value.villa_name)
  const qrisImageUrl = computed(() => settings.value.qris_image_url)
  const qrisMerchantName = computed(() => settings.value.qris_merchant_name)
  const qrisNmid = computed(() => settings.value.qris_nmid)
  const paymentDeadlineHours = computed(() => settings.value.payment_deadline_hours ?? 2)

  return {
    settings,
    fetchSettings,
    saveSettings,
    whatsappNumber,
    villaName,
    qrisImageUrl,
    qrisMerchantName,
    qrisNmid,
    paymentDeadlineHours,
  }
}
