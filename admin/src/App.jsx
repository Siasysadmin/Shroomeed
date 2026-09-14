import { useState } from 'react'
import './App.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('shroomeed_admin_auth') === 'true'
  })
  const [activeTab, setActiveTab] = useState('main-reviews')

  const handleLogout = () => {
    localStorage.removeItem('shroomeed_admin_auth')
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>ShrooMEED Admin</h2>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-btn active">Review Management</button>
          <button className="nav-btn">Orders (Locked)</button>
          <button className="nav-btn">Customers (Locked)</button>
          <button className="nav-btn">Products (Locked)</button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <h1>Manage Reviews</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="user-profile">Admin User</div>
            <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: '500' }}>Log Out</button>
          </div>
        </header>

        <div className="content-wrapper">
          <div className="tabs">
            <button 
              className={`tab-btn ${activeTab === 'main-reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('main-reviews')}
            >
              Main Page Reviews
            </button>
            <button 
              className={`tab-btn ${activeTab === 'home-videos' ? 'active' : ''}`}
              onClick={() => setActiveTab('home-videos')}
            >
              Home & Shop Videos
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'main-reviews' && <MainReviewsForm />}
            {activeTab === 'home-videos' && <HomeVideosForm />}
          </div>
        </div>
      </main>
    </div>
  )
}

function Login({ onLogin }) {
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
      setError('Invalid credentials. Check username or password, or click the 1-Click Login button below.')
    }
  }

  const handleAutoFillAndLogin = () => {
    setUsername('user-admin@shroomeed.management')
    setPassword('shroomeed@admin')
    localStorage.setItem('shroomeed_admin_auth', 'true')
    onLogin()
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <span className="login-brand-tag">ShrooMEED Dashboard</span>
          <h2>Admin Login</h2>
          <p>Sign in to manage reviews, videos, and orders.</p>
        </div>
        
        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form className="admin-form" onSubmit={handleLogin}>
          <div className="form-group">
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

          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
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
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="form-actions" style={{ marginTop: '24px', paddingTop: '16px' }}>
            <button type="submit" className="submit-btn" style={{ width: '100%' }}>
              Sign In
            </button>
          </div>
        </form>

        <div className="quick-fill-box">
          <span className="quick-fill-label">Authorized Credentials</span>
          <div className="quick-fill-creds">
            <strong>User:</strong> user-admin@shroomeed.management<br />
            <strong>Pass:</strong> shroomeed@admin
          </div>
          <button 
            type="button" 
            className="quick-fill-btn" 
            onClick={handleAutoFillAndLogin}
          >
            One-Click Login as Admin
          </button>
        </div>
      </div>
    </div>
  )
}

function MainReviewsForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    
    const formData = new FormData(e.target)
    
    try {
      const res = await fetch('http://localhost:5000/api/reviews', {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        setSuccess(true)
        e.target.reset()
      } else {
        alert('Failed to save review')
      }
    } catch (err) {
      alert('Error connecting to server. Is the backend running?')
    }
    setLoading(false)
  }

  return (
    <div className="form-card">
      <div className="form-header">
        <h2>Add Main Page Review</h2>
        <p className="form-desc">Manage reviews shown on the dedicated /reviews page.</p>
      </div>
      
      {success && (
        <div style={{ background: '#ecfdf5', color: '#047857', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontWeight: '500' }}>
          ✅ Review successfully saved to database!
        </div>
      )}

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Customer Name</label>
            <input type="text" name="name" placeholder="e.g. Jane Doe" required />
          </div>
          
          <div className="form-group">
            <label>Role / Title</label>
            <input type="text" name="role" placeholder="e.g. Marathon Runner" />
          </div>
        </div>

        <div className="form-group">
          <label>Redirect Link (Optional)</label>
          <input type="url" name="redirectUrl" placeholder="e.g. https://instagram.com/p/..." />
          <span className="input-hint">If provided, clicking the review will redirect here.</span>
        </div>

        <div className="form-group">
          <label>Cover Photo</label>
          <div className="file-upload-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="upload-icon"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <div className="upload-text">
              <span className="upload-link">Click to upload</span> or drag and drop
            </div>
            <p className="upload-hint">SVG, PNG, JPG or GIF (max. 5MB)</p>
            <input type="file" name="image" accept="image/*" className="file-input" required />
          </div>
        </div>

        <div className="form-group">
          <label>Text-Based Review (Quote)</label>
          <textarea name="quote" rows="4" placeholder="Enter the text review here..." required></textarea>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Save Review'}
          </button>
        </div>
      </form>
    </div>
  )
}

function HomeVideosForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    
    const formData = new FormData(e.target)
    
    try {
      const res = await fetch('http://localhost:5000/api/showcase-videos', {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        setSuccess(true)
        e.target.reset()
      } else {
        alert('Failed to save video')
      }
    } catch (err) {
      alert('Error connecting to server. Is the backend running?')
    }
    setLoading(false)
  }

  return (
    <div className="form-card">
      <div className="form-header">
        <h2>Add Showcase Video</h2>
        <p className="form-desc">Manage videos for the split-layout section on Home and Shop pages.</p>
      </div>
      
      {success && (
        <div style={{ background: '#ecfdf5', color: '#047857', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontWeight: '500' }}>
          ✅ Video successfully saved to database!
        </div>
      )}

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Customer Name</label>
            <input type="text" name="name" placeholder="e.g. David B." required />
          </div>
          
          <div className="form-group">
            <label>Role / Title</label>
            <input type="text" name="role" placeholder="e.g. High Performer" />
          </div>
        </div>

        <div className="form-group">
          <label>Upload Video File</label>
          <div className="file-upload-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="upload-icon"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
            <div className="upload-text">
              <span className="upload-link">Click to upload</span> or drag and drop
            </div>
            <p className="upload-hint">MP4, WebM or OGG (max. 50MB)</p>
            <input type="file" name="video" accept="video/*" className="file-input" required />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload & Save Video'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default App
