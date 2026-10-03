import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { EASE_OUT_EXPO } from '../lib/motion'
import { API_URL } from '../lib/api'
import { formatPrice } from '../lib/cart'
import { product } from '../content/site'
import styles from './Account.module.css'

const ORDERS_KEY = 'shroomeed.orders.v1'

function readTokens() {
  try {
    const saved = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function formatDate(value) {
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export default function Account() {
  const [activeTab, setActiveTab] = useState('orders')
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeTab])

  useEffect(() => {
    const tokens = readTokens()
    if (tokens.length === 0) {
      setLoading(false)
      return
    }

    fetch(`${API_URL}/api/orders/mine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokens }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null)
        if (!res.ok) throw new Error(data?.error || 'Could not load your orders.')
        return data
      })
      .then((rows) => {
        const list = Array.isArray(rows) ? rows : []
        setOrders(list)
        if (list[0]) setExpandedOrder(list[0].orderId)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

    const [trackFor, setTrackFor] = useState(null)
  const [trackData, setTrackData] = useState(null)
  const [trackBusy, setTrackBusy] = useState(false)
  const [trackError, setTrackError] = useState('')

  /** Courier se seedha taaza haal — apne hi order ka, apne hi token se. */
  const trackOrder = async (order) => {
    if (trackFor === order.orderId) {
      setTrackFor(null)
      return
    }

    setTrackFor(order.orderId)
    setTrackData(null)
    setTrackError('')
    setTrackBusy(true)

    try {
      const res = await fetch(`${API_URL}/api/orders/track-mine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: order.viewToken }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Could not fetch tracking.')
      setTrackData(data)
    } catch (err) {
      setTrackError(err.message)
    } finally {
      setTrackBusy(false)
    }
  }


  const displayName = orders[0]?.customerName || 'My account'
  const initial = displayName.trim().charAt(0).toUpperCase() || 'S'

  const panelVariants = {
    enter: { opacity: 0, y: 16 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.layout}>

          <aside className={styles.sidebar}>
            <div className={styles.userProfile}>
              <div
                className={styles.avatar}
                aria-hidden="true"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#D4AF37',
                  color: '#fff',
                  fontSize: '1.6rem',
                  fontWeight: 600,
                }}
              >
                {initial}
              </div>
              <div className={styles.userName}>{displayName}</div>
            </div>

            <div className={styles.navMenu}>
              <button
                className={`${styles.navItem} ${activeTab === 'orders' ? styles.navItemActive : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                My orders
              </button>
            </div>
          </aside>

          <main className={styles.content}>
            <AnimatePresence mode="wait">
              {activeTab === 'orders' && (
                <motion.div
                  key="orders"
                  variants={panelVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                >
                  <div className={styles.panelHeader}>
                    <h1 className={styles.panelTitle}>My orders</h1>
                  </div>

                  {loading && <p>Loading your orders…</p>}

                  {!loading && error && <p role="alert">{error}</p>}

                  {!loading && !error && orders.length === 0 && (
                    <div>
                      <p>You haven't placed any orders on this device yet.</p>
                      <p style={{ marginTop: 12 }}>
                        <Link to="/product">Shop Daily Shield →</Link>
                      </p>
                    </div>
                  )}

                  {!loading && !error && orders.length > 0 && (
                    <div className={styles.orderTable}>
                      <div className={styles.tableHeader}>
                        <span>Order Number</span>
                        <span>Cost</span>
                        <span>Order Status</span>
                      </div>

                      <div className={styles.orderList}>
                        {orders.map((order) => (
                          <div key={order.orderId} className={styles.orderRow}>
                            <div
                              className={`${styles.orderMain} ${expandedOrder === order.orderId ? styles.expanded : ''}`}
                              onClick={() => setExpandedOrder(expandedOrder === order.orderId ? null : order.orderId)}
                            >
                              <span>
                                {order.orderId}
                                <br />
                                <small style={{ opacity: 0.6 }}>{formatDate(order.createdAt)}</small>
                              </span>
                              <span>{formatPrice(order.totalAmount || 0)}</span>
                              <div className={styles.orderStatusCol}>
                                <div className={styles.statusWrapper}>
                                  <div className={styles.statusDot}></div>
                                  <span>{order.status}</span>
                                </div>
                                <svg className={styles.chevron} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                              </div>
                            </div>

                            <AnimatePresence initial={false}>
                              {expandedOrder === order.orderId && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
                                  style={{ overflow: 'hidden' }}
                                >
                                  <div className={styles.orderItems}>
                                    {(order.items || []).map((item, i) => (
                                      <div key={i} className={styles.itemRow}>
                                        <div className={styles.itemInfo}>
                                          <img src={product.gallery[0].src} alt={item.title} className={styles.itemImg} />
                                          <div className={styles.itemTitle}>{item.title}</div>
                                        </div>
                                        <div className={styles.itemQty}>Quantity: {item.quantity}</div>
                                        <div className={styles.itemPrice}>
                                          Price: {formatPrice((item.price || 0) * (item.quantity || 1))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                                                    {order.delhiveryAwb && (
                                    <div style={{ padding: '0 0 16px' }}>
                                      <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); trackOrder(order) }}
                                        style={{
                                          padding: '8px 14px',
                                          borderRadius: 999,
                                          border: '1px solid rgba(0,0,0,0.18)',
                                          background: 'transparent',
                                          font: 'inherit',
                                          fontSize: '0.85rem',
                                          cursor: 'pointer',
                                        }}
                                      >
                                        {trackFor === order.orderId ? 'Hide tracking' : 'Track shipment'}
                                      </button>

                                                                         {trackFor === order.orderId && (
                                        <Tracking data={trackData} busy={trackBusy} error={trackError} />
                                      )}
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </main>

        </div>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------- tracking */

const TRACK_STEPS = ['Packed', 'On the way', 'Out for delivery', 'Delivered']

/** Courier ke shabd grahak ki bhasha mein. */
function plainStatus(raw) {
  const value = String(raw || '').toLowerCase()
  if (value.includes('delivered')) return { label: 'Delivered', step: 3 }
  if (value.includes('rto') || value.includes('return')) return { label: 'Coming back to us', step: -1 }
  if (value.includes('cancel') || value.includes('lost')) return { label: 'Cancelled', step: -1 }
  if (value.includes('dispatched') || value.includes('out for delivery')) return { label: 'Out for delivery', step: 2 }
  if (value.includes('transit') || value.includes('pending')) return { label: 'On the way', step: 1 }
  if (value.includes('manifest') || value.includes('not picked')) return { label: 'Packed', step: 0 }
  return { label: raw || 'Updating', step: 0 }
}

/** "Bhopal_BharatNagar_D (Madhya Pradesh)" ka matlab grahak ke liye bas "Bhopal" hai. */
function placeName(raw) {
  return String(raw || '').split('(')[0].split('_')[0].trim()
}

function when(value) {
  if (!value) return ''
  const date = new Date(value)
  return (
    date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) +
    ', ' +
    date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  )
}

/**
 * Courier har hub par kai baar scan karta hai, to "On the way" lagatar
 * dohrata hai. Ek padav ek hi baar dikhao — list safar jaisi lage, log
 * jaisi nahi.
 */
function tidyScans(scans) {
  const out = []
  for (const scan of scans || []) {
    const label = plainStatus(scan.status).label
    const location = placeName(scan.location)
    const last = out[out.length - 1]
    if (last && last.label === label && last.location === location) continue
    out.push({ label, location, at: scan.at })
  }
  return out
}

function Tracking({ data, busy, error }) {
  if (busy) return <p className={styles.trackNote}>Checking with the courier…</p>
  if (error) return <p className={styles.trackNote} role="alert">{error}</p>
  if (!data) return null

  const now = plainStatus(data.status)
  const steps = tidyScans(data.scans).reverse()
  const delivered = now.step === 3

  return (
    <div className={styles.track}>
      <div className={styles.trackHead}>
        <span className={styles.trackStatus}>{now.label}</span>
        {!delivered && data.expectedDate && (
          <span className={styles.trackMeta}>
            Expected by{' '}
            {new Date(data.expectedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>

      {now.step >= 0 && (
        <ol className={styles.trackBar}>
          {TRACK_STEPS.map((label, i) => (
            <li
              key={label}
              className={`${styles.trackStep} ${i <= now.step ? styles.trackStepDone : ''}`}
            >
              <span className={styles.trackDot} />
              <span className={styles.trackStepLabel}>{label}</span>
            </li>
          ))}
        </ol>
      )}

      {steps.length > 0 && (
        <ul className={styles.trackList}>
          {steps.map((scan, i) => (
            <li key={i} className={styles.trackItem}>
              <span className={styles.trackItemLabel}>{scan.label}</span>
              <span className={styles.trackItemMeta}>
                {[scan.location, when(scan.at)].filter(Boolean).join(' · ')}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className={styles.trackAwb}>Tracking number {data.awb}</p>
    </div>
  )
}