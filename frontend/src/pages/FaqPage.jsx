import { faq } from '../content/site'
import { Faq } from '../components/sections/Faq'
import { Closing } from '../components/sections/Closing'
import { JsonLd } from '../components/common/JsonLd'


export default function FaqPage() {

    const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  return (
    <>
          <JsonLd data={faqSchema} />
      <Faq data={faq} isPage={true} />
      <Closing />
    </>
  )
}
