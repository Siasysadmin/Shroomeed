import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

/**
 * A <video> that actually autoplays on phones.
 *
 * `autoPlay muted playsInline` in JSX is not enough on mobile. React sets
 * `muted` as a DOM property but never writes the `muted` attribute, and iOS
 * checks the attribute when deciding whether a video may start on its own —
 * so the same markup that autoplays on a desktop sits frozen on an iPhone.
 *
 * This component writes the attributes itself, plays the video while it is
 * on screen and pauses it when it scrolls away (saving battery and data).
 * When the browser refuses anyway — iOS Low Power Mode blocks every autoplay
 * — it starts on the visitor's first tap instead of never.
 */
const GESTURES = ['pointerup', 'touchend', 'click', 'keydown']

export function AutoplayVideo({ ref, muted = true, playing = true, ...props }) {
  const node = useRef(null)
  const state = useRef({ onScreen: false, waiting: false, playing })
  state.current.playing = playing

  // Created once, so the same function is always the one added and removed.
  const handlers = useRef(null)
  if (!handlers.current) {
    const release = () => {
      if (!state.current.waiting) return
      state.current.waiting = false
      GESTURES.forEach((type) => window.removeEventListener(type, attempt))
    }
    const attempt = () => {
      const video = node.current
      const s = state.current
      if (!video || !s.playing || !s.onScreen) return
      const started = video.play()
      started?.then(release).catch(() => {
        // Blocked. A tap grants permission to play, so retry on the first one.
        if (s.waiting) return
        s.waiting = true
        GESTURES.forEach((type) => window.addEventListener(type, attempt, { passive: true }))
      })
    }
    handlers.current = { attempt, release }
  }
  const { attempt, release } = handlers.current

  const setRef = useCallback(
    (element) => {
      node.current = element
      if (typeof ref === 'function') ref(element)
      else if (ref) ref.current = element
      if (!element) return
      element.setAttribute('playsinline', '')
      element.setAttribute('webkit-playsinline', '')
    },
    [ref]
  )

  // Property and attribute kept in step. A layout effect, so unmuting from a
  // tap still lands inside that tap's permission to play sound.
  useLayoutEffect(() => {
    const video = node.current
    if (!video) return
    video.muted = muted
    video.defaultMuted = muted
    if (muted) video.setAttribute('muted', '')
    else video.removeAttribute('muted')
  }, [muted])

  useEffect(() => {
    const video = node.current
    if (!video) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        state.current.onScreen = entry.isIntersecting
        if (entry.isIntersecting) attempt()
        else video.pause()
      },
      { threshold: 0.25 }
    )
    observer.observe(video)
    video.addEventListener('loadeddata', attempt)
    return () => {
      observer.disconnect()
      video.removeEventListener('loadeddata', attempt)
      release()
    }
  }, [attempt, release])

  useEffect(() => {
    if (playing) attempt()
    else node.current?.pause()
  }, [playing, attempt])

  return <video ref={setRef} muted={muted} autoPlay={playing} playsInline {...props} />
}
