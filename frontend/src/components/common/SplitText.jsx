import { motion, useReducedMotion } from 'framer-motion'
import { VIEWPORT, pick, riseBlurred } from '../../lib/motion'
import styles from './SplitText.module.css'

/**
 * Display type that rises word by word out of a clipped baseline.
 *
 * Lines are passed in explicitly rather than letting the browser wrap: at
 * display sizes the break is art direction, and a mask needs to know where
 * the baseline is. Each word gets its own clip so the rise reads as type
 * being set, not as a block sliding up.
 */
export function SplitText({
  lines,
  as = 'h2',
  className,
  delay = 0,
  stagger = 0.055,
  lineStagger = 0.09,
  onMount = false,
  id,
}) {
  const reduced = useReducedMotion()
  const variants = pick(riseBlurred, reduced)
  const Tag = motion[as] ?? motion.h2

  // `onMount` is for the hero, which animates on load; everything else waits
  // until it is actually looked at.
  const trigger = onMount
    ? { animate: 'enter' }
    : { whileInView: 'enter', viewport: VIEWPORT }

  let index = 0

  /*
    Remount the whole heading whenever the line set changes.

    `VIEWPORT` is `once: true`, so the in-view trigger fires exactly once and
    then releases its observer. A caller that re-breaks its lines at a
    breakpoint — the closing headline sets "join / the ritual." over two lines
    on a handset — swaps the array underneath a heading that has already
    fired. Words carried over keep their finished state, but words that mount
    afterwards land on `initial="rest"` with nothing left to animate them, and
    stay invisible at opacity 0.

    Keying the element on the content means a re-break is a fresh mount: the
    trigger re-arms and every word animates together.
  */
  const signature = lines.map((line) => (Array.isArray(line) ? line : line.words).join(' ')).join('|')

  return (
    <Tag
      key={signature}
      className={`${styles.split} ${className ?? ''}`}
      initial="rest"
      id={id}
      {...trigger}
    >
      {lines.map((line, lineIndex) => {
        const words = Array.isArray(line) ? line : line.words
        const accent = Array.isArray(line) ? false : line.accent
        return (
          <span className={styles.line} key={lineIndex} data-accent={accent || undefined}>
            {words.map((word) => {
              const wordDelay = reduced
                ? 0
                : delay + lineIndex * lineStagger + index++ * stagger
              return (
                <span className={styles.clip} key={`${lineIndex}-${word}`}>
                  <motion.span className={styles.word} variants={variants} custom={wordDelay}>
                    {word}
                  </motion.span>
                </span>
              )
            })}
          </span>
        )
      })}
    </Tag>
  )
}
