import { computed, ref } from 'vue'
import { api, authApi, getToken, setToken, clearToken } from '../lib/api'

const user = ref(null)
const ready = ref(false)
let initPromise = null

async function init() {
  if (getToken()) {
    try {
      const { user: me } = await authApi.get('/auth/me')
      user.value = me
    } catch {
      clearToken()
      user.value = null
    }
  }
  ready.value = true
}

window.addEventListener('vtb:unauthorized', () => {
  user.value = null
})

export function useAuth() {
  function initAuth() {
    if (!initPromise) initPromise = init()
    return initPromise
  }

  const isAuthenticated = computed(() => Boolean(user.value))
  const userEmail = computed(() => user.value?.email ?? null)

  async function signIn(email, password) {
    const data = await api.post('/auth/login', { email, password })
    setToken(data.token)
    user.value = data.user
    return data
  }

  async function signOut() {
    clearToken()
    user.value = null
  }

  return { ready, initAuth, isAuthenticated, userEmail, signIn, signOut }
}
