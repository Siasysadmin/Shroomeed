import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { SplitText } from '../common/SplitText'
import { Reveal } from '../common/Reveal'
import { EASE_OUT_EXPO } from '../../lib/motion'
import { api } from '../../lib/api'
import { isValidEmail, useUser } from '../../lib/user'
import styles from './Faq.module.css'

/**
 * A real disclosure widget: a button that owns `aria-expanded` and a region
 * labelled by it. The open panel animates its height, which is the one place
 * on the page a layout property is animated — a disclosure has no honest
 * transform-only equivalent, and only one panel is ever in flight.
 */
export function Faq({ data, isPage }) {
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(0)
  const uid = useId()

  return (
    <section className={`${styles.section} ${isPage ? styles.stacked : ''}`} id="faq" aria-labelledby="faq-title">
      <header className={styles.head}>
        <Reveal as="p" className={styles.eyebrow}>
          <span className={styles.mark} aria-hidden="true" />
          {data.eyebrow}
        </Reveal>
        <SplitText lines={data.headline} className={`${styles.title} ${!isPage ? styles.homeTitle : ''}`} id="faq-title" />
        <Reveal as="p" className={styles.intro} delay={0.1}>
          {data.intro}
        </Reveal>
      </header>

      <div className={styles.list}>
        {data.items.map((item, index) => {
          const isOpen = open === index
          const buttonId = `${uid}-q${index}`
          const panelId = `${uid}-a${index}`
          return (
            <Reveal className={styles.item} key={item.q} delay={index * 0.05} distance={18}>
              <h3 className={styles.questionHeading}>
                <button
                  className={styles.question}
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? -1 : index)}
                >
                  <span>{item.q}</span>
                  <span className={styles.sign} data-open={isOpen || undefined} aria-hidden="true">
                    <i />
                    <i />
                  </span>
                </button>
              </h3>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    className={styles.panel}
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{
                      duration: reduced ? 0.01 : 0.52,
                      ease: EASE_OUT_EXPO,
                      opacity: { duration: reduced ? 0.01 : 0.3 },
                    }}
                  >
                    <p className={styles.answer}>
                      {item.a}
                      {item.link && (
                        <>
                          {' '}
                          <a href={item.link.url} target="_blank" rel="noopener noreferrer" className={styles.outLink}>
                            {item.link.text} ↗
                          </a>
                        </>
                      )}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Reveal>
          )
        })}
      </div>

      {isPage && <StillCuriousSection />}
    </section>
  )
}

/**
 * The public ask box.
 *
 * A question is only worth collecting if it can be answered, so the form will
 * not send without an address to reply to: an unidentified visitor is asked to
 * sign in first, and the address they sign in with — not a field they can
 * retype per submission — is what reaches the admin queue alongside the
 * question.
 */
function StillCuriousSection() {
  const { user, isSignedIn, signIn, signOut } = useUser()
  const [question, setQuestion] = useState('')
  const [emailDraft, setEmailDraft] = useState('')
  const [nameDraft, setNameDraft] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | done
  const [error, setError] = useState('')

  const handleSignIn = (event) => {
    event.preventDefault()
    setError('')
    try {
      signIn(emailDraft, nameDraft)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!isSignedIn) {
      setError('Please sign in with your email first.')
      return
    }
    if (!question.trim()) {
      setError('Please type your question.')
      return
    }

    setStatus('sending')
    try {
      await api.json('/api/questions', 'POST', {
        question: question.trim(),
        email: user.email,
        name: user.name,
      })
      setStatus('done')
      setQuestion('')
    } catch (err) {
      setStatus('idle')
      setError(err.message || 'Could not send your question. Please try again.')
    }
  }

  if (status === 'done') {
    return (
      <Reveal className={styles.stillCurious} delay={0.2} distance={20}>
        <h3>Still curious?</h3>
        <div className={styles.askSuccess}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Thanks — we’ll reply to {user.email}
        </div>
        <button type="button" className={styles.askAnother} onClick={() => setStatus('idle')}>
          Ask another question
        </button>
      </Reveal>
    )
  }

  return (
    <Reveal className={styles.stillCurious} delay={0.2} distance={20}>
      <h3>Still curious?</h3>
      <p>Have a question we haven’t covered? We’d love to hear it.</p>

      {isSignedIn ? (
        <form className={styles.askForm} onSubmit={handleSubmit}>
          <div className={styles.askIdentity}>
            <span className={styles.askIdentityLabel}>Asking as</span>
            <span className={styles.askIdentityEmail}>{user.email}</span>
            <button type="button" className={styles.askSwitch} onClick={signOut}>
              Change
            </button>
          </div>

          <textarea
            className={styles.askInput}
            placeholder="Type your question here..."
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={2000}
            required
          />

          {error && <p className={styles.askError}>{error}</p>}

          <button type="submit" className={styles.askSubmit} disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Submit Question'}
          </button>
        </form>
      ) : (
        <form className={styles.askForm} onSubmit={handleSignIn}>
          <p className={styles.askGate}>
            Sign in with your email so we know where to send the answer.
          </p>

          <input
            className={styles.askField}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={emailDraft}
            onChange={(event) => setEmailDraft(event.target.value)}
            required
          />
          <input
            className={styles.askField}
            type="text"
            autoComplete="name"
            placeholder="Your name (optional)"
            value={nameDraft}
            onChange={(event) => setNameDraft(event.target.value)}
          />

          {error && <p className={styles.askError}>{error}</p>}

          <button type="submit" className={styles.askSubmit} disabled={!isValidEmail(emailDraft)}>
            Sign in to ask
          </button>
        </form>
      )}
    </Reveal>
  )
}

