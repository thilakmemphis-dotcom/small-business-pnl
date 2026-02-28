/**
 * Client for local Postgres API (when VITE_API_URL is set)
 */

const TOKEN_KEY = 'small-business-pnl-token'

/** Turn fetch/network errors into user-friendly messages */
export function friendlyError(err, fallback = 'Something went wrong') {
  if (!err) return fallback
  const msg = err.message || String(err)
  if (/failed to fetch|networkerror|network request failed/i.test(msg)) {
    return 'Network error. Check your internet connection and try again.'
  }
  if (/timeout|timed out/i.test(msg)) {
    return 'Request timed out. The server may be starting – please try again in a moment.'
  }
  if (/cors|cross-origin/i.test(msg)) {
    return 'Connection blocked. Try refreshing or using a different browser.'
  }
  if (msg && msg.length > 0 && msg.length < 120) return msg
  return fallback
}

export function getApiUrl() {
  const explicit = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
  if (explicit) return explicit
  // Production: frontend and API are served from same origin (Render, etc.)
  if (typeof window !== 'undefined') return window.location.origin
  return null
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

export async function signup(email, password, name) {
  const base = getApiUrl()
  if (!base) throw new Error('API not configured')
  const res = await fetch(`${base.replace(/\/$/, '')}/api/auth/signup`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, password, name }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || res.statusText)
  return data
}

export async function forgotPassword(email) {
  const base = getApiUrl()
  if (!base) throw new Error('API not configured')
  const res = await fetch(`${base.replace(/\/$/, '')}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || res.statusText)
  return data
}

export async function resetPassword(token, newPassword) {
  const base = getApiUrl()
  if (!base) throw new Error('API not configured')
  const res = await fetch(`${base.replace(/\/$/, '')}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || res.statusText)
  return data
}

export async function login(email, password) {
  const base = getApiUrl()
  if (!base) throw new Error('API not configured')
  const res = await fetch(`${base.replace(/\/$/, '')}/api/auth/login`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || res.statusText)
  return data
}

export async function updateProfile({ name, avatar_url }) {
  const base = getApiUrl()
  if (!base) throw new Error('API not configured')
  const body = {}
  if (name !== undefined) body.name = name
  if (avatar_url !== undefined) body.avatar_url = avatar_url
  const res = await fetch(`${base.replace(/\/$/, '')}/api/auth/me`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || res.statusText)
  return data
}

export async function fetchMe() {
  const base = getApiUrl()
  const token = getToken()
  if (!base || !token) return null
  const res = await fetch(`${base.replace(/\/$/, '')}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  return res.json()
}

export async function fetchLedger() {
  const base = getApiUrl()
  if (!base) return null
  const res = await fetch(`${base.replace(/\/$/, '')}/api/ledger`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function saveLedger(accounts, entries) {
  const base = getApiUrl()
  if (!base) return null
  const res = await fetch(`${base.replace(/\/$/, '')}/api/ledger`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ accounts, entries }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
