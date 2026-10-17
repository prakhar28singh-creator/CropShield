import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth'
import FarmerHome from './FarmerHome'
import { LocalizedContent } from '../i18n'

const BENEFITS = [
  { icon: 'leaf', title: 'Reduce post-harvest loss', body: 'Get practical storage guidance to help protect your crop.' },
  { icon: 'coins', title: 'Compare market prices', body: 'Explore mandi prices by crop and location.' },
  { icon: 'shield', title: 'Make informed decisions', body: 'Review risk and sell-or-store estimates together.' },
  { icon: 'people', title: 'Designed for farmers', body: 'Clear tools for small and growing farm businesses.' },
]

const STEPS = [
  { icon: 'plant', title: 'Enter crop details', body: 'Add the crop, harvest date and storage conditions.' },
  { icon: 'search', title: 'Review crop risk', body: 'See a spoilage-risk estimate and storage guidance.' },
  { icon: 'chart', title: 'Compare mandi prices', body: 'Explore sample prices across crops and locations.' },
  { icon: 'calculator', title: 'Check your options', body: 'Compare selling now with a storage scenario.' },
  { icon: 'person', title: 'Save and track', body: 'Create an account to keep your batches and reports.' },
]

const PRICES = [
  { crop: 'Tomato', market: 'Nashik, Maharashtra', min: '₹1,200', max: '₹1,800', modal: '₹1,500' },
  { crop: 'Potato', market: 'Indore, Madhya Pradesh', min: '₹1,000', max: '₹1,500', modal: '₹1,250' },
  { crop: 'Onion', market: 'Pune, Maharashtra', min: '₹1,400', max: '₹2,100', modal: '₹1,750' },
  { crop: 'Chilli', market: 'Guntur, Andhra Pradesh', min: '₹2,800', max: '₹3,600', modal: '₹3,200' },
]

function Icon({ name, size = 22 }) {
  const shared = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  const paths = {
    leaf: <><path d="M19.5 4.5c-8 0-13 3.7-13 9.1a5.9 5.9 0 0 0 5.9 5.9c5.4 0 7.1-7 7.1-15Z" /><path d="M4 21c2.4-4.1 5.8-7.4 11-10.3" /></>,
    lightning: <path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z" />,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19 13.5a7.5 7.5 0 0 0 0-3l1.7-1.3-1.8-3.1-2 .7a7.7 7.7 0 0 0-2.6-1.5L14 3h-4l-.3 2.3A7.7 7.7 0 0 0 7 6.8l-2-.7-1.8 3.1L5 10.5a7.5 7.5 0 0 0 0 3l-1.8 1.3L5 18l2-.7a7.7 7.7 0 0 0 2.6 1.5L10 21h4l.3-2.3a7.7 7.7 0 0 0 2.6-1.5l2 .7 1.8-3.1L19 13.5Z" transform="translate(-1 -1) scale(1.08)" /></>,
    coins: <><ellipse cx="12" cy="6" rx="7.5" ry="3" /><path d="M4.5 6v5c0 1.7 3.4 3 7.5 3 .7 0 1.4 0 2-.1" /><path d="M4.5 11v5c0 1.7 3.4 3 7.5 3" /><path d="M19.5 11v2M19.5 16v4M17 18h5" /></>,
    shield: <><path d="m12 3 8 3v5.5c0 4.5-3.3 7.8-8 9.5-4.7-1.7-8-5-8-9.5V6l8-3Z" /><path d="m8.5 12 2.3 2.3 4.8-5" /></>,
    people: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.4-3.2 2.2-5 5.5-5s5.1 1.8 5.5 5" /><path d="M16 5.5a3 3 0 0 1 0 5.8M17 14c2.2.4 3.4 2.1 3.6 5" /></>,
    plant: <><path d="M12 21v-8" /><path d="M12 14c-4.8 0-7-2.6-7-7 4.6 0 7 2.2 7 7Z" /><path d="M12 11c0-4 2.1-6 6-6 0 3.8-1.8 6-6 6Z" /><path d="M6 21h12" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /><path d="M8.5 11h4.6M10.8 8.7v4.6" /></>,
    chart: <><path d="M4 19.5h16" /><path d="M6.5 16v-4M11 16V7M15.5 16v-6M20 16V4" /></>,
    calculator: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 7h8v3H8zM8.5 14h.1M12 14h.1M15.5 14h.1M8.5 17.5h.1M12 17.5h.1M15.5 17.5h.1" /></>,
    person: <><circle cx="12" cy="7" r="3.5" /><path d="M4.5 21c.4-4.1 3-6.5 7.5-6.5s7.1 2.4 7.5 6.5" /></>,
    arrow: <><path d="M5 12h13" /><path d="m13 6 6 6-6 6" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3.5 9h17M3.5 15h17M12 3c2.2 2.4 3.2 5.4 3.2 9s-1 6.6-3.2 9c-2.2-2.4-3.2-5.4-3.2-9S9.8 5.4 12 3Z" /></>,
  }

  return <svg {...shared}>{paths[name] || paths.leaf}</svg>
}

export default function Home() {
  const { farmer } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (location.hash !== '#how-it-works') return
    document.getElementById('how-it-works')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    })
  }, [location.hash])

  if (farmer) return <FarmerHome />

  const handleScenePointerMove = event => {
    if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width
    const y = (event.clientY - bounds.top) / bounds.height
    event.currentTarget.style.setProperty('--scene-rotate-x', `${(0.5 - y) * 1.5}deg`)
    event.currentTarget.style.setProperty('--scene-rotate-y', `${(x - 0.5) * 2}deg`)
    event.currentTarget.style.setProperty('--scene-shift-x', `${(x - 0.5) * 5}px`)
    event.currentTarget.style.setProperty('--scene-shift-y', `${(y - 0.5) * 4}px`)
  }

  const resetScenePointer = event => {
    event.currentTarget.style.setProperty('--scene-rotate-x', '0deg')
    event.currentTarget.style.setProperty('--scene-rotate-y', '0deg')
    event.currentTarget.style.setProperty('--scene-shift-x', '0px')
    event.currentTarget.style.setProperty('--scene-shift-y', '0px')
  }

  return (
    <LocalizedContent>
      <div className="landing landing-reference">
        <section className="landing-hero landing-reference-hero" onPointerMove={handleScenePointerMove} onPointerLeave={resetScenePointer}>
          <div className="landing-reference-scene" aria-hidden="true">
            <img src="/cropshield-hero.jpg" alt="" fetchPriority="high" />
          </div>
          <div className="landing-reference-copy">
            <span className="landing-reference-kicker">Smarter decisions. Healthier crops. Better returns.</span>
            <h1>Protect your crops.<br /><span>Secure your future.</span></h1>
            <p>Get crop-specific storage guidance, explore mandi prices, and compare your selling options — all in one place.</p>
            <div className="landing-reference-actions">
              <Link to="/finder" className="landing-reference-primary"><Icon name="chart" size={17} /> Check mandi prices <Icon name="arrow" size={16} /></Link>
              <Link to="/auth" className="landing-reference-secondary"><Icon name="shield" size={17} /> Protect my crops <Icon name="arrow" size={16} /></Link>
            </div>
            <div className="landing-reference-note">
              <span><Icon name="lightning" size={15} /> Prices are available to browse without an account</span>
              <span><Icon name="person" size={15} /> Sign in to save crop batches and assessments</span>
            </div>
          </div>
          <div className="landing-reference-preview" aria-label="Illustrative sample crop assessment">
            <div className="landing-reference-preview-top">
              <span className="landing-reference-icon"><Icon name="coins" size={18} /></span>
              <span><b>Sample crop outlook</b><small>Illustrative values · not live prices</small></span>
              <span className="landing-reference-badge">DEMO</span>
            </div>
            <div className="landing-reference-preview-crop">Tomato <span>·</span> 100 kg</div>
            <div className="landing-reference-preview-row"><span>Sell today</span><b>₹1,965</b></div>
            <div className="landing-reference-preview-row"><span>Store for 7 days</span><b>₹2,186</b></div>
            <div className="landing-reference-preview-verdict"><Icon name="shield" size={16} /> Review storage risk before deciding</div>
          </div>
          <div className="landing-hero-cards" aria-label="CropShield tools">
            <article className="landing-hero-tool landing-hero-tool-prices">
              <span className="landing-hero-tool-icon"><Icon name="coins" size={18} /></span>
              <span><b>Mandi prices</b><small>Explore sample market data</small></span>
              <Icon name="chart" size={17} />
            </article>
            <article className="landing-hero-tool landing-hero-tool-storage">
              <span className="landing-hero-tool-icon"><Icon name="leaf" size={18} /></span>
              <span><b>Storage guidance</b><small>Practical crop care</small></span>
            </article>
            <article className="landing-hero-tool landing-hero-tool-risk">
              <span className="landing-hero-tool-icon"><Icon name="shield" size={18} /></span>
              <span><b>Risk assessment</b><small>Understand crop conditions</small></span>
            </article>
            <article className="landing-hero-tool landing-hero-tool-action">
              <span className="landing-hero-tool-icon"><Icon name="arrow" size={18} /></span>
              <span><b>Compare options</b><small>Sell now or review storage</small></span>
            </article>
          </div>
          <span className="landing-reference-sun" aria-hidden="true" />
          <span className="landing-reference-ground" aria-hidden="true" />
        </section>

        <section className="landing-benefits" aria-label="CropShield benefits">
          {BENEFITS.map((benefit, index) => (
            <article className={`landing-benefit landing-benefit-${index + 1}`} key={benefit.title}>
              <span className="landing-benefit-icon"><Icon name={benefit.icon} size={23} /></span>
              <h2>{benefit.title}</h2>
              <p>{benefit.body}</p>
            </article>
          ))}
        </section>

        <section className="landing-crops">
          <div className="landing-crops-heading">
            <span className="landing-section-eyebrow">Built for Indian harvests</span>
            <h2>Support for the crops you grow</h2>
          </div>
          <div className="landing-crop-list">
            {['Tomato', 'Potato', 'Onion', 'Chilli', 'Brinjal'].map((crop, index) => (
              <span className="landing-crop" key={crop}><span className={`landing-crop-dot crop-${index + 1}`} />{crop}</span>
            ))}
            <span className="landing-crops-more">More crops available</span>
          </div>
        </section>

        <section className="landing-why" id="why-cropshield">
          <div className="landing-why-copy">
            <span className="landing-section-eyebrow"><Icon name="leaf" size={15} /> Why CropShield?</span>
            <h2>Better information for healthier crops and higher returns.</h2>
            <p>From a crop-risk assessment to mandi comparisons, CropShield brings practical post-harvest information together so you can make a more informed decision.</p>
            <div className="landing-why-grid">
              {BENEFITS.map((benefit, index) => (
                <article className="landing-why-point" key={benefit.title}>
                  <span className={`landing-why-icon landing-why-icon-${index + 1}`}><Icon name={benefit.icon} size={18} /></span>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.body}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="landing-why-art">
            <div className="landing-why-photo"><img src="/cropshield-field.png" alt="Crop rows at sunset" /></div>
            <div className="landing-why-leaf landing-why-leaf-one" aria-hidden="true" />
            <div className="landing-why-leaf landing-why-leaf-two" aria-hidden="true" />
            <div className="landing-why-mini-card">
              <span className="landing-why-mini-icon"><Icon name="leaf" size={17} /></span>
              <span><b>Storage guidance</b><small>Review the conditions around your crop</small></span>
              <Icon name="arrow" size={15} />
            </div>
          </div>
        </section>

        <section className="landing-process" id="how-it-works">
          <div className="landing-process-heading">
            <span className="landing-section-eyebrow"><Icon name="settings" size={15} /> How it works</span>
            <h2>Simple steps. Clearer decisions.</h2>
            <p>From your crop details to a decision you can review and understand.</p>
          </div>
          <div className="landing-steps">
            {STEPS.map((step, index) => (
              <article className="landing-step" key={step.title}>
                <span className={`landing-step-icon landing-step-icon-${index + 1}`}><Icon name={step.icon} size={22} /></span>
                <span className="landing-step-number">{index + 1}</span>
                {index < STEPS.length - 1 && <span className="landing-step-arrow"><Icon name="arrow" size={18} /></span>}
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
          <Link to="/how-it-works" className="landing-process-link">Explore the full workflow and architecture <Icon name="arrow" size={15} /></Link>
        </section>

        <section className="landing-market-section" id="mandi-prices">
          <div className="landing-market-copy">
            <span className="landing-section-eyebrow"><Icon name="coins" size={15} /> Mandi price explorer</span>
            <h2>Compare markets. Plan your next move.</h2>
            <p>Explore crop prices by state, district and mandi. Current prices shown in CropShield are sample data, not live market rates.</p>
            <Link to="/finder" className="landing-reference-primary">View mandi prices <Icon name="arrow" size={16} /></Link>
          </div>
          <div className="landing-price-card">
            <div className="landing-price-card-top">
              <div><span className="landing-price-pulse" /><b>Sample mandi prices</b></div>
              <span className="landing-price-demo">DEMO DATA</span>
            </div>
            <div className="landing-price-tabs" aria-hidden="true"><span className="active">Tomato</span><span>Potato</span><span>Onion</span><span>Chilli</span></div>
            <div className="landing-price-table-wrap">
              <table className="landing-price-table">
                <thead><tr><th>Crop</th><th>Market</th><th>Min (₹/q)</th><th>Max (₹/q)</th><th>Modal (₹/q)</th></tr></thead>
                <tbody>
                  {PRICES.map(row => (
                    <tr key={row.crop}><td>{row.crop}</td><td>{row.market}</td><td>{row.min}</td><td>{row.max}</td><td><b>{row.modal}</b></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="landing-price-foot"><span>Illustrative sample values only · verify rates locally before selling.</span><Link to="/finder">Explore markets <Icon name="arrow" size={14} /></Link></div>
          </div>
          <div className="landing-produce-art" aria-hidden="true">
            <div className="landing-produce-spark">Better information.<br /><b>More confident decisions.</b><i /></div>
            <div className="landing-produce-crate">
              <span className="landing-produce tomato" /><span className="landing-produce tomato tomato-two" /><span className="landing-produce tomato tomato-three" />
              <span className="landing-produce tomato tomato-four" /><span className="landing-produce tomato tomato-five" />
            </div>
          </div>
        </section>

        <section className="landing-final-cta">
          <div><span className="landing-section-eyebrow">Take the next step</span><h2>Make your next harvest decision with confidence.</h2><p>Explore sample mandi data, or create a farmer account to save crop batches and review assessments.</p></div>
          <div className="landing-final-actions"><Link to="/auth" className="landing-reference-primary">Get started <Icon name="arrow" size={16} /></Link><Link to="/about" className="landing-final-link">Learn about CropShield</Link><Link to="/contact" className="landing-final-link">Contact us</Link></div>
        </section>
      </div>
    </LocalizedContent>
  )
}
