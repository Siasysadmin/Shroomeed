import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { EASE_OUT_EXPO, EASE_OUT_QUART } from './motion'
import { Logo, LOGO_BUILD_MS } from './Logo'
import styles from './Welcome.module.css'

/**
 * The first two seconds of the site.
 *
 * The motion is a *growth*, not a flourish: a spore lands, the stem pushes up
 * segment by segment, the cap opens off it, the light sweep draws across in
 * one stroke, the word sets underneath. The only liberty the mark takes is a
 * literal wink. Every curve arrives and settles; nothing bounces.
 *
 * Deliberately absent: light sweeps across the screen, glints, lens flare.
 * The gold already shines; the animation only has to give it a reason to be
 * looked at.
 *
 * `onReveal` fires the instant the curtain starts lifting rather than when it
 * has gone. Whatever is underneath usually animates on load, and an entrance
 * that plays behind an opaque panel is an entrance nobody sees — so the
 * handoff overlaps by design.
 */

const SESSION_KEY = 'shroomeed:welcomed'
const HOLD_REDUCED_MS = 850

/** Spores drifting up past the mark. Fixed values — random would re-roll every render. */
const SPORES = [
  { x: -46, y: 18, size: 5, delay: 0.9, duration: 4.2, rise: 128, drift: 14 },
  { x: 52, y: -8, size: 4, delay: 1.25, duration: 3.6, rise: 104, drift: -18 },
  { x: -72, y: -34, size: 3, delay: 1.55, duration: 4.6, rise: 142, drift: 22 },
  { x: 78, y: 44, size: 6, delay: 1.05, duration: 5.0, rise: 118, drift: -12 },
  { x: 20, y: 62, size: 3, delay: 1.8, duration: 3.9, rise: 96, drift: 16 },
  { x: -18, y: -58, size: 4, delay: 1.42, duration: 4.4, rise: 132, drift: -20 },
]

/**
 * With `once`, a visitor sees this on their first page of a session and never
 * again until they come back — the second viewing of any welcome is a delay.
 * `#welcome` in the URL forces it back, which is how you show it to someone.
 */
export function shouldPlay(once = true) {
  if (typeof window === 'undefined') return false
  if (!once) return true
  if (window.location.hash === '#welcome') return true
  try {
    return sessionStorage.getItem(SESSION_KEY) !== '1'
  } catch {
    // private-mode storage throws; a visitor who cannot be remembered still gets the welcome
    return true
  }
}

export let isWelcomeDone = false;

/**
 * @param {() => void} onReveal  called as the curtain starts lifting — mount the page here
 * @param {boolean} once         true (default) plays once per session; false plays every load
 * @param {number} hold          ms the mark holds before lifting; defaults to its build length
 */
export function Welcome({ onReveal, once = true, hold = LOGO_BUILD_MS }) {
  const reduced = useReducedMotion()
  const [state, setState] = useState(() => {
    const play = shouldPlay(once);
    if (!play) isWelcomeDone = true;
    return play ? 'playing' : 'done';
  })
  const revealed = useRef(false)

  const release = useCallback(() => {
    if (revealed.current) return
    revealed.current = true
    isWelcomeDone = true
    try {
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      /* not being able to remember is not a reason to fail */
    }
    onReveal?.()
    window.dispatchEvent(new Event('shroomeed:welcome-done'))
    setState('lifting')
  }, [onReveal])

  useEffect(() => {
    if (state === 'done') {
      onReveal?.()
      return
    }
    if (state !== 'playing') return
    const timer = setTimeout(release, reduced ? HOLD_REDUCED_MS : hold)
    return () => clearTimeout(timer)
  }, [state, reduced, hold, release, onReveal])

  // Anyone who wants to get on with it can. A welcome that cannot be dismissed
  // is a loading screen.
  useEffect(() => {
    if (state !== 'playing') return
    const skip = () => release()
    const onKey = (event) => {
      if (event.key !== 'Tab') skip()
    }
    window.addEventListener('pointerdown', skip)
    window.addEventListener('wheel', skip, { passive: true })
    window.addEventListener('touchstart', skip, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', skip)
      window.removeEventListener('wheel', skip)
      window.removeEventListener('touchstart', skip)
      window.removeEventListener('keydown', onKey)
    }
  }, [state, release])

  // Nothing behind the curtain should be reachable by scroll.
  useEffect(() => {
    if (state === 'done') return
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [state])

  if (state === 'done') return null

  return (
    <AnimatePresence onExitComplete={() => setState('done')}>
      {state === 'playing' && (
        <motion.div
          className={styles.curtain}
          role="status"
          aria-label="ShrooMEED"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: reduced ? 0.3 : 0.85, ease: EASE_OUT_QUART },
          }}
        >
          {!reduced && (
            <>
              {/* Ambient warmth, not a light source: diffuse, slow, edgeless. */}
              <motion.div
                className={styles.halo}
                initial={{ opacity: 0, scale: 0.86 }}
                animate={{
                  opacity: [0, 1, 0.82, 1],
                  scale: [0.86, 1, 0.97, 1.01],
                  transition: {
                    duration: 5.2,
                    delay: 0.35,
                    times: [0, 0.28, 0.66, 1],
                    ease: EASE_OUT_QUART,
                  },
                }}
              />

              {/* One soft ring, released at the moment the cap opens. */}
              <motion.div
                className={styles.ripple}
                initial={{ opacity: 0, scale: 0.35 }}
                animate={{
                  opacity: [0, 0.4, 0],
                  scale: [0.35, 1.5, 1.85],
                  transition: {
                    duration: 1.5,
                    delay: 0.62,
                    times: [0, 0.35, 1],
                    ease: EASE_OUT_EXPO,
                  },
                }}
              />

              {SPORES.map((spore, index) => (
                <motion.span
                  key={index}
                  className={styles.spore}
                  style={{
                    width: spore.size,
                    height: spore.size,
                    left: `calc(50% + ${spore.x}px)`,
                    top: `calc(50% + ${spore.y}px)`,
                  }}
                  initial={{ opacity: 0, y: 0, x: 0 }}
                  animate={{
                    opacity: [0, 0.55, 0],
                    y: [0, -spore.rise],
                    x: [0, spore.drift],
                    transition: {
                      duration: spore.duration,
                      delay: spore.delay,
                      ease: 'linear',
                      repeat: Infinity,
                      repeatDelay: 0.4,
                    },
                  }}
                />
              ))}
            </>
          )}

          <motion.div
            className={styles.stage}
            exit={
              reduced
                ? { opacity: 0, transition: { duration: 0.25 } }
                : {
                    opacity: 0,
                    y: -20,
                    scale: 0.93,
                    filter: 'blur(7px)',
                    transition: { duration: 0.62, ease: EASE_OUT_EXPO },
                  }
            }
          >
            <Logo variant="lockup" animated={!reduced} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
