import { Hero } from '../components/hero/Hero'
import { Marquee } from '../components/sections/Marquee'
import { Benefits } from '../components/sections/Benefits'
import { ProductShowcase } from '../components/sections/ProductShowcase'
import { FeatureSplit } from '../components/sections/FeatureSplit'
import { VideoProof } from '../components/sections/VideoProof'
import { Faq } from '../components/sections/Faq'
import { Closing } from '../components/sections/Closing'
import { homeFaq } from '../content/site'
import { useSiteSettings } from '../hooks/useSiteSettings'

/**
 * The home page argues, in order:
 *
 *   hero          the product, floating, on cream
 *   marquee       a dark beat — the certifications
 *   what it does  the four mechanisms
 *   faq           the objections
 *   shop          the product returns, and the ask
 *
 * Reviews deliberately live on the product page, next to the buy button,
 * where they are actually doing work.
 */
export default function Home() {
  const { showReviewsHome } = useSiteSettings()

  return (
    <>
      <Hero />
      <Marquee />
      <Benefits />
      <ProductShowcase />
      <FeatureSplit />
      {showReviewsHome && <VideoProof />}
      <Faq data={homeFaq} />
      <Closing />
    </>
  )
}
