import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Reveal } from '../common/Reveal'
import { EASE_OUT_EXPO } from '../../lib/motion'
import styles from './ProductAccordion.module.css'

export function ProductAccordion({ items }) {
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(0) // Automatically open the first section
  const uid = useId()

  return (
    <Reveal className={styles.list} delay={0.35}>
      {items.map((item, index) => {
        const isOpen = open === index
        const buttonId = `${uid}-q${index}`
        const panelId = `${uid}-a${index}`
        return (
          <div className={styles.item} key={item.title}>
            <h3 className={styles.questionHeading}>
              <button
                className={styles.question}
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? -1 : index)}
              >
                <span>{item.title}</span>
                <span className={styles.sign} data-open={isOpen || undefined} aria-hidden="true">
                  <i />
                  <i />
                </span>
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  className={styles.panel}
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    duration: reduced ? 0.01 : 0.52,
                    ease: EASE_OUT_EXPO,
                    opacity: { duration: reduced ? 0.01 : 0.3 },
                  }}
                >
                  <div className={styles.answer}>
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </Reveal>
  )
}
