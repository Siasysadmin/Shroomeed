import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { commerce } from '../content/site'

const KEY = 'shroomeed.cart.v1'
const CartContext = createContext(null)

/** Daily Shield is the only SKU, so the cart is a single line with a quantity. */
const readStored = () => {
  try {
    const raw = localStorage.getItem(KEY)
    const value = raw ? JSON.parse(raw) : null
    const qty = Number(value?.qty)
    return Number.isFinite(qty) && qty > 0 ? Math.min(Math.floor(qty), 99) : 0
  } catch {
    return 0
  }
}

export function CartProvider({ children }) {
  const [qty, setQty] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setQty(readStored())
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ qty }))
    } catch {}
  }, [qty])

  const setQuantity = useCallback((next) => {
    setQty(Math.max(0, Math.min(99, Math.floor(Number(next) || 0))))
  }, [])

  const add = useCallback((count = 1) => {
    setQty((current) => Math.min(99, current + count))
    setIsOpen(true)
  }, [])

  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  // Dynamic pricing: 15% off (2550 per unit) if buying 3 or more
  const pricePerItem = qty >= 3 ? 2550 : 3000

  const value = useMemo(
    () => ({
      qty,
      add,
      remove: () => setQty(0),
      setQuantity,
      subtotal: qty * pricePerItem,
      freeShipping: qty * pricePerItem >= commerce.freeShippingOver,
      isOpen,
      openCart,
      closeCart
    }),
    [qty, add, setQuantity, isOpen, openCart, closeCart, pricePerItem],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const value = useContext(CartContext)
  if (!value) throw new Error('useCart must be used inside <CartProvider>')
  return value
}

/** ₹3,000 — grouped the Indian way, since this is an India-only store. */
export const formatPrice = (amount) =>
  `${commerce.currency}${amount.toLocaleString('en-IN')}`
