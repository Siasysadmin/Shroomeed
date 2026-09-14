import { motion } from 'framer-motion'
import { lift, pick } from '../../lib/motion'
import styles from './ScrollCue.module.css'

/** One hairline and one travelling mark. The only thing in the hero that asks. */
export function ScrollCue({ reduced }) {
  return (
    <motion.div
      className={styles.cue}
      variants={pick(lift(12), reduced)}
      initial="rest"
      animate="enter"
      custom={1.8}
      aria-hidden="true"
    >
      <span className={styles.label}>Scroll</span>
      <span className={styles.rail} data-still={reduced || undefined}>
        <i />
      </span>
    </motion.div>
  )
}
