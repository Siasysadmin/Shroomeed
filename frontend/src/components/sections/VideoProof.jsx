import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Reveal } from '../common/Reveal'
import { AutoplayVideo } from '../common/AutoplayVideo'
import { proof } from '../../content/site'
import { useIsMobile } from '../../hooks/useMediaQuery'
import styles from './VideoProof.module.css'
import { useSiteSettings } from '../../hooks/useSiteSettings'

export function VideoProof() {
  const { showReviewsMain } = useSiteSettings()
  const [isMuted, setIsMuted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const videoPeople = proof.people.filter(p => p.type === 'video')

  /**
   * The deck fans to the right in fixed pixels. On a 375px frame those offsets
   * carried the hindmost card past the gutter, so the fan is scaled with the
   * viewport — same gesture, sized to the screen it is drawn on.
   */
  const isMobile = useIsMobile()
  const fan = isMobile ? 18 : 32

  const toggleMute = () => setIsMuted((value) => !value)
  const togglePlay = () => setIsPlaying((value) => !value)

  const handleVideoEnd = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % videoPeople.length)
  }

  const videoSrc = '/media/hero_video.mp4'

  return (
    <section className={styles.section} id="reviews" aria-labelledby="reviews-title">
      <div className={styles.inner}>
        <div className={styles.left}>
          <header className={styles.head}>
            <Reveal as="p" className={styles.eyebrow}>
              <span className={styles.mark} aria-hidden="true" />
              {proof.eyebrow}
            </Reveal>
            
            <Reveal as="h2" className={styles.title} id="reviews-title">
              High performers don't exaggerate.
            </Reveal>
            
            <Reveal as="p" className={styles.intro} delay={0.06}>
              Hear from real customers about how Daily Shield has become part of their daily performance and wellness routine.
            </Reveal>
          </header>
          
          {/* Only offer the wall when there is a wall to send people to. */}
          {showReviewsMain && (
            <Reveal delay={0.3} className={styles.seeAllWrap}>
              <Link to="/reviews" className={styles.seeAllLink}>
                See all reviews <span aria-hidden="true">→</span>
              </Link>
            </Reveal>
          )}
        </div>
        
        <div className={styles.right}>
          <Reveal delay={0.2} distance={20} className={styles.videoWrap}>
            <AnimatePresence initial={false}>
              {videoPeople.map((person, i) => {
                const relIndex = (i - currentIndex + videoPeople.length) % videoPeople.length
                
                const isExiting = relIndex === videoPeople.length - 1
                if (relIndex > 2 && !isExiting) return null

                const isActive = relIndex === 0

                let zIndex, scale, y, opacity, x;

                if (relIndex === 0) {
                  zIndex = 3; scale = 1; y = 0; x = 0; opacity = 1;
                } else if (relIndex === 1) {
                  zIndex = 2; scale = 0.95; y = 0; x = fan; opacity = 1;
                } else if (relIndex === 2) {
                  zIndex = 1; scale = 0.90; y = 0; x = fan * 2; opacity = 1;
                } else if (isExiting) {
                  zIndex = 4; scale = 1; y = 0; x = -100; opacity = 0;
                }

                return (
                  <motion.div
                    key={person.name}
                    className={styles.videoInner}
                    initial={false}
                    animate={{ zIndex, scale, y, x, opacity }}
                    transition={{ type: 'spring', stiffness: 260, damping: 25 }}
                  >
                    {isActive || isExiting ? (
                      <AutoplayVideo
                        className={styles.video}
                        src={videoSrc}
                        playing={isActive && isPlaying}
                        muted={isMuted}
                        onEnded={isActive ? handleVideoEnd : undefined}
                      />
                    ) : (
                      <img src={person.image} alt="" className={styles.video} />
                    )}

                    <div className={styles.videoName}>
                      {person.name} {person.role ? `— ${person.role}` : ''}
                    </div>

                    {isActive && (
                      <div className={styles.controls}>
                        <button type="button" className={styles.controlBtn} onClick={togglePlay} aria-label={isPlaying ? 'Pause video' : 'Play video'}>
                          {isPlaying ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                          )}
                        </button>
                        <button type="button" className={styles.controlBtn} onClick={toggleMute} aria-label={isMuted ? 'Unmute video' : 'Mute video'}>
                          {isMuted ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                          )}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
