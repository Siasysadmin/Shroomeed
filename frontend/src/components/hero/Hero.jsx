import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { HeroCopy } from './HeroCopy'
import { HeroVideo } from './HeroVideo'
import { ScrollCue } from './ScrollCue'
import { useIsMobile } from '../../hooks/useMediaQuery'
import styles from './Hero.module.css'

export function Hero() {
  const reduced = useReducedMotion()
  const isMobile = useIsMobile()
  const ref = useRef(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const OUT = 0.7
  const copyY = useTransform(scrollYProgress, [0, OUT], ['0svh', '-30svh'])
  const copyOpacity = useTransform(scrollYProgress, [0, OUT * 0.62], [1, 0])
  
  const cueOpacity = useTransform(scrollYProgress, [0, 0.09], [1, 0])

  /**
   * The parallax lift belongs to the desktop scene, where the copy floats over
   * a pinned full-bleed plate. On a handset the hero is an ordinary stacked
   * block — art, then words — so the same transform would just fade the copy
   * out as soon as the reader started scrolling toward it.
   */
  const at = (value) => (reduced || isMobile ? undefined : value)

  return (
    <section id="top" ref={ref} className={styles.hero} aria-label="ShrooMEED Daily Shield">
      <HeroVideo reduced={reduced} />

      <div className={styles.scene}>
        <motion.div className={styles.copyCol} style={at({ y: copyY, opacity: copyOpacity })}>
          <HeroCopy reduced={reduced} />
        </motion.div>

        <motion.div className={styles.cueCol} style={at({ opacity: cueOpacity })}>
          <ScrollCue reduced={reduced} />
        </motion.div>
      </div>
    </section>
  )
}
