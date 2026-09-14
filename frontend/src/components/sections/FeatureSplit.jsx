import { motion } from 'framer-motion'
import { Reveal } from '../common/Reveal'
import { ArrowLink } from '../common/ArrowLink'
import styles from './FeatureSplit.module.css'

export function FeatureSplit() {
  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.content}>
          <Reveal delay={0.1}>
            <p className={styles.eyebrow}>Daily Shield</p>
          </Reveal>
          
          <Reveal delay={0.2}>
            <h2 className={styles.title}>
              When your body says stop, you don’t have to.
            </h2>
          </Reveal>
          
          <Reveal delay={0.3}>
            <p className={styles.description}>
              Some limits are physical. Others are simply where most people stop. Daily Shield is a daily performance ritual designed to support respiratory wellness, oxygen utilization and sustained energy—so you can keep pushing when it gets hard.
            </p>
          </Reveal>
          
          <Reveal delay={0.4}>
            <ArrowLink href="/product" tone="ink">
              Discover more
            </ArrowLink>
          </Reveal>
        </div>
        
        <Reveal className={styles.imageWrap} delay={0.2} distance={0}>
          <motion.img 
            className={styles.image}
            src="/media/home_img.png" 
            alt="Person showing sustained energy in nature"
            initial={{ scale: 1.05 }}
            whileInView={{ scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
          />
        </Reveal>
      </div>
    </section>
  )
}
