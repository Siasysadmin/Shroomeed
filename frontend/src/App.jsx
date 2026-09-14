import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import { FloatingNav } from './components/nav/FloatingNav'
import { FloatingCart } from './components/common/FloatingCart'
import { CartDrawer } from './components/common/CartDrawer'
import { Footer } from './components/sections/Footer'
import { Welcome, shouldPlay } from './components/welcome/Welcome'
import Home from './pages/Home'

/*
  Every route except the landing page is fetched on demand.

  They were all static imports, so one bundle carried the shop, the cart,
  the account area and the whole admin panel to every first-time visitor —
  who, on the overwhelmingly common path, only ever sees the home page.
  Behaviour is unchanged; the code for a route simply arrives when the
  route does.
*/
const Science = lazy(() => import('./pages/Science'))
const Product = lazy(() => import('./pages/Product'))
const Cart = lazy(() => import('./pages/Cart'))
const Reviews = lazy(() => import('./pages/Reviews'))
const FaqPage = lazy(() => import('./pages/FaqPage'))
const AllResearches = lazy(() => import('./pages/AllResearches'))
const Account = lazy(() => import('./pages/Account'))
const Admin = lazy(() => import('./pages/Admin'))
const Policy = lazy(() => import('./pages/Policy'))
import { useSmoothScroll } from './hooks/useSmoothScroll'
import { scrollToTop } from './lib/scroller'

/** A new route should start at the top of itself, not wherever the last one ended. */
function ScrollToTopOnRouteChange() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) return
    scrollToTop({ immediate: true })
  }, [pathname, hash])
  return null
}

export default function App() {
  const reduced = useReducedMotion()
  const navigate = useNavigate()
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  /*
    Lenis drives the document's own scroll position, which is what the
    storefront needs — but the admin panel does not scroll the document. Its
    layout is a full-height frame (`overflow: hidden`) with the panel scrolling
    inside `.admin-main-content`, so Lenis was swallowing the wheel and nothing
    moved. The admin gets plain native scrolling instead.
  */
  useSmoothScroll(!reduced && !isAdminRoute)

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return
    if (shouldPlay(false) && location.pathname !== '/') {
      navigate('/', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      {!isAdminRoute && <Welcome once={false} />}
      {!isAdminRoute && <a className="skip-link" href="#main">Skip to content</a>}
      {!isAdminRoute && <FloatingNav reduced={reduced} />}
      {!isAdminRoute && <FloatingCart />}
      {!isAdminRoute && <CartDrawer />}
      <ScrollToTopOnRouteChange />
      <main id="main">
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/science" element={<Science />} />
            <Route path="/product" element={<Product />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/researches" element={<AllResearches />} />
            <Route path="/policies/:policyId" element={<Policy />} />
            <Route path="/account" element={<Account />} />
            <Route path="/admin/*" element={<Admin />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </main>
      {!isAdminRoute && <Footer />}
    </>
  )
}
