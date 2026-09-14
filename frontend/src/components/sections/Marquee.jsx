import { useReducedMotion } from 'framer-motion'
import { announcements } from '../../content/site'
import styles from './Marquee.module.css'

/**
 * A thin ink strip between the hero and the argument — a beat, and the place
 * the certifications live. It scrolls because the list is longer than any
 * screen, not for decoration: still on reduced motion, and paused on hover so
 * it can actually be read.
 */
export function Marquee() {
  const reduced = useReducedMotion()
  // two identical passes make the loop seamless; the copy is hidden from AT
  const passes = reduced ? [0] : [0, 1]

  return (
    <aside className={styles.strip} aria-label="Certifications and shipping">
      <div className={styles.track} data-still={reduced || undefined}>
        {passes.map((pass) => (
          <ul className={styles.row} key={pass} aria-hidden={pass === 1 || undefined}>
            {announcements.map((item) => (
              <li className={styles.item} key={`${pass}-${item}`}>
                <span className={styles.spark} aria-hidden="true">✦</span>
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </aside>
  )
}
