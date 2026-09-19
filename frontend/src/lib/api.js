/**
 * One place that knows where the backend lives.
 *
 * The URL was hard-coded as `http://localhost:5000` in the admin forms, which
 * works on a dev machine and nowhere else. It now comes from the environment
 * with that same value as the fallback, so a deployed build only needs
 * `VITE_API_URL` set.
 */
export const API_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '')

/**
 * Uploads come back as `/uploads/x.jpg`; the storefront needs them absolute.
 *
 * Only the uploads folder lives on the backend. Anything else that starts with
 * a slash — `/media/clip.mp4` and friends — is a file this app ships in
 * `public/` and is served from the site's own origin, so pointing it at the
 * API host would 404 it.
 */
export function mediaUrl(src) {
  if (!src) return ''
  if (/^(https?:)?\/\//i.test(src) || src.startsWith('data:') || src.startsWith('blob:')) return src
  if (src.startsWith('/uploads')) return `${API_URL}${src}`
  if (src.startsWith('/')) return src
  return `${API_URL}/${src}`
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

/**
 * A multipart POST that can report how far it has got.
 *
 * `fetch` cannot: it resolves when the response arrives and says nothing in
 * between, so a 150MB clip left the admin looking at a frozen button with no
 * way to tell a slow upload from a dead one. XHR still exposes upload
 * progress, so video uploads go through this instead.
 */
function upload(path, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_URL}${path}`)

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100))
    })

    xhr.addEventListener('load', () => {
      let payload = null
      try {
        payload = JSON.parse(xhr.responseText)
      } catch {
        payload = null
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100)
        resolve(payload)
      } else {
        reject(new Error(payload?.error || `Request failed (${xhr.status})`))
      }
    })

    xhr.addEventListener('error', () =>
      reject(new Error('Could not reach the server. Is the backend running?'))
    )
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled.')))

    xhr.send(formData)
  })
}

export const api = {
  get: (path) => request(path),

  upload,

  json: (path, method, body) =>
    request(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  form: (path, formData) => request(path, { method: 'POST', body: formData }),

  del: (path) => request(path, { method: 'DELETE' }),
}
