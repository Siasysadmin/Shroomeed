import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { EASE_OUT_EXPO, EASE_OUT_QUART, pick } from '../../lib/motion'
import { scrollToTarget, scrollToTop } from '../../lib/scroller'
import { brand, hero, nav as LINKS } from '../../content/site'
import { useCart } from '../../lib/cart'
import { useSiteSettings } from '../../hooks/useSiteSettings'
import styles from './FloatingNav.module.css'

/** The nav floats into place once, on load. */
const navVariants = {
  rest: { y: -22, opacity: 0, filter: 'blur(6px)' },
  enter: {
    y: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 1.1, delay: 0.35, ease: EASE_OUT_EXPO },
  },
}

/**
 * Not a header bar — a small object resting above the page. It detaches from
 * every edge, carries its own material, and tightens as the hero is left
 * behind rather than switching to a different component.
 */
export function FloatingNav({ reduced }) {
  const [hovered, setHovered] = useState(null)
  const [open, setOpen] = useState(false)
  const [condensed, setCondensed] = useState(false)
  const { scrollY } = useScroll()
  const shellRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { qty } = useCart()
  const { showReviewsMain } = useSiteSettings()

  useMotionValueEvent(scrollY, 'change', (y) => {
    const next = y > window.innerHeight * 0.3
    setCondensed((current) => (current === next ? current : next))
  })

  useEffect(() => setOpen(false), [location.pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (event) => event.key === 'Escape' && setOpen(false)
    const onPointer = (event) => {
      if (!shellRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  /**
   * "/#ingredients" has to work from any route: scroll if we are already on
   * the home page, otherwise navigate and let the page settle first.
   */
  const go = (event, to) => {
    const [path, hash] = to.split('#')
    const target = path || '/'
    if (!hash) return
    event.preventDefault()
    setOpen(false)
    if (location.pathname === target) {
      window.history.pushState(null, '', to)
      scrollToTarget(`#${hash}`, { offset: -80 })
    } else {
      navigate(to)
      setTimeout(() => {
        scrollToTarget(`#${hash}`, { offset: -80, immediate: true })
      }, 100)
    }
  }

  const [activeSection, setActiveSection] = useState(null)

  useEffect(() => {
    const sectionIds = LINKS.map(link => link.to.split('#')[1]).filter(Boolean)
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.find(e => e.isIntersecting)
      if (visible) setActiveSection(visible.target.id)
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 })

    const timeout = setTimeout(() => {
      sectionIds.forEach(id => {
        const el = document.getElementById(id)
        if (el) observer.observe(el)
      })
    }, 100)
    
    return () => {
      clearTimeout(timeout)
      observer.disconnect()
    }
  }, [location.pathname])

  const isCurrent = (to) => {
    const [path, hash] = to.split('#')
    const targetPath = path || '/'
    if (hash) return location.pathname === targetPath && activeSection === hash
    return targetPath === location.pathname
  }

  /*
    A hidden section leaves no way in. When the reviews wall is switched
    off its nav entry is removed outright rather than left pointing at a
    page that redirects — the menu should not hint that it exists.
  */
  const links = showReviewsMain ? LINKS : LINKS.filter((link) => link.to !== '/reviews')

  const marked = hovered ?? links.findIndex((link) => isCurrent(link.to))
  const indicatorTransition = reduced
    ? { duration: 0 }
    : { type: 'tween', duration: 0.3, ease: EASE_OUT_QUART }

  return (
    <>
      <motion.header
        className={styles.header}
        variants={pick(navVariants, reduced)}
        initial="rest"
        animate="enter"
        ref={shellRef}
      >
        <div className={styles.capsule} data-condensed={condensed || undefined}>
          <Link
            className={styles.brand}
            to="/"
            onClick={() => location.pathname === '/' && scrollToTop()}
          >
            <img src="/media/Group%206189.svg" alt="ShrooMEED" className={styles.brandSvgLogo} />
          </Link>

          <span className={styles.divider} aria-hidden="true" />

          <nav className={styles.nav} aria-label="Primary">
            <ul className={styles.list}>
              {links.map((link, index) => (
                <li key={link.to} className={styles.item}>
                  <Link
                    className={styles.link}
                    to={link.to}
                    aria-current={isCurrent(link.to) ? 'page' : undefined}
                    onClick={(event) => go(event, link.to)}
                    onPointerEnter={() => setHovered(index)}
                    onPointerLeave={() => setHovered(null)}
                    onFocus={() => setHovered(index)}
                    onBlur={() => setHovered(null)}
                  >
                    {index === marked && (
                      <motion.span
                        className={styles.indicator}
                        layoutId="nav-indicator"
                        transition={indicatorTransition}
                        aria-hidden="true"
                      />
                    )}
                    <span className={styles.linkLabel}>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Link className={styles.action} to="/product">
            Shop
          </Link>

          <button
            className={styles.toggle}
            type="button"
            aria-expanded={open}
            aria-controls="floating-nav-menu"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="visually-hidden">{open ? 'Close menu' : 'Open menu'}</span>
            <span className={styles.toggleGlyph} data-open={open || undefined} aria-hidden="true">
              <i />
              <i />
            </span>
          </button>

          {/*
            The one action that stays out of the sheet on a handset. Ordering is
            done in CSS so the desktop capsule keeps its own reading order.
          */}
          <Link className={styles.cartMobile} to="/cart" aria-label={`Cart${qty > 0 ? ` (${qty})` : ''}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            {qty > 0 && <span className={styles.badge}>{qty}</span>}
          </Link>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              className={styles.sheet}
              id="floating-nav-menu"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.98 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: reduced ? 0.01 : 0.42, ease: EASE_OUT_EXPO }}
            >
              <ul className={styles.sheetList}>
                {links.map((link) => (
                  <li key={link.to}>
                    <Link className={styles.sheetLink} to={link.to} onClick={(e) => go(e, link.to)}>
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link className={styles.sheetLink} to="/product" onClick={() => setOpen(false)}>
                    Shop
                  </Link>
                </li>
                <li>
                  <Link className={styles.sheetLink} to="/account" onClick={() => setOpen(false)}>
                    Account
                  </Link>
                </li>
                <li>
                  <Link className={styles.sheetLink} to="/cart" onClick={() => setOpen(false)}>
                    Cart {qty > 0 && `(${qty})`}
                  </Link>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <div className={styles.iconActions}>
        <Link to="/account" className={styles.iconBtn} aria-label="Account">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </Link>
        <Link to="/cart" className={styles.iconBtn} aria-label="Cart">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          {qty > 0 && <span className={styles.badge}>{qty}</span>}
        </Link>
      </div>
    </>
  )
}
