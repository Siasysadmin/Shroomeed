import { useCallback, useEffect, useMemo, useState } from 'react'
import { API_URL, api, mediaUrl } from '../lib/api'
import './Admin.css'

/**
 * The dashboard.
 *
 * The sidebar used to list three sections that existed only as the word
 * "(Locked)" — dead affordances that told the operator nothing. It now lists
 * the four things this panel can actually do, and each one is a real view:
 *
 *   Reviews     publish a card to the wall, or take one down
 *   Videos      the split-layout clips on Home and Shop
 *   Questions   what visitors asked from the FAQ page, and who asked it
 *   Visibility  which review sections the storefront is currently showing
 */

const SECTIONS = [
  { id: 'orders', label: 'Orders', heading: 'Orders' },
  { id: 'reviews', label: 'Reviews', heading: 'Manage Reviews' },
  { id: 'videos', label: 'Showcase Videos', heading: 'Manage Videos' },
  { id: 'questions', label: 'FAQ Questions', heading: 'Questions from visitors' },
  { id: 'visibility', label: 'Section Visibility', heading: 'Section Visibility' },
]

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem('shroomeed_admin_token'))
  })
  const [section, setSection] = useState('orders')
  const [newCount, setNewCount] = useState(0)

  /** The sidebar badge is the reason to open the Questions tab at all. */
  const refreshNewCount = useCallback(() => {
    api
      .get('/api/questions?status=new')
      .then((rows) => setNewCount(Array.isArray(rows) ? rows.length : 0))
      .catch(() => setNewCount(0))
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    refreshNewCount()
  }, [isAuthenticated, refreshNewCount])

  const handleLogout = () => {
      localStorage.removeItem('shroomeed_admin_token')
    localStorage.removeItem('shroomeed_admin_auth')
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />
  }

  const current = SECTIONS.find((entry) => entry.id === section) || SECTIONS[0]

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>ShrooMEED Admin</h2>
        </div>
        <nav className="admin-sidebar-nav">
          {SECTIONS.map((entry) => (
            <button
              key={entry.id}
              className={`admin-nav-btn ${section === entry.id ? 'active' : ''}`}
              onClick={() => setSection(entry.id)}
            >
              {entry.label}
              {entry.id === 'questions' && newCount > 0 && (
                <span className="admin-badge">{newCount}</span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      <main className="admin-main-content">
        <header className="admin-topbar">
          <h1>{current.heading}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="admin-user-profile">Admin User</div>
            <button
              onClick={handleLogout}
              style={{ background: 'transparent', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', fontWeight: '500', fontSize: '0.95rem' }}
            >
              Log Out
            </button>
          </div>
        </header>

        <div className="admin-content-wrapper">
                    {section === 'orders' && <OrdersPanel onUnauthorized={handleLogout} />}
          {section === 'reviews' && <ReviewsPanel />}
          {section === 'videos' && <VideosPanel />}
          {section === 'questions' && <QuestionsPanel onChange={refreshNewCount} />}
          {section === 'visibility' && <VisibilityPanel />}
        </div>
      </main>
    </div>
  )
}

/* ------------------------------------------------------------------ login */

function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

   const [loading, setLoading] = useState(false)

  const loginWith = async (email, pass) => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: pass }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.token) throw new Error(data?.error || 'Login failed.')
      localStorage.setItem('shroomeed_admin_token', data.token)
      onLogin()
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Could not reach the server. It may be waking up — try again in 30 seconds.'
          : err.message,
      )
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (e) => {
    if (e) e.preventDefault()
    loginWith(username, password)
  }

 

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <span className="admin-login-brand-tag">ShrooMEED Dashboard</span>
          <h2>Admin Login</h2>
          <p>Sign in to manage reviews, videos, and website content.</p>
        </div>

        {error && (
          <div className="admin-login-error">
            {error}
          </div>
        )}

        <form className="admin-form" onSubmit={handleLogin}>
          <div className="admin-form-group">
            <label>Username / Email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Email"
              autoComplete="username"
              required
            />
          </div>

          <div className="admin-form-group">
            <label>Password</label>
            <div className="admin-password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="admin-form-actions" style={{ marginTop: '24px', paddingTop: '16px' }}>
                       <button type="submit" className="admin-submit-btn" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </div>
        </form>

      
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- reviews */

/**
 * The four kinds of card the wall can show.
 *
 * The admin picks the kind first and the form then asks for exactly what that
 * kind needs — a video card asks for a clip, a text card does not ask for a
 * file at all. One form that showed every field at once could be filled in
 * ways the wall cannot render (a "video card" with no video), so the choice
 * comes first and the server checks the same rule again on arrival.
 */
const REVIEW_TYPES = [
  {
    id: 'text',
    label: 'Text',
    hint: 'A written review. No media — the words carry the card.',
  },
  {
    id: 'image',
    label: 'Photo + text',
    hint: 'A photo with the name and, if you add it, the review text over it.',
  },
  {
    id: 'video',
    label: 'Video + text',
    hint: 'A clip that plays on the wall. Add a poster frame to control the still.',
  },
  {
    id: 'instagram',
    label: 'Instagram post',
    hint: 'Paste the post link, pull its cover in, and the card opens the post.',
  },
]

const EMPTY_FIELDS = { name: '', role: '', quote: '' }

/**
 * A local preview for a file the admin just picked, revoked when it changes.
 *
 * The url is derived during the render rather than set from an effect, so it
 * is always in step with the file it belongs to. Held in state it lagged by a
 * render: clearing the file left the old url behind for one pass, and the
 * preview — which reads `file.name` — rendered against a file that was
 * already gone.
 */
function useObjectUrl(file) {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file])

  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url]
  )

  return url
}

function ReviewsPanel() {
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('all')
  const [busyId, setBusyId] = useState(null)

  // the composer
  const [type, setType] = useState('text')
  const [fields, setFields] = useState(EMPTY_FIELDS)
  const [imageFile, setImageFile] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [posterFile, setPosterFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(null)
  const [notice, setNotice] = useState(null)

  // Instagram cover lookup
  const [postUrl, setPostUrl] = useState('')
  const [cover, setCover] = useState(null) // { image, title, source }
  const [fetching, setFetching] = useState(false)
  const [coverError, setCoverError] = useState('')

  const imagePreview = useObjectUrl(imageFile)
  const videoPreview = useObjectUrl(videoFile)
  const posterPreview = useObjectUrl(posterFile)

  const load = useCallback(() => {
    api.get('/api/reviews').then((data) => setRows(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  useEffect(load, [load])

  const set = (key) => (event) => setFields((prev) => ({ ...prev, [key]: event.target.value }))

  const resetForm = () => {
    setFields(EMPTY_FIELDS)
    setImageFile(null)
    setVideoFile(null)
    setPosterFile(null)
    setPostUrl('')
    setCover(null)
    setCoverError('')
    setProgress(null)
  }

  /** Switching kind clears what the new kind cannot use, and keeps the words. */
  const chooseType = (next) => {
    setType(next)
    setNotice(null)
    setCoverError('')
    if (next !== 'video') {
      setVideoFile(null)
      setPosterFile(null)
    }
    if (next === 'text') setImageFile(null)
    if (next !== 'instagram') {
      setCover(null)
      setPostUrl('')
    }
  }

  /**
   * Paste a post link, get its cover back. The server does the reading and
   * saves a local copy, so what lands in the form is a file we own rather
   * than a signed CDN url that expires.
   */
  const fetchCover = async () => {
    const url = postUrl.trim()
    if (!url) return
    setFetching(true)
    setCoverError('')
    setCover(null)
    try {
      const data = await api.get(`/api/post-preview?url=${encodeURIComponent(url)}`)
      setCover(data)
      setImageFile(null)
    } catch (err) {
      setCoverError(err.message)
    }
    setFetching(false)
  }

  /** The same rule the server enforces, said early enough to be useful. */
  const validate = () => {
    if (!fields.name.trim()) return 'Add the reviewer’s name.'
    if (type === 'text' && !fields.quote.trim()) return 'A text card needs the review text.'
    if (type === 'image' && !imageFile) return 'Choose a photo for this card.'
    if (type === 'video' && !videoFile) return 'Choose a video file for this card.'
    if (type === 'instagram') {
      if (!/^https?:\/\//i.test(postUrl.trim())) return 'Paste the full post link, starting with https://'
      if (!cover?.image && !imageFile) return 'Fetch the post’s cover, or upload one yourself.'
    }
    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const problem = validate()
    if (problem) {
      setNotice({ tone: 'bad', text: problem })
      return
    }

    const data = new FormData()
    data.set('type', type)
    data.set('name', fields.name.trim())
    data.set('role', fields.role.trim())
    data.set('quote', fields.quote.trim())

    if (type === 'image' && imageFile) data.set('image', imageFile)
    if (type === 'video') {
      data.set('video', videoFile)
      if (posterFile) data.set('poster', posterFile)
    }
    if (type === 'instagram') {
      data.set('redirectUrl', postUrl.trim())
      if (imageFile) {
        data.set('image', imageFile)
      } else if (cover?.image) {
        // an auto-fetched cover travels as a path, not a file
        data.set('image', cover.image)
        data.set('coverSource', cover.source || postUrl.trim())
      }
    }

    setLoading(true)
    setNotice(null)
    setProgress(0)
    try {
      await api.upload('/api/reviews', data, setProgress)
      setNotice({ tone: 'ok', text: 'Published — it is now the first card on the wall.' })
      resetForm()
      load()
    } catch (err) {
      setNotice({ tone: 'bad', text: err.message })
      setProgress(null)
    }
    setLoading(false)
  }

  const remove = async (row) => {
    const what = row.video ? 'review and its video' : 'review'
    if (!window.confirm(`Delete this ${what}? This cannot be undone.`)) return
    setBusyId(row._id)
    try {
      await api.del(`/api/reviews/${row._id}`)
      setRows((prev) => prev.filter((entry) => entry._id !== row._id))
      setNotice({ tone: 'ok', text: 'Review deleted.' })
    } catch (err) {
      setNotice({ tone: 'bad', text: err.message })
    }
    setBusyId(null)
  }

  const chosen = REVIEW_TYPES.find((entry) => entry.id === type) || REVIEW_TYPES[0]
  const visible = filter === 'all' ? rows : rows.filter((row) => row.type === filter)
  const countOf = (id) => (id === 'all' ? rows.length : rows.filter((row) => row.type === id).length)

  return (
    <>
      <div className="admin-form-card">
        <div className="admin-form-header">
          <h2>Add Review</h2>
          <p className="admin-form-desc">
            Pick what kind of card this is. Published reviews appear at the top of the
            wall — newest first.
          </p>
        </div>

        {notice && <Notice notice={notice} />}

        <div className="admin-tabs" role="tablist" aria-label="Card type">
          {REVIEW_TYPES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={type === entry.id}
              className={`admin-tab-btn ${type === entry.id ? 'active' : ''}`}
              onClick={() => chooseType(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>
        <p className="admin-type-hint">{chosen.hint}</p>

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label htmlFor="rv-name">Customer Name</label>
              <input
                id="rv-name"
                type="text"
                value={fields.name}
                onChange={set('name')}
                placeholder="e.g. Jane Doe"
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="rv-role">Role / Title</label>
              <input
                id="rv-role"
                type="text"
                value={fields.role}
                onChange={set('role')}
                placeholder="e.g. Marathon Runner"
              />
            </div>
          </div>

          {/* ---- photo ---- */}
          {type === 'image' && (
            <div className="admin-form-group">
              <label>Photo</label>
              {imagePreview ? (
                <MediaPreview
                  onClear={() => setImageFile(null)}
                  title={imageFile.name}
                  meta={`${(imageFile.size / (1024 * 1024)).toFixed(1)} MB`}
                >
                  <img src={imagePreview} alt="Selected" />
                </MediaPreview>
              ) : (
                <FilePicker
                  accept="image/*"
                  onPick={setImageFile}
                  icon="image"
                  hint="JPG, PNG or WebP — up to 10MB"
                />
              )}
            </div>
          )}

          {/* ---- video ---- */}
          {type === 'video' && (
            <>
              <div className="admin-form-group">
                <label>Video file</label>
                {videoPreview ? (
                  <MediaPreview
                    onClear={() => setVideoFile(null)}
                    title={videoFile.name}
                    meta={`${(videoFile.size / (1024 * 1024)).toFixed(1)} MB`}
                  >
                    <video src={videoPreview} muted playsInline controls preload="metadata" />
                  </MediaPreview>
                ) : (
                  <FilePicker
                    accept="video/*"
                    onPick={setVideoFile}
                    icon="video"
                    hint="MP4, WebM or MOV — up to 200MB"
                  />
                )}
              </div>

              <div className="admin-form-group">
                <label>Poster frame <span className="admin-optional">optional</span></label>
                {posterPreview ? (
                  <MediaPreview
                    onClear={() => setPosterFile(null)}
                    title={posterFile.name}
                    meta="Shown before the clip plays"
                  >
                    <img src={posterPreview} alt="Poster" />
                  </MediaPreview>
                ) : (
                  <FilePicker
                    accept="image/*"
                    onPick={setPosterFile}
                    icon="image"
                    hint="Leave empty to use the video’s own first frame"
                  />
                )}
              </div>
            </>
          )}

          {/* ---- instagram ---- */}
          {type === 'instagram' && (
            <div className="admin-form-group">
              <label htmlFor="rv-link">Instagram / Post Link</label>
              <div className="admin-inline-row">
                <input
                  id="rv-link"
                  type="url"
                  placeholder="https://www.instagram.com/p/..."
                  value={postUrl}
                  onChange={(event) => setPostUrl(event.target.value)}
                />
                <button
                  type="button"
                  className="admin-secondary-btn"
                  onClick={fetchCover}
                  disabled={fetching || !postUrl.trim()}
                >
                  {fetching ? 'Fetching…' : 'Fetch cover'}
                </button>
              </div>
              <span className="admin-input-hint">
                Clicking the card opens this link. Press <strong>Fetch cover</strong> to pull the
                post’s image in automatically — or upload one below if Instagram refuses.
              </span>

              {coverError && (
                <div style={{ marginTop: '12px' }}>
                  <Notice notice={{ tone: 'bad', text: coverError }} />
                </div>
              )}

              {cover?.image && !imageFile && (
                <div style={{ marginTop: '12px' }}>
                  <MediaPreview
                    onClear={() => setCover(null)}
                    title="Cover fetched"
                    meta={cover.title || 'This image will be used as the card cover.'}
                  >
                    <img src={mediaUrl(cover.image)} alt="Fetched cover" />
                  </MediaPreview>
                </div>
              )}

              {!cover?.image && (
                <div style={{ marginTop: '12px' }}>
                  {imagePreview ? (
                    <MediaPreview
                      onClear={() => setImageFile(null)}
                      title={imageFile.name}
                      meta="Uploaded cover"
                    >
                      <img src={imagePreview} alt="Selected cover" />
                    </MediaPreview>
                  ) : (
                    <FilePicker
                      accept="image/*"
                      onPick={setImageFile}
                      icon="image"
                      hint="Upload the cover yourself"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          <div className="admin-form-group">
            <label htmlFor="rv-quote">
              Review Text
              {type !== 'text' && <span className="admin-optional">optional</span>}
            </label>
            <textarea
              id="rv-quote"
              rows="4"
              value={fields.quote}
              onChange={set('quote')}
              placeholder="What did they say?"
            />
            <span className="admin-input-hint">
              {type === 'text'
                ? 'This is the card — write it as they said it.'
                : 'Sits under the name on the card. Leave it empty for media on its own.'}
            </span>
          </div>

          {loading && progress !== null && (
            <div className="admin-progress" role="status" aria-live="polite">
              <div className="admin-progress-track">
                <div className="admin-progress-bar" style={{ width: `${progress}%` }} />
              </div>
              <span>{progress < 100 ? `Uploading… ${progress}%` : 'Processing…'}</span>
            </div>
          )}

          <div className="admin-form-actions">
            <button type="submit" className="admin-submit-btn" disabled={loading}>
              {loading ? 'Publishing…' : 'Publish Review'}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-form-card">
        <div className="admin-form-header">
          <h2>Published ({rows.length})</h2>
          <p className="admin-form-desc">Newest first — the same order the wall uses.</p>
        </div>

        <div className="admin-tabs">
          {[{ id: 'all', label: 'All' }, ...REVIEW_TYPES].map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={`admin-tab-btn ${filter === entry.id ? 'active' : ''}`}
              onClick={() => setFilter(entry.id)}
            >
              {entry.label} ({countOf(entry.id)})
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="admin-empty">
            {rows.length === 0 ? 'Nothing published yet.' : 'No cards of this kind yet.'}
          </p>
        ) : (
          <ul className="admin-list">
            {visible.map((row) => (
              <li key={row._id} className="admin-list-row">
                <ReviewThumb row={row} />

                <div className="admin-list-body">
                  <strong>{row.name}</strong>
                  {row.role && <span className="admin-list-meta">{row.role}</span>}
                  {row.quote && <p className="admin-list-quote">{row.quote}</p>}
                  <span className="admin-list-meta">
                    <span className="admin-pill admin-pill--type">{row.type}</span>
                    {new Date(row.createdAt).toLocaleString()}
                  </span>
                  {row.redirectUrl && (
                    <a
                      className="admin-list-link"
                      href={row.redirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open the post ↗
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  className="admin-danger-btn"
                  disabled={busyId === row._id}
                  onClick={() => remove(row)}
                >
                  {busyId === row._id ? 'Deleting…' : 'Delete'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

/** The still that stands for a published card in the list. */
function ReviewThumb({ row }) {
  if (row.type === 'video' && row.video) {
    return (
      <video
        className="admin-list-thumb"
        src={mediaUrl(row.video)}
        poster={row.image ? mediaUrl(row.image) : undefined}
        muted
        playsInline
        preload="metadata"
      />
    )
  }
  if (row.image) return <img className="admin-list-thumb" src={mediaUrl(row.image)} alt="" />
  return <span className="admin-list-thumb admin-list-thumb--text">Aa</span>
}

/** A drop zone that reports what was picked instead of relying on form state. */
function FilePicker({ accept, onPick, icon, hint }) {
  return (
    <div className="admin-file-upload-box">
      {icon === 'video' ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="admin-upload-icon"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="admin-upload-icon"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
      )}
      <div className="admin-upload-text">
        <span className="admin-upload-link">Click to upload</span> or drag and drop
      </div>
      <p className="admin-upload-hint">{hint}</p>
      <input
        type="file"
        accept={accept}
        className="admin-file-input"
        onChange={(event) => onPick(event.target.files?.[0] || null)}
      />
    </div>
  )
}

/** What was picked, shown back, with one way to undo it. */
function MediaPreview({ children, title, meta, onClear }) {
  return (
    <div className="admin-cover-preview">
      {children}
      <div>
        <strong>{title}</strong>
        <p>{meta}</p>
        <button type="button" className="admin-link-btn" onClick={onClear}>
          Remove
        </button>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- videos */

function VideosPanel() {
  const [rows, setRows] = useState([])
  const [fields, setFields] = useState({ name: '', role: '' })
  const [videoFile, setVideoFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [notice, setNotice] = useState(null)

  const videoPreview = useObjectUrl(videoFile)

  const load = useCallback(() => {
    api.get('/api/showcase-videos').then((data) => setRows(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  useEffect(load, [load])

  const set = (key) => (event) => setFields((prev) => ({ ...prev, [key]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!fields.name.trim()) {
      setNotice({ tone: 'bad', text: 'Add the customer’s name.' })
      return
    }
    if (!videoFile) {
      setNotice({ tone: 'bad', text: 'Choose a video file to upload.' })
      return
    }

    const data = new FormData()
    data.set('name', fields.name.trim())
    data.set('role', fields.role.trim())
    data.set('video', videoFile)

    setLoading(true)
    setNotice(null)
    setProgress(0)
    try {
      await api.upload('/api/showcase-videos', data, setProgress)
      setNotice({ tone: 'ok', text: 'Video saved — it now leads the deck on Home and Shop.' })
      setFields({ name: '', role: '' })
      setVideoFile(null)
      setProgress(null)
      load()
    } catch (err) {
      setNotice({ tone: 'bad', text: err.message })
      setProgress(null)
    }
    setLoading(false)
  }

  const remove = async (row) => {
    if (!window.confirm('Delete this video? This cannot be undone.')) return
    setBusyId(row._id)
    try {
      await api.del(`/api/showcase-videos/${row._id}`)
      setRows((prev) => prev.filter((entry) => entry._id !== row._id))
      setNotice({ tone: 'ok', text: 'Video deleted.' })
    } catch (err) {
      setNotice({ tone: 'bad', text: err.message })
    }
    setBusyId(null)
  }

  return (
    <>
      <div className="admin-form-card">
        <div className="admin-form-header">
          <h2>Add Showcase Video</h2>
          <p className="admin-form-desc">
            The deck beside the headline on Home and Shop. Newest plays first, then
            it cycles. With nothing uploaded the section does not appear at all.
          </p>
        </div>

        {notice && <Notice notice={notice} />}

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label htmlFor="sv-name">Customer Name</label>
              <input
                id="sv-name"
                type="text"
                value={fields.name}
                onChange={set('name')}
                placeholder="e.g. David B."
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="sv-role">Role / Title</label>
              <input
                id="sv-role"
                type="text"
                value={fields.role}
                onChange={set('role')}
                placeholder="e.g. High Performer"
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label>Video file</label>
            {videoFile && videoPreview ? (
              <MediaPreview
                onClear={() => setVideoFile(null)}
                title={videoFile.name}
                meta={`${(videoFile.size / (1024 * 1024)).toFixed(1)} MB`}
              >
                <video src={videoPreview} muted playsInline controls preload="metadata" />
              </MediaPreview>
            ) : (
              <FilePicker
                accept="video/*"
                onPick={setVideoFile}
                icon="video"
                hint="MP4, WebM or MOV — up to 200MB. Portrait clips fit the frame best."
              />
            )}
          </div>

          {loading && progress !== null && (
            <div className="admin-progress" role="status" aria-live="polite">
              <div className="admin-progress-track">
                <div className="admin-progress-bar" style={{ width: `${progress}%` }} />
              </div>
              <span>{progress < 100 ? `Uploading… ${progress}%` : 'Processing…'}</span>
            </div>
          )}

          <div className="admin-form-actions">
            <button type="submit" className="admin-submit-btn" disabled={loading}>
              {loading ? 'Uploading…' : 'Upload & Save Video'}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-form-card">
        <div className="admin-form-header">
          <h2>Uploaded ({rows.length})</h2>
          <p className="admin-form-desc">Newest first — the order the deck plays them in.</p>
        </div>

        {rows.length === 0 ? (
          <p className="admin-empty">
            No videos yet, so the testimonial section is hidden on Home and Shop.
          </p>
        ) : (
          <ul className="admin-list">
            {rows.map((row) => (
              <li key={row._id} className="admin-list-row">
                <video
                  className="admin-list-thumb"
                  src={mediaUrl(row.videoUrl)}
                  poster={row.thumbnail ? mediaUrl(row.thumbnail) : undefined}
                  muted
                  playsInline
                  preload="metadata"
                />
                <div className="admin-list-body">
                  <strong>{row.name}</strong>
                  {row.role && <span className="admin-list-meta">{row.role}</span>}
                  <span className="admin-list-meta">{new Date(row.createdAt).toLocaleString()}</span>
                </div>
                <button
                  type="button"
                  className="admin-danger-btn"
                  disabled={busyId === row._id}
                  onClick={() => remove(row)}
                >
                  {busyId === row._id ? 'Deleting…' : 'Delete'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}


/* -------------------------------------------------------------- questions */

function QuestionsPanel({ onChange }) {
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('all')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    api.get('/api/questions').then((data) => setRows(Array.isArray(data) ? data : [])).catch(() => setRows([]))
  }, [])

  useEffect(load, [load])

  const update = async (id, patch) => {
    setBusy(true)
    try {
      await api.json(`/api/questions/${id}`, 'PATCH', patch)
      load()
      onChange?.()
    } catch {
      /* the row simply stays as it was */
    }
    setBusy(false)
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this question?')) return
    await api.del(`/api/questions/${id}`).catch(() => {})
    load()
    onChange?.()
  }

  const visible = filter === 'all' ? rows : rows.filter((row) => row.status === filter)

  return (
    <div className="admin-form-card">
      <div className="admin-form-header">
        <h2>Questions from visitors</h2>
        <p className="admin-form-desc">
          Submitted from the FAQ page. Every question carries the email address the
          visitor was signed in with, so you always know where to reply.
        </p>
      </div>

      <div className="admin-tabs">
        {['all', 'new', 'answered'].map((value) => (
          <button
            key={value}
            className={`admin-tab-btn ${filter === value ? 'active' : ''}`}
            onClick={() => setFilter(value)}
          >
            {value === 'all' ? 'All' : value === 'new' ? 'New' : 'Answered'}
            {' '}({value === 'all' ? rows.length : rows.filter((r) => r.status === value).length})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="admin-empty">Nothing here yet.</p>
      ) : (
        <ul className="admin-list">
          {visible.map((row) => (
            <li key={row._id} className="admin-list-row admin-list-row--stack">
              <div className="admin-q-head">
                <span className={`admin-pill ${row.status === 'new' ? 'admin-pill--new' : ''}`}>
                  {row.status}
                </span>
                <a className="admin-q-email" href={`mailto:${row.email}`}>{row.email}</a>
                {row.name && <span className="admin-list-meta">{row.name}</span>}
                <span className="admin-list-meta">{new Date(row.createdAt).toLocaleString()}</span>
              </div>

              <p className="admin-q-text">{row.question}</p>

              <div className="admin-q-actions">
                <a
                  className="admin-secondary-btn"
                  href={`mailto:${row.email}?subject=${encodeURIComponent('Re: your question about Daily Shield')}&body=${encodeURIComponent(`\n\n— \nYou asked: ${row.question}`)}`}
                >
                  Reply by email
                </a>
                <button
                  type="button"
                  className="admin-secondary-btn"
                  disabled={busy}
                  onClick={() => update(row._id, { status: row.status === 'new' ? 'answered' : 'new' })}
                >
                  Mark as {row.status === 'new' ? 'answered' : 'new'}
                </button>
                <button type="button" className="admin-danger-btn" onClick={() => remove(row._id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ------------------------------------------------------------- visibility */

const TOGGLES = [
  {
    key: 'showReviewsMain',
    label: 'Main reviews page',
    hint: 'The full wall of reviews at /reviews.',
  },
  {
    key: 'showReviewsHome',
    label: 'Home page review section',
    hint: 'The video testimonial section on the home page.',
  },
  {
    key: 'showReviewsShop',
    label: 'Shop page review section',
    hint: 'The video testimonial section on the product page.',
  },
]

function VisibilityPanel() {
  const [settings, setSettings] = useState(null)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    api.get('/api/settings').then(setSettings).catch(() => setNotice({ tone: 'bad', text: 'Could not load settings. Is the backend running?' }))
  }, [])

  const toggle = async (key) => {
    const next = { ...settings, [key]: !settings[key] }
    setSettings(next) // optimistic: the switch should move under the finger
    setNotice(null)
    try {
      const saved = await api.json('/api/settings', 'PUT', { [key]: next[key] })
      setSettings(saved)
      setNotice({ tone: 'ok', text: 'Saved. Reload the storefront to see the change.' })
    } catch (err) {
      setSettings(settings) // put it back
      setNotice({ tone: 'bad', text: err.message })
    }
  }

  if (!settings) {
    return (
      <div className="admin-form-card">
        {notice ? <Notice notice={notice} /> : <p className="admin-empty">Loading…</p>}
      </div>
    )
  }

  return (
    <div className="admin-form-card">
      <div className="admin-form-header">
        <h2>Section Visibility</h2>
        <p className="admin-form-desc">
          Turn a review section off to hide it from the live site. Content is kept —
          nothing is deleted, and switching it back on restores it exactly as it was.
        </p>
      </div>

      {notice && <Notice notice={notice} />}

      <ul className="admin-toggle-list">
        {TOGGLES.map((entry) => (
          <li key={entry.key} className="admin-toggle-row">
            <div>
              <strong>{entry.label}</strong>
              <p>{entry.hint}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(settings[entry.key])}
              className="admin-switch"
              data-on={settings[entry.key] ? 'true' : undefined}
              onClick={() => toggle(entry.key)}
            >
              <span className="admin-switch-thumb" />
              <span className="visually-hidden">{entry.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <p className="admin-input-hint" style={{ marginTop: '20px' }}>
        Backend: <code>{API_URL}</code>
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ bits */

function Notice({ notice }) {
  const ok = notice.tone === 'ok'
  return (
    <div
      style={{
        background: ok ? '#ecfdf5' : '#fef2f2',
        color: ok ? '#047857' : '#b91c1c',
        padding: '14px 16px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontWeight: 500,
        fontSize: '0.95rem',
      }}
    >
      {ok ? '✅ ' : '⚠️ '}
      {notice.text}
    </div>
  )
}



/* ----------------------------------------------------------------- orders */

const ORDER_STATUSES = ['Confirmed', 'Shipped', 'In Transit', 'Delivered', 'Cancelled']

async function adminFetch(path, options = {}) {
  const token = localStorage.getItem('shroomeed_admin_token') || ''
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return data
}

function OrdersPanel({ onUnauthorized }) {
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    adminFetch('/api/orders')
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setRows(list)
      })
      .catch((err) => {
        if (err.status === 401) onUnauthorized?.()
        else setError(err.message)
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const updateStatus = async (id, status) => {
    setSavingId(id)
    try {
      const updated = await adminFetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setRows((current) => current.map((row) => (row._id === id ? updated : row)))
    } catch (err) {
      if (err.status === 401) onUnauthorized?.()
      else window.alert(err.message)
    }
    setSavingId('')
  }

  const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
  const visible = filter === 'all' ? rows : rows.filter((row) => row.status === filter)
  const paidTotal = rows
    .filter((row) => row.paymentStatus === 'Paid' && row.status !== 'Cancelled')
    .reduce((sum, row) => sum + (row.totalAmount || 0), 0)

  return (
    <div className="admin-form-card">
      <div className="admin-form-header">
        <h2>Orders</h2>
        <p className="admin-form-desc">
          {rows.length} order{rows.length === 1 ? '' : 's'} · {money(paidTotal)} paid.
          Change the status as the parcel moves — the customer sees it on their My orders page.
        </p>
      </div>

      <div className="admin-tabs" style={{ flexWrap: 'wrap' }}>
        {['all', ...ORDER_STATUSES].map((value) => (
          <button
            key={value}
            className={`admin-tab-btn ${filter === value ? 'active' : ''}`}
            onClick={() => setFilter(value)}
          >
            {value === 'all' ? 'All' : value}
            {' '}({value === 'all' ? rows.length : rows.filter((r) => r.status === value).length})
          </button>
        ))}
        <button className="admin-tab-btn" onClick={load} disabled={loading} style={{ marginLeft: 'auto' }}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {error && <p className="admin-empty" role="alert">{error}</p>}

      {!error && !loading && visible.length === 0 && (
        <p className="admin-empty">No orders here yet.</p>
      )}

      {visible.length > 0 && (
        <ul className="admin-list">
          {visible.map((row) => (
            <li key={row._id} className="admin-list-row admin-list-row--stack">
              <div className="admin-q-head">
                <strong>{row.orderId}</strong>
                <span className={`admin-pill ${row.paymentStatus === 'Paid' ? 'admin-pill--new' : ''}`}>
                  {row.paymentStatus || 'Unknown'}
                </span>
                <span className="admin-list-meta">
                  {new Date(row.createdAt).toLocaleString('en-IN')}
                </span>
                <strong style={{ marginLeft: 'auto' }}>{money(row.totalAmount)}</strong>
              </div>

              <div className="admin-q-text">
                <div><strong>{row.customerName}</strong></div>
                <div style={{ marginTop: 4 }}>
                  <a className="admin-q-email" href={`tel:${row.customerPhone}`}>{row.customerPhone}</a>
                  {' · '}
                  <a className="admin-q-email" href={`mailto:${row.customerEmail}`}>{row.customerEmail}</a>
                </div>
                <div style={{ whiteSpace: 'pre-line', marginTop: 8 }}>{row.deliveryAddress}</div>
                <div style={{ marginTop: 8, opacity: 0.75 }}>
                  {(row.items || []).map((item) => `${item.title} × ${item.quantity}`).join(', ')}
                </div>
                {row.razorpayPaymentId && (
                  <div className="admin-list-meta" style={{ marginTop: 6 }}>
                    Payment ID: {row.razorpayPaymentId}
                  </div>
                )}
              </div>

              <div className="admin-q-actions">
                <label className="admin-list-meta" htmlFor={`status-${row._id}`}>Status</label>
                <select
                  id={`status-${row._id}`}
                  value={row.status}
                  disabled={savingId === row._id}
                  onChange={(e) => updateStatus(row._id, e.target.value)}
                  style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', font: 'inherit' }}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
