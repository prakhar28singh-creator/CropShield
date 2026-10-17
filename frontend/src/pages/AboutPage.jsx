import { Link } from 'react-router-dom'
import { LocalizedContent } from '../i18n'

const PILLARS = [
  { icon: '1', title: 'Spoilage-risk first', body: 'Every batch gets a Low / Medium / High risk grade with exact reasons — heat, humidity, storage method, harvest age — plus practical steps to slow loss.' },
  { icon: '2', title: 'Mandi prices for all', body: 'Anyone can search mandi prices by state, district, crop and market — free, no login. Timestamped, with min / modal / max and arrivals.' },
  { icon: '3', title: 'Explainable decisions', body: 'Sell now, store safely, or move mandis? Net-return math per option with every assumption shown and uncertainty flagged — guidance, not guarantees.' },
  { icon: '4', title: 'Farmer accounts', body: 'A free account links every batch to you. Your batches, risk reports and history stay saved on your personal dashboard.' },
]

const STACK = [
  { t: 'React + CSS + JS', d: 'Homepage, guest price lookup, batch forms, risk screens, dashboard' },
  { t: 'Python + FastAPI', d: 'Validates, authenticates, routes to the three engines, returns JSON' },
  { t: 'Risk Engine', d: 'Crop-specific rules today; validated ML only when data allows' },
  { t: 'Market Service', d: 'AGMARKNET-style data with graceful SAMPLE fallback' },
  { t: 'Decision Engine', d: 'Fuses risk + prices + costs into net-return options' },
  { t: 'SQLite (prototype)', d: 'Farmers, batches, assessments, price snapshots, history' },
]

export default function AboutPage() {
  return (
    <LocalizedContent>
    <div className="page-body">
      <div className="about-hero">
        <div className="auth-eyebrow">ABOUT CROPSHIELD</div>
        <h1>Know your options<br />after the <span>harvest.</span></h1>
        <p>CropShield brings crop-condition checks, storage guidance and mandi-price comparisons together so farmers can review practical next steps. Risk scores use transparent rules; mandi prices are sample data today.</p>
        <div className="about-cta">
          <Link to="/finder" className="topnav-cta" style={{ textDecoration: 'none' }}>Check Mandi Prices</Link>
          <Link to="/auth" className="topnav-login" style={{ textDecoration: 'none' }}>Become a Farmer</Link>
        </div>
      </div>
      <div className="about-grid">
        {PILLARS.map(p => (
          <div key={p.title} className="about-card">
            <div className="about-ico">{p.icon}</div>
            <h3>{p.title}</h3><p>{p.body}</p>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-body">
          <div className="section-label">HOW IT WORKS — 500 KG TOMATO EXAMPLE</div>
          <ol className="about-flow">
            <li><b>Farmer enters</b> 500 kg tomato + harvest date + district + storage + temp/humidity + planned days.</li>
            <li><b>FastAPI validates</b> and calls the Risk Engine — HIGH risk + reasons + tips.</li>
            <li><b>Market Service</b> pulls mandi prices (or clearly-labelled SAMPLE data + timestamp).</li>
            <li><b>Decision Engine</b> computes net returns: sell now vs store vs other mandi.</li>
            <li><b>Dashboard shows</b> risk report, market compare and the recommended action with reasons.</li>
            <li><b>Registered farmers</b> save it — batches and history persist. Guests stop at viewing prices.</li>
          </ol>
        </div>
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-body">
          <div className="section-label">TECHNOLOGY STACK</div>
          <div className="about-stack">
            {STACK.map(s => (
              <div key={s.t} className="about-stack-item"><b>{s.t}</b><span>{s.d}</span></div>
            ))}
          </div>
        </div>
      </div>
      <div className="home-footer-note" style={{ marginTop: 18 }}>
        Honest scope: rule-based risk today (no fake AI claims), sample prices clearly labelled, weather optional.
        CropShield provides guidance, not guarantees — verify with your local market and extension officer.
      </div>
    </div>
    </LocalizedContent>
  )
}
