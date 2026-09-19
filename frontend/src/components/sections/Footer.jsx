import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Reveal } from '../common/Reveal'
import { brand, footer, newsletter } from '../../content/site'
import styles from './Footer.module.css'

/**
 * Footer, with the mailing list at the top of it.
 *
 * The form validates and reports state on the client. It is deliberately not
 * wired to a provider — point `onSubmit` at the real endpoint (Klaviyo,
 * Mailchimp, an internal route) and the rest of this component is unchanged.
 */
export function Footer() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle') // idle | invalid | done

  const onSubmit = (event) => {
    event.preventDefault()
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
    setState(valid ? 'done' : 'invalid')
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>


        <div className={styles.body}>
          <div className={styles.brandBlock}>
            <p className={styles.wordmark}>
              Shroo<span className={styles.wordmarkAccent}>MEED</span>
              <span className={styles.wordmarkTm}>{brand.mark}</span>
            </p>
            <p className={styles.blurb}>{footer.blurb}</p>
          </div>

          <nav className={styles.columns} aria-label="Footer">
            {footer.columns.map((column) => (
              <div className={styles.column} key={column.title}>
                <h2 className={styles.columnTitle}>{column.title}</h2>
                <ul>
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link className={styles.link} to={link.to}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className={styles.footerBottom}>
          <div className={styles.legalBlock}>
            <p className={styles.legal}>{footer.legal}</p>
            <address className={styles.address}>{footer.address}</address>
          </div>
          <ul className={styles.verifiedBadges}>
            <li className={styles.badgeSeal}>
              <span className={styles.badgeTitle}>ISO</span>
              <span className={styles.badgeSub}>CERTIFIED</span>
            </li>
            <li className={styles.badgeSeal}>
              <span className={styles.badgeTitle}>GMP</span>
              <span className={styles.badgeSub}>CERTIFIED</span>
            </li>
            <li className={styles.badgeSeal}>
              <span className={styles.badgeTitle}>FSSAI</span>
              <span className={styles.badgeSub}>APPROVED</span>
            </li>
          </ul>
        </div>
      </div>
      <div className={styles.giantBrand}>
        Shroo<span className={styles.giantBrandAccent}>MEED</span>
      </div>
    </footer>
  )
}
