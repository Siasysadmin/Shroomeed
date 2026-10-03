import { useEffect } from 'react'

/**
 * Schema markup page ke andar <script> ban kar lagta hai, aur page chhodte hi
 * hat jaata hai — warna product ka data privacy page par bhi padha rehta.
 */
export function JsonLd({ data }) {
  useEffect(() => {
    const tag = document.createElement('script')
    tag.type = 'application/ld+json'
    tag.textContent = JSON.stringify(data)
    document.head.appendChild(tag)
    return () => tag.remove()
  }, [data])

  return null
}