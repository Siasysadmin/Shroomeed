/**
 * One place that knows where the backend lives.
 *
 * The URL was hard-coded as `http://localhost:5000` in the admin forms, which
 * works on a dev machine and nowhere else. It now comes from the environment
 * with that same value as the fallback, so a deployed build only needs
 * `VITE_API_URL` set.
 */
export const API_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')

/** Uploads come back as `/uploads/x.jpg`; the storefront needs them absolute. */
export function mediaUrl(src) {
  if (!src) return ''
  if (/^(https?:)?\/\//i.test(src) || src.startsWith('data:')) return src
  return `${API_URL}${src.startsWith('/') ? '' : '/'}${src}`
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, options)
  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed (${response.status})`)
  }
  return payload
}

export const api = {
  get: (path) => request(path),

  json: (path, method, body) =>
    request(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  form: (path, formData) => request(path, { method: 'POST', body: formData }),

  del: (path) => request(path, { method: 'DELETE' }),
}
