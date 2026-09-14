import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import styles from './HeroVideo.module.css'

import { shouldPlay, isWelcomeDone } from '../welcome/Welcome'

export function HeroVideo({ reduced }) {
  const videoRef = useRef(null)
  const welcomeFinished = useRef(isWelcomeDone)

  useEffect(() => {
    if (reduced) return
    const video = videoRef.current
    if (!video) return
    
    let isIntersecting = false

    const tryPlay = () => {
      if (isIntersecting && welcomeFinished.current) {
        video.currentTime = 0
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    }

    const onWelcomeDone = () => {
      welcomeFinished.current = true
      tryPlay()
    }
    window.addEventListener('shroomeed:welcome-done', onWelcomeDone)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isIntersecting = entry.isIntersecting
          tryPlay()
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(video)
    return () => {
      observer.disconnect()
      window.removeEventListener('shroomeed:welcome-done', onWelcomeDone)
    }
  }, [reduced])

  return (
    <div className={styles.container}>
      {/*
        The breakpoint here must be the same 860px the stylesheet pivots on —
        with the two out of step there was a band of widths running the mobile
        plate under the desktop layout. Both files are preloaded in index.html
        behind these exact queries, so the swap is a cache hit, not a fetch.
      */}
      <picture className={styles.picture}>
        <source media="(max-width: 860px)" srcSet="/media/mobile-hero.png" />
        <img
          className={styles.video} /* Re-using .video class for styling, but it's an image now */
          src="/media/hero_bg.png"
          alt="ShrooMEED Daily Shield"
          fetchPriority="high"
          decoding="async"
        />
      </picture>
    </div>
  )
}
