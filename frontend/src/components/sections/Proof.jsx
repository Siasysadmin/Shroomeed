import { useEffect, useRef, useState } from 'react'
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

/**
 * Admin rows and seeded rows have different field names; the wall wants one.
 *
 * The kind is derived from what the row actually carries, never from the
 * stored label alone: a video card whose clip is missing renders as the photo
 * it still has rather than as a play button over nothing.
 */
function normalise(review) {
  const image = mediaUrl(review.image)
  const video = mediaUrl(review.video)
  const href = review.redirectUrl || review.href || ''

  let type = 'text'
  if (video) type = 'video'
  else if (image && (review.type === 'instagram' || isInstagram(href))) type = 'instagram'
  else if (image) type = 'image'

  return {
    id: review._id || `${review.name}-${review.quote || review.image || ''}`,
    name: review.name || '',
    role: review.role || '',
    quote: review.quote || '',
    image,
    video,
    caption: review.caption || '',
    href,
    type,
    // Admin rows carry `createdAt`; seeded rows carry `postedAt`. Either way
    // the wall only ever sorts on this one number.
    postedAt: new Date(review.createdAt || review.postedAt || 0).getTime(),
  }
}

const isInstagram = (url) => /instagram\.com/i.test(url || '')

export function Proof({ showSeeAll, limit, uniformCards, customTitle, customIntro }) {
  const { showReviewsMain } = useSiteSettings()
  const [published, setPublished] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let alive = true
    api
      .get('/api/reviews')
      .then((rows) => {
        if (alive && Array.isArray(rows)) setPublished(rows)
      })
      // A backend that is down costs the page its cards, never the section.
      .catch(() => {})
      .finally(() => {
        if (alive) setLoaded(true)
      })
    return () => {
      alive = false
    }
  }, [])

  /*
    One list, one rule: last posted, first shown. Everything here was published
    from the admin panel — there is no seeded wall to interleave with — so a
    review published a minute ago opens the wall.
  */
  let cards = published.map(normalise).sort((a, b) => b.postedAt - a.postedAt)
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

      {/* Until the first card is published the wall says so, rather than
          leaving the heading sitting over empty cream. Nothing is shown while
          the request is still out, so the note never flashes before the cards
          arrive. */}
      {loaded && cards.length === 0 && (
        <Reveal as="p" className={styles.emptyNote}>
          {proof.empty}
        </Reveal>
      )}

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

  // A clip plays in place, so its frame is a player rather than a link — the
  // link, if there is one, becomes a button in the corner instead.
  if (card.type === 'video') return <VideoCard card={card} />

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
    <Frame className={`${styles.card} ${styles.cardMedia}`} {...linkProps}>
      {card.caption && <div className={styles.mediaCaption}>{card.caption}</div>}
      <img src={card.image} alt="" className={styles.mediaBg} loading="lazy" />
      <div className={styles.mediaOverlay} />
      {card.type === 'instagram' && <InstagramBadge />}
      <span className={styles.mediaName}>{card.name}</span>
      {card.role && <span className={styles.mediaRole}>{card.role}</span>}
      {card.quote && <p className={styles.mediaQuote}>{card.quote}</p>}
    </Frame>
  )
}

/** Says where the card came from, and that it opens somewhere. */
function InstagramBadge() {
  return (
    <span className={styles.igBadge} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    </span>
  )
}

/**
 * A review that is a clip.
 *
 * It plays where it sits — tapping the frame starts it with sound, tapping
 * again pauses — because a wall of cards that each opened a new tab to play
 * would be a worse read than the feed it is imitating. Nothing preloads
 * beyond metadata, so twenty video cards cost twenty posters, not twenty
 * downloads, and a clip that scrolls off screen pauses itself.
 *
 * Browsers may still refuse a sound-on start; when they do the clip retries
 * muted rather than doing nothing, and the mute button says what happened.
 */
function VideoCard({ card }) {
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const node = videoRef.current
    if (!node) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && !node.paused) node.pause()
      },
      { threshold: 0.2 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const toggle = () => {
    const node = videoRef.current
    if (!node) return
    if (!node.paused) {
      node.pause()
      return
    }
    setStarted(true)
    node.play().catch(() => {
      // Sound-on autoplay refused: play it muted rather than not at all.
      node.muted = true
      setMuted(true)
      node.play().catch(() => setStarted(false))
    })
  }

  const toggleMute = (event) => {
    event.stopPropagation()
    const node = videoRef.current
    if (!node) return
    node.muted = !node.muted
    setMuted(node.muted)
  }

  return (
    <div className={`${styles.card} ${styles.cardMedia} ${styles.cardVideo}`}>
      {card.caption && !started && <div className={styles.mediaCaption}>{card.caption}</div>}

      <video
        ref={videoRef}
        className={styles.mediaBg}
        src={card.video}
        poster={card.image || undefined}
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          setStarted(false)
        }}
      />

      <button
        type="button"
        className={styles.videoHit}
        onClick={toggle}
        aria-label={playing ? `Pause ${card.name}’s review` : `Play ${card.name}’s review`}
      />

      <div className={styles.mediaOverlay} />

      {!playing && (
        <span className={styles.playBtn} aria-hidden="true">
          <svg viewBox="0 0 12 14" fill="currentColor">
            <path d="M0 0l12 7-12 7z" />
          </svg>
        </span>
      )}

      {started && (
        <button
          type="button"
          className={styles.muteBtn}
          onClick={toggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </button>
      )}

      <span className={styles.mediaName}>{card.name}</span>
      {card.role && <span className={styles.mediaRole}>{card.role}</span>}
      {card.quote && <p className={styles.mediaQuote}>{card.quote}</p>}

      {card.href && (
        <a
          className={styles.postLink}
          href={card.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => event.stopPropagation()}
        >
          View post ↗
        </a>
      )}
    </div>
  )
}
