import { Link } from 'react-router-dom'
import { hero } from '../../content/site'
import styles from './HeroCTA.module.css'

/**
 * A statement, not a buy button. The word is set twice — a solid layer and a
 * stroked outline layer sitting a fraction of an em off it. On hover or focus
 * the outline draws across the word left-to-right while an amber fill sweeps
 * the pill, producing a layered echo rather than a state change.
 *
 * All of it is CSS transitions keyed off one `--on` switch, so an interrupted
 * hover reverses from wherever it got to instead of snapping.
 */
export function HeroCTA({ hideAside }) {
  return (
    <div className={styles.wrap} data-centered={hideAside ? "true" : undefined}>
      <Link className={`${styles.btn} ${styles['fx-46']}`} to="/product">
        <span className={styles['btn-label']}>
          {hero.cta.split('').map((char, index) => (
            <span key={index} className={styles.charWrapper} style={{ '--index': index }}>
              <span className={styles.char} data-char={char}>{char === ' ' ? '\u00A0' : char}</span>
            </span>
          ))}
        </span>
      </Link>
      {!hideAside && (
        <p className={styles.aside}>
          {hero.aside.map((line) => (<span key={line}>{line}</span>))}
        </p>
      )}
    </div>
  )
}
