import { useEffect } from 'react'
import Lenis from 'lenis'
import { registerScroller } from '../lib/scroller'

/**
 * Momentum scrolling for the whole document.
 *
 * The page hands off between sections through scroll progress, so the quality
 * of the scroll *is* part of the art direction. Lenis is skipped entirely when
 * the visitor asks for reduced motion — native scrolling is then the correct,
 * honest behaviour.
 */
export function useSmoothScroll(enabled = true) {
  useEffect(() => {
    if (!enabled) return

    // the hero animates on load; restoring a previous offset would drop the
    // visitor into the middle of it
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

    const lenis = new Lenis({
      duration: 1.05,
      // matches --ease-out-expo so page motion and element motion agree
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
      autoRaf: false,
      // Lenis owns the scroll position, so native anchor jumps would be
      // fought and reverted. This routes every in-page #hash through Lenis.
      anchors: true,
    })

    const unregister = registerScroller(lenis)

    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    })

    if (import.meta.env.DEV) window.__lenis = lenis

    return () => {
      cancelAnimationFrame(frame)
      unregister()
      lenis.destroy()
      if (import.meta.env.DEV) delete window.__lenis
    }
  }, [enabled])
}
