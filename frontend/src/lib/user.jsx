import { createContext, useCallback, useContext, useMemo, useState } from 'react'

/**
 * Who is using the site, as far as the storefront is concerned.
 *
 * This is a lightweight identity, not an authentication system: the visitor
 * states an email address, it is kept on this device, and it travels with
 * anything they submit so the admin can see who asked. There is no password
 * and no server-side session, so treat the address as a claim, not proof — it
 * is the same trust model as an email field on a contact form, except it is
 * captured once and reused, and nothing can be submitted without it.
 */
const STORAGE_KEY = 'shroomeed_user'

const UserContext = createContext(null)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const isValidEmail = (value) => EMAIL_RE.test(String(value || '').trim())

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return isValidEmail(parsed?.email) ? parsed : null
  } catch {
    return null
  }
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(read)

  const signIn = useCallback((email, name = '') => {
    const clean = String(email || '').trim().toLowerCase()
    if (!isValidEmail(clean)) throw new Error('Enter a valid email address.')
    const next = { email: clean, name: String(name || '').trim() }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // a private window can refuse storage; the session still works in memory
    }
    setUser(next)
    return next
  }, [])

  const signOut = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* nothing to clean up */
    }
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, email: user?.email || '', isSignedIn: Boolean(user), signIn, signOut }),
    [user, signIn, signOut]
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser must be used inside <UserProvider>')
  return context
}
