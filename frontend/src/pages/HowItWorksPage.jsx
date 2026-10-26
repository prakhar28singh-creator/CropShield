import { Link } from 'react-router-dom'
import {
  ArrowDown,
  ArrowRight,
  ChartNoAxesCombined,
  ClipboardCheck,
  Database,
  FileText,
  Leaf,
  LockKeyhole,
  Server,
  ShieldAlert,
  Sprout,
  Warehouse,
} from 'lucide-react'
import { LocalizedContent } from '../i18n'

const FARMER_STEPS = [
  {
    icon: ClipboardCheck,
    title: 'Describe your harvest',
    body: 'Choose a crop, enter harvest date and quantity, and record your storage method, temperature, humidity, and visible condition.',
  },
  {
    icon: ShieldAlert,
    title: 'Review spoilage risk',
    body: 'Crop-specific rules estimate a Low, Medium, or High risk and show which recorded conditions contributed to the score.',
  },
  {
    icon: ChartNoAxesCombined,
    title: 'Compare market options',
    body: 'Official feed prices are shown when available; clearly labeled prototype prices are used only as a fallback.',
  },
  {
    icon: Warehouse,
    title: 'Compare sell or store',
    body: 'The decision engine compares selling now with an illustrative storage scenario, including expected loss and storage costs.',
  },
  {
    icon: FileText,
    title: 'Save and revisit',
    body: 'Your account stores batches and assessment history so you can review the report and recalculate an estimate.',
  },
]

const PUBLIC_STEPS = [
  ['Choose a crop and location', 'Select state, district, crop, and optionally a mandi.'],
  ['Browse sample mandi data', 'Review market rows, price ranges, arrivals, and displayed price dates.'],
  ['Use as a starting point', 'Prices are illustrative only; confirm today’s rates with the market before selling.'],
]

const ARCHITECTURE = [
  {
    icon: Sprout,
    label: 'React web app',
    detail: 'Public price search, farmer forms, reports, and dashboard',
    className: 'how-architecture-client',
  },
  {
    icon: Server,
    label: 'FastAPI service',
    detail: 'Validates requests, authenticates farmers, and coordinates calculations',
    className: 'how-architecture-api',
  },
  {
    icon: ShieldAlert,
    label: 'Risk engine',
    detail: 'Transparent rules for crop, storage, time, and recorded conditions',
    className: 'how-architecture-engine',
  },
  {
    icon: ChartNoAxesCombined,
    label: 'Market service',
    detail: 'Official data.gov.in daily mandi prices with a labeled prototype fallback',
    className: 'how-architecture-engine',
  },
  {
    icon: Warehouse,
    label: 'Decision engine',
    detail: 'Compares risk-adjusted sell-now and store scenarios',
    className: 'how-architecture-engine',
  },
  {
    icon: Database,
    label: 'SQLite storage',
    detail: 'Persists farmer accounts, crop batches, and saved assessments',
    className: 'how-architecture-data',
  },
]

export default function HowItWorksPage() {
  return (
    <LocalizedContent>
      <div className="page-body how-page">
        <section className="how-hero">
          <div className="how-hero-copy">
            <span className="how-eyebrow"><Sprout size={15} /> CropShield workflow</span>
            <h1>From harvest details to a clearer next step.</h1>
            <p>See how CropShield organizes crop-risk guidance, mandi market information, and sell-or-store estimates in one reviewable flow.</p>
            <div className="how-hero-actions">
              <Link to="/auth" className="how-primary-link">Start a crop assessment <ArrowRight size={16} /></Link>
              <Link to="/finder" className="how-secondary-link">Browse mandi prices</Link>
            </div>
          </div>
          <div className="how-hero-visual">
            <img src="/cropshield-hero.jpg" alt="Sunrise over a cultivated field" />
            <div className="how-photo-caption"><Leaf size={17} /><span><b>Plan after harvest</b><small>Understand the inputs behind each estimate</small></span></div>
          </div>
        </section>

        <section className="how-section">
          <div className="how-section-heading">
            <span className="how-eyebrow">FOR FARMERS</span>
            <h2>Your crop assessment, step by step</h2>
            <p>Each stage adds context to the report. Recommendations are estimates, not guarantees.</p>
          </div>
          <div className="how-farmer-flow">
            {FARMER_STEPS.map(({ icon: Icon, title, body }, index) => (
              <article className="how-flow-card" key={title}>
                <div className={`how-flow-icon how-flow-icon-${index + 1}`}><Icon size={22} /></div>
                <span className="how-flow-number">0{index + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
                {index < FARMER_STEPS.length - 1 && <ArrowRight className="how-flow-arrow" size={19} aria-hidden="true" />}
              </article>
            ))}
          </div>
          <div className="how-flow-outcome">
            <div className="how-outcome-mark"><ClipboardCheck size={20} /></div>
            <span><b>Assessment report</b><small>Risk grade, reasons, storage actions, market comparison, and calculation assumptions</small></span>
            <ArrowDown className="how-outcome-arrow" size={18} aria-hidden="true" />
          </div>
        </section>

        <section className="how-public-section">
          <div className="how-public-photo">
            <img src="/cropshield-field.png" alt="Rows of crops growing in a farm field" loading="lazy" />
          </div>
          <div className="how-public-copy">
            <span className="how-eyebrow">OPEN MARKET EXPLORER</span>
            <h2>Price browsing is open to everyone</h2>
            <p>No account is needed to explore sample prices by crop and location. Farmer registration is only needed to save batches and view assessments.</p>
            <ol className="how-public-steps">
              {PUBLIC_STEPS.map(([title, body]) => (
                <li key={title}><b>{title}</b><span>{body}</span></li>
              ))}
            </ol>
            <Link to="/finder" className="how-inline-link">Open Mandi Price Finder <ArrowRight size={15} /></Link>
          </div>
        </section>

        <section className="how-architecture-section">
          <div className="how-section-heading">
            <span className="how-eyebrow">UNDER THE HOOD</span>
            <h2>How the application pieces connect</h2>
            <p>The diagram shows the current prototype architecture and where its estimates come from.</p>
          </div>
          <div className="how-architecture">
            <div className="how-architecture-lane">
              {ARCHITECTURE.slice(0, 2).map(({ icon: Icon, label, detail, className }) => (
                <article className={`how-architecture-card ${className}`} key={label}>
                  <span className="how-architecture-icon"><Icon size={21} /></span>
                  <div><h3>{label}</h3><p>{detail}</p></div>
                </article>
              ))}
            </div>
            <div className="how-architecture-connector"><span /><ArrowDown size={17} /><span /></div>
            <div className="how-architecture-engine-grid">
              {ARCHITECTURE.slice(2, 5).map(({ icon: Icon, label, detail, className }) => (
                <article className={`how-architecture-card ${className}`} key={label}>
                  <span className="how-architecture-icon"><Icon size={21} /></span>
                  <div><h3>{label}</h3><p>{detail}</p></div>
                </article>
              ))}
            </div>
            <div className="how-architecture-connector"><span /><ArrowDown size={17} /><span /></div>
            <article className={`how-architecture-card how-architecture-card-storage ${ARCHITECTURE[5].className}`}>
              <span className="how-architecture-icon"><Database size={21} /></span>
              <div><h3>{ARCHITECTURE[5].label}</h3><p>{ARCHITECTURE[5].detail}</p></div>
              <LockKeyhole size={17} className="how-storage-lock" aria-hidden="true" />
            </article>
            <p className="how-architecture-caption">In production, the frontend and API are deployed separately. The API requires persistent storage for the SQLite database.</p>
          </div>
        </section>

        <aside className="how-honesty-note">
          <span className="how-honesty-icon"><ShieldAlert size={19} /></span>
          <div><b>Important: estimates use rules and source-labeled prices</b><p>Official feed prices are used when available; prototype samples are clearly labeled when the feed is unavailable. Risk logic and price outlooks are not field-validated predictions. Check actual storage conditions and current local prices before acting.</p></div>
        </aside>
      </div>
    </LocalizedContent>
  )
}
