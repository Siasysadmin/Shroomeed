import { mediaUrl } from '../../lib/api'
import styles from './Article.module.css'

/**
 * Admin saada text likhta hai; yahan wo page ban jaata hai.
 *
 * Ek poori markdown library iske liye bahut bhaari hoti — blog ko bas chaar
 * cheezein chahiye: heading, bullet, bold aur image. Utna hi padhte hain,
 * baaki sab jaisa likha hai waisa hi chhap jaata hai.
 */

/** **bold** aur [link](url) — ek line ke andar. */
function inline(text, keyBase) {
  const parts = []
  const pattern = /(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/g
  let last = 0
  let match

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))

    const token = match[0]
    if (token.startsWith('**')) {
      parts.push(<strong key={`${keyBase}-b-${match.index}`}>{token.slice(2, -2)}</strong>)
    } else {
      const label = token.slice(1, token.indexOf(']'))
      const href = token.slice(token.indexOf('(') + 1, -1)
      const external = /^https?:/i.test(href)
      parts.push(
        <a
          key={`${keyBase}-a-${match.index}`}
          href={href}
          {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
        >
          {label}
        </a>,
      )
    }
    last = pattern.lastIndex
  }

  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export function Article({ body }) {
  const lines = String(body || '').split('\n')
  const blocks = []
  let bullets = []
  let paragraph = []

  const flushBullets = () => {
    if (bullets.length === 0) return
    const items = bullets
    bullets = []
    blocks.push(
      <ul key={`ul-${blocks.length}`} className={styles.list}>
        {items.map((item, i) => (
          <li key={i}>{inline(item, `li-${blocks.length}-${i}`)}</li>
        ))}
      </ul>,
    )
  }

  const flushParagraph = () => {
    if (paragraph.length === 0) return
    const text = paragraph.join(' ')
    paragraph = []
    blocks.push(
      <p key={`p-${blocks.length}`} className={styles.paragraph}>
        {inline(text, `p-${blocks.length}`)}
      </p>,
    )
  }

  const flushAll = () => {
    flushBullets()
    flushParagraph()
  }

  lines.forEach((raw) => {
    const line = raw.trim()

    if (line === '') {
      flushAll()
      return
    }

    const image = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (image) {
      flushAll()
      blocks.push(
        <figure key={`fig-${blocks.length}`} className={styles.figure}>
          <img src={mediaUrl(image[2])} alt={image[1]} loading="lazy" decoding="async" />
          {image[1] && <figcaption>{image[1]}</figcaption>}
        </figure>,
      )
      return
    }

    if (line.startsWith('### ')) {
      flushAll()
      blocks.push(
        <h3 key={`h3-${blocks.length}`} className={styles.h3}>{line.slice(4)}</h3>,
      )
      return
    }

    if (line.startsWith('## ')) {
      flushAll()
      blocks.push(
        <h2 key={`h2-${blocks.length}`} className={styles.h2}>{line.slice(3)}</h2>,
      )
      return
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      flushParagraph()
      bullets.push(line.slice(2))
      return
    }

    flushBullets()
    paragraph.push(line)
  })

  flushAll()

  return <div className={styles.article}>{blocks}</div>
}