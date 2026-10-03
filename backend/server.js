import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import multer from 'multer'
import Razorpay from 'razorpay'
import crypto from 'crypto'

dotenv.config()

const DELHIVERY_API_TOKEN = process.env.DELHIVERY_API_TOKEN
const DELHIVERY_PICKUP_LOCATION =
  process.env.DELHIVERY_PICKUP_LOCATION || 'SHROOMEED B2C'

// const DELHIVERY_BASE_URL = 'https://track.delhivery.com'
const DELHIVERY_BASE_URL =
  process.env.DELHIVERY_BASE_URL || 'https://track.delhivery.com'

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

/** Delhivery ko GET request — token lagata hai aur jawab ko JSON mein badalta hai. */
async function delhiveryGet(path) {
  if (!DELHIVERY_API_TOKEN) throw new Error('DELHIVERY_API_TOKEN is missing')

  const response = await fetch(`${DELHIVERY_BASE_URL}${path}`, {
    headers: {
      Authorization: `Token ${DELHIVERY_API_TOKEN}`,
      Accept: 'application/json',
    },
  })

  const text = await response.text()
  let data = null
  try { data = JSON.parse(text) } catch { /* kabhi HTML bhi aata hai */ }

  if (!response.ok) {
    throw new Error(data?.rmk || data?.error || `Delhivery request failed (${response.status})`)
  }
  return data ?? text
}

/** Ek waybill ka abhi ka haal — status aur poora safar. */
async function trackDelhiveryShipment(awb) {
  const data = await delhiveryGet(
    `/api/v1/packages/json/?waybill=${encodeURIComponent(awb)}`
  )

  const shipment = data?.ShipmentData?.[0]?.Shipment || null
  if (!shipment) throw new Error('Delhivery has no record of this waybill yet.')

  return {
    status: shipment?.Status?.Status || 'Unknown',
    note: shipment?.Status?.Instructions || '',
    location: shipment?.Status?.StatusLocation || '',
    updatedAt: shipment?.Status?.StatusDateTime || null,
    expectedDate: shipment?.ExpectedDeliveryDate || null,
    scans: (shipment?.Scans || []).map((scan) => ({
      status: scan?.ScanDetail?.Scan || '',
      note: scan?.ScanDetail?.Instructions || '',
      location: scan?.ScanDetail?.ScannedLocation || '',
      at: scan?.ScanDetail?.StatusDateTime || null,
    })),
  }
}

/**
 * Delhivery ka status dukaan ke status se alag hai — usme "Manifested",
 * "Dispatched" jaise shabd hain. Sirf woh padav uthate hain jo grahak ke
 * liye maayne rakhte hain; baaki delhiveryStatus mein jaise ka taisa rehta hai.
 */
function shopStatusFor(delhiveryStatus) {
  const value = String(delhiveryStatus || '').toLowerCase()
  if (value.includes('delivered')) return 'Delivered'
  if (value.includes('rto') || value.includes('cancel') || value.includes('lost')) return 'Cancelled'
  if (value.includes('dispatched') || value.includes('transit') || value.includes('pending')) return 'In Transit'
  if (value.includes('manifest') || value.includes('not picked')) return 'Confirmed'
  return null
}

/** Packing slip — jo parcel par chipkana hai. */
async function delhiveryPackingSlip(awb) {
  return delhiveryGet(
    `/api/p/packing_slip?wbns=${encodeURIComponent(awb)}&pdf=true`
  )
}

/** "Aa ke parcel le jao" — Delhivery ko bulana. */
async function requestDelhiveryPickup({ date, time, count }) {
  if (!DELHIVERY_API_TOKEN) throw new Error('DELHIVERY_API_TOKEN is missing')

  const response = await fetch(`${DELHIVERY_BASE_URL}/fm/request/new/`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${DELHIVERY_API_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      pickup_location: DELHIVERY_PICKUP_LOCATION,
      pickup_date: date,
      pickup_time: time,
      expected_package_count: Number(count) || 1,
    }),
  })

  const result = await response.json().catch(() => null)
  if (!response.ok || result?.error) {
    throw new Error(
      result?.error || result?.pry_message || `Pickup request failed (${response.status})`
    )
  }
  return result
}


async function createDelhiveryShipment(order) {
  if (!DELHIVERY_API_TOKEN) {
    throw new Error('DELHIVERY_API_TOKEN is missing')
  }
  // Delhivery in characters ko reject karta hai: & # % ; \
  const clean = (value) =>
    String(value ?? '').replace(/[&#%;\\]/g, ' ').replace(/\s+/g, ' ').trim()

  const shipment = {
    name: order.customerName,
    add: order.deliveryAddress,
    pin: order.deliveryPincode,
    city: order.deliveryCity,
    state: order.deliveryState,
    country: 'India',

    phone: order.customerPhone,

    order: order.orderId,

    payment_mode: 'Prepaid',

    total_amount: order.totalAmount,

       products_desc: clean(
      order.items.map(item => `${item.title} x ${item.quantity}`).join(', ')
    ),

    quantity: order.items.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    ),

    weight: Number(process.env.DELHIVERY_DEFAULT_WEIGHT_G || 500),

    shipment_width: Number(
      process.env.DELHIVERY_DEFAULT_WIDTH_CM || 10
    ),

    shipment_height: Number(
      process.env.DELHIVERY_DEFAULT_HEIGHT_CM || 8
    ),

    shipment_length: Number(
      process.env.DELHIVERY_DEFAULT_LENGTH_CM || 15
    ),

    shipping_mode: 'Surface'
  }

  const payload = {
    shipments: [shipment],
     pickup_location: {
      name: DELHIVERY_PICKUP_LOCATION,
      add: process.env.DELHIVERY_PICKUP_ADDRESS || '',
      city: process.env.DELHIVERY_PICKUP_CITY || '',
      pin_code: Number(process.env.DELHIVERY_PICKUP_PIN) || undefined,
      country: 'India',
      phone: process.env.DELHIVERY_PICKUP_PHONE || '',
    }
  }

  const body = new URLSearchParams()
  body.append('format', 'json')
  body.append('data', JSON.stringify(payload))

  const response = await fetch(
    `${DELHIVERY_BASE_URL}/api/cmu/create.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Token ${DELHIVERY_API_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    }
  )

  const result = await response.json()

  const pkg = result?.packages?.[0] || null

  if (
    !response.ok ||
    result?.success === false ||
    pkg?.status === 'Fail' ||
    !pkg?.waybill
  ) {
    console.error('Delhivery API Error:', result)
    throw new Error(
      pkg?.remarks?.join(' ') ||
      result?.rmk ||
      result?.error ||
      'Delhivery shipment creation failed'
    )
  }

  console.log('Delhivery shipment response:', result)

  return result
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
    pinned: { type: Boolean, default: false },
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
  status: { type: String, default: 'Confirmed' },
  paymentStatus: { type: String, default: 'Pending' },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  viewToken: { type: String, index: true },
  deliveryAddress: { type: String },
    deliveryCity: { type: String },
  deliveryState: { type: String },
  deliveryPincode: { type: String },

  delhiveryAwb: { type: String },
  delhiveryStatus: { type: String },
  delhiveryShipmentCreated: { type: Boolean, default: false },
  delhiveryShipmentError: { type: String },
  delhiveryLastUpdated: { type: Date },
  createdAt: { type: Date, default: Date.now }
})
const Order = mongoose.model('Order', OrderSchema)

// --- RAZORPAY ---

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// Daam server par tay hota hai, browser par nahi.
const UNIT_PRICE = 3000
const BULK_PRICE = 2550
const BULK_MIN_QTY = 3

function priceFor(rawQty) {
  const qty = Math.max(0, Math.min(99, Math.floor(Number(rawQty) || 0)))
  const unit = qty >= BULK_MIN_QTY ? BULK_PRICE : UNIT_PRICE
  return { qty, unit, total: qty * unit }
}

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
      const videos = await ShowcaseVideo.find().sort({ pinned: -1, createdAt: -1 })
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

// Admin: video ko pin / unpin karna
app.patch('/api/showcase-videos/:id/pin', requireAdmin, async (req, res) => {
  try {
    const pinned = Boolean(req.body?.pinned)
    const video = await ShowcaseVideo.findByIdAndUpdate(req.params.id, { pinned }, { new: true })
    if (!video) return res.status(404).json({ error: 'Video not found' })

    const videos = await ShowcaseVideo.find().sort({ pinned: -1, createdAt: -1 })
    res.json(videos)
  } catch (err) {
    res.status(500).json({ error: 'Could not update the video.' })
  }
})

//temporary test route
// app.get('/api/test-delhivery', async (req, res) => {
//   try {
//    const testOrder = {
//   orderId: `SHROOMTEST-${Date.now()}`,

//   customerName: 'Rahul Sharma',
//   customerPhone: '8358056306',
//    deliveryAddress: '54 Scheme No 54, Vijay Nagar',
//   deliveryCity: 'Gurgaon',
//   deliveryState: 'Haryana',
//   deliveryPincode: '122003',

//   items: [
//     {
//       title: 'ShroMEED Daily Shield',
//       quantity: 1,
//       price: 999
//     }
//   ],

//   totalAmount: 999
// }

//     const result = await createDelhiveryShipment(testOrder)

//     res.json(result)
//   } catch (error) {
//     res.status(500).json({
//       error: error.message
//     })
//   }
// })


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

// --- ADMIN AUTH ---

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase()
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''
const ADMIN_SECRET = process.env.ADMIN_SECRET || ''
const ADMIN_TOKEN_DAYS = 7

function signAdminToken() {
  const expires = String(Date.now() + ADMIN_TOKEN_DAYS * 24 * 60 * 60 * 1000)
  const sig = crypto.createHmac('sha256', ADMIN_SECRET).update(expires).digest('hex')
  return `${expires}.${sig}`
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const [expires, sig] = token.split('.')

  if (!ADMIN_SECRET || !expires || !sig || Number(expires) < Date.now()) {
    return res.status(401).json({ error: 'Please log in again.' })
  }

  const expected = crypto.createHmac('sha256', ADMIN_SECRET).update(expires).digest('hex')
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: 'Please log in again.' })
  }

  next()
}

app.post('/api/admin/login', (req, res) => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_SECRET) {
    return res.status(500).json({ error: 'Admin login is not set up on the server.' })
  }
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Wrong email or password.' })
  }
  res.json({ token: signAdminToken() })
})

// Orders API
app.get('/api/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 })
    res.json(orders)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/orders', requireAdmin, async (req, res) => {
  try {
       const orderId = '#SHR-' + crypto.randomBytes(3).toString('hex').toUpperCase()
    const order = new Order({ ...req.body, orderId })
    await order.save()
    res.status(201).json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// Admin: order ka status badalna
const ORDER_STATUSES = ['Confirmed', 'Shipped', 'In Transit', 'Delivered', 'Cancelled']

app.patch('/api/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const status = String(req.body?.status || '')
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' })
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!order) return res.status(404).json({ error: 'Order not found.' })
    res.json(order)
  } catch (err) {
    res.status(500).json({ error: 'Could not update the order.' })
  }
})

// Admin: order delete
app.delete('/api/orders/:id', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found.' })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'Could not delete the order.' })
  }
})

// Customer: sirf apne orders (token se)
app.post('/api/orders/mine', async (req, res) => {
  try {
    const tokens = Array.isArray(req.body?.tokens)
      ? req.body.tokens.filter((t) => typeof t === 'string' && t.length === 48).slice(0, 50)
      : []
    if (tokens.length === 0) return res.json([])

    const orders = await Order.find({ viewToken: { $in: tokens } })
      .sort({ createdAt: -1 })
           .select('orderId customerName items totalAmount status paymentStatus createdAt viewToken delhiveryAwb -_id')

    res.json(orders)
  } catch (err) {
    res.status(500).json({ error: 'Could not load your orders.' })
  }
})


// --- DELHIVERY ROUTES ---

/** Shipment banao aur order par nishan laga do. */
async function shipOrder(order) {
  const result = await createDelhiveryShipment(order)
  const pkg = result?.packages?.[0] || null

  order.delhiveryAwb = pkg?.waybill || ''
  order.delhiveryStatus = pkg?.status || 'Manifested'
  order.delhiveryShipmentCreated = true
  order.delhiveryShipmentError = ''
  order.delhiveryLastUpdated = new Date()
  await order.save()

  return order
}

/**
 * Jin orders ka shipment nahi ban paya (wallet khali tha, ya Delhivery down
 * thi) unhe dobara bhejne ka raasta. Iske bina wo order hamesha ke liye
 * atke rehte.
 */
app.post('/api/orders/:id/ship', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found.' })
    if (order.delhiveryAwb) {
      return res.status(400).json({ error: 'This order already has a waybill.' })
    }

    await shipOrder(order)
    res.json(order)
  } catch (err) {
    // Wajah order par likh do taaki admin ko dikhe
    try {
      const order = await Order.findById(req.params.id)
      if (order) {
        order.delhiveryShipmentCreated = false
        order.delhiveryShipmentError = err.message
        order.delhiveryLastUpdated = new Date()
        await order.save()
      }
    } catch { /* ignore */ }

    res.status(502).json({ error: err.message })
  }
})

// Admin: Delhivery se taaza status laao
app.post('/api/orders/:id/track', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found.' })
    if (!order.delhiveryAwb) {
      return res.status(400).json({ error: 'No waybill on this order yet.' })
    }

    const tracking = await trackDelhiveryShipment(order.delhiveryAwb)

    order.delhiveryStatus = tracking.status
    order.delhiveryLastUpdated = new Date()

    const shopStatus = shopStatusFor(tracking.status)
    if (shopStatus) order.status = shopStatus

    await order.save()
    res.json({ order, tracking })
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

// Admin: packing slip (parcel par chipkane wala label)
app.get('/api/orders/:id/label', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Order not found.' })
    if (!order.delhiveryAwb) {
      return res.status(400).json({ error: 'No waybill on this order yet.' })
    }

    const slip = await delhiveryPackingSlip(order.delhiveryAwb)
    res.json(slip)
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

// Admin: "aa ke parcel le jao"
app.post('/api/delhivery/pickup', requireAdmin, async (req, res) => {
  try {
    const { date, time, count } = req.body || {}
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) {
      return res.status(400).json({ error: 'Date must be YYYY-MM-DD.' })
    }

    const result = await requestDelhiveryPickup({
      date,
      time: time || '14:00:00',
      count: count || 1,
    })
    res.json(result)
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})

/**
 * Grahak apna tracking dekhe — sirf apne viewToken se, isliye koi doosra
 * kisi aur ka parcel nahi dekh sakta.
 */
app.post('/api/orders/track-mine', async (req, res) => {
  try {
    const token = String(req.body?.token || '')
    if (token.length !== 48) return res.status(400).json({ error: 'Invalid request.' })

    const order = await Order.findOne({ viewToken: token })
    if (!order) return res.status(404).json({ error: 'Order not found.' })
    if (!order.delhiveryAwb) {
      return res.json({ awb: '', status: order.status, scans: [] })
    }

    const tracking = await trackDelhiveryShipment(order.delhiveryAwb)
    res.json({
      awb: order.delhiveryAwb,
      status: tracking.status,
      expectedDate: tracking.expectedDate,
      scans: tracking.scans,
    })
  } catch (err) {
    res.status(502).json({ error: err.message })
  }
})


// --- PAYMENT API ---

app.post('/api/payment/create-order', async (req, res) => {
  try {
    const { qty, unit, total } = priceFor(req.body?.qty)
    if (qty < 1) return res.status(400).json({ error: 'Cart is empty.' })

    const rzpOrder = await razorpay.orders.create({
      amount: total * 100, // Razorpay paise mein leta hai
      currency: 'INR',
      receipt: 'shr_' + Date.now(),
      notes: { qty: String(qty), unit: String(unit) },
    })

    res.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
    })
  } catch (err) {
    console.error('create-order failed:', err)
    res.status(500).json({ error: 'Could not start payment.' })
  }
})

app.post('/api/payment/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customer,
    } = req.body || {}

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Incomplete payment details.' })
    }

    // Signature check — isse pata chalta hai payment sach mein hua hai
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: 'Payment verification failed.' })
    }

    // Ek hi payment do baar save na ho jaye
    const already = await Order.findOne({ razorpayPaymentId: razorpay_payment_id })
      if (already) return res.json({ ok: true, orderId: already.orderId, viewToken: already.viewToken })

    // Amount Razorpay se hi lete hain — browser par bharosa nahi
    const rzpOrder = await razorpay.orders.fetch(razorpay_order_id)
    const qty = Math.max(1, Number(rzpOrder.notes?.qty) || 1)
    const total = Number(rzpOrder.amount) / 100
    const unit = Math.round(total / qty)

    const orderId = '#SHR-' + crypto.randomBytes(3).toString('hex').toUpperCase()

    const order = await Order.create({
      orderId,
      customerName: customer?.name || 'Unknown',
      customerEmail: customer?.email || '',
      customerPhone: customer?.phone || '',
      deliveryAddress: customer?.address || '',
      deliveryCity: customer?.city || '',
deliveryState: customer?.state || '',
deliveryPincode: customer?.pincode || '',
      items: [{ title: 'Daily Shield', quantity: qty, price: unit }],
      totalAmount: total,
      status: 'Confirmed',
      paymentStatus: 'Paid',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      viewToken: crypto.randomBytes(24).toString('hex'),
    })

    try {
  const delhiveryResult = await createDelhiveryShipment(order)

  console.log('DELHIVERY RESULT:', JSON.stringify(delhiveryResult, null, 2))

  const packageData =
    delhiveryResult?.packages?.[0] ||
    delhiveryResult?.package?.[0] ||
    null

  const awb =
    packageData?.waybill ||
    packageData?.awb ||
    delhiveryResult?.waybill ||
    ''

  order.delhiveryAwb = awb
  order.delhiveryStatus = packageData?.status || 'Manifested'
  order.delhiveryShipmentCreated = true
  order.delhiveryShipmentError = ''
  order.delhiveryLastUpdated = new Date()

  await order.save()

  console.log('Delhivery AWB saved:', awb)

} catch (delhiveryError) {
  console.error(
    'Delhivery shipment creation failed:',
    delhiveryError
  )

  order.delhiveryShipmentCreated = false
  order.delhiveryShipmentError =
    delhiveryError?.message || 'Shipment creation failed'

  await order.save()
}


       res.status(201).json({ ok: true, orderId: order.orderId, viewToken: order.viewToken })
  } catch (err) {
    console.error('verify failed:', err)
    res.status(500).json({ error: 'Could not confirm the order.' })
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
