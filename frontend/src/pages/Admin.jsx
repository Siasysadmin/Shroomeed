import { useCallback, useEffect, useState } from 'react'
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
  { id: 'reviews', label: 'Reviews', heading: 'Manage Reviews' },
  { id: 'videos', label: 'Showcase Videos', heading: 'Manage Videos' },
  { id: 'questions', label: 'FAQ Questions', heading: 'Questions from visitors' },
  { id: 'visibility', label: 'Section Visibility', heading: 'Section Visibility' },
]

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('shroomeed_admin_auth') === 'true'
  })
  const [section, setSection] = useState('reviews')
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

  const handleLogin = (e) => {
    if (e) e.preventDefault()
    setError('')

    const cleanUser = username.trim().toLowerCase()
    const cleanPass = password.trim()

    const validUsers = [
      'user-admin@shroomeed.management',
      'admin@shroomeed.management',
      'admin',
      'user-admin'
    ]

    const validPasses = [
      'shroomeed@admin',
      'admin'
    ]

    if (validUsers.includes(cleanUser) && validPasses.includes(cleanPass)) {
      localStorage.setItem('shroomeed_admin_auth', 'true')
      onLogin()
    } else {
      setError('Invalid credentials. Check email & password, or use the 1-Click Login below.')
    }
  }

  const handleAutoFillAndLogin = () => {
    setUsername('user-admin@shroomeed.management')
    setPassword('shroomeed@admin')
    localStorage.setItem('shroomeed_admin_auth', 'true')
    onLogin()
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
              placeholder="user-admin@shroomeed.management"
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
            <button type="submit" className="admin-submit-btn" style={{ width: '100%' }}>
              Sign In
            </button>
          </div>
        </form>

        <div className="admin-quick-fill-box">
          <span className="admin-quick-fill-label">Authorized Credentials</span>
          <div className="admin-quick-fill-creds">
            <strong>User:</strong> user-admin@shroomeed.management<br />
            <strong>Pass:</strong> shroomeed@admin
          </div>
          <button
            type="button"
            className="admin-quick-fill-btn"
            onClick={handleAutoFillAndLogin}
          >
            One-Click Login as Admin
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- reviews */

function ReviewsPanel() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)

  // Instagram cover lookup
  const [postUrl, setPostUrl] = useState('')
  const [cover, setCover] = useState(null) // { image, title }
  const [fetching, setFetching] = useState(false)
  const [coverError, setCoverError] = useState('')

  const load = useCallback(() => {
    api.get('/api/reviews').then((data) => setRows(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  useEffect(load, [load])

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
    } catch (err) {
      setCoverError(err.message)
    }
    setFetching(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setNotice(null)

    const formData = new FormData(event.target)
    // An auto-fetched cover travels as a path, not a file.
    if (cover?.image && !formData.get('image')?.size) {
      formData.delete('image')
      formData.set('image', cover.image)
      formData.set('coverSource', cover.source || postUrl)
    }

    try {
      await api.form('/api/reviews', formData)
      setNotice({ tone: 'ok', text: 'Review published to the wall.' })
      event.target.reset()
      setCover(null)
      setPostUrl('')
      load()
    } catch (err) {
      setNotice({ tone: 'bad', text: err.message })
    }
    setLoading(false)
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return
    try {
      await api.del(`/api/reviews/${id}`)
      load()
    } catch (err) {
      setNotice({ tone: 'bad', text: err.message })
    }
  }

  return (
    <>
      <div className="admin-form-card">
        <div className="admin-form-header">
          <h2>Add Review</h2>
          <p className="admin-form-desc">
            Published reviews appear at the top of the wall — newest first.
          </p>
        </div>

        {notice && <Notice notice={notice} />}

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Customer Name</label>
              <input type="text" name="name" placeholder="e.g. Jane Doe" required />
            </div>

            <div className="admin-form-group">
              <label>Role / Title</label>
              <input type="text" name="role" placeholder="e.g. Marathon Runner" />
            </div>
          </div>

          <div className="admin-form-group">
            <label>Instagram / Post Link</label>
            <div className="admin-inline-row">
              <input
                type="url"
                name="redirectUrl"
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
              post’s image in automatically — no need to upload one.
            </span>
          </div>

          {coverError && <Notice notice={{ tone: 'bad', text: coverError }} />}

          {cover?.image && (
            <div className="admin-cover-preview">
              <img src={mediaUrl(cover.image)} alt="Fetched cover" />
              <div>
                <strong>Cover fetched</strong>
                <p>{cover.title || 'This image will be used as the card cover.'}</p>
                <button type="button" className="admin-link-btn" onClick={() => setCover(null)}>
                  Remove and upload manually
                </button>
              </div>
            </div>
          )}

          <div className="admin-form-group">
            <label>Card Type</label>
            <select name="type" className="admin-select" defaultValue="image">
              <option value="image">Photo card</option>
              <option value="video">Video card (shows a play button)</option>
              <option value="text">Text only</option>
            </select>
          </div>

          {!cover?.image && (
            <div className="admin-form-group">
              <label>Cover Photo</label>
              <div className="admin-file-upload-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="admin-upload-icon"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                <div className="admin-upload-text">
                  <span className="admin-upload-link">Click to upload</span> or drag and drop
                </div>
                <p className="admin-upload-hint">Leave empty for a text-only review</p>
                <input type="file" name="image" accept="image/*" className="admin-file-input" />
              </div>
            </div>
          )}

          <div className="admin-form-group">
            <label>Review Text</label>
            <textarea name="quote" rows="4" placeholder="What did they say?"></textarea>
            <span className="admin-input-hint">
              Required for a text card; optional caption on a photo or video card.
            </span>
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="admin-submit-btn" disabled={loading}>
              {loading ? 'Saving…' : 'Publish Review'}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-form-card">
        <div className="admin-form-header">
          <h2>Published ({rows.length})</h2>
          <p className="admin-form-desc">Newest first — the same order the wall uses.</p>
        </div>

        {rows.length === 0 ? (
          <p className="admin-empty">Nothing published yet.</p>
        ) : (
          <ul className="admin-list">
            {rows.map((row) => (
              <li key={row._id} className="admin-list-row">
                {row.image ? (
                  <img className="admin-list-thumb" src={mediaUrl(row.image)} alt="" />
                ) : (
                  <span className="admin-list-thumb admin-list-thumb--text">Aa</span>
                )}
                <div className="admin-list-body">
                  <strong>{row.name}</strong>
                  {row.role && <span className="admin-list-meta">{row.role}</span>}
                  {row.quote && <p className="admin-list-quote">{row.quote}</p>}
                  <span className="admin-list-meta">
                    {new Date(row.createdAt).toLocaleString()} · {row.type}
                  </span>
                </div>
                <button type="button" className="admin-danger-btn" onClick={() => remove(row._id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

/* ----------------------------------------------------------------- videos */

function VideosPanel() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null)

  const load = useCallback(() => {
    api.get('/api/showcase-videos').then((data) => setRows(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  useEffect(load, [load])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setNotice(null)
    try {
      await api.form('/api/showcase-videos', new FormData(event.target))
      setNotice({ tone: 'ok', text: 'Video saved.' })
      event.target.reset()
      load()
    } catch (err) {
      setNotice({ tone: 'bad', text: err.message })
    }
    setLoading(false)
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this video?')) return
    await api.del(`/api/showcase-videos/${id}`).catch(() => {})
    load()
  }

  return (
    <>
      <div className="admin-form-card">
        <div className="admin-form-header">
          <h2>Add Showcase Video</h2>
          <p className="admin-form-desc">The split-layout section on Home and Shop.</p>
        </div>

        {notice && <Notice notice={notice} />}

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>Customer Name</label>
              <input type="text" name="name" placeholder="e.g. David B." required />
            </div>

            <div className="admin-form-group">
              <label>Role / Title</label>
              <input type="text" name="role" placeholder="e.g. High Performer" />
            </div>
          </div>

          <div className="admin-form-group">
            <label>Upload Video File</label>
            <div className="admin-file-upload-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="admin-upload-icon"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
              <div className="admin-upload-text">
                <span className="admin-upload-link">Click to upload</span> or drag and drop
              </div>
              <p className="admin-upload-hint">MP4, WebM or OGG (max. 50MB)</p>
              <input type="file" name="video" accept="video/*" className="admin-file-input" required />
            </div>
          </div>

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
        </div>
        {rows.length === 0 ? (
          <p className="admin-empty">No videos yet.</p>
        ) : (
          <ul className="admin-list">
            {rows.map((row) => (
              <li key={row._id} className="admin-list-row">
                <div className="admin-list-body">
                  <strong>{row.name}</strong>
                  {row.role && <span className="admin-list-meta">{row.role}</span>}
                  <span className="admin-list-meta">{new Date(row.createdAt).toLocaleString()}</span>
                </div>
                <button type="button" className="admin-danger-btn" onClick={() => remove(row._id)}>
                  Delete
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
