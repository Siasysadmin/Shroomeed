import { useEffect, useState } from 'react'

/**
 * Reads a CSS media query from JS and keeps it live.
 *
 * The hero drives its own layout from scroll position, so the breakpoint has
 * to be known to the component, not only to the stylesheet — otherwise the
 * phone keeps running transforms written for a pinned full-bleed desktop
 * scene. Seeding from `matchMedia` on the first render (rather than from
 * `false`) means the handset layout is correct on the very first paint
 * instead of flashing the desktop one for a frame.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const list = window.matchMedia(query)
    const onChange = (event) => setMatches(event.matches)

    setMatches(list.matches)
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** The one breakpoint the layout actually pivots on. Keep in step with the CSS. */
export const MOBILE_QUERY = '(max-width: 860px)'

export const useIsMobile = () => useMediaQuery(MOBILE_QUERY)
