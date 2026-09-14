import { useEffect, useState } from 'react'
import { api } from '../lib/api'

/**
 * Site-wide switches the admin controls.
 *
 * Everything defaults to visible and stays visible if the backend is down or
 * slow: a section disappearing because an API call failed would be a far worse
 * failure than a section the admin meant to hide staying up for one load. Only
 * an explicit `false` from the server ever hides anything.
 *
 * Callers also get `settled`, which says whether the answer has actually come
 * back yet. A section that merely renders can ignore it. Anything that acts
 * irreversibly on the answer — redirecting away from a hidden page — must wait
 * for it, or it will bounce people off a page they were allowed to see.
 */
const DEFAULTS = {
  showReviewsMain: true,
  showReviewsHome: true,
  showReviewsShop: true,
}

/** Cached at module scope so the second section to mount does not refetch. */
let cache = null
let inflight = null

function load() {
  if (cache) return Promise.resolve(cache)
  if (!inflight) {
    inflight = api
      .get('/api/settings')
      .then((data) => {
        cache = { ...DEFAULTS, ...(data || {}) }
        return cache
      })
      // A failed lookup still settles — on the defaults, which show everything.
      .catch(() => {
        cache = { ...DEFAULTS }
        return cache
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

/** Drop the cache so the admin's own preview reflects a change immediately. */
export function invalidateSiteSettings() {
  cache = null
}

export function useSiteSettings() {
  const [settings, setSettings] = useState(() => cache)

  useEffect(() => {
    let alive = true
    load().then((next) => {
      if (alive) setSettings(next)
    })
    return () => {
      alive = false
    }
  }, [])

  return { ...(settings || DEFAULTS), settled: settings !== null }
}
