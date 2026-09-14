import { Navigate } from 'react-router-dom'
import { Proof } from '../components/sections/Proof'
import { useSiteSettings } from '../hooks/useSiteSettings'

/**
 * Hidden means hidden.
 *
 * When the admin switches the wall off there is no placeholder, no "back
 * soon" notice and no route to land on — every link into this page is
 * removed at the same time, and anyone arriving on a bookmark is sent to the
 * home page. A visitor should not be able to tell the section exists.
 *
 * `settled` matters: the switches arrive over the network, so for the first
 * moment of the page we do not yet know the answer. Rendering nothing until
 * then avoids both failure modes — flashing the wall before hiding it, and
 * bouncing someone off a page they were allowed to see.
 */
export default function Reviews() {
  const { showReviewsMain, settled } = useSiteSettings()

  if (!settled) return null
  if (!showReviewsMain) return <Navigate to="/" replace />

  return (
    <div style={{ paddingTop: '100px', minHeight: '80vh' }}>
      <Proof
        customTitle="Hear It From Those Who Use It"
        customIntro="Hear from real customers about how Daily Shield has become part of their daily performance and wellness routine."
      />
    </div>
  )
}
