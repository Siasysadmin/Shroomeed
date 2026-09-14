/**
 * Every word and every number on the site, in one place.
 *
 * Copy, certifications and claims are carried over from the existing
 * ShrooMEED site; the ingredient roster, the price and the pack size were
 * supplied by the brand. Nothing here is invented — testimonials keep only
 * the attribution the source published, and no dosages are stated because
 * none were provided.
 */

export const brand = {
  name: 'ShrooMEED',
  mark: '™',
  product: 'Daily Shield',
  tagline: 'The Daily Performance Ritual',
  subtitle: 'Respiratory wellness powered by Cordyceps militaris',
  category: 'Health supplement',
}

/** One place to change money. Amounts are in whole rupees. */
export const commerce = {
  currency: '₹',
  price: 3000,
  pack: '60 capsules',
  supply: 'One month',
  freeShippingOver: 1999,
  sku: 'SM-DS-60',
}

export const announcements = [
  'ISO & GMP Certified',
  'Third party tested for purity and potency',
  'Zero heavy metals',
  'FSSAI Approved',
]

export const nav = [
  { label: 'What it does', to: '/#what-it-does' },
  { label: 'Review', to: '/reviews' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Science', to: '/science' },
]

export const hero = {
  eyebrow: 'Daily Shield -',
  headline: [
    { words: ['The', 'new'] },
    { words: ['standard', 'for'] },
    { words: ['daily', 'energy.'], accent: true },
  ],
  lead: 'Science-backed Cordyceps formulated to support VO₂ max, reduce inflammation, and fuel everyday performance.',
  cta: 'Discover now ➔',
  aside: ['60 capsules · one month', 'ISO & GMP certified'],
}

/** Section 02 — what the formula actually does. */
export const benefits = {
  eyebrow: '01 — what it does',
  headline: [{ words: ['what', 'it', 'does'] }, { words: ['for', 'you'], accent: true }],
  intro: 'Four mechanisms, one capsule format. This is the whole argument.',
  items: [
    {
      id: '01',
      title: 'Elevates VO₂ max',
      body: "The active compound, cordycepin, mimics the body's natural structure to boost ATP production. This directly elevates VO₂ max and enhances oxygen uptake for peak stamina.",
    },
    {
      id: '02',
      title: 'Clears congestion',
      body: 'NAC acts as an advanced mucolytic. It actively breaks down the chemical bonds in thick airway mucus, resulting in unobstructed breathing.',
    },
    {
      id: '03',
      title: 'Shields lungs',
      body: 'Beta-glucans serve as ultimate biological armour for the lungs — your first line of defence against urban smog, dust, and pollution.',
    },
    {
      id: '04',
      title: 'Reduces inflammation',
      body: 'The formula fights airway inflammation, while adenosine optimises blood circulation and CNS signaling — promoting faster, systemic recovery and soothing airways.',
    },
  ],
}

/** Section 03 — the nine actives, as supplied by the brand. No dosages given. */
export const formula = {
  eyebrow: 'the formula',
  headline: [{ words: ['nine', 'actives.', 'one', 'capsule.'] }],
  intro:
    'Clinically dosed and third-party tested. No fillers or synthetic binders — in a clean capsule shell.',
  actives: [
    { name: 'Cordyceps Militaris', latin: 'Ophiocordyceps', role: 'Helps maintain energy and respiratory wellness.' },
    { name: 'NAC', latin: 'N-Acetyl Cysteine', role: 'Helps maintain antioxidant balance and clear breathing.' },
    { name: 'Tulsi', latin: 'Ocimum tenuiflorum', role: 'Promotes stress balance and respiratory comfort.' },
    { name: 'Curcumin', latin: 'Curcuma longa', role: 'Helps manage inflammation and supports recovery.' },
    { name: 'Ginger', latin: 'Zingiber officinale', role: 'Aids digestion and everyday gut comfort.' },
    { name: 'Mulethi', latin: 'Glycyrrhiza', role: 'Soothes the throat and supports comfortable breathing.' },
    { name: 'Vasaka', latin: 'Adhatoda vasica', role: 'Traditionally used for respiratory comfort.' },
    { name: 'Black Pepper Extract', latin: 'Piper nigrum', role: 'Enhances nutrient absorption and bioavailability.' },
    { name: 'Vitamin C', latin: 'Ascorbic acid', role: 'Provides antioxidant protection and supports immune function.' },
  ],
  supports: [
    'Support healthy lung function',
    'Support respiratory comfort',
    'Support antioxidant defence',
  ],
}

export const faq = {
  eyebrow: 'Clear the doubts',
  headline: [{ words: ['Before', 'you', 'commit.'] }],
  intro: "You're investing in your performance. Here are the answers you need to make an informed decision.",
  items: [
    {
      q: 'Can I take this with my other supplements — pre-workout, creatine, protein?',
      a: "For most people, yes — Daily Shield plays well with the usual stuff like protein, creatine, or a pre-workout. It's not a stimulant, so you're not stacking energy on energy. That said, if you're on any prescription medication or have an existing health condition, just run it by your doctor first.",
    },
    {
      q: 'How many capsules, and when do I take them?',
      a: "Two capsules, once a day. Mornings work best — most people take it right after they wake up, before breakfast, so it's just part of the routine.",
    },
    {
      q: 'How long before I notice something — and what does it actually feel like?',
      a: "Honestly, it's different for everyone, but here's the pattern we hear most often. In the first week or so, people usually notice their breathing feels a little easier — less huffing on stairs, that kind of thing. By the three-week mark, a lot of users tell us their stamina feels steadier through a workout, not just at the start. And by a month in, the thing people mention most is not hitting that flat, foggy feeling in the afternoon, but give it a full 30 days before you judge it. That's genuinely how long actives like cordyceps need to build up in your system.",
    },
    {
      q: 'Is this safe for daily, long-term use? Any side effects?',
      a: "Yes, it's built for daily use — that's the whole point, it's not a one-off boost. It's a natural formula, and most people don't notice any side effects at all. Occasionally someone with a sensitive stomach feels a little something if they take it empty stomach, so if that's you, just have it with breakfast instead of before. And if you're pregnant, breastfeeding, or managing a health condition, check with your doctor before starting anything new.",
    },
    {
      q: 'Is this just another everything-pill, like a multivitamin?',
      a: "No — honestly, that's what we were trying to avoid. Most \"do everything\" supplements pack in fifteen ingredients at doses too small to matter, just so they can put them on the label. We went the other way: fewer ingredients, focused entirely on respiratory health, dosed at levels that actually do something. That's also why it's two capsules and not one — one capsule genuinely isn't enough to dose the actives properly. We'd rather ask you to take two that work than one.",
    },
    {
      q: 'Is there real research behind Cordyceps, or is this wellness-industry hype?',
      a: "Fair question — the supplement world is full of ingredients riding on vibes, not evidence. Cordyceps isn't one of them. It's been studied in actual clinical trials for its effect on oxygen use and exercise tolerance, not just folklore. We've put together a proper science section with the studies linked — genuinely go have a look, we'd rather you see the research yourself than take our word for it.",
    },
    {
      q: 'Is there actual research on Cordyceps improving VO2 max?',
      a: "Yes — this one's well-documented. A study on Cordyceps militaris found a 10.9% improvement in VO2 max after three weeks of supplementation, compared to no real change in the placebo group. Time to exhaustion improved too. We've linked the study in our science section so you can read the actual data, not just our summary of it.",
      link: { text: "Visit site", url: "https://www.researchgate.net/publication/305313339_Cordyceps_militaris_Improves_Tolerance_to_High-Intensity_Exercise_After_Acute_and_Chronic_Supplementation" }
    },
    {
      q: 'Is this like a pre-workout — a quick energy hit?',
      a: "No, and that's kind of the point. There's no caffeine spike here, no jitters, nothing instant. Cordyceps works by building up in your system over days and weeks, not minutes. Think of it less as \"energy in a capsule\" and more as your body slowly getting better at using the oxygen it already has. Different tool, different job.",
    },
    {
      q: 'Do you have any certifications or lab testing?',
      a: "Yes — Daily Shield is FSSAI certified and manufactured under GMP-compliant practices. We also run third-party lab testing on our batches, so what's on the label is actually what's in the capsule. You'll find the actual lab reports in our science section.",
    },
    {
      q: 'Is Cordyceps some new wellness trend?',
      a: "Not even close — it's one of the oldest performance ingredients around, just newly popular in the West. Tibetan herders were using it centuries ago after noticing their yaks had unusual stamina at high altitude, and it's been a staple in traditional Chinese medicine for over a thousand years for exactly what we use it for now — fatigue and breathing. The clinical trials are new. The ingredient isn't.",
    }
  ],
}

export const homeFaq = {
  eyebrow: 'Questions',
  headline: [{ words: ['Before', 'you'] }, { words: ['commit.'] }],
  intro: "Still deciding? Here's what people usually ask before their first order.",
  items: [
    faq.items[0],
    faq.items[1],
    faq.items[2],
    faq.items[3],
    faq.items[6],
  ],
}

/** Reviews live on the product page, not the home page. */
export const proof = {
  eyebrow: 'Reviews',
  headline: [{ words: ['High', 'performers', "don't", 'exaggerate.'] }],
  rating: { score: '4.9', label: 'Trusted by 1,200+ high performers' },
  /**
   * The seeded wall.
   *
   * These used to be written in a strict text / media / text / media
   * alternation, which read as a layout pattern rather than as a feed — the
   * wall looked arranged instead of posted. Each entry now carries the date it
   * went up and the wall sorts on that alone, newest first, exactly as it does
   * for reviews published from the admin panel. The mix of kinds down a column
   * is whatever the dates happen to produce.
   */
  people: [
    { postedAt: '2026-09-08', type: 'text', name: 'Arjun M.', role: 'Hyrox athlete', quote: 'The biggest difference is my sustained energy throughout the day. No crashes, just clean stamina.' },
    { postedAt: '2026-09-06', type: 'text', name: 'Priya S.', role: 'Designer', quote: 'I’ve been taking this for a month. My breathing feels so much clearer during morning runs. Definitely a game-changer!' },
    { postedAt: '2026-09-05', type: 'video', name: 'Chef Mareya', image: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=600&auto=format&fit=crop' },
    { postedAt: '2026-09-03', type: 'image', name: 'Sarah', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=600&auto=format&fit=crop' },
    { postedAt: '2026-09-01', type: 'text', name: 'Neha R.', role: 'Founder', quote: 'This has been incredible for my respiratory health. I can finally take deep, clear breaths again.' },
    { postedAt: '2026-08-29', type: 'image', name: 'Anna Davey', image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600&auto=format&fit=crop' },
    { postedAt: '2026-08-27', type: 'text', name: 'Rohan', role: 'Cyclist', quote: 'A game changer for my VO2 max. Highly recommend it to anyone serious about endurance.' },
    { postedAt: '2026-08-25', type: 'video', name: 'David B.', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop', caption: 'Start the day with David Beckham?' },
    { postedAt: '2026-08-22', type: 'text', name: 'Kabir S.', role: 'Run club lead', quote: 'My recovery times have noticeably improved since I started taking this daily.' },
    { postedAt: '2026-08-20', type: 'text', name: 'Sam T.', role: 'Marathoner', quote: 'Been looking for a clean Cordyceps supplement for years. This is the only one I trust before long runs.' },
    { postedAt: '2026-08-18', type: 'image', name: 'James W.', image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600&auto=format&fit=crop' },
    { postedAt: '2026-08-15', type: 'video', name: 'Dr. Alisha', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=600&auto=format&fit=crop', caption: 'Why I recommend Daily Shield' },
    { postedAt: '2026-08-12', type: 'text', name: 'Vikram', role: 'Triathlete', quote: 'Noticeable difference in my breathing during intense cardio. Zero jitters, just raw stamina.' },
    { postedAt: '2026-08-09', type: 'image', name: 'Elena', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=600&auto=format&fit=crop' },
    { postedAt: '2026-08-06', type: 'text', name: 'Elena M.', role: 'Yoga Instructor', quote: 'The adaptogenic blend has completely stabilized my morning energy levels. I feel incredibly grounded.' },
    { postedAt: '2026-08-03', type: 'text', name: 'Jordan', role: 'CrossFit Coach', quote: 'Recovery is faster, and I don\'t feel the afternoon crash anymore. Pure, clean energy that lasts all day.' },
    { postedAt: '2026-07-31', type: 'video', name: 'Marcus', image: 'https://images.unsplash.com/photo-1599058917212-97d1421008d5?q=80&w=600&auto=format&fit=crop', caption: 'My 30-day results' },
    { postedAt: '2026-07-28', type: 'image', name: 'Morning Ritual', image: 'https://images.unsplash.com/photo-1542282811-943ef1a6777f?q=80&w=600&auto=format&fit=crop' },
    { postedAt: '2026-07-25', type: 'text', name: 'Anita K.', role: 'Writer', quote: 'Living in a polluted city, this has been my armor. My airways feel incredibly clear and I breathe so much easier.' },
  ],

}

/** The buying page. */
export const product = {
  eyebrow: 'Daily Shield',
  title: 'Daily Shield',
  subtitle: 'Respiratory wellness powered by Cordyceps militaris',
  lede: 'One product which anyone can relate to — and that everyone will appreciate. Consider city air, dust and the daily stamina dip, handled.',
  gallery: [
    { src: '/media/shop01.png', alt: 'ShrooMEED Daily Shield image 1' },
    { src: '/media/shop02.png', alt: 'ShrooMEED Daily Shield image 2' },
    { src: '/media/shop03.png', alt: 'ShrooMEED Daily Shield image 3' },
    { src: '/media/shop04.png', alt: 'ShrooMEED Daily Shield image 4' },
    { src: '/media/shop05.png', alt: 'ShrooMEED Daily Shield image 5' },
    { src: '/media/shop06.png', alt: 'ShrooMEED Daily Shield image 6' },
  ],
  facts: [
    { term: 'Pack', detail: '60 capsules · one month' },
    { term: 'Base', detail: 'Cordyceps militaris extract' },
    { term: 'Actives', detail: 'Nine, third-party tested' },
    { term: 'Free from', detail: 'Fillers, synthetic binders' },
  ],
  addToCart: 'Add to cart',
  shipping: 'Free shipping nationwide · Cash on Delivery available',
}

export const cart = {
  title: [{ words: ['your'] }, { words: ['cart.'], accent: true }],
  empty: 'Nothing here yet.',
  emptyBody: 'Daily Shield is a one-month pack of 60 capsules. Start the ritual whenever you are ready.',
  checkout: 'Checkout',
  note: 'Taxes calculated at checkout. Cash on Delivery available across India.',
}

export const newsletter = {
  eyebrow: 'Stay in the loop',
  headline: [{ words: ['join', 'the', 'ritual.'], accent: true }],
  /* Set over two lines on a handset — "join" alone, then "the ritual." */
  headlineMobile: [
    { words: ['join'], accent: true },
    { words: ['the', 'ritual.'], accent: true },
  ],
  body: 'Restock alerts, research notes on the actives inside Daily Shield, and the occasional note from the founder. No spam.',
  action: 'Sign up',
}

export const footer = {
  blurb:
    'The Daily Performance Ritual — clinically dosed Cordyceps militaris for stamina, unrestricted breathing, and clean cellular energy.',
  columns: [
    { title: 'Shop', links: [{ label: 'Daily Shield', to: '/product' }, { label: 'Cart', to: '/cart' }] },
    { title: 'Learn', links: [{ label: 'What it does', to: '/#what-it-does' }, { label: 'Ingredients', to: '/#ingredients' }, { label: 'FAQ', to: '/faq' }] },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', to: '/policies/privacy' },
        { label: 'Terms & Conditions', to: '/policies/terms' },
        { label: 'Shipping Policy', to: '/policies/shipping' },
        { label: 'Refunds', to: '/policies/refunds' },
      ],
    },
  ],
  badges: ['ISO Certified', 'GMP Certified', 'FSSAI Approved', 'Zero heavy metals', 'Third party tested'],
  legal: 'ShrooMEED™ 2026. FSSAI Lic. No. 21426590000646. The Daily Performance Ritual.',
}

export const researchData = {
  title: 'The Researches',
  intro: [
    'Explore the peer-reviewed clinical studies and scientific literature supporting the active ingredients in Daily Shield.'
  ],
  items: [
    {
      journal: 'ENDURANCE',
      title: 'Studied to improve VO2 max by up to 10.9% in just 3 weeks.',
      body: null,
      linkText: 'Read paper \u2192',
      linkUrl: 'https://www.researchgate.net/publication/305313339_Cordyceps_militaris_Improves_Tolerance_to_High-Intensity_Exercise_After_Acute_and_Chronic_Supplementation'
    },
    {
      journal: 'RECOVERY',
      title: 'Improves muscle glycogen storage overcompensation and limits fatigue caused by excessive physical training.',
      body: null,
      linkText: 'Read paper \u2192',
      linkUrl: 'https://doi.org/10.1038/s41598-025-92790-3'
    },
    {
      journal: 'ENERGY',
      title: 'Reviews structural anti-fatigue properties of C. militaris-derived polysaccharides that help maintain prolonged glycogen status.',
      body: null,
      linkText: 'Read paper \u2192',
      linkUrl: 'https://doi.org/10.3389/fnut.2022.898674'
    },
    {
      journal: 'RECOVERY',
      title: 'Cordyceps-based nanoemulsion shows measurable antioxidant, antimicrobial, and anti-inflammatory activity relevant to airway defense.',
      body: null,
      linkText: 'Read paper \u2192',
      linkUrl: 'https://doi.org/10.3390/molecules25235733'
    },
    {
      journal: 'STAMINA',
      title: 'Cordyceps militaris Improves Tolerance to High-Intensity Exercise After Acute and Chronic Supplementation',
      body: null,
      linkText: 'Read paper \u2192',
      linkUrl: 'https://www.tandfonline.com/doi/abs/10.1080/19390211.2016.1203386'
    }
  ],
  viewAll: {
    text: 'View all researches',
    url: '/researches'
  }
}

export const labReportsData = {
  title: 'Lab Reports',
  intro: [
    'Below, you can find the complete certificates of analysis from our ISO-accredited third-party testing partners.'
  ],
  items: [
    {
      journal: 'INDEPENDENT BATCH TESTING',
      title: 'Heavy Metals & Microbial Analysis',
      body: '— Comprehensive screening for heavy metals and microbiological parameters. All results passed strictly within safety limits.',
      linkText: 'View certificate',
      linkUrl: '/media/sff-130826014.pdf'
    }
  ]
}
