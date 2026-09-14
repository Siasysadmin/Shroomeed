import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion'
import { SplitText } from '../common/SplitText'
import { Reveal } from '../common/Reveal'
import { benefits } from '../../content/site'
import styles from './Benefits.module.css'

/**
 * Four mechanisms, read as a list rather than a grid of cards.
 *
 * The heading pins while the list moves past it, and a hairline on the left
 * fills in step with how far through the four you are — so the scroll reports
 * progress instead of merely revealing things.
 */
export function Benefits() {
  const reduced = useReducedMotion()
  const ref = useRef(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 65%', 'end 85%'],
  })
  // a spring only on the indicator: it is feedback, so it may lag slightly
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 })

  return (
    <section className={styles.section} id="what-it-does" ref={ref} aria-labelledby="what-it-does-title">
      <header className={styles.head}>
        <Reveal as="p" className={styles.eyebrow}>
          <span className={styles.mark} aria-hidden="true" />
          {benefits.eyebrow}
        </Reveal>
        <SplitText lines={benefits.headline} className={styles.title} id="what-it-does-title" />
        <Reveal as="p" className={styles.intro} delay={0.1}>
          {benefits.intro}
        </Reveal>
      </header>

      <ol className={styles.list}>
        <span className={styles.rail} aria-hidden="true">
          <motion.i
            className={styles.railFill}
            style={reduced ? { scaleY: 1 } : { scaleY: progress }}
          />
        </span>

        {benefits.items.map((item, index) => (
          <Reveal as="li" className={styles.item} key={item.id} delay={index * 0.06} distance={26}>
            <span className={styles.index} aria-hidden="true">{item.id}</span>
            <div className={styles.itemBody}>
              <h3 className={styles.itemTitle}>{item.title}</h3>
              <p className={styles.itemText}>{item.body}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </section>
  )
}
