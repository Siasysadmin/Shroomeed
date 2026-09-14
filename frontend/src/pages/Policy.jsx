import { useParams } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { policies } from '../content/policies'
import { Reveal } from '../components/common/Reveal'
import { EASE_OUT_EXPO } from '../lib/motion'
import { Closing } from '../components/sections/Closing'
import styles from './Policy.module.css'

export default function Policy() {
  const { policyId } = useParams()
  const reduced = useReducedMotion()
  
  const policy = policies[policyId]

  if (!policy) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>Policy not found</h1>
      </div>
    )
  }

  return (
    <>
      <main className={styles.page}>
        <Reveal delay={0.1}>
          <p className={styles.eyebrow}>Last Updated: {policy.updated}</p>
          <h1 className={styles.title}>{policy.title}</h1>
        </Reveal>

        <div className={styles.content}>
          {policy.sections.map((section, index) => (
            <Reveal key={index} className={styles.section} delay={0.2 + (index * 0.05)}>
              <h2 className={styles.heading}>{section.heading}</h2>
              <p className={styles.body}>{section.body}</p>
            </Reveal>
          ))}
        </div>
      </main>
      <Closing />
    </>
  )
}
