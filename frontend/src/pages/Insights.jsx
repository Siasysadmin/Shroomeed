import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Reveal } from '../components/common/Reveal'
import { Closing } from '../components/sections/Closing'
import { api, mediaUrl } from '../lib/api'
import styles from './Insights.module.css'

function readableDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function Insights() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Insights | ShrooMEED'
    window.scrollTo({ top: 0 })
  }, [])

  useEffect(() => {
    let alive = true
    api
      .get('/api/blogs')
      .then((rows) => {
        if (alive && Array.isArray(rows)) setPosts(rows)
      })
      // Backend down hone par page khaali rahega, toota hua nahi
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <>
      <main className={styles.page}>
        <Reveal delay={0.1}>
          <p className={styles.eyebrow}>Insights</p>
          <h1 className={styles.title}>What we're reading, testing and learning.</h1>
          <p className={styles.intro}>
            Notes on Cordyceps, endurance, and the research behind what goes into Daily Shield.
          </p>
        </Reveal>

        {loading && <p className={styles.note}>Loading…</p>}

        {!loading && posts.length === 0 && (
          <p className={styles.note}>No articles yet — check back soon.</p>
        )}

        {posts.length > 0 && (
          <div className={styles.grid}>
            {posts.map((post, index) => (
              <Reveal key={post.slug} delay={0.15 + index * 0.05}>
                <Link className={styles.card} to={`/insights/${post.slug}`}>
                  {post.coverImage && (
                    <div className={styles.cardMedia}>
                      <img
                        src={mediaUrl(post.coverImage)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  )}

                  <div className={styles.cardBody}>
                    <p className={styles.cardMeta}>
                      {[readableDate(post.publishedAt), `${post.readMinutes} min read`]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    <h2 className={styles.cardTitle}>{post.title}</h2>
                    {post.excerpt && <p className={styles.cardExcerpt}>{post.excerpt}</p>}
                    <span className={styles.cardLink}>
                      Read
                      <svg viewBox="0 0 22 10" fill="none" aria-hidden="true">
                        <path d="M0 5h20M16 1l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
                      </svg>
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </main>
      <Closing />
    </>
  )
}