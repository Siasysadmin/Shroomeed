import { useId } from 'react'
import { motion } from 'framer-motion'
import { EASE_IN_OUT, EASE_OUT_EXPO, EASE_OUT_QUART } from './motion'
import styles from './Logo.module.css'

/**
 * The ShrooMEED mark — the supplied artwork, path for path.
 *
 * Nothing here is redrawn. The five paths from `logo.svg` (the file sits
 * beside this one) are kept verbatim; the only thing added is which of them
 * moves, when, and from where. That separation is the point: the logo stays
 * the logo, and the animation is a layer over it rather than an
 * interpretation of it.
 *
 * Colour lives in the stylesheet, not here, so one variable retints the whole
 * mark. The negative space is real space — the cap lobes and the three stem
 * segments are separate shapes with gaps between them — so it sits on any
 * background without a single override.
 *
 * Two variations from one source: `mark` is the glyph, `lockup` adds the
 * wordmark. Variants stay inert until an ancestor drives them, so the static
 * logo renders as finished artwork with no second code path.
 */

/* --- artwork, verbatim (viewBox 0 0 154 169) --------------------------- */

/** Upper lobe of the cap — the light sweep. */
const CAP_SWEEP =
  'M65.224 0.0923851C72.5643 -0.0826058 80.4591 0.0361889 87.8279 0.083126C93.2146 1.18465 97.9049 3.0792 102.841 5.22531C114.552 10.2085 123.848 18.2609 132.042 27.8607C140.998 38.3545 148.242 50.506 151.948 63.8747C152.461 65.7274 153.151 67.9528 153.019 69.9052C152.912 71.483 149.604 70.1135 148.711 69.959C142.679 68.0442 136.335 66.0814 130.725 63.1503C129.686 62.6072 128.781 61.4258 128.22 60.4236C129.354 58.3292 130.265 56.9589 131.173 54.6454C133.942 47.5918 133.663 41.1071 130.569 34.2464C128.724 29.9351 123.978 24.8568 119.519 23.2112C104.063 17.5083 90.4989 29.7091 79.5639 38.3441C75.157 41.8067 70.6574 45.1495 66.0696 48.3686C64.9234 49.187 63.7378 49.8523 62.6005 50.6212C50.5372 58.7757 37.6187 65.5546 23.4622 69.2475C19.5073 70.2792 3.93828 73.0255 0.619373 71.7251C-0.768754 70.5542 0.54849 66.158 0.982872 64.6487C9.05046 36.62 36.0773 6.31614 65.224 0.0923851Z'

/** Lower body of the cap. */
const CAP_BODY =
  'M80.2692 56.584C90.7076 56.2564 101.839 59.7324 111.568 63.1105C115.045 64.2844 118.498 65.5271 121.926 66.8382C127.401 68.9872 131.997 71.0269 137.688 72.9466C140.689 73.943 143.722 74.8388 146.783 75.6325C147.889 75.915 151.728 76.6653 152.369 76.994C153.174 77.8253 152.618 79.5333 152.169 80.4272C147.838 89.0501 139.796 95.8702 130.746 99.0994C122.06 102.328 113.077 102.898 103.96 103.667C93.2934 104.566 82.7576 104.521 72.0552 104.537C65.1475 104.54 58.2419 104.298 51.3514 103.813C38.6173 103.018 24.4155 101.901 13.2065 95.3203C7.96499 92.2433 2.02004 86.4475 0.170294 80.3999C-0.0173385 79.7865 0.0423558 79.5422 0.330828 79.0666C1.05238 78.57 1.41551 78.7156 2.18884 78.9143C3.62989 79.2843 5.16307 79.3924 6.64572 79.4645C11.9382 79.6784 17.2348 79.157 22.3842 77.9154C35.4535 74.8536 45.9934 68.0052 57.7679 62.0567C65.5523 58.124 71.6053 56.82 80.2692 56.584Z'

/** The eye — the curl the sweep wraps around. */
const EYE =
  'M108.96 27.8527C110.43 27.5908 113.084 27.8117 114.559 28.0517C124.031 29.5928 129.84 38.4064 127.12 47.6803C123.61 59.6476 115.041 57.4085 105.615 54.5933C101.01 52.8866 87.1621 48.2299 84.2959 45.0788C84.9831 43.5441 86.7693 40.8071 87.8589 39.544C93.4752 33.0331 100.36 28.7929 108.96 27.8527Z'

/** Stem, centre segment. */
const STEM_CORE =
  'M63.0887 168.075C58.8831 166.774 53.0493 166.195 50.7588 161.82C47.743 156.058 54.9344 129.77 56.7853 122.485C57.6262 119.175 58.2537 115.755 59.3363 112.516C59.6385 111.612 60.0181 110.674 60.7227 110.011C61.3046 109.749 61.8915 109.671 62.5242 109.64C65.1368 109.512 88.7288 109.504 89.9476 109.915C90.4482 110.084 90.6074 110.488 90.806 110.941C91.8025 113.221 92.2501 116.003 92.78 118.425L95.6192 131.915L98.1243 143.337C99.3042 148.477 101.342 155.976 99.7589 161.041C98.2776 165.779 90.2992 166.765 86.544 168.075H63.0887Z'

/** Stem, right segment. */
const STEM_RIGHT =
  'M97.3018 109.938C97.8286 110.097 98.3315 110.327 98.7964 110.622C100.577 111.731 101.789 112.977 103.38 114.269C113.965 122.873 120.068 137.872 113.805 150.81C113.083 152.302 112.104 153.83 111.2 155.274C110.436 156.454 108.855 158.716 107.455 159.024C105.642 158.932 105.452 155.593 105.407 154.256C105.32 151.682 105.087 149.166 104.769 146.613C103.809 138.599 102.227 130.672 100.037 122.903C99.0476 119.392 96.8345 114.793 96.3346 111.302C96.2578 110.766 96.8854 110.284 97.3018 109.938Z'

/** Stem, left segment. */
const STEM_LEFT =
  'M52.3688 110.289C52.9471 110.234 53.3145 110.247 53.7558 110.645C54.0959 111.222 54.0075 112.105 53.757 112.697C47.7654 126.852 44.2014 141.997 44.3336 157.41C44.3415 158.344 43.6635 158.844 42.9962 159.337C41.3612 158.456 40.4472 157.235 39.3233 155.811C39.0597 155.434 38.8062 155.05 38.563 154.659C36.9301 152.047 35.9798 150.044 35.0181 147.132C30.4711 133.36 40.9994 117.343 52.3688 110.289Z'

const WORD = [...'ShrooMEED']

/* --- the build order, in seconds -------------------------------------- */
const AT = {
  seed: 0,
  core: 0.14,
  legs: 0.32,
  body: 0.48,
  sweep: 0.76,
  word: 0.84,
  eye: 1.06,
  blink: 1.46,
}

/** How long the mark takes to finish assembling itself, in ms. */
export const LOGO_BUILD_MS = 2000

const seedVariants = {
  rest: { scale: 0, opacity: 0 },
  enter: {
    scale: [0, 1, 0.6],
    opacity: [0, 1, 0],
    transition: { duration: 0.6, delay: AT.seed, times: [0, 0.4, 1], ease: EASE_OUT_QUART },
  },
}

/** The stem pushes up out of the spore. */
const coreVariants = {
  rest: { scaleY: 0, scaleX: 0.68, opacity: 0 },
  enter: {
    scaleY: 1,
    scaleX: 1,
    opacity: 1,
    transition: {
      duration: 0.68,
      delay: AT.core,
      ease: EASE_OUT_EXPO,
      opacity: { duration: 0.2, delay: AT.core, ease: 'linear' },
    },
  },
}

/** The outer segments swing out from the base a beat behind the centre. */
const legVariants = (rotate, delay) => ({
  rest: { scale: 0.3, rotate, opacity: 0 },
  enter: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      duration: 0.72,
      delay,
      ease: EASE_OUT_EXPO,
      opacity: { duration: 0.22, delay, ease: 'linear' },
    },
  },
})

/** The cap's underside opens off the top of the stem. */
const bodyVariants = {
  rest: { scaleX: 0.12, scaleY: 0.35, opacity: 0 },
  enter: {
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    transition: {
      duration: 0.88,
      delay: AT.body,
      ease: EASE_OUT_EXPO,
      opacity: { duration: 0.24, delay: AT.body, ease: 'linear' },
    },
  },
}

/**
 * The light sweep is revealed left to right rather than scaled, so it reads
 * as the swirl being drawn in one stroke — the gesture the shape already is.
 */
const wipeVariants = {
  rest: { width: 0 },
  enter: {
    width: 166,
    transition: { duration: 0.62, delay: AT.sweep, ease: EASE_OUT_QUART },
  },
}

const eyeVariants = {
  rest: { scale: 0, opacity: 0 },
  enter: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.52, delay: AT.eye, ease: EASE_OUT_EXPO },
  },
}

/** The one liberty the mark takes: once it is whole, it blinks. */
const blinkVariants = {
  rest: { scaleY: 1 },
  enter: {
    scaleY: [1, 0.1, 1],
    transition: { duration: 0.28, delay: AT.blink, times: [0, 0.38, 1], ease: EASE_IN_OUT },
  },
}

const letterVariants = {
  rest: { y: '112%', opacity: 0 },
  enter: (index) => ({
    y: '0%',
    opacity: 1,
    transition: {
      duration: 0.76,
      delay: AT.word + index * 0.03,
      ease: EASE_OUT_EXPO,
      opacity: { duration: 0.28, delay: AT.word + index * 0.03, ease: 'linear' },
    },
  }),
}

/**
 * @param {'lockup' | 'mark'} variant  glyph with the wordmark, or the glyph alone
 * @param {boolean} animated           false renders the finished artwork, static
 * @param {string} className           size it by setting `--wa-mark-size` here
 */
export function Logo({ variant = 'lockup', animated = false, className, label = 'ShrooMEED' }) {
  // The wipe lives in defs; a shared id would let one logo drive another's.
  const wipeId = `shroomeed-wipe-${useId().replace(/:/g, '')}`
  const drive = animated ? { initial: 'rest', animate: 'enter' } : {}

  return (
    <div className={`${styles.logo} ${className ?? ''}`} role="img" aria-label={label}>
      <motion.svg
        className={styles.mark}
        viewBox="0 0 154 169"
        fill="none"
        aria-hidden="true"
        {...drive}
      >
        <defs>
          <clipPath id={wipeId}>
            <motion.rect x="-6" y="-6" height="190" width="166" variants={wipeVariants} />
          </clipPath>
        </defs>

        {/* the spore the whole thing comes out of */}
        <motion.circle className={styles.seed} cx="76" cy="166" r="3.4" variants={seedVariants} />

        <motion.path className={styles.core} d={STEM_CORE} variants={coreVariants} />
        <motion.path
          className={styles.legLeft}
          d={STEM_LEFT}
          variants={legVariants(-13, AT.legs)}
        />
        <motion.path
          className={styles.legRight}
          d={STEM_RIGHT}
          variants={legVariants(13, AT.legs + 0.05)}
        />

        <g clipPath={`url(#${wipeId})`}>
          <path className={styles.sweep} d={CAP_SWEEP} />
        </g>

        <motion.path className={styles.body} d={CAP_BODY} variants={bodyVariants} />

        <motion.g className={styles.eyePop} variants={eyeVariants}>
          <motion.g className={styles.eyeBlink} variants={blinkVariants}>
            <path className={styles.eye} d={EYE} />
          </motion.g>
        </motion.g>
      </motion.svg>

      {variant === 'lockup' && (
        <motion.span className={styles.word} aria-hidden="true" {...drive}>
          {WORD.map((letter, index) => (
            <span className={styles.clip} key={`${letter}-${index}`}>
              <motion.span className={styles.letter} variants={letterVariants} custom={index}>
                {letter}
              </motion.span>
            </span>
          ))}
        </motion.span>
      )}
    </div>
  )
}
