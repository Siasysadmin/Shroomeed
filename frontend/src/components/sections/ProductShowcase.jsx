import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Reveal } from '../common/Reveal'
import { commerce, brand } from '../../content/site'
import { EASE_OUT_EXPO } from '../../lib/motion'
import { useCart } from '../../lib/cart'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { AutoplayVideo } from '../common/AutoplayVideo'
import styles from './ProductShowcase.module.css'

export function ProductShowcase() {
  const [showToast, setShowToast] = useState(false)
  const { add } = useCart()

  /*
    The box-open clip plays on hover with a mouse and on tap with a finger —
    never on its own, and with no play button drawn over it.

    It ships in two encodings. The WebM carries a real alpha channel, which
    every Chromium/Firefox engine composites; WebKit cannot, and paints the
    transparent area solid. Every iPhone browser is WebKit, so they get the
    plain H.264 cut instead. The `#t=0.001` fragment makes iOS draw the first
    frame as a poster, so the closed box is visible before the first tap.
  */
  const canHover = useMediaQuery('(hover: hover) and (pointer: fine)')
  const [boxSrc] = useState(() =>
    isWebKit() ? '/media/h_p.mp4#t=0.001' : '/media/h_p.webm'
  )

  const playBox = (video) => {
    video.currentTime = 0
    video.play()?.catch(() => {})
  }

  const handleAddToCart = () => {
    add(1)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  return (
    <section className={styles.section} aria-label="Product Showcase">
      <div className={styles.inner}>
        
        {/* Left Side: Video */}
        <div className={styles.sliderCol}>
          <div className={styles.slideFrame}>
            <AutoplayVideo src="/media/Home_cart_vd.mp4" className={styles.slideImg} loop />
          </div>
        </div>

        {/* Right Side: Product Info */}
        <div className={styles.infoCol}>
          <Reveal delay={0.1}>
            <p className={styles.eyebrow}>To complete any morning</p>
          </Reveal>
          
          <Reveal delay={0.2} as="h2" className={styles.title}>
            {brand.name}{brand.mark} {brand.product}
          </Reveal>

          <Reveal delay={0.3} as="p" className={styles.desc}>
            Elevate your daily ritual with our full spectrum formulation. Engineered to increase stamina, elevate VO2 max, and act as an armor for your respiratory system.
          </Reveal>
          
          <Reveal delay={0.4} className={styles.productStage}>
            <div className={styles.boxHoverContainer}>
              <video
                src={boxSrc}
                className={styles.productVideo}
                muted
                playsInline
                preload="auto"
                disablePictureInPicture
                onMouseEnter={canHover ? (e) => e.currentTarget.play() : undefined}
                onMouseLeave={
                  canHover
                    ? (e) => {
                        e.currentTarget.pause()
                        e.currentTarget.currentTime = 0
                      }
                    : undefined
                }
                onClick={canHover ? undefined : (e) => playBox(e.currentTarget)}
                onEnded={(e) => e.currentTarget.pause()}
              />
            </div>
          </Reveal>
          
          <Reveal delay={0.5} className={styles.actionWrap} viewport={{ once: true, margin: '0px' }}>
            <button className={styles.cartBtn} type="button" onClick={handleAddToCart}>
              <span className={styles.cartBtnLabel}>Add to cart</span>
              <span className={styles.cartBtnIcon} aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              </span>
            </button>
          </Reveal>

        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            className={styles.toast}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--amber)' }}><polyline points="20 6 9 17 4 12"></polyline></svg>
            Added to cart
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

/** Safari and every iOS browser — the engines that cannot composite WebM alpha. */
function isWebKit() {
  const ua = navigator.userAgent
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const safari = /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(ua)
  return iOS || safari
}
