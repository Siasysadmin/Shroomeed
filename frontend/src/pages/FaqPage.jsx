import { faq } from '../content/site'
import { Faq } from '../components/sections/Faq'
import { Closing } from '../components/sections/Closing'

export default function FaqPage() {
  return (
    <>
      <Faq data={faq} isPage={true} />
      <Closing />
    </>
  )
}
