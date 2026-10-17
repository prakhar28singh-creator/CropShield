import { Link } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesColumnIncreasing,
  ClipboardPlus,
  Layers3,
  LayoutDashboard,
  ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../auth'

const ACTIONS = [
  {
    to: '/register',
    title: 'Register a crop batch',
    body: 'Add a recent harvest and get a crop-condition risk assessment.',
    cta: 'Add a batch',
    icon: ClipboardPlus,
    className: 'farmer-action-primary',
  },
  {
    to: '/batches',
    title: 'Review your batches',
    body: 'Open saved harvest details and revisit previous assessments.',
    cta: 'View batches',
    icon: Layers3,
  },
  {
    to: '/market',
    title: 'Open your dashboard',
    body: 'See an overview of your registered crops and available guidance.',
    cta: 'View dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/finder',
    title: 'Compare mandi prices',
    body: 'Browse prices by crop and location. No account is needed.',
    cta: 'Explore prices',
    icon: ChartNoAxesColumnIncreasing,
  },
]

const STEPS = [
  {
    number: '01',
    title: 'Add harvest details',
    body: 'Enter the crop, quantity, harvest date and storage conditions.',
    icon: ClipboardPlus,
  },
  {
    number: '02',
    title: 'Review crop risk',
    body: 'See a rules-based risk score, the factors behind it and storage guidance.',
    icon: ShieldCheck,
  },
  {
    number: '03',
    title: 'Compare next steps',
    body: 'Review mandi prices and sell-or-store estimates before you decide.',
    icon: ChartNoAxesColumnIncreasing,
  },
]

export default function FarmerHome() {
  const { farmer } = useAuth()
  const name = farmer?.name?.trim() || 'Farmer'
  const firstName = name.split(/\s+/)[0]
  const place = [farmer?.village, farmer?.district, farmer?.state].filter(Boolean).join(', ')

  return (
    <div className="farmer-home">
      <section className="farmer-welcome">
        <div className="farmer-welcome-copy">
          <div className="farmer-eyebrow">Your CropShield workspace</div>
          <h1>Good to see you, {firstName}.</h1>
          <p>
            Keep your harvest details in one place, understand storage risk and compare
            your selling options before making a decision.
          </p>
          <div className="farmer-welcome-actions">
            <Link to="/register" className="farmer-primary-link">
              Register a crop batch <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link to="/batches" className="farmer-secondary-link">View your batches</Link>
          </div>
        </div>
        <aside className="farmer-profile">
          <div className="farmer-avatar">{name.charAt(0).toUpperCase()}</div>
          <div className="farmer-profile-copy">
            <span className="farmer-profile-label">Signed in as</span>
            <strong>{name}</strong>
            <span className="farmer-idsub">{place || 'Farmer account'}</span>
          </div>
          <span className="farmer-profile-status"><span /> Active</span>
        </aside>
      </section>

      <section className="farmer-actions-section" aria-labelledby="farmer-actions-title">
        <div className="farmer-section-heading">
          <div>
            <span className="farmer-section-eyebrow">GET STARTED</span>
            <h2 id="farmer-actions-title">What would you like to do?</h2>
            <p>Choose a task to continue. Your batches and assessments stay linked to your account.</p>
          </div>
        </div>
        <div className="farmer-actions-grid">
          {ACTIONS.map(({ to, title, body, cta, icon: Icon, className = '' }) => (
            <Link key={to} to={to} className={`farmer-action-card ${className}`}>
              <span className="farmer-action-icon"><Icon size={20} strokeWidth={1.8} aria-hidden="true" /></span>
              <span className="farmer-action-title">{title}</span>
              <span className="farmer-action-body">{body}</span>
              <span className="farmer-action-cta">
                {cta}<ArrowUpRight size={16} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="farmer-workflow" aria-labelledby="farmer-workflow-title">
        <div className="farmer-workflow-heading">
          <span className="farmer-section-eyebrow">A CLEAR PROCESS</span>
          <h2 id="farmer-workflow-title">From harvest details to a considered decision</h2>
          <p>CropShield makes the inputs and assumptions visible, so you can judge the guidance for yourself.</p>
        </div>
        <div className="farmer-workflow-grid">
          {STEPS.map(({ number, title, body, icon: Icon }) => (
            <article className="farmer-workflow-step" key={number}>
              <div className="farmer-workflow-step-top">
                <span className="farmer-workflow-icon"><Icon size={19} strokeWidth={1.8} aria-hidden="true" /></span>
                <span className="farmer-workflow-number">{number}</span>
              </div>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
        <div className="farmer-data-note">
          <span className="farmer-data-note-mark">i</span>
          <p><strong>A note on prices:</strong> Mandi prices are currently sample data. Use them as a guide, and verify with your local market before selling.</p>
          <Link to="/finder">Browse prices <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
      </section>
    </div>
  )
}
