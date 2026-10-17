import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import FarmerHome from './FarmerHome'

const FACTS = [
  { value: 'Open access', label: 'Browse mandi prices without an account' },
  { value: 'Farmer account', label: 'Save crop batches and assessment history' },
  { value: 'Clear reasons', label: 'See the factors behind each risk score' },
  { value: 'Demo prices', label: 'Mandi price data is clearly labelled' },
];

const AUDIENCES = [
  {
    title: 'Farmers with a recent harvest',
    body: 'Record crop, harvest date and storage conditions to review spoilage risk and practical storage guidance.',
  },
  {
    title: 'Farmers deciding when to sell',
    body: 'Compare an estimate for selling now with a storage scenario, including expected crop loss and costs.',
  },
  {
    title: 'Anyone checking mandi prices',
    body: 'Explore mandi prices by crop and location without creating an account. Current prices are sample data.',
  },
];

const FEATURES = [
  { label: '01 · Risk', pub: false, tag: 'Farmers only',
    title: 'Will it spoil before you can sell it?',
    body: "Tell us the temperature and humidity your crop is sitting at, how it's stored and the day you cut it. You get a score out of 100, the exact reasons behind it — 'temperature 32°C is above the 0–4°C optimum' — and what to change today." },
  { label: '02 · Prices', pub: true, tag: 'Free, no login',
    title: 'What nearby mandis are actually paying',
    body: "Modal price first — then commission, weighing, loading and transport deducted, so you compare the rupees you'd really take home. Market by market, with distances, tagged as demo data for now." },
  { label: '03 · Verdict', pub: false, tag: 'Farmers only',
    title: 'Sell today, or store — and for how long',
    body: 'One recommendation for 7, 14 or 30 days of storage, with the seasonal outlook, recent momentum and a plain confidence label. Not convinced? Change the days and recalculate, and watch the maths respond.' },
];

const STEPS = [
  { n: '1', title: 'Tell us about the harvest',
    body: "Crop, kilograms, the day you cut it, how you're storing it, and the temperature where it's kept. That's all." },
  { n: '2', title: 'We run the numbers',
    body: 'Spoilage risk for your storage, prices across mandis, and what another 7, 14 or 30 days could do to both the price and your stock.' },
  { n: '3', title: 'You make the call',
    body: 'One recommendation, with every assumption listed underneath so you can check it yourself. Recalculate as often as you like.' },
];

export default function Home() {
  const { farmer } = useAuth();
  if (farmer) return <FarmerHome />;
  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-hero-text">
          <span className="landing-kicker">POST-HARVEST DECISIONS, MADE CLEARER</span>
          <h1>
            <span className="landing-title-brand">CropShield:</span>
            <span className="landing-title-main">Smart Post-Harvest Loss Prevention and Price Protection for Crops</span>
          </h1>
          <p className="landing-lead">
            Built for farmers managing a harvested crop. Check spoilage risk and storage conditions, compare
            mandi prices, and review sell-now versus store estimates before deciding your next step.
          </p>
          <div className="landing-cta">
            <Link to="/auth" className="landing-btn-primary">Assess your harvest</Link>
            <Link to="/finder" className="landing-btn-ghost">Explore mandi prices</Link>
          </div>
          <div className="landing-guest-note">Mandi prices are open to everyone. A free farmer account is required to save batches and view assessments.</div>
          <div className="landing-facts">
            {FACTS.map(f => (
              <div key={f.value} className="landing-fact">
                <div className="landing-fact-value">{f.value}</div>
                <div className="landing-fact-label">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="landing-hero-img">
          <img src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=900&q=80" alt="Young maize plants in dark soil" loading="eager" />
          <div className="landing-sample">
            <div className="landing-sample-top">
              <span className="landing-sample-chip">Sample batch</span>
              <span className="landing-sample-meta">Wheat · Nashik · 100 kg · gunny bag</span>
            </div>
            <div className="landing-sample-row"><span>Sell today</span><b>₹1,965</b></div>
            <div className="landing-sample-row"><span>Store 7 days</span><b>₹2,186</b></div>
            <div className="landing-sample-verdict">Store Safely <small>risk 25/100, low · demo data</small></div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--left landing-audience">
        <span className="landing-section-eyebrow">WHO IT'S FOR</span>
        <h2>Built for farmers making post-harvest decisions</h2>
        <p className="landing-section-sub">
          Farmers can review crop risk and sell-or-store estimates. Anyone can explore mandi prices without an account.
        </p>
        <div className="landing-audience-grid">
          {AUDIENCES.map((audience, index) => (
            <article className="landing-audience-card" key={audience.title}>
              <span className="landing-audience-index">0{index + 1}</span>
              <h3>{audience.title}</h3>
              <p>{audience.body}</p>
            </article>
          ))}
        </div>
      </section>

      <aside className="landing-aside">
        <p className="landing-aside-quote">“Wholesale mandi price ≠ what the farmer takes home.”</p>
        <p className="landing-aside-note">Commission, weighing, loading and transport come out of every sale — so we compare the net price you'd actually keep, market by market, not the headline number on the board.</p>
      </aside>

      <section className="landing-section landing-section--left">
        <h2>What it does, in plain terms</h2>
        <p className="landing-section-sub">Three jobs, done properly: a spoilage-risk check, honest net prices, and one clear sell-or-store call.</p>
        <div className="landing-grid">
          {FEATURES.map(f => (
            <div key={f.title} className={'landing-card' + (f.pub ? ' landing-card-pub' : '')}>
              <div className="landing-card-label">{f.label}</div>
              <h3>{f.title}</h3><p>{f.body}</p>
              <span className={'landing-tag' + (f.pub ? ' pub' : '')}>{f.tag}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="landing-section landing-section--left landing-how">
        <h2>How it works</h2>
        <p className="landing-section-sub">From harvest to a decision you can defend, in three steps.</p>
        <div className="landing-steps">
          {STEPS.map(s => (
            <div key={s.n} className="landing-step">
              <div className="landing-step-num">{s.n}</div>
              <h3>{s.title}</h3><p>{s.body}</p>
            </div>
          ))}
        </div>
        <div className="landing-access">
          <div className="landing-access-col pub">
            <div className="landing-access-title">Anyone can, without an account:</div>
            <ul><li>Browse this site and see how the tool works</li>
            <li>Check mandi prices by state, district and crop</li>
            <li>See price trends and compare markets</li></ul>
          </div>
          <div className="landing-access-col lock">
            <div className="landing-access-title">A free farmer account unlocks:</div>
            <ul><li>Registering as many crop batches as you need</li>
            <li>Spoilage-risk reports and storage guidance</li>
            <li>Sell-vs-store recommendations you can recalculate</li>
            <li>Your own dashboard and batch history</li></ul>
          </div>
        </div>
      </section>

      <section className="landing-honest">
        <h3>What's real, and what's a demo — plainly</h3>
        <p>The spoilage model, the seasonal price model and every rupee of arithmetic in a verdict run live
        on your batch. Mandi prices are currently <b>sample data</b> modelled on typical AGMARKNET ranges —
        every table carries a “Demo data” tag until live price feeds are connected. Trust the direction;
        treat the exact rupee as an estimate.</p>
        <span className="landing-honest-sign">— the CropShield team</span>
      </section>

      <section className="landing-cta-block">
        <h2>Try it with your own harvest</h2>
        <p>Create a free farmer account and register a batch in about three minutes — or look around today's sample mandi prices first, no sign-up needed.</p>
        <div className="landing-cta" style={{ justifyContent: 'center' }}>
          <Link to="/auth" className="landing-btn-primary">Register as a farmer</Link>
          <Link to="/finder" className="landing-btn-ghost">Check mandi prices</Link>
        </div>
        <div className="landing-fine">Prices shown are sample data for demonstration. CropShield gives guidance, not guarantees — verify with your local market and extension officer.</div>
      </section>
    </div>
  );
}
