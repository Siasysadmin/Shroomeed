import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { SplitText } from '../components/common/SplitText'
import { Reveal } from '../components/common/Reveal'
import { EASE_OUT_EXPO } from '../lib/motion'
import { brand, cart as copy, commerce, product } from '../content/site'
import { formatPrice, useCart } from '../lib/cart'
import { API_URL } from '../lib/api'
import styles from './Cart.module.css'

/** Razorpay ka widget ek script hai; zaroorat par ek baar load karo. */
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true)
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const EMPTY_FORM = { name: '', email: '', phone: '', address: '' }

export default function Cart() {
  const reduced = useReducedMotion()
  const { qty, setQuantity, remove, subtotal, freeShipping } = useCart()

  const [form, setForm] = useState(EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [placedOrderId, setPlacedOrderId] = useState('')

  const shortfall = commerce.freeShippingOver - subtotal
  const unitPrice = qty >= 3 ? 2550 : 3000
  const supplyText = `${qty * 60} CAPSULES · ${qty} MONTH${qty > 1 ? 'S' : ''} · SM-DS-${qty * 60}`

  const setField = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  function validate() {
    if (!form.name.trim()) return 'Please enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Please enter a valid email.'
    if (!/^[0-9]{10}$/.test(form.phone.replace(/\D/g, '').slice(-10))) {
      return 'Please enter a 10-digit phone number.'
    }
    if (form.address.trim().length < 12) return 'Please enter your full delivery address.'
    return ''
  }

  async function handleCheckout() {
    setError('')

    const problem = validate()
    if (problem) {
      setError(problem)
      return
    }

    setBusy(true)
    try {
      const ready = await loadRazorpay()
      if (!ready) throw new Error('Could not load the payment window. Check your connection.')

      const createRes = await fetch(`${API_URL}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qty }),
      })
      const created = await createRes.json()
      if (!createRes.ok) throw new Error(created?.error || 'Could not start payment.')

      const rzp = new window.Razorpay({
        key: created.keyId,
        order_id: created.orderId,
        amount: created.amount,
        currency: created.currency,
        name: 'ShrooMEED',
        description: brand.product || 'Daily Shield',
        prefill: {
          name: form.name.trim(),
          email: form.email.trim(),
          contact: form.phone.replace(/\D/g, '').slice(-10),
        },
        theme: { color: '#D4AF37' },
        modal: {
          ondismiss: () => {
            setBusy(false)
            setError('Payment window closed before the payment went through.')
          },
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API_URL}/api/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                customer: {
                  name: form.name.trim(),
                  email: form.email.trim(),
                  phone: form.phone.replace(/\D/g, '').slice(-10),
                  address: form.address.trim(),
                },
              }),
            })
            const verified = await verifyRes.json()
            if (!verifyRes.ok) throw new Error(verified?.error || 'Could not confirm the order.')

                          try {
              const saved = JSON.parse(localStorage.getItem('shroomeed.orders.v1') || '[]')
              if (verified.viewToken && !saved.includes(verified.viewToken)) {
                localStorage.setItem(
                  'shroomeed.orders.v1',
                  JSON.stringify([verified.viewToken, ...saved].slice(0, 50)),
                )
              }
            } catch {
              // private window storage block kar sakti hai; order server par phir bhi save hai
            }

            setPlacedOrderId(verified.orderId)
            setForm(EMPTY_FORM)
            remove()
          } catch (err) {
            setError(
              `${err.message} Your payment id is ${response.razorpay_payment_id} — please keep it and contact us.`,
            )
          } finally {
            setBusy(false)
          }
        },
      })

      rzp.on('payment.failed', (event) => {
        setBusy(false)
        setError(event?.error?.description || 'Payment failed. Please try again.')
      })

      rzp.open()
    } catch (err) {
      setBusy(false)
      setError(err.message)
    }
  }

  if (placedOrderId) {
    return (
      <section className={styles.page} aria-labelledby="cart-title">
        <header className={styles.head}>
      <SplitText lines={[{ words: ['thank'] }, { words: ['you.'], accent: true }]} className={styles.title} id="cart-title" />
        </header>
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Your order is confirmed.</p>
          <p className={styles.emptyBody}>
            Order {placedOrderId}. A confirmation is on its way to your email.
          </p>
          <Link className={styles.emptyAction} to="/account">
            View my orders
            <svg viewBox="0 0 22 10" fill="none" focusable="false" aria-hidden="true">
              <path d="M0 5h20M16 1l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
            </svg>
          </Link>
        </div>
      </section>
    )
  }

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

              <div className={styles.checkoutForm}>
                <h2 className={styles.formTitle}>Delivery details</h2>

                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label htmlFor="co-name">Full name</label>
                    <input
                      id="co-name"
                      type="text"
                      autoComplete="name"
                      value={form.name}
                      onChange={setField('name')}
                      placeholder="Aayan Garg"
                    />
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="co-phone">Phone</label>
                    <input
                      id="co-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={form.phone}
                      onChange={setField('phone')}
                      placeholder="9876543210"
                    />
                  </div>

                  <div className={`${styles.field} ${styles.fieldWide}`}>
                    <label htmlFor="co-email">Email</label>
                    <input
                      id="co-email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={setField('email')}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className={`${styles.field} ${styles.fieldWide}`}>
                    <label htmlFor="co-address">Delivery address</label>
                    <textarea
                      id="co-address"
                      rows="3"
                      autoComplete="street-address"
                      value={form.address}
                      onChange={setField('address')}
                      placeholder="House / flat, street, area, city, state, PIN code"
                    />
                  </div>
                </div>
              </div>
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

              {error && (
                <p className={styles.payError} role="alert">{error}</p>
              )}

              <button
                className={styles.checkout}
                type="button"
                onClick={handleCheckout}
                disabled={busy}
              >
                {busy ? 'Please wait…' : copy.checkout}
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