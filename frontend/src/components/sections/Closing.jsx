import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { SplitText } from '../common/SplitText'
import { Reveal } from '../common/Reveal'
import { HeroCTA } from '../hero/HeroCTA'
import { brand, commerce, newsletter } from '../../content/site'
import { useIsMobile } from '../../hooks/useMediaQuery'
import styles from './Closing.module.css'

/**
 * The bookend. The bottle returns — same object, same cream, same light as
 * the hero — but standing below the type rather than behind it, rising out of
 * the page edge, so the page closes on the product it opened on.
 */
export function Closing() {
  const reduced = useReducedMotion()
  const isMobile = useIsMobile()
  const ref = useRef(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end end'],
  })
  const at = (value) => (reduced ? undefined : value)

  return (
    <section className={styles.section} id="shop" ref={ref} aria-labelledby="shop-title">
      <div className={styles.halo} aria-hidden="true" />

      <div className={styles.copy}>
        <SplitText lines={isMobile ? newsletter.headlineMobile : newsletter.headline} className={styles.title} id="shop-title" />
        <Reveal as="p" className={styles.body} delay={0.1}>
          {brand.name}{brand.mark} {brand.product} — {brand.subtitle.toLowerCase()}.
          {' '}{commerce.pack}, {commerce.supply.toLowerCase()}.
        </Reveal>
        <Reveal delay={0.18}>
          <HeroCTA hideAside />
        </Reveal>
      </div>
    </section>
  )
}

