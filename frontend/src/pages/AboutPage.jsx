import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, CircleDollarSign, ShieldCheck, UsersRound } from 'lucide-react'
import { LocalizedContent } from '../i18n'

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Understand crop risk',
    body: 'Review storage duration, temperature, humidity, storage method, and visible condition with clear reasons behind each risk grade.',
  },
  {
    icon: CircleDollarSign,
    title: 'Compare market options',
    body: 'Browse mandi prices by crop and location, then review net-return estimates alongside the assumptions used.',
  },
  {
    icon: BadgeCheck,
    title: 'Make informed decisions',
    body: 'Consider selling now, storing safely, or exploring another market. CropShield offers guidance, not guarantees.',
  },
  {
    icon: UsersRound,
    title: 'Keep harvest records',
    body: 'Farmer accounts keep crop batches and assessment history together in one place.',
  },
]

export default function AboutPage() {
  return (
    <LocalizedContent>
      <div className="page-body about-page">
        <section className="about-hero">
          <div className="auth-eyebrow">ABOUT CROPSHIELD</div>
          <h1>Know your options after the harvest.</h1>
          <p>CropShield brings crop-condition checks, storage guidance, and mandi-price comparisons together so farmers can review practical next steps. It uses official market-feed prices when available and clearly labels prototype samples used as a fallback.</p>
          <div className="about-cta">
            <Link to="/how-it-works" className="topnav-cta about-primary-link">See how it works <ArrowRight size={16} /></Link>
            <Link to="/finder" className="topnav-login about-secondary-link">Check mandi prices</Link>
          </div>
        </section>

        <section className="about-grid" aria-label="What CropShield offers">
          {PILLARS.map(({ icon: Icon, title, body }) => (
            <article key={title} className="about-card">
              <span className="about-pillar-icon"><Icon size={20} /></span>
              <h2>{title}</h2>
              <p>{body}</p>
            </article>
          ))}
        </section>

        <aside className="about-scope-note">
          <b>Prototype scope</b>
          <p>CropShield is a decision-support prototype. Fallback prices are illustrative, and risk guidance has not been validated against field outcomes. Confirm local conditions and market rates before acting.</p>
        </aside>
      </div>
    </LocalizedContent>
  )
}
