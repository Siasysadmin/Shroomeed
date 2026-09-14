import { Ingredients } from '../components/sections/Ingredients'
import { Closing } from '../components/sections/Closing'
import { Reveal } from '../components/common/Reveal'
import { SplitText } from '../components/common/SplitText'
import { formula, researchData, labReportsData } from '../content/site'
import { ResearchSection } from '../components/sections/ResearchSection'
import styles from './Science.module.css'

export default function Science() {
  return (
    <div className={styles.page}>
      {/* 1. Research Section (New First Section) */}
      <ResearchSection data={researchData} id="research" theme="light" />

      {/* 2. Old First Two Sections (Shifted down) */}
      <section className={styles.scienceHero}>
        <div className={styles.heroInner}>
          <Reveal as="p" className={styles.eyebrow}>
            <span className={styles.mark} aria-hidden="true" />
            {formula.eyebrow}
          </Reveal>
          <SplitText lines={formula.headline} className={styles.title} />
          <Reveal as="p" className={styles.intro} delay={0.1}>
            {formula.intro}
          </Reveal>
        </div>
      </section>

      <Ingredients />
      
      {/* 3. Lab Reports Section (New Third Section) */}
      <ResearchSection data={labReportsData} id="lab-reports" />
      

      <Closing />
    </div>
  )
}
