import { Link } from 'react-router-dom'
import styles from './ArrowLink.module.css'

/**
 * The quieter sibling of the hero CTA: a text link whose rule draws itself
 * across on hover while the arrow steps forward. Same `--on` switch, so it
 * reverses cleanly and works identically from the keyboard.
 */
export function ArrowLink({ href, children, tone = 'ink' }) {
  const isInternal = href && href.startsWith('/')

  const content = (
    <>
      <span className={styles.text}>{children}</span>
      <span className={styles.rule} aria-hidden="true" />
      <span className={styles.arrow} aria-hidden="true">
        <svg viewBox="0 0 22 10" fill="none" focusable="false">
          <path d="M0 5h20M16 1l4 4-4 4" stroke="currentColor" strokeWidth="1.4"
                strokeLinecap="square" />
        </svg>
      </span>
    </>
  )

  if (isInternal) {
    return (
      <Link className={styles.link} to={href} data-tone={tone}>
        {content}
      </Link>
    )
  }

  return (
    <a className={styles.link} href={href} data-tone={tone} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>
      {content}
    </a>
  )
}
