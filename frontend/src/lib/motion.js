/**
 * One motion language for the entire site.
 *
 * Rules it encodes:
 *  - every curve is an ease-OUT: motion arrives and settles, never overshoots
 *  - nothing bounces, springs or rubber-bands
 *  - distance is small; duration is long; the eye reads it as weight
 *  - every animation is opacity/transform/filter only — never layout
 */

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1]
export const EASE_OUT_QUART = [0.22, 1, 0.36, 1]
export const EASE_IN_OUT = [0.65, 0, 0.35, 1]

export const DUR = {
  sm: 0.42,
  md: 0.85,
  lg: 1.05,
  xl: 1.7,
}

/**
 * Variant factories.
 *
 * Each is self-contained: components pass `initial`/`animate` themselves
 * rather than inheriting a variant label from an ancestor. Propagated
 * variants and scroll-linked `style` motion values fight over the same
 * properties — keeping the two systems on separate elements is what stops
 * a scroll-driven opacity from being overwritten by a finished entrance.
 */

/** A short lift. The workhorse for supporting copy, buttons, cards. */
export const lift = (distance = 18) => ({
  rest: { opacity: 0, y: distance },
  enter: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: DUR.md, delay, ease: EASE_OUT_QUART },
  }),
})

/** Display type: rises out of a clipped baseline, blur resolving to sharp. */
export const riseBlurred = {
  rest: { y: '105%', opacity: 0, filter: 'blur(10px)' },
  enter: (delay = 0) => ({
    y: '0%',
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: DUR.lg, delay, ease: EASE_OUT_EXPO },
  }),
}

/** Objects that should feel like they entered the room, not faded in. */
export const arrive = {
  rest: { opacity: 0, y: 34, scale: 0.94 },
  enter: (delay = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: DUR.xl,
      delay,
      ease: EASE_OUT_EXPO,
      opacity: { duration: DUR.lg, delay, ease: 'linear' },
    },
  }),
}

/** A rule or divider drawing itself. */
export const draw = {
  rest: { scaleX: 0 },
  enter: (delay = 0) => ({
    scaleX: 1,
    transition: { duration: DUR.lg, delay, ease: EASE_OUT_EXPO },
  }),
}

/** Reduced motion: everything still arrives; nothing travels. */
export const fade = {
  rest: { opacity: 0 },
  enter: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.35, delay: Math.min(delay, 0.2), ease: 'linear' },
  }),
}

/** Pick the right variant set for the visitor's motion preference. */
export const pick = (variants, reduced) => (reduced ? fade : variants)

/** Where a section starts revealing itself, as a share of the viewport. */
export const VIEWPORT = { once: true, margin: '0px 0px -18% 0px' }
