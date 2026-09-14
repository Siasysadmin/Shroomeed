import { motion, useReducedMotion } from 'framer-motion'
import { VIEWPORT, lift, pick } from '../../lib/motion'

/**
 * Reveals its children once, when they first enter the viewport.
 *
 * Deliberately self-contained — it sets its own `initial`/`whileInView`
 * rather than inheriting a variant label from an ancestor, so it can never
 * collide with a scroll-linked `style` on a parent.
 */
export function Reveal({
  as = 'div',
  delay = 0,
  distance = 18,
  className,
  children,
  ...rest
}) {
  const reduced = useReducedMotion()
  const Tag = motion[as] ?? motion.div

  return (
    <Tag
      className={className}
      variants={pick(lift(distance), reduced)}
      initial="rest"
      whileInView="enter"
      viewport={VIEWPORT}
      custom={reduced ? 0 : delay}
      {...rest}
    >
      {children}
    </Tag>
  )
}
