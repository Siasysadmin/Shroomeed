import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { SplitText } from '../components/common/SplitText'
import { Reveal } from '../components/common/Reveal'
import { EASE_OUT_EXPO } from '../lib/motion'
import { brand, cart as copy, commerce, product } from '../content/site'
import { formatPrice, useCart } from '../lib/cart'
import styles from './Cart.module.css'

/**
 * One SKU, so the cart is one line and a quantity — no table scaffolding for
 * rows that cannot exist. The summary sticks so the total stays in view while
 * the quantity changes, and the empty state is a real state rather than a
 * blank page: it says what the product is and offers the way back.
 */
export default function Cart() {
  const reduced = useReducedMotion()
  const { qty, setQuantity, remove, subtotal, freeShipping } = useCart()

  const shortfall = commerce.freeShippingOver - subtotal
  const unitPrice = qty >= 3 ? 2550 : 3000
  const supplyText = `${qty * 60} CAPSULES · ${qty} MONTH${qty > 1 ? 'S' : ''} · SM-DS-${qty * 60}`

  return (
    <section className={styles.page} aria-labelledby="cart-title">
      <header className={styles.head}>
        <SplitText lines={copy.title} className={styles.title} id="cart-title" />
      </header>

      <AnimatePresence mode="wait" initial={false}>
        {qty === 0 ? (
          <motion.div
            key="empty"
            className={styles.empty}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: reduced ? 0.01 : 0.5, ease: EASE_OUT_EXPO }}
          >
            <p className={styles.emptyTitle}>{copy.empty}</p>
            <p className={styles.emptyBody}>{copy.emptyBody}</p>
            <Link className={styles.emptyAction} to="/product">
              See Daily Shield
              <svg viewBox="0 0 22 10" fill="none" focusable="false" aria-hidden="true">
                <path d="M0 5h20M16 1l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
              </svg>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            key="filled"
            className={styles.body}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: reduced ? 0.01 : 0.5, ease: EASE_OUT_EXPO }}
          >
            <div className={styles.lines}>
              <article className={styles.line}>
                <Link className={styles.thumb} to="/product" aria-label={`${brand.product} product page`}>
                  <img
                    src={product.gallery[0].src}
                    alt=""
                    width="160"
                    height="120"
                    loading="lazy"
                    decoding="async"
                  />
                </Link>

                <div className={styles.lineBody}>
                  <h2 className={styles.lineName}>
                    <Link to="/product">{brand.product}</Link>
                  </h2>
                  <p className={styles.lineMeta}>
                    {supplyText}
                  </p>

                  <div className={styles.stepper}>
                    <label className="visually-hidden" htmlFor="cart-qty">Quantity</label>
                    <button
                      className={styles.step}
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => setQuantity(qty - 1)}
                    >
                      −
                    </button>
                    <input
                      className={styles.qty}
                      id="cart-qty"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max="99"
                      value={qty}
                      onChange={(event) => setQuantity(event.target.value)}
                    />
                    <button
                      className={styles.step}
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => setQuantity(qty + 1)}
                    >
                      +
                    </button>

                    <button className={styles.removeBtn} type="button" onClick={remove}>
                      Remove
                    </button>
                  </div>
                </div>

                <p className={styles.linePrice}>
                  {formatPrice(unitPrice * qty)}
                  {qty > 1 && (
                    <span className={styles.lineUnit}>{formatPrice(unitPrice)} each</span>
                  )}
                </p>
              </article>
            </div>

            <aside className={styles.summary} aria-label="Order summary">
              <dl className={styles.totals}>
                <div className={styles.row}>
                  <dt>Subtotal</dt>
                  <dd>{formatPrice(subtotal)}</dd>
                </div>
                <div className={styles.row}>
                  <dt>Shipping</dt>
                  <dd>{freeShipping ? 'Free' : 'Calculated at checkout'}</dd>
                </div>
                <div className={`${styles.row} ${styles.grand}`}>
                  <dt>Total</dt>
                  <dd>{formatPrice(subtotal)}</dd>
                </div>
              </dl>

              {!freeShipping && shortfall > 0 && (
                <p className={styles.nudge}>
                  {formatPrice(shortfall)} more for free shipping.
                </p>
              )}

              <button className={styles.checkout} type="button">
                {copy.checkout}
                <span aria-hidden="true">{formatPrice(subtotal)}</span>
              </button>

              <p className={styles.note}>{copy.note}</p>

              <Link className={styles.keep} to="/product">Keep looking</Link>
            </aside>
          </motion.div>
        )}
      </AnimatePresence>

      <Reveal as="ul" className={styles.badges} delay={0.1}>
        <li>ISO &amp; GMP certified</li>
        <li>Third party tested</li>
        <li>Cash on Delivery</li>
      </Reveal>
    </section>
  )
}
