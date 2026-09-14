import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart, formatPrice } from '../../lib/cart'
import { commerce } from '../../content/site'
import styles from './CartDrawer.module.css'

export function CartDrawer() {
  const { qty, setQuantity, subtotal, isOpen, closeCart } = useCart()

  const supplyText = `${qty * 60} Capsules / ${qty} Month Supply`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            aria-hidden="true"
          />
          
          <motion.div
            className={styles.drawer}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            role="dialog"
            aria-modal="true"
            aria-label="Your Cart"
          >
            <div className={styles.imageSection}>
              <div className={styles.topBar}>
                <span className={styles.cartLabel}>CART</span>
                <button className={styles.close} onClick={closeCart} aria-label="Close cart">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              
              <div className={styles.productImageWrapper}>
                <video 
                  src="/media/Home_cart_vd.mp4" 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className={styles.productImage} 
                />
              </div>
            </div>

            <div className={styles.card}>
              {qty === 0 ? (
                <div className={styles.emptyState}>
                  <h2>Your cart is empty</h2>
                  <button className={styles.continueBtn} onClick={closeCart}>Continue Shopping</button>
                </div>
              ) : (
                <>
                  <div className={styles.cardHeader}>
                    <h2 className={styles.title}>DAILY SHIELD</h2>
                    <div className={styles.starWrap}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--amber)" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </div>
                  </div>

                  <ul className={styles.bullets}>
                    <li>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      {supplyText}
                    </li>
                    <li>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Clinically Studied Actives
                    </li>
                    <li>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      No Fillers or Synthetics
                    </li>
                  </ul>

                  <div className={styles.priceRow}>
                    <div className={styles.priceCol}>
                      <span className={styles.priceValue}>{formatPrice(subtotal)}</span>
                    </div>
                    
                    <div className={styles.qtyControl}>
                      <span className={styles.qtyLabel}>Qty:</span>
                      <div className={styles.qtyButtons}>
                        <button onClick={() => setQuantity(Math.max(1, qty - 1))} aria-label="Decrease quantity">−</button>
                        <span className={styles.qtyValue}>{qty}</span>
                        <button onClick={() => setQuantity(qty + 1)} aria-label="Increase quantity">+</button>
                      </div>
                    </div>
                  </div>

                  <Link to="/cart" className={styles.checkoutBtn} onClick={closeCart}>
                    CHECKOUT
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
