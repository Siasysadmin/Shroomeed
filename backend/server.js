import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import multer from 'multer'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}
app.use('/uploads', express.static(uploadsDir))

// Setup Multer Storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

/**
 * Size ceilings, per field.
 *
 * Multer's `limits` are per request, not per field, so the video ceiling is
 * the one that applies and a photo is checked separately once its size is
 * known. Without a ceiling a mis-picked 2GB file would be streamed to disk in
 * full before anything could reject it.
 */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_BYTES = 200 * 1024 * 1024 // 200MB

/** Reject by field: an .mp4 in the cover slot is a mistake, not a cover. */
function fileFilter(req, file, cb) {
  const isImageField = ['image', 'poster', 'thumbnail'].includes(file.fieldname)
  const wanted = isImageField ? 'image/' : 'video/'
  if (!file.mimetype.startsWith(wanted)) {
    cb(new Error(`The ${file.fieldname} field takes ${isImageField ? 'an image' : 'a video'} file.`))
    return
  }
  cb(null, true)
}

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_VIDEO_BYTES, files: 2 } })

/** The three media slots a review can arrive with. */
const reviewUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'poster', maxCount: 1 },
])

/**
 * Delete files this server wrote.
 *
 * Only paths under `/uploads` are touched — a review whose cover is a remote
 * url has nothing of ours to remove, and a crafted path must never be able to
 * reach outside the uploads folder.
 */
function removeUploads(...paths) {
  for (const value of paths) {
    if (typeof value !== 'string' || !value.startsWith('/uploads/')) continue
    const resolved = path.resolve(uploadsDir, path.basename(value))
    if (path.dirname(resolved) !== path.resolve(uploadsDir)) continue
    fs.promises.unlink(resolved).catch(() => {
      /* already gone, or never written — nothing to clean up */
    })
  }
}

/** Byte counts are unreadable in an error message; megabytes are not. */
const mb = (bytes) => Math.round((bytes / (1024 * 1024)) * 10) / 10

/** Whatever multer managed to write before the request was rejected. */
function discardUploaded(req) {
  const groups = req.files ? Object.values(req.files).flat() : req.file ? [req.file] : []
  removeUploads(...groups.map((file) => `/uploads/${file.filename}`))
}

// --- SCHEMAS ---
/**
 * One card on the review wall.
 *
 * Four kinds, and the kind decides which fields carry the card:
 *
 *   text        `quote` only — no media at all
 *   image       `image` (uploaded photo) + optional `quote` as the caption
 *   video       `video` (uploaded clip) + optional `image` as its poster frame
 *   instagram   `redirectUrl` to the post + `image` as the cover pulled off it
 *
 * `image` doubles as the poster on a video card because the storefront only
 * ever needs one still per card, whatever produced it.
 */
const REVIEW_TYPES = ['text', 'image', 'video', 'instagram']

const ReviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String },
  quote: { type: String },
  image: { type: String },
  video: { type: String },
  redirectUrl: { type: String },
  type: { type: String, default: 'text', enum: REVIEW_TYPES },
  /** Where the cover came from when it was pulled off a post rather than uploaded. */
  coverSource: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
})
const Review = mongoose.model('Review', ReviewSchema)

const ShowcaseVideoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String },
  videoUrl: { type: String, required: true },
  thumbnail: { type: String },
  createdAt: { type: Date, default: Date.now }
})
const ShowcaseVideo = mongoose.model('ShowcaseVideo', ShowcaseVideoSchema)

/**
 * A question asked from the public FAQ page.
 *
 * `email` is not free text — it is whatever address the asker was signed in
 * with, captured server-side into its own indexed field so the admin table can
 * always answer "who asked this". Questions are never anonymous.
 */
const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true, maxlength: 2000 },
  email: { type: String, required: true, trim: true, lowercase: true, index: true },
  name: { type: String, trim: true },
  status: { type: String, default: 'new', enum: ['new', 'answered'] },
  answer: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
})
const Question = mongoose.model('Question', QuestionSchema)

/**
 * One row, ever. Site-wide switches the admin flips; the storefront reads them
 * on load so a section can be pulled without a deploy.
 */
const SettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'site', unique: true },
  showReviewsMain: { type: Boolean, default: true },
  showReviewsHome: { type: Boolean, default: true },
  showReviewsShop: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now },
})
const Settings = mongoose.model('Settings', SettingsSchema)

const SETTINGS_FIELDS = ['showReviewsMain', 'showReviewsHome', 'showReviewsShop']

/** The settings row is created on first read so no seed step is required. */
async function getSettings() {
  let doc = await Settings.findOne({ key: 'site' })
  if (!doc) doc = await Settings.create({ key: 'site' })
  return doc
}

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String },
  items: [{
    title: String,
    quantity: Number,
    price: Number
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, default: 'Confirmed' }, // Confirmed, Shipped, In Transit, Delivered
  deliveryAddress: { type: String },
  createdAt: { type: Date, default: Date.now }
})
const Order = mongoose.model('Order', OrderSchema)

// --- ROUTES ---

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
})

// Reviews API
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 })
    res.json(reviews)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * Publish a card.
 *
 * The card's kind is decided here from what actually arrived, not from what
 * the form claimed: a "video card" with no clip attached would render as an
 * empty black frame on the wall, so the request is refused instead of stored.
 * Everything already written to disk is removed on the way out — a rejected
 * submission must not leave a 100MB orphan behind.
 */
app.post('/api/reviews', reviewUpload, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim()
    const role = String(req.body.role || '').trim()
    const quote = String(req.body.quote || '').trim()
    const redirectUrl = String(req.body.redirectUrl || '').trim()
    const requested = REVIEW_TYPES.includes(req.body.type) ? req.body.type : 'text'

    const imageFile = req.files?.image?.[0]
    const videoFile = req.files?.video?.[0]
    const posterFile = req.files?.poster?.[0]

    const fail = (message) => {
      discardUploaded(req)
      res.status(400).json({ error: message })
      return null
    }

    if (!name) return fail('Add the reviewer’s name.')
    if (redirectUrl && !/^https?:\/\//i.test(redirectUrl)) {
      return fail('The post link needs to start with http:// or https://')
    }
    if (imageFile && imageFile.size > MAX_IMAGE_BYTES) {
      return fail(`That photo is ${mb(imageFile.size)}MB. Images are capped at ${mb(MAX_IMAGE_BYTES)}MB.`)
    }
    if (posterFile && posterFile.size > MAX_IMAGE_BYTES) {
      return fail(`That poster is ${mb(posterFile.size)}MB. Images are capped at ${mb(MAX_IMAGE_BYTES)}MB.`)
    }

    const video = videoFile ? `/uploads/${videoFile.filename}` : ''

    // A still comes from one of three places, in order of how deliberate it is:
    // an uploaded poster, an uploaded photo, then a cover fetched off a post.
    let image = ''
    let coverSource = ''
    if (posterFile) {
      image = `/uploads/${posterFile.filename}`
    } else if (imageFile) {
      image = `/uploads/${imageFile.filename}`
    } else if (req.body.image) {
      image = String(req.body.image)
      coverSource = String(req.body.coverSource || redirectUrl || '')
    }

    // What the card actually is, given what actually arrived.
    let type = requested
    if (video) type = 'video'
    else if (type === 'video') return fail('Attach a video file, or pick another card type.')
    else if (type === 'instagram' && !redirectUrl) return fail('Paste the post link for an Instagram card.')
    else if (type === 'instagram' && !image) return fail('Fetch or upload a cover for the Instagram card.')
    else if (type === 'image' && !image) return fail('Upload a photo, or pick another card type.')
    else if (!image) type = 'text'

    if (type === 'text' && !quote) return fail('A text card needs the review text.')

    const review = await Review.create({
      name,
      role,
      quote,
      redirectUrl,
      image,
      video,
      coverSource,
      type,
    })
    res.status(201).json(review)
  } catch (err) {
    discardUploaded(req)
    res.status(500).json({ error: err.message })
  }
})

/** Taking a card down takes its uploaded files with it. */
app.delete('/api/reviews/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id)
    if (!review) return res.status(404).json({ error: 'Review not found' })
    removeUploads(review.image, review.video)
    res.json({ message: 'Review deleted', id: review._id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Showcase Videos API
app.get('/api/showcase-videos', async (req, res) => {
  try {
    const videos = await ShowcaseVideo.find().sort({ createdAt: -1 })
    res.json(videos)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post(
  '/api/showcase-videos',
  upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]),
  async (req, res) => {
    try {
      const name = String(req.body.name || '').trim()
      const role = String(req.body.role || '').trim()
      const videoFile = req.files?.video?.[0]
      const thumbFile = req.files?.thumbnail?.[0]

      const fail = (message) => {
        discardUploaded(req)
        res.status(400).json({ error: message })
        return null
      }

      if (!name) return fail('Add the customer’s name.')

      // A remote url is still accepted, for a clip already hosted elsewhere.
      const videoUrl = videoFile
        ? `/uploads/${videoFile.filename}`
        : String(req.body.videoUrl || '').trim()
      if (!videoUrl) return fail('Attach a video file, or give a video url.')

      if (thumbFile && thumbFile.size > MAX_IMAGE_BYTES) {
        return fail(`That thumbnail is ${mb(thumbFile.size)}MB. Images are capped at ${mb(MAX_IMAGE_BYTES)}MB.`)
      }

      const video = await ShowcaseVideo.create({
        name,
        role,
        videoUrl,
        thumbnail: thumbFile ? `/uploads/${thumbFile.filename}` : '',
      })
      res.status(201).json(video)
    } catch (err) {
      discardUploaded(req)
      res.status(500).json({ error: err.message })
    }
  }
)

app.delete('/api/showcase-videos/:id', async (req, res) => {
  try {
    const video = await ShowcaseVideo.findByIdAndDelete(req.params.id)
    if (!video) return res.status(404).json({ error: 'Video not found' })
    removeUploads(video.videoUrl, video.thumbnail)
    res.json({ message: 'Video deleted', id: video._id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Orders API
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/orders', async (req, res) => {
  try {
    const orderId = '#SHR-' + Math.floor(1000 + Math.random() * 9000)
    const order = new Order({ ...req.body, orderId })
    await order.save()
    res.status(201).json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ---------------------------------------------------------------- Questions

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Newest first — the admin works the top of the queue. */
app.get('/api/questions', async (req, res) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {}
    const questions = await Question.find(filter).sort({ createdAt: -1 })
    res.json(questions)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/questions', async (req, res) => {
  try {
    const question = String(req.body.question || '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()
    const name = String(req.body.name || '').trim()

    if (!question) {
      return res.status(400).json({ error: 'Please type a question.' })
    }
    // The identity gate: no signed-in address, no submission.
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(401).json({ error: 'Please sign in with your email before asking a question.' })
    }

    const doc = await Question.create({ question, email, name })
    res.status(201).json(doc)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.patch('/api/questions/:id', async (req, res) => {
  try {
    const update = {}
    if (typeof req.body.answer === 'string') update.answer = req.body.answer
    if (req.body.status) update.status = req.body.status
    const doc = await Question.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!doc) return res.status(404).json({ error: 'Question not found' })
    res.json(doc)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/questions/:id', async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id)
    res.json({ message: 'Question deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ----------------------------------------------------------------- Settings

app.get('/api/settings', async (req, res) => {
  try {
    const doc = await getSettings()
    res.json(doc)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/settings', async (req, res) => {
  try {
    const update = { updatedAt: new Date() }
    for (const field of SETTINGS_FIELDS) {
      if (typeof req.body[field] === 'boolean') update[field] = req.body[field]
    }
    const doc = await Settings.findOneAndUpdate(
      { key: 'site' },
      { $set: update },
      { new: true, upsert: true }
    )
    res.json(doc)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// -------------------------------------------------------- Post cover lookup

/**
 * Pull the cover image out of a social post so the admin does not have to
 * screenshot one by hand.
 *
 * Instagram's own oEmbed endpoint needs an app token, so this reads the public
 * page and takes the OpenGraph card — the same image any chat app shows when
 * you paste the link. Instagram serves that to unauthenticated crawlers most of
 * the time but not always, so a miss is reported as a plain "couldn't read it"
 * and the admin form falls back to uploading a file. It is a convenience, never
 * a dependency.
 */
function pickMeta(html, names) {
  for (const name of names) {
    const pattern = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`,
      'i'
    )
    const alt = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`,
      'i'
    )
    const hit = html.match(pattern) || html.match(alt)
    if (hit) return hit[1]
  }
  return ''
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

const CRAWLER_UA =
  'Mozilla/5.0 (compatible; facebookexternalhit/1.1; +http://www.facebook.com/externalhit_uatext.php)'
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

async function fetchText(url, userAgent, ms = 9000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': userAgent,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })
    if (!response.ok) return null
    return await response.text()
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

const IG_POST_RE = /instagram\.com\/(?:[^/]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i

/**
 * Instagram's official oEmbed. This is the only route Meta actually supports,
 * and the only one that works reliably — but it needs an app token, so it is
 * used when `IG_ACCESS_TOKEN` is set and skipped otherwise.
 */
async function instagramOEmbed(target) {
  const token = process.env.IG_ACCESS_TOKEN
  if (!token) return null

  const endpoint =
    `https://graph.facebook.com/v19.0/instagram_oembed` +
    `?url=${encodeURIComponent(target)}&fields=thumbnail_url,author_name,title&access_token=${token}`

  const raw = await fetchText(endpoint, BROWSER_UA, 9000)
  if (!raw) return null
  try {
    const data = JSON.parse(raw)
    if (!data.thumbnail_url) return null
    return { image: data.thumbnail_url, title: data.title || '', author: data.author_name || '' }
  } catch {
    return null
  }
}

/**
 * Last resort for Instagram: read the public embed view.
 *
 * Worth attempting because it costs one request and occasionally still works,
 * but do not rely on it — Meta increasingly answers automated requests with a
 * login shell regardless of user agent, in which case this finds nothing and
 * the caller falls back to a manual upload.
 */
async function instagramScrape(target) {
  const match = target.match(IG_POST_RE)
  if (!match) return null

  const html = await fetchText(
    `https://www.instagram.com/p/${match[1]}/embed/captioned/`,
    BROWSER_UA,
    10000
  )
  if (!html) return null

  const candidates = [
    /class="EmbeddedMediaImage"[^>]*\ssrc="([^"]+)"/i,
    /"display_url"\s*:\s*"([^"]+)"/i,
    /"thumbnail_src"\s*:\s*"([^"]+)"/i,
  ]

  for (const pattern of candidates) {
    const hit = html.match(pattern)
    if (!hit?.[1]) continue

    const url = decodeEntities(hit[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/'))
    // `static.cdninstagram.com` is Instagram's own UI chrome, never post media.
    if (!url.startsWith('http') || /static\.cdninstagram\.com/i.test(url)) continue

    const caption = html.match(/class="Caption"[^>]*>([\s\S]{0,400}?)<\/div>/i)
    return {
      image: url,
      title: caption ? decodeEntities(caption[1].replace(/<[^>]+>/g, ' ').trim()).slice(0, 200) : '',
      author: '',
    }
  }
  return null
}

app.get('/api/post-preview', async (req, res) => {
  const target = String(req.query.url || '').trim()

  if (!/^https?:\/\//i.test(target)) {
    return res.status(400).json({ error: 'Provide a full http(s) link.' })
  }

  try {
    let image = ''
    let title = ''
    let author = ''

    const isInstagram = IG_POST_RE.test(target)

    // 1. Official oEmbed first for Instagram — the only route Meta supports.
    if (isInstagram) {
      const official = await instagramOEmbed(target)
      if (official) {
        image = official.image
        title = official.title
        author = official.author
      }
    }

    // 2. The OpenGraph card — what most of the web, and every link preview, uses.
    if (!image) {
      const html = await fetchText(target, CRAWLER_UA)
      if (html) {
        image = decodeEntities(pickMeta(html, ['og:image', 'twitter:image', 'og:image:secure_url']))
        title = title || decodeEntities(pickMeta(html, ['og:title', 'twitter:title']))
        author = author || decodeEntities(pickMeta(html, ['og:description', 'twitter:description'])).slice(0, 300)
      }
    }

    // 3. Instagram's public embed, which sometimes still answers.
    if (!image && isInstagram) {
      const scraped = await instagramScrape(target)
      if (scraped) {
        image = scraped.image
        title = title || scraped.title
      }
    }

    if (!image) {
      return res.status(404).json({
        error: isInstagram
          ? 'Instagram did not return a cover for that link. Meta blocks automated cover lookups unless an app token is configured (set IG_ACCESS_TOKEN on the server) — until then, upload the cover manually.'
          : 'No cover image found on that link. The post may be private or have no preview image — upload a cover instead.',
        needsManualUpload: true,
      })
    }

    /*
      The OG url points at Instagram's CDN, which signs its links and refuses
      hotlinking from another origin — a review saved with that url straight in
      it would show a broken frame within hours. So the bytes are copied into
      our own uploads folder now and the review keeps a local path, exactly as
      if the admin had uploaded the file.
    */
    let stored = ''
    try {
      const shot = await fetch(image, {
        headers: { 'User-Agent': 'Mozilla/5.0', Referer: target },
      })
      if (shot.ok) {
        const buffer = Buffer.from(await shot.arrayBuffer())
        const mime = shot.headers.get('content-type') || 'image/jpeg'
        const ext = mime.includes('png') ? '.png' : mime.includes('webp') ? '.webp' : '.jpg'
        const filename = `cover-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`
        fs.writeFileSync(path.join(uploadsDir, filename), buffer)
        stored = `/uploads/${filename}`
      }
    } catch {
      // fall through — the caller still gets the remote url to preview
    }

    res.json({ image: stored || image, remoteImage: image, stored: Boolean(stored), title, author, source: target })
  } catch (err) {
    const aborted = err.name === 'AbortError'
    res.status(504).json({
      error: aborted ? 'That link took too long to respond.' : `Could not reach that link: ${err.message}`,
    })
  }
})

/**
 * Upload failures in words the admin can act on.
 *
 * Multer throws before any route body runs, so without this an oversized clip
 * came back as a bare 500 and the panel could only say "Request failed" — the
 * one case where the operator most needs to be told what to do differently.
 */
app.use((err, req, res, next) => {
  if (!err) return next()
  discardUploaded(req)

  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `That file is too large. Videos are capped at ${mb(MAX_VIDEO_BYTES)}MB and images at ${mb(MAX_IMAGE_BYTES)}MB.`
        : err.code === 'LIMIT_UNEXPECTED_FILE'
          ? `Unexpected file field "${err.field}".`
          : err.message
    return res.status(400).json({ error: message })
  }

  // fileFilter rejections arrive as plain Errors — they are the admin's to fix.
  return res.status(400).json({ error: err.message || 'Upload failed.' })
})

// Connect Database & Start Server
const MONGODB_URI = process.env.MONGODB_URI
console.log('Connecting to MongoDB Atlas...')

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Successfully connected to MongoDB Atlas!')
    app.listen(PORT, () => {
      console.log(`🚀 ShrooMEED Backend running on http://localhost:${PORT}`)
    })
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message)
  })
