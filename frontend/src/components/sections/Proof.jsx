import { useEffect, useState } from 'react'
import { SplitText } from '../common/SplitText'
import { Reveal } from '../common/Reveal'
import { proof } from '../../content/site'
import { api, mediaUrl } from '../../lib/api'
import { useSiteSettings } from '../../hooks/useSiteSettings'
import styles from './Proof.module.css'

/**
 * The wall.
 *
 * Every testimonial — filmed, photographed or written — is rendered as a card
 * of the same family, in one masonry column flow. Text used to be the odd one
 * out, sitting on the page with no edge of its own; it now carries the same
 * frame as the media cards, so a column reads as one wall rather than as
 * pictures interrupted by loose paragraphs.
 *
 * Order is strictly newest first. The set is whatever the admin has published,
 * followed by the seeded copy in `content/site`, so a fresh review always
 * lands at the top of the wall instead of being shuffled into the middle.
 */

/** Admin rows and seeded rows have different field names; the wall wants one. */
function normalise(review) {
  const image = mediaUrl(review.image)
  return {
    id: review._id || `${review.name}-${review.quote || review.image || ''}`,
    name: review.name || '',
    role: review.role || '',
    quote: review.quote || '',
    image,
    caption: review.caption || '',
    href: review.redirectUrl || '',
    // A card is only media if it actually has a cover to show.
    type: !image ? 'text' : review.type === 'video' ? 'video' : 'image',
    // Admin rows carry `createdAt`; seeded rows carry `postedAt`. Either way
    // the wall only ever sorts on this one number.
    postedAt: new Date(review.createdAt || review.postedAt || 0).getTime(),
  }
}

export function Proof({ showSeeAll, limit, uniformCards, customTitle, customIntro }) {
  const { showReviewsMain } = useSiteSettings()
  const [published, setPublished] = useState([])

  useEffect(() => {
    let alive = true
    api
      .get('/api/reviews')
      .then((rows) => {
        if (alive && Array.isArray(rows)) setPublished(rows)
      })
      // The seeded wall is the fallback: a backend that is down costs the page
      // its newest reviews, never the section itself.
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  /*
    One list, one rule: last posted, first shown. Admin reviews and seeded
    reviews go into the same pile and are sorted purely on their date, so a
    review published a minute ago opens the wall and nothing is interleaved to
    make a text/media pattern.
  */
  let cards = [...published.map(normalise), ...proof.people.map(normalise)].sort(
    (a, b) => b.postedAt - a.postedAt
  )
  if (uniformCards) cards = cards.filter((card) => card.type === 'text')
  if (limit) cards = cards.slice(0, limit)

  return (
    <section className={styles.section} id="reviews" aria-labelledby="reviews-title">
      <div className={styles.headerRow}>
        <header className={styles.head}>
          <Reveal as="p" className={styles.eyebrow}>
            <span className={styles.mark} aria-hidden="true" />
            {proof.eyebrow}
          </Reveal>
          {customTitle ? (
            <Reveal as="h2" className={styles.title} id="reviews-title">
              {customTitle}
            </Reveal>
          ) : (
            <SplitText lines={proof.headline} className={styles.title} id="reviews-title" />
          )}
          {customIntro ? (
            <Reveal as="p" className={styles.intro} delay={0.06}>
              {customIntro}
            </Reveal>
          ) : null}
        </header>

        {showSeeAll && showReviewsMain && (
          <Reveal delay={0.3} className={styles.seeAllWrap}>
            <a href="/reviews" className={styles.seeAllLink}>
              See all reviews <span aria-hidden="true">➔</span>
            </a>
          </Reveal>
        )}
      </div>

      <div className={uniformCards ? styles.uniformGrid : styles.masonry}>
        {cards.map((card, index) => (
          <Reveal
            as="div"
            key={card.id}
            delay={(index % 4) * 0.08}
            distance={22}
            className={uniformCards ? styles.uniformItem : styles.masonryItem}
          >
            <ProofCard card={card} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/** A card is a link only when the admin gave it somewhere to go. */
function ProofCard({ card }) {
  const Frame = card.href ? 'a' : 'div'
  const linkProps = card.href
    ? { href: card.href, target: '_blank', rel: 'noopener noreferrer' }
    : {}

  if (card.type === 'text') {
    return (
      <Frame className={`${styles.card} ${styles.cardText}`} {...linkProps}>
        <div className={styles.cardTop}>
          <span className={styles.monogram} aria-hidden="true">
            {card.name.charAt(0)}
          </span>
          <span className={styles.who}>
            <span className={styles.name}>{card.name}</span>
            {card.role && <span className={styles.role}>{card.role}</span>}
          </span>
        </div>
        <p className={styles.quote}>{card.quote}</p>
      </Frame>
    )
  }

  return (
    <Frame
      className={`${styles.card} ${styles.cardMedia} ${card.type === 'video' ? styles.cardVideo : ''}`}
      {...linkProps}
    >
      {card.caption && <div className={styles.mediaCaption}>{card.caption}</div>}
      <img src={card.image} alt="" className={styles.mediaBg} loading="lazy" />
      <div className={styles.mediaOverlay} />
      {card.type === 'video' && (
        <span className={styles.playBtn} aria-hidden="true">
          <svg viewBox="0 0 12 14" fill="currentColor">
            <path d="M0 0l12 7-12 7z" />
          </svg>
        </span>
      )}
      <span className={styles.mediaName}>{card.name}</span>
      {card.quote && <p className={styles.mediaQuote}>{card.quote}</p>}
    </Frame>
  )
}
