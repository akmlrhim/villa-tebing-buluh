const BASE = import.meta.env.VITE_API_URL || '/api'

const TOKEN_KEY = 'vtb_admin_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export class ApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message)
    this.status = status
    this.code = code
  }
}

function onUnauthorized() {
  clearToken()
  window.dispatchEvent(new CustomEvent('vtb:unauthorized'))
}

async function request(path, { method = 'GET', body, auth = false, isForm = false } = {}) {
  const headers = {}
  if (!isForm && body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: isForm ? body : body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Tidak bisa terhubung ke server. Cek koneksi internet Anda.', {
      code: 'NETWORK',
    })
  }

  if (res.status === 204) return null

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      throw new ApiError(`Balasan server tidak valid (HTTP ${res.status}).`, {
        status: res.status,
        code: 'BAD_RESPONSE',
      })
    }
  }

  if (!res.ok) {
    if (res.status === 401) onUnauthorized()
    throw new ApiError(data?.error || `Permintaan gagal (HTTP ${res.status}).`, {
      status: res.status,
      code: data?.code,
    })
  }

  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
}

export const authApi = {
  get: (path) => request(path, { auth: true }),
  post: (path, body) => request(path, { method: 'POST', body, auth: true }),
  put: (path, body) => request(path, { method: 'PUT', body, auth: true }),
  patch: (path, body) => request(path, { method: 'PATCH', body, auth: true }),
  del: (path) => request(path, { method: 'DELETE', auth: true }),
  upload: (path, formData) => request(path, { method: 'POST', body: formData, auth: true, isForm: true }),
}

export const uploadPublic = (path, formData) =>
  request(path, { method: 'POST', body: formData, isForm: true })

export function friendlyDbError(err) {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      return 'Sesi Anda sudah berakhir. Silakan login lagi.'
    }
    return err.message
  }
  return err?.message || String(err ?? '')
}
