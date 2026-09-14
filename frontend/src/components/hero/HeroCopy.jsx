import { motion } from 'framer-motion'
import { SplitText } from '../common/SplitText'
import { HeroCTA } from './HeroCTA'
import { arrive, pick } from '../../lib/motion'
import { hero } from '../../content/site'
import styles from './HeroCopy.module.css'

/** Beat markers for the hero's one-time entrance, in seconds from mount. */
const CUE = { eyebrow: 0.5, headline: 0.65, lead: 1.3, cta: 1.5 }

export function HeroCopy({ reduced }) {
  const variants = pick(arrive, reduced)

  return (
    <div className={styles.copy}>
      <motion.p
        className={styles.eyebrow}
        variants={variants}
        initial="rest"
        animate="enter"
        custom={CUE.eyebrow}
      >
        <span className={styles.mark} aria-hidden="true" />
        {hero.eyebrow}
      </motion.p>

      <SplitText
        as="h1"
        lines={hero.headline}
        className={styles.headline}
        delay={CUE.headline}
        onMount
      />

      <motion.p
        className={styles.lead}
        variants={variants}
        initial="rest"
        animate="enter"
        custom={CUE.lead}
      >
        {hero.lead}
      </motion.p>

      <motion.div variants={variants} initial="rest" animate="enter" custom={CUE.cta}>
        <HeroCTA hideAside={true} />
      </motion.div>
    </div>
  )
}
