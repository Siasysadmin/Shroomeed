/**
 * A tiny handle on the page scroller.
 *
 * Lenis owns the scroll position, so anything that wants to move the page —
 * an anchor, a route change, an ingredient node asking to be looked at — has
 * to go through it or be fought and reverted. This keeps one reference and
 * degrades to the native API when smooth scrolling is off.
 */
let lenis = null

export const registerScroller = (instance) => {
  lenis = instance
  return () => {
    if (lenis === instance) lenis = null
  }
}

export const scrollToY = (y, options = {}) => {
  if (lenis) lenis.scrollTo(y, options)
  else window.scrollTo({ top: y, behavior: options.immediate ? 'auto' : 'smooth' })
}

export const scrollToTop = (options = {}) => scrollToY(0, options)

export const scrollToTarget = (target, options = {}) => {
  const el = typeof target === 'string' ? document.querySelector(target) : target
  if (!el) return
  if (lenis) lenis.scrollTo(el, { offset: options.offset ?? 0, ...options })
  else {
    const top = el.getBoundingClientRect().top + window.scrollY + (options.offset ?? 0)
    window.scrollTo({ top, behavior: options.immediate ? 'auto' : 'smooth' })
  }
}
