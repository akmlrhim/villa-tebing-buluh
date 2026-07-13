import { computed, ref } from 'vue'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

// Autentikasi admin (F-08) via Supabase Auth (email + password).
const session = ref(null)
const ready = ref(false)
let initPromise = null

async function init() {
  if (isSupabaseConfigured) {
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    supabase.auth.onAuthStateChange((_event, next) => {
      session.value = next
    })
  }
  ready.value = true
}

export function useAuth() {
  function initAuth() {
    if (!initPromise) initPromise = init()
    return initPromise
  }

  const isAuthenticated = computed(() => Boolean(session.value))
  const userEmail = computed(() => session.value?.user?.email ?? null)

  async function signIn(email, password) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase belum dikonfigurasi.')
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    session.value = data.session
    return data
  }

  async function signOut() {
    if (isSupabaseConfigured) await supabase.auth.signOut()
    session.value = null
  }

  return { ready, initAuth, isAuthenticated, userEmail, signIn, signOut }
}
