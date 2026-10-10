import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Reveal } from '../components/common/Reveal'
import { Article } from '../components/common/Article'
import { JsonLd } from '../components/common/JsonLd'
import { Closing } from '../components/sections/Closing'
import { api, mediaUrl } from '../lib/api'
import styles from './Insight.module.css'

function readableDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function Insight() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0 })
    setLoading(true)
    setMissing(false)

    let alive = true
    api
      .get(`/api/blogs/${slug}`)
      .then((data) => {
        if (!alive) return
        setPost(data)
        document.title = `${data.title} | ShrooMEED`
      })
      .catch(() => {
        if (alive) setMissing(true)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [slug])

  if (loading) {
    return <main className={styles.page}><p className={styles.note}>Loading…</p></main>
  }

  if (missing || !post) {
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Article not found</h1>
        <Link className={styles.back} to="/insights">← All insights</Link>
      </main>
    )
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    author: { '@type': 'Organization', name: post.author },
    publisher: { '@id': 'https://shroomeed.com/#organization' },
    mainEntityOfPage: `https://shroomeed.com/insights/${post.slug}`,
    ...(post.coverImage ? { image: `https://shroomeed.com${post.coverImage}` } : {}),
  }

  return (
    <>
      <JsonLd data={schema} />

      <main className={styles.page}>
        <Reveal delay={0.1}>
          <Link className={styles.back} to="/insights">← All insights</Link>

          <p className={styles.meta}>
            {[readableDate(post.publishedAt), `${post.readMinutes} min read`]
              .filter(Boolean)
              .join(' · ')}
          </p>

          <h1 className={styles.title}>{post.title}</h1>
          {post.excerpt && <p className={styles.lead}>{post.excerpt}</p>}
        </Reveal>

        {post.coverImage && (
          <Reveal delay={0.15}>
            <div className={styles.cover}>
              <img src={mediaUrl(post.coverImage)} alt="" decoding="async" />
            </div>
          </Reveal>
        )}

        <Reveal delay={0.2}>
          <Article body={post.body} />
        </Reveal>

        <div className={styles.footer}>
          <Link className={styles.back} to="/insights">← All insights</Link>
        </div>
      </main>

      <Closing />
    </>
  )
}