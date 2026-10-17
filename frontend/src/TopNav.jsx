import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from './auth'
import { LocalizedContent, useLanguage } from './i18n'

const I = {
  home: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg>),
  chart: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3v18h18" /><path d="M7 15v3M12 10v8M17 6v12" /></svg>),
  shield: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 5 6v5c0 5 3.4 8.4 7 9.5 3.6-1.1 7-4.5 7-9.5V6z" /><path d="m9.5 12 2 2 3.5-4" /></svg>),
  layers: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></svg>),
  grid: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>),
  user: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="3.5" /><path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" /></svg>),
  info: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><circle cx="12" cy="8" r="1" fill="currentColor" /></svg>),
}

const PUB = [
  { to: '/', end: true, icon: I.home, label: 'Home' },
  { to: '/finder', end: false, icon: I.chart, label: 'Mandi Prices' },
  { to: '/about', end: false, icon: I.info, label: 'About Us' },
]
const PVT = [
  { to: '/register', end: false, icon: I.shield, label: 'Register Crop' },
  { to: '/batches', end: false, icon: I.layers, label: 'My Batches' },
  { to: '/market', end: false, icon: I.grid, label: 'Dashboard' },
]

export default function TopNavbar() {
  const { farmer, logout } = useAuth()
  const { language, setLanguage } = useLanguage()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const out = () => { logout(); setOpen(false); navigate('/') }
  const links = farmer ? [...PUB, ...PVT] : PUB
  return (
    <LocalizedContent>
    <header className="topnav">
      <div className="topnav-inner">
        <NavLink to="/" className="topnav-brand" onClick={() => setOpen(false)}>
          <img className="topnav-brand-icon" src="/favicon.svg?v=2" alt="" />
          <div className="brand-text">
            <span className="brand-name">CropShield</span>
          </div>
        </NavLink>
        <nav className="topnav-links">
          {PUB.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => 'topnav-link' + (isActive ? ' active' : '')}>
              <span className="topnav-ico">{n.icon}</span>{n.label}
            </NavLink>
          ))}
          {farmer && <span className="topnav-sep" />}
          {farmer && PVT.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => 'topnav-link farmer' + (isActive ? ' active' : '')}>
              <span className="topnav-ico">{n.icon}</span>{n.label}
            </NavLink>
          ))}
        </nav>
        <div className="topnav-right">
          <div className="language-switch" role="group" aria-label="Choose language">
            <button type="button" className={language === 'en' ? 'active' : ''}
              aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>English</button>
            <button type="button" className={language === 'hi' ? 'active' : ''}
              aria-pressed={language === 'hi'} onClick={() => setLanguage('hi')}>हिन्दी</button>
          </div>
          {farmer ? (
            <><span className="topnav-user">{farmer.name.split(' ')[0]}</span>
              <button className="topnav-logout" onClick={out}>Logout</button></>
          ) : (
            <><NavLink to="/auth" className="topnav-login"><span className="topnav-ico">{I.user}</span>Farmer Login</NavLink>
              <NavLink to="/auth" className="topnav-cta">Get Started</NavLink></>
          )}
          <button className="topnav-burger" onClick={() => setOpen(o => !o)} aria-label="Menu">{open ? '✕' : '☰'}</button>
        </div>
      </div>
      {open && (
        <div className="topnav-mobile">
          {links.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}
              className={({ isActive }) => 'topnav-link' + (isActive ? ' active' : '')}>
              <span className="topnav-ico">{n.icon}</span>{n.label}
            </NavLink>
          ))}
          {!farmer && <NavLink to="/auth" onClick={() => setOpen(false)} className="topnav-link"><span className="topnav-ico">{I.user}</span>Farmer Login / Register</NavLink>}
          {farmer && <button className="topnav-logout" onClick={out}>Logout</button>}
        </div>
      )}
    </header>
    </LocalizedContent>
  )
}
