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

  const whatsappNumber = computed(() => settings.value.whatsapp_number)
  const villaName = computed(() => settings.value.villa_name)

  return { settings, fetchSettings, whatsappNumber, villaName }
}
