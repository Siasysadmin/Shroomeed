import { useEffect } from 'react'
import { ResearchSection } from '../components/sections/ResearchSection'
import { allResearchesData } from '../content/allResearches'
import styles from './AllResearches.module.css'

export default function AllResearches() {
  useEffect(() => {
    document.title = 'All Researches | ShrooMEED'
  }, [])

  return (
    <div className={styles.page}>
      <ResearchSection data={allResearchesData} theme="light" fastStagger={true} />
    </div>
  )
}
