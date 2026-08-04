import { computed, ref } from 'vue'
import { api, authApi } from '../lib/api'
import { demoSettings } from '../data/demoData'

const settings = ref({ ...demoSettings })
let loadPromise = null

async function load() {
  try {
    Object.assign(settings.value, await api.get('/settings'))
  } catch {
  }
}

export function useSettings() {
  function fetchSettings() {
    if (!loadPromise) loadPromise = load()
    return loadPromise
  }

  async function saveSettings(patch) {
    await authApi.put('/settings', patch)
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
