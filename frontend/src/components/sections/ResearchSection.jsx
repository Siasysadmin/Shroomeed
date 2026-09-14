import { Reveal } from '../common/Reveal'
import { ArrowLink } from '../common/ArrowLink'
import styles from './ResearchSection.module.css'

export function ResearchSection({ data, id, theme = 'light', fastStagger = false }) {
  return (
    <section className={`${styles.section} ${styles[theme]}`} id={id}>
      <div className={styles.inner}>
        <Reveal as="h2" className={styles.title}>
          {data.title}
        </Reveal>
        
        <div className={styles.introGroup}>
          {data.intro.map((paragraph, index) => (
            <Reveal as="p" key={index} className={styles.introPara} delay={fastStagger ? index * 0.02 : index * 0.1}>
              {paragraph}
            </Reveal>
          ))}
        </div>

        <div className={styles.items}>
          {data.items.map((item, index) => (
            <Reveal key={index} className={styles.item} delay={fastStagger ? Math.min(0.1 + (index * 0.03), 0.5) : 0.2 + (index * 0.1)}>
              <div className={styles.itemText}>
                <p className={styles.itemEyebrow}>{item.journal}</p>
                <h3 className={styles.itemTitle}>
                  {item.title}
                  {item.body && (
                    <span className={theme === 'amber' ? styles.inlineBody : styles.blockBody}>
                      {item.body}
                    </span>
                  )}
                </h3>
              </div>
              <a href={item.linkUrl} className={styles.itemLink} target="_blank" rel="noopener noreferrer">
                {item.linkText}
              </a>
            </Reveal>
          ))}
        </div>

        {data.viewAll && (
          <Reveal className={styles.viewAllWrapper} delay={0.4}>
            <ArrowLink href={data.viewAll.url} tone={theme === 'amber' ? 'paper' : 'ink'}>
              {data.viewAll.text}
            </ArrowLink>
          </Reveal>
        )}
      </div>
    </section>
  )
}
