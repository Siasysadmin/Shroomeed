import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { SplitText } from '../components/common/SplitText'
import { Reveal } from '../components/common/Reveal'
import { VideoProof } from '../components/sections/VideoProof'
import { Faq } from '../components/sections/Faq'
import { ProductAccordion } from '../components/sections/ProductAccordion'
import { IngredientsCarousel } from '../components/sections/IngredientsCarousel'
import { EASE_OUT_EXPO } from '../lib/motion'
import { commerce, product, formula, benefits, homeFaq } from '../content/site'
import { useSiteSettings } from '../hooks/useSiteSettings'
import { formatPrice, useCart } from '../lib/cart'
import styles from './Product.module.css'


export default function Product() {
  const reduced = useReducedMotion()
  const [shot, setShot] = useState(0)
  const [hoveredShot, setHoveredShot] = useState(null)
  const [plan, setPlan] = useState('quarterly')
  const { add, qty } = useCart()
  const { showReviewsShop } = useSiteSettings()

  const currentPrice = plan === 'monthly' ? 3000 : 7650
  const displayShot = hoveredShot !== null ? hoveredShot : shot

  const onAdd = () => {
    add(plan === 'quarterly' ? 3 : 1)
  }

  return (
    <>
      <section className={styles.buy} aria-labelledby="product-title">
        <div className={styles.gallery}>
          <Reveal as="ul" className={styles.thumbs} delay={0.08}>
            {product.gallery.map((image, index) => (
              <li key={image.src}>
                <button
                  className={styles.thumb}
                  type="button"
                  data-on={index === shot || undefined}
                  aria-label={`View image ${index + 1} of ${product.gallery.length}`}
                  aria-current={index === shot ? 'true' : undefined}
                  onClick={() => setShot(index)}
                  onMouseEnter={() => setHoveredShot(index)}
                  onMouseLeave={() => setHoveredShot(null)}
                >
                  <img src={image.src} alt={image.alt} width="160" height="90" loading="lazy" decoding="async" />
                </button>
              </li>
            ))}
          </Reveal>

          <Reveal className={styles.frame} distance={26}>
            <motion.img
              key={product.gallery[displayShot].src}
              className={styles.shot}
              src={product.gallery[displayShot].src}
              alt={product.gallery[displayShot].alt}
              width="1800"
              height="1013"
              decoding="async"
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 1.03 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              transition={{ duration: reduced ? 0.01 : 0.7, ease: EASE_OUT_EXPO }}
            />
          </Reveal>
        </div>

        <div className={styles.panel}>
          <Reveal delay={0.1}>
            <p className={styles.eyebrow}>{product.eyebrow}</p>
          </Reveal>
          
          <Reveal delay={0.15}>
            <h1 className={styles.title} id="product-title">{product.title}</h1>
          </Reveal>
          
          <Reveal delay={0.2}>
            <p className={styles.subtitle}>{product.subtitle}</p>
          </Reveal>

          <Reveal delay={0.25} distance={10}>
            <ul className={styles.metaList}>
              <li>Clinically studied</li>
              <li>No fillers</li>
            </ul>
          </Reveal>

          <Reveal className={styles.options} delay={0.14}>
            <div 
              className={styles.option} 
              data-active={plan === 'monthly' || undefined} 
              onClick={() => setPlan('monthly')}
            >
              <span className={styles.optionTitle}>1 month delivery</span>
              <span className={styles.optionPrice}>{formatPrice(3000)}</span>
            </div>
            <div 
              className={`${styles.option} ${styles.optionQuarterly}`} 
              data-active={plan === 'quarterly' || undefined} 
              onClick={() => setPlan('quarterly')}
            >
              <span className={styles.optionTitle}>
                3 month delivery 
                <span style={{color: 'var(--amber)', fontSize: '0.75em', marginLeft: '6px', fontWeight: 'bold'}}>(15% OFF)</span>
              </span>
              <span className={styles.optionPrice}>
                <span className={styles.cutPrice}>{formatPrice(9000)}</span>
                {formatPrice(7650)}
              </span>
            </div>
          </Reveal>

          <Reveal className={styles.actions} delay={0.24} viewport={{ once: true, margin: '0px' }}>
            <button className={styles.add} type="button" onClick={onAdd}>
              <span className={styles.addLabel}>
                {product.addToCart}
              </span>
              <span className={styles.addPrice} aria-hidden="true">
                {formatPrice(currentPrice)}
              </span>
            </button>

            <p className={styles.shipping}>{product.shipping}</p>
          </Reveal>

          <Reveal as="dl" className={styles.facts} delay={0.3}>
            {product.facts.map(({ term, detail }) => (
              <div className={styles.fact} key={term}>
                <dt>{term}</dt>
                <dd>{detail}</dd>
              </div>
            ))}
          </Reveal>

          <ProductAccordion items={[
            {
              title: 'What is Daily Shield?',
              content: (
                <p className={styles.panelParagraph}>
                  Daily Shield is ShrooMEED’s daily respiratory and performance formula, powered by Cordyceps militaris and a blend of functional botanicals and essential nutrients. It is designed to support unrestricted breathing, oxygen utilization, VO₂ max, and sustained energy—helping you make the most of your everyday performance.
                </p>
              )
            },
            {
              title: 'Who is Daily Shield for?',
              content: (
                <>
                  <p className={styles.panelParagraph}>
                    Men, women, and people over 18-years-old who are not currently pregnant or breastfeeding. Daily Shield is designed for adults who want to support their breathing, stamina, and everyday physical performance. It can be especially useful for:
                  </p>
                  <ul className={styles.panelList}>
                    <li><strong>The Performance Driven:</strong> People who train regularly and want to support oxygen utilization, VO₂ max, endurance, and sustained energy.</li>
                    <li><strong>The Everyday Performer:</strong> Those who feel breathless during everyday activities or want to move, train, and perform with greater ease.</li>
                    <li><strong>The Active Lifestyle:</strong> Runners, gym-goers, athletes, and anyone who wants daily support for staying active and performing at their best.</li>
                  </ul>
                </>
              )
            },
            {
              title: 'Benefits',
              content: (
                <>
                  <p className={styles.panelParagraph}>
                    Daily Shield is designed to support:
                  </p>
                  <ul className={styles.panelList}>
                    <li><strong>Unrestricted Breathing</strong> — supports respiratory wellness and comfortable breathing.</li>
                    <li><strong>VO₂ Max</strong> — supports aerobic capacity and endurance.</li>
                    <li><strong>Sustained Energy</strong> — helps support energy production and physical performance throughout the day.</li>
                    <li><strong>Endurance & Stamina</strong> — supports sustained performance during workouts and everyday activity.</li>
                    <li><strong>Recovery & Performance</strong> — supports your body as you train, recover, and stay active.</li>
                  </ul>
                </>
              )
            },
            {
              title: 'How to Use Daily Shield?',
              content: (
                <p className={styles.panelParagraph}>
                  Take <strong>2 capsules daily</strong>, preferably with a meal and a glass of water.
                </p>
              )
            }
          ]} />

          <Reveal className={styles.trustBlocks} delay={0.47}>
            <a href="/media/sff-130826014.pdf" className={styles.trustBoxLight} target="_blank" rel="noreferrer">
              <div className={styles.trustIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div className={styles.trustDivider} />
              <div className={styles.trustContent}>
                <div className={styles.trustTop}>
                  Tested by SKAS Labs <span className={styles.trustTag}>AUGUST 2026</span>
                </div>
              </div>
            </a>
            
            <div className={styles.trustBoxGray}>
              <img src="/media/iso.svg" alt="ISO Certified" className={styles.trustLogo} />
              ISO and GMP certified 
              <img src="/media/gmp.svg" alt="GMP Certified" className={styles.trustLogo} />
            </div>
          </Reveal>

        </div>
      </section>

      <IngredientsCarousel />

      {showReviewsShop && <VideoProof />}
      <Faq data={homeFaq} />
    </>
  )
}
