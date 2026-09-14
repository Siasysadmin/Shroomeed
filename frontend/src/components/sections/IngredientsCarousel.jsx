import { formula } from '../../content/site'
import styles from './IngredientsCarousel.module.css'

export function IngredientsCarousel() {
  const { actives } = formula

  // We duplicate the items to create a seamless infinite marquee
  const items = [...actives, ...actives]

  return (
    <section className={styles.section} id="what-it-does">
      <div className={styles.header}>
        <h2 className={styles.title}>
          9 Ingredients, Fully Disclosed — No Filler, No Blends
        </h2>
      </div>

      <div className={styles.carouselWrap}>
        <div className={styles.track}>
          {items.map((item, index) => {
            // we map index to 0-8 for the image
            const imgIndex = index % 9
            return (
              <div className={styles.card} key={`${item.name}-${index}`}>
                <img 
                  src={`/media/ingredients/ing_${imgIndex}.jpg`} 
                  alt={item.name} 
                  className={styles.cardBg} 
                  loading="lazy" 
                />
                <div className={styles.cardContent}>
                  <div className={styles.cardBottom}>
                    <h3 className={styles.cardTitle}>{item.name}</h3>
                    <p className={styles.cardRole}>{item.role}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.footerRow}>
        <p className={styles.footerLeft}>
          <strong>ISO & GMP Certified</strong> — meeting globally recognized standards for quality, safety, and rigorous manufacturing practices.
        </p>
        <p className={styles.footerRight}>
          Third party tested for purity and potency.
        </p>
      </div>
    </section>
  )
}
