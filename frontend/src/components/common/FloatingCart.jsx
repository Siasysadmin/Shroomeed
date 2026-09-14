import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useCart } from '../../lib/cart'
import styles from './FloatingCart.module.css'

export function FloatingCart() {
  const [isVisible, setIsVisible] = useState(false)
  const location = useLocation()
  const { add } = useCart()

  useEffect(() => {
    // Hide on cart page
    if (location.pathname === '/cart') {
      setIsVisible(false)
      return
    }

    const checkScroll = () => {
      // Show after scrolling past the first section (e.g. 300px)
      const scrolled = window.scrollY > 300
      
      // Hide if footer is in view
      const footer = document.querySelector('footer')
      let footerVisible = false
      if (footer) {
        const rect = footer.getBoundingClientRect()
        footerVisible = rect.top < window.innerHeight
      }

      setIsVisible(scrolled && !footerVisible)
    }

    window.addEventListener('scroll', checkScroll, { passive: true })
    checkScroll() // Initial check

    return () => window.removeEventListener('scroll', checkScroll)
  }, [location.pathname])

  const handleAddToCart = () => {
    add(1)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className={styles.wrapper}
          initial={{ y: 100, opacity: 0, x: '-50%' }}
          animate={{ y: 0, opacity: 1, x: '-50%' }}
          exit={{ y: 100, opacity: 0, x: '-50%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <div className={styles.bar}>
            <div className={styles.left}>
              <div className={styles.imageWrap}>
                <img src="/media/shop01.png" alt="Daily Shield" />
              </div>
              <div className={styles.textWrap}>
                <p className={styles.title}>Daily Shield</p>
                <p className={styles.subtitle}>₹3,000 / 1 month delivery</p>
              </div>
            </div>
            <button className={styles.addButton} onClick={handleAddToCart}>
              Add to cart
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
