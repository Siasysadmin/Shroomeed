import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { SplitText } from '../common/SplitText'
import { Reveal } from '../common/Reveal'
import { EASE_OUT_EXPO, EASE_OUT_QUART } from '../../lib/motion'
import { scrollToTarget } from '../../lib/scroller'
import { formula } from '../../content/site'
import styles from './Ingredients.module.css'

const COUNT = formula.actives.length
/** Ring radius as a share of the dial box — matches the SVG circle's r=92/200. */
const RADIUS = 46

/** Where node i sits on the ring, starting at twelve o'clock. */
const nodePosition = (index) => {
  const angle = (index / COUNT) * Math.PI * 2 - Math.PI / 2
  return {
    '--x': `${(50 + RADIUS * Math.cos(angle)).toFixed(3)}%`,
    '--y': `${(50 + RADIUS * Math.sin(angle)).toFixed(3)}%`,
  }
}

/**
 * Nine actives, read as one object rather than nine rows.
 *
 * The stage pins while a column of step markers scrolls past behind it; an
 * IntersectionObserver decides which marker is crossing the middle of the
 * screen, and that is the active ingredient. Scrolling therefore *is* the
 * control — it advances the dial, sweeps the arc, and swaps the centre — and
 * the index on the left is a second way into the same state, not a parallel
 * one. Clicking an index entry scrolls its marker into the middle, so there
 * is only ever a single source of truth.
 *
 * Below 900px the pin and the dial are dropped entirely: nine cards in a
 * column, revealed as they arrive. A dial the size of a phone screen would be
 * a worse way to read nine names, not a more impressive one.
 */
export function Ingredients() {
  const reduced = useReducedMotion()
  const [active, setActive] = useState(0)
  const stepRefs = useRef([])

  useEffect(() => {
    const steps = stepRefs.current.filter(Boolean)
    if (!steps.length || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const index = Number(entry.target.dataset.step)
          if (Number.isFinite(index)) setActive(index)
        }
      },
      // a one-pixel band across the middle of the viewport: whichever marker
      // is crossing it is the one being read
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
    )

    steps.forEach((step) => observer.observe(step))
    return () => observer.disconnect()
  }, [])

  const show = (index) => {
    const step = stepRefs.current[index]
    if (!step) return
    // centre the marker, which is what the observer is watching for
    scrollToTarget(step, { offset: -Math.round(window.innerHeight / 2) })
  }

  const current = formula.actives[active]
  const ARC = 2 * Math.PI * 92

  return (
    <section className={styles.section} id="ingredients" aria-label="Ingredients">
      <div className={styles.stage}>
        <div className={styles.inner}>
          <div className={styles.copy}>


            {/* Active Ingredient Details moved outside and left aligned */}
            <div className={styles.activeDetails}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.name}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, x: -20, filter: 'blur(4px)' }}
                  animate={reduced ? { opacity: 1 } : { opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, x: 20, filter: 'blur(4px)' }}
                  transition={{ duration: reduced ? 0.01 : 0.4, ease: EASE_OUT_EXPO }}
                  className={styles.activeDetailsCard}
                >
                  <p className={styles.count} aria-hidden="true">
                    {String(active + 1).padStart(2, '0')}
                    <span>/ {String(COUNT).padStart(2, '0')}</span>
                  </p>
                  <h3 className={styles.nameLeft}>{current.name}</h3>
                  <p className={styles.latinLeft}>{current.latin}</p>
                  <p className={styles.roleLeft}>{current.role}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ---- the dial ------------------------------------------------ */}
          <div className={styles.dial}>
            <svg className={styles.rings} viewBox="0 0 200 200" aria-hidden="true">
              <circle className={styles.ringTrack} cx="100" cy="100" r="92" />
              <motion.circle
                className={styles.ringArc}
                cx="100"
                cy="100"
                r="92"
                strokeDasharray={ARC}
                animate={{ strokeDashoffset: ARC * (1 - (active + 1) / COUNT) }}
                transition={reduced ? { duration: 0 } : { duration: 0.7, ease: EASE_OUT_EXPO }}
              />
            </svg>

            <div className={styles.nodes}>
              {formula.actives.map((active_, index) => (
                <button
                  key={active_.name}
                  className={styles.node}
                  type="button"
                  style={nodePosition(index)}
                  data-on={index === active || undefined}
                  onClick={() => show(index)}
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  <span />
                </button>
              ))}
            </div>

            <div className={styles.centre}>
              {/* Ingredient Image inside the circle */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.name}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                  animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                  transition={{ duration: reduced ? 0.01 : 0.6, ease: EASE_OUT_EXPO }}
                  className={styles.imageContainer}
                >
                  <img 
                    src={`/media/ingredients/ing_${active}.jpg`} 
                    alt={current.name} 
                    className={styles.ingredientImage}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1610992015732-2449b0849206?q=80&w=400&h=400&auto=format&fit=crop";
                    }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            {/* announced separately so the swap is not read as nine headings */}
            <p className="visually-hidden" role="status">
              {current.name}. {current.role}
            </p>
          </div>
        </div>
      </div>

      {/* Scroll runway. Each marker is one ingredient's turn on the stage. */}
      <div className={styles.steps} aria-hidden="true">
        {formula.actives.map((active_, index) => (
          <div
            key={active_.name}
            className={styles.step}
            data-step={index}
            ref={(el) => { stepRefs.current[index] = el }}
          />
        ))}
        {/* Buffer gives the final image time to be seen before the section unpins */}
        <div className={styles.stepBuffer} />
      </div>

      {/* Below 900px this is the whole section. */}
      <ol className={styles.stack}>
        {formula.actives.map((active_, index) => (
          <Reveal as="li" className={styles.stackItem} key={active_.name} delay={index * 0.04}>
            <span className={styles.stackNum}>{String(index + 1).padStart(2, '0')}</span>
            <div>
              <h3 className={styles.stackName}>{active_.name}</h3>
              <p className={styles.stackLatin}>{active_.latin}</p>
              <p className={styles.stackRole}>{active_.role}</p>
            </div>
          </Reveal>
        ))}
      </ol>

      <Reveal as="ul" className={styles.supports}>
        {formula.supports.map((item) => (
          <li className={styles.support} key={item}>{item}</li>
        ))}
      </Reveal>
    </section>
  )
}

