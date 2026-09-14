# ShrooMEED — welcome animation

A self-contained intro sequence. Copy this whole folder anywhere; nothing in it
reaches outside itself.

## Requires

`react` (18+, for `useId`) and `framer-motion` (11+, or `motion`). Your bundler
needs CSS Modules — Vite, Next.js, CRA and Parcel all have it on by default.

The wordmark is set in **Cabinet Grotesk 800**, with a system fallback stack if
it is not loaded. To match the brand exactly, add this to your `<head>`:

```html
<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f%5B%5D=cabinet-grotesk@800&display=swap" />
```

## Use it

```jsx
import { useState } from 'react'
import { Welcome } from './welcome-animation'

export default function App() {
  const [entered, setEntered] = useState(false)

  return (
    <>
      <Welcome onReveal={() => setEntered(true)} />
      {entered && <YourSite />}
    </>
  )
}
```

`onReveal` fires the moment the curtain *starts* lifting, not when it has gone.
Gating your page on it that way means your own on-load animations play through
the reveal instead of finishing behind an opaque panel. If your page has no
entrance to protect, render it normally and ignore `onReveal` — the curtain sits
on top and lifts off it either way.

### `<Welcome>` props

| prop | default | |
|---|---|---|
| `onReveal` | — | called as the curtain starts lifting |
| `once` | `true` | once per browser session. `false` replays on every load — use it while tuning |
| `hold` | `2000` | ms the finished mark holds before lifting |

With `once`, `#welcome` in the URL forces a replay on a built site.

### `<Logo>` — the two variations

```jsx
import { Logo } from './welcome-animation'

<Logo variant="lockup" />                  // mark + wordmark, static
<Logo variant="mark" />                    // mark alone, static
<Logo variant="lockup" animated />         // plays the build sequence
```

Both come off one source, so the welcome opens on the mark and resolves into the
lockup without a second copy of the artwork. The mark's negative space is real
space — separate shapes with gaps between them — so it drops onto a dark surface
untouched.

## The sequence

| | |
|---|---|
| 0.00s | a spore lands at the base and pulses out |
| 0.14s | the stem's centre segment pushes up out of it |
| 0.32s | the two outer segments swing out from the base behind it |
| 0.48s | the cap's underside opens off the stem top |
| 0.76s | the light sweep wipes in left to right — the swirl drawn in one stroke |
| 0.84s | `ShrooMEED` sets letter by letter, each rising out of its own baseline |
| 1.06s | the eye curl pops in |
| 1.46s | it blinks |
| 2.00s | the mark lifts, blurs and dissolves; the page is revealed |

Click, scroll or any key skips it. `prefers-reduced-motion` gets a plain 0.85s
fade with no drift, no halo and no ring.

## Retint it

Every tunable is a CSS custom property read with a fallback. Set any of them on
`:root`, a wrapper, or an inline `style` — nothing needs editing in this folder.

| property | default | |
|---|---|---|
| `--wa-gold` | `#E0B34A` | the mark's main gold; also the spores |
| `--wa-gold-light` | `#E9BE55` | the cap's upper sweep |
| `--wa-bg` | `#F4EFE4` | the curtain. **Set this to your page's own colour** |
| `--wa-mark-size` | `clamp(104px, 13vw, 168px)` | rendered width of the glyph; the wordmark scales with it |
| `--wa-logo-gap` | `clamp(15px, 1.7vw, 25px)` | space between glyph and wordmark |
| `--wa-font` | Cabinet Grotesk → system | wordmark typeface |
| `--wa-z` | `400` | curtain z-index |
| `--wa-halo-inner` / `--wa-halo-outer` | warm ambers | the ambient glow |
| `--wa-ripple` | `rgba(224,179,74,.55)` | the single ring |

```css
:root {
  --wa-bg: #0e0d0c;
  --wa-mark-size: 200px;
}
```

## Files

| | |
|---|---|
| `Welcome.jsx` | the curtain: timing, skip handling, scroll lock, handoff |
| `Welcome.module.css` | curtain, halo, ripple, spores |
| `Logo.jsx` | the artwork's five paths, plus which one moves when |
| `Logo.module.css` | colour, sizing, and each part's transform origin |
| `motion.js` | the three easing curves |
| `logo.svg` | the original artwork, unmodified, for reference |
| `index.js` | re-exports `Welcome`, `Logo`, `LOGO_BUILD_MS` |

`Logo.jsx` holds the paths inline rather than importing `logo.svg`, so the
component works in any bundler with no SVG loader configured. `logo.svg` is kept
beside it as the source of truth — if the artwork changes, the six path
constants at the top of `Logo.jsx` are what to replace.
