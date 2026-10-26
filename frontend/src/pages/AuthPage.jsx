import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { registerFarmer, loginFarmer, getMarketMeta } from '../api'
import { useAuth } from '../auth'
import { LocalizedContent } from '../i18n'

export default function AuthPage() {
  const [mode, setMode] = useState('register') // 'register' | 'login'
  const [form, setForm] = useState({ name: '', phone: '', password: '', village: '', state: '', district: '' })
  const [locations, setLocations] = useState([])
  const [locationsError, setLocationsError] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    getMarketMeta()
      .then(r => setLocations(r.data.states))
      .catch(() => setLocationsError('Could not load state and district options. You can still create an account without adding your location.'))
  }, [])

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError('') }

  const districts = locations.find(option => option.name === form.state)?.districts || []

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (mode === 'register' && !form.name.trim()) return setError('Please enter your full name.')
    if (!form.phone.trim() || form.phone.trim().length < 10) return setError('Enter a valid 10-digit phone number.')
    if (!form.password || (mode === 'register' && form.password.length < 8))
      return setError(mode === 'register' ? 'Password must be at least 8 characters.' : 'Enter your password.')
    if (form.password.length > 128) return setError('Password must be 128 characters or fewer.')
    setBusy(true)
    try {
      const res = mode === 'register'
        ? await registerFarmer(form)
        : await loginFarmer({ phone: form.phone.trim(), password: form.password })
      login(res.data.token, res.data.farmer)
      const requestedPage = location.state?.from
      const destination = requestedPage
        ? `${requestedPage.pathname}${requestedPage.search || ''}${requestedPage.hash || ''}`
        : mode === 'register' ? '/register' : '/'
      navigate(destination, { replace: true })
    } catch (err) {
      setError(err?.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <LocalizedContent>
    <div className="page-body">
      <div className="auth-wrap">
        <div className="auth-side">
          <div className="auth-eyebrow">CROPSHIELD · FARMER ACCOUNT</div>
          <h1>Track your harvest.<br /><span style={{ color: 'var(--primary)' }}>Compare your options.</span></h1>
          <p>Create an account to save crop batches, review spoilage-risk guidance, compare mandi prices
             and revisit sell-or-store calculations.</p>
          <ul className="auth-points">
            <li><b>✓</b> Rule-based risk checks for each batch</li>
            <li><b>✓</b> Saved batches and assessment history</li>
            <li><b>✓</b> Mandi prices remain open to everyone</li>
          </ul>
          <div className="auth-guest">
            Just browsing? <Link to="/finder">Check mandi prices without login →</Link>
          </div>
        </div>

        <div className="card auth-card">
          <div className="auth-tabs">
            <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError('') }}>Register</button>
            <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError('') }}>Login</button>
          </div>
          <div className="card-body">
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>
              {mode === 'register' ? 'Create farmer account' : 'Welcome back'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
              {mode === 'register'
                ? 'Register yourself before adding a crop batch.'
                : 'Log in to access your batches and dashboard.'}
            </div>
            <form onSubmit={submit}>
              {mode === 'register' && (
                <div className="form-group">
                  <label>Full name *</label>
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Ramesh Patil" />
                </div>
              )}
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label>Phone number *</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="10-digit mobile" inputMode="numeric" />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} />
                </div>
              </div>
              {mode === 'register' && (
                <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label>Village / Town</label>
                    <input value={form.village} onChange={e => set('village', e.target.value)} placeholder="e.g. Igatpuri" />
                  </div>
                  <div className="form-group">
                    <label>State / Union Territory</label>
                    <select value={form.state} onChange={e => { set('state', e.target.value); set('district', '') }}>
                      <option value="">Select state (optional)</option>
                      {locations.map(option => <option key={option.name} value={option.name}>{option.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>District</label>
                    <select value={form.district} onChange={e => set('district', e.target.value)} disabled={!form.state}>
                      <option value="">Select district (optional)</option>
                      {districts.map(district => <option key={district} value={district}>{district}</option>)}
                    </select>
                  </div>
                </div>
              )}
              {mode === 'register' && locationsError && <div className="alert alert-warn" role="status">{locationsError}</div>}
              {error && <div className="alert alert-crit" style={{ marginTop: 12 }}>{error}</div>}
              <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 16 }} disabled={busy}>
                {busy ? 'Please wait…' : mode === 'register' ? 'Register & continue' : 'Log in'}
              </button>
            </form>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 12, textAlign: 'center' }}>
              {mode === 'register'
                ? <>Already registered? <button className="link-btn" onClick={() => setMode('login')}>Login instead</button></>
                : <>New farmer? <button className="link-btn" onClick={() => setMode('register')}>Create account</button></>}
            </div>
          </div>
        </div>
      </div>
    </div>
    </LocalizedContent>
  )
}
