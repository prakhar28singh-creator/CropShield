import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { getDashboardSummary, getBatches, assessBatch, getMarketPrices } from '../api'
import { LocalizedContent, useLanguage } from '../i18n'

const CROP_BADGE = { tomato: 'bg-crit', potato: 'bg-warn', onion: 'bg-info', wheat: 'bg-ok' }
const STORAGE_RISK = { cold_storage: 'Low', ventilated_room: 'Low', open_room: 'Medium', bamboo_basket: 'High', gunny_bag: 'High' }
const CURRENT_TIME = Date.now()
const CURRENT_DATE = new Date(CURRENT_TIME)

function RiskDot({ level }) {
  const cls = level === 'High' ? 'badge-crit' : level === 'Medium' ? 'badge-warn' : 'badge-ok'
  return <span className={`badge ${cls}`}>{level}</span>
}

// Custom tooltip for charts
const ChartTooltip = ({ active, payload, label, prefix = '₹', suffix = '' }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '1px solid #DCE6DD', borderRadius: 6,
      padding: '8px 12px', fontSize: 12, boxShadow: '0 4px 12px rgba(32,51,41,0.08)'
    }}>
      <div style={{ color: '#607267', marginBottom: 3 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {prefix}{Number(p.value).toLocaleString('en-IN')}{suffix}
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { language } = useLanguage()
  const [summary, setSummary] = useState(null)
  const [batches, setBatches] = useState([])
  const [priceData, setPriceData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      getDashboardSummary(),
      getBatches(),
      getMarketPrices('tomato'),
      getMarketPrices('onion'),
      getMarketPrices('potato'),
    ]).then(([s, b, tomato, onion, potato]) => {
      setSummary(s.data)
      setBatches(b.data)  // keep full list for KPI totals; table renders top 5
      setPriceData({ tomato: tomato.data, onion: onion.data, potato: potato.data })
    }).catch(() => setError('Cannot reach the backend. Make sure the server is running on port 8000.'))
      .finally(() => setLoading(false))
  }, [])

  const handleAssess = async (id) => {
    try { await assessBatch(id); navigate(`/batches/${id}/result`) }
    catch { alert('Assessment failed. Please try again.') }
  }

  if (loading) return (
    <LocalizedContent>
    <div className="page-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
      <div className="spinner" />
      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Loading dashboard…</span>
    </div>
    </LocalizedContent>
  )

  if (error) return (
    <LocalizedContent>
    <div className="page-body">
      <div className="alert alert-crit" style={{ marginTop: 40 }}>{error}</div>
    </div>
    </LocalizedContent>
  )

  const prices = summary?.latest_prices || {}

  // Build bar chart data from latest prices
  const priceBarData = Object.entries(prices).map(([crop, info]) => ({
    crop: crop.charAt(0).toUpperCase() + crop.slice(1),
    price: info.modal_price,
  }))

  // Tomato trend for area chart
  const tomatoHistory = priceData.tomato?.price_history || []
  const onionHistory  = priceData.onion?.price_history  || []

  // Days since harvest for each batch
  const withDays = batches.map(b => {
    const days = Math.max(0, Math.round((CURRENT_TIME - new Date(b.harvest_date)) / 86400000))
    return { ...b, days_stored: days }
  })
  const recentBatches = withDays.slice(0, 5)

  // ── Portfolio-level insight numbers ──
  const totalKg = withDays.reduce((s, b) => s + (Number(b.quantity_kg) || 0), 0)
  const oldest = withDays.reduce((a, b) => (!a || b.days_stored > a.days_stored ? b : a), null)
  const noEnvData = withDays.filter(b => b.temperature_c == null || b.humidity_pct == null)
  // Best live price across tracked crops (by net modal today)
  const bestPrice = Object.entries(prices).reduce((best, [crop, info]) =>
    (!best || info.modal_price > best.price) ? { crop, price: info.modal_price, market: info.market } : best, null)

  const insights = []
  if (oldest && oldest.days_stored >= 3) {
    const level = oldest.days_stored > 5 ? 'tone-crit' : 'tone-warn'
    insights.push({
      level, ico: '1', title: 'Oldest batch needs attention',
      body: <><b style={{ textTransform: 'capitalize' }}>{oldest.crop}</b> has been stored for <b>{oldest.days_stored} days</b>. {oldest.days_stored > 5 ? 'Inspect it today and sell at the earliest opportunity.' : 'Plan its sale within the next 1–2 days.'}</>,
    })
  }
  if (noEnvData.length > 0) {
    insights.push({
      level: 'tone-warn', ico: '2', title: 'Incomplete storage readings',
      body: <><b>{noEnvData.length}</b> of <b>{withDays.length}</b> batches have no temperature/humidity logged — risk scores for these are less reliable.</>,
    })
  }
  if (bestPrice) {
    insights.push({
      level: 'tone-ok', ico: '3', title: 'Best mandi price today',
      body: <><b style={{ textTransform: 'capitalize' }}>{bestPrice.crop}</b> is at <b>₹{bestPrice.price}/qtl</b> in {bestPrice.market}. Worth prioritising if you hold this crop.</>,
    })
  }
  if ((summary?.high_risk_batches ?? 0) === 0 && withDays.length > 0) {
    insights.push({
      level: 'tone-ok', ico: '4', title: 'No immediate threats',
      body: <>All <b>{withDays.length}</b> batches are currently below high-risk threshold. Keep monitoring as storage days grow.</>,
    })
  }

  return (
    <LocalizedContent>
    <div className="page-body">

      {/* ── PAGE HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.015em', lineHeight: 1.2 }}>
            Operations Dashboard
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>
            Post-harvest monitoring · {CURRENT_DATE.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link to="/market" className="btn btn-secondary">View Markets</Link>
          <Link to="/register" className="btn btn-primary">+ Assess Crop</Link>
        </div>
      </div>

      {/* ── KPI ROW ── */}
      <div className="kpi-grid" style={{ marginBottom: 20 }}>
        <div className="kpi-card kpi-ok">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="kpi-label">Total Batches</div>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>#</div>
          </div>
          <div className="kpi-value">{summary?.total_batches ?? 0}</div>
          <div className="kpi-sub">Registered harvest batches</div>
        </div>

        <div className={`kpi-card ${(summary?.high_risk_batches ?? 0) > 0 ? 'kpi-danger' : 'kpi-ok'}`}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="kpi-label">High Risk</div>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: (summary?.high_risk_batches ?? 0) > 0 ? 'var(--crit-bg)' : 'var(--surface-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>!</div>
          </div>
          <div className="kpi-value" style={{ color: (summary?.high_risk_batches ?? 0) > 0 ? 'var(--crit-text)' : undefined }}>
            {summary?.high_risk_batches ?? 0}
          </div>
          <div className="kpi-sub">Require immediate action</div>
        </div>

        <div className={`kpi-card ${(summary?.medium_risk_batches ?? 0) > 0 ? 'kpi-warn' : 'kpi-neutral'}`}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="kpi-label">Medium Risk</div>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: (summary?.medium_risk_batches ?? 0) > 0 ? 'var(--warn-bg)' : 'var(--surface-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>i</div>
          </div>
          <div className="kpi-value" style={{ color: (summary?.medium_risk_batches ?? 0) > 0 ? 'var(--warn-text)' : undefined }}>
            {summary?.medium_risk_batches ?? 0}
          </div>
          <div className="kpi-sub">Monitor closely</div>
        </div>

        <div className="kpi-card kpi-danger">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="kpi-label">Est. Loss Value</div>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--crit-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>₹</div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--crit-text)', fontSize: 22 }}>
            ₹{((summary?.estimated_loss_inr ?? 0) / 1000).toFixed(1)}K
          </div>
          <div className="kpi-sub">{summary?.total_at_risk_kg ?? 0} kg produce at risk</div>
        </div>

        <div className="kpi-card kpi-ok">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="kpi-label">Produce Tracked</div>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>#</div>
          </div>
          <div className="kpi-value">{totalKg.toLocaleString('en-IN')}<span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-2)' }}> kg</span></div>
          <div className="kpi-sub">Across {withDays.length} registered batch{withDays.length !== 1 ? 'es' : ''}</div>
        </div>

        <div className="kpi-card kpi-neutral">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="kpi-label">Best Price Today</div>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>₹</div>
          </div>
          <div className="kpi-value" style={{ fontSize: 22, textTransform: 'capitalize' }}>
            {bestPrice ? `₹${bestPrice.price}` : '—'}
            {bestPrice && <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', textTransform: 'none' }}>/qtl</span>}
          </div>
          <div className="kpi-sub">
            {bestPrice ? `${bestPrice.crop} · ${bestPrice.market}` : 'No price data available'}
          </div>
        </div>
      </div>

      {/* ── ACTION CENTER — derived insights ── */}
      {insights.length > 0 && (
        <div className="insights-strip">
          {insights.map(ins => (
            <div key={ins.title} className={`insight ${ins.level}`}>
              <span className="insight-ico">{ins.ico}</span>
              <div>
                <div className="insight-title">{ins.title}</div>
                <div className="insight-body">{ins.body}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MAIN TWO-COLUMN ROW ── */}
      <div className="dash-split">

        {/* LEFT: Price trend area chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Mandi Price Trends</span>
            <span className="badge badge-demo">DEMO DATA</span>
          </div>
          <div className="card-body">
            {tomatoHistory.length > 1 ? (
              <>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10 }}>
                  Tomato modal price — last 14 days (₹/quintal)
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={tomatoHistory} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#276749" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#276749" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DCE6DD" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#607267' }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#607267' }} domain={['auto', 'auto']} axisLine={false} tickLine={false} width={40} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="modal_price" stroke="#276749" strokeWidth={2} fill="url(#greenGrad)" dot={false} name="Tomato" />
                  </AreaChart>
                </ResponsiveContainer>

                {onionHistory.length > 1 && (
                  <>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', margin: '14px 0 10px' }}>
                      Onion modal price — last 14 days (₹/quintal)
                    </div>
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={onionHistory} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#8C6200" stopOpacity={0.12} />
                            <stop offset="95%" stopColor="#8C6200" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#DCE6DD" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#607267' }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#607267' }} domain={['auto', 'auto']} axisLine={false} tickLine={false} width={40} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="modal_price" stroke="#8C6200" strokeWidth={2} fill="url(#amberGrad)" dot={false} name="Onion" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontSize: 13 }}>
                No price trend data available
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Market snapshot + Risk breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Market snapshot card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Market Snapshot</span>
            </div>
            <div style={{ padding: '4px 0' }}>
              {Object.entries(prices).map(([crop, info], i, arr) => (
                <div
                  key={crop}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 20px',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onClick={() => navigate('/market')}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={`badge ${CROP_BADGE[crop] || 'bg-ok'} crop-badge`}>{crop.charAt(0).toUpperCase() + crop.slice(1)}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', textTransform: 'capitalize' }}>{crop}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{info.market}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
                      ₹{info.modal_price}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)' }}>/quintal</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk breakdown */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Risk Overview</span>
            </div>
            <div className="card-body">
              {/* Risk donut-style bars */}
              {[
                { label: 'High Risk', val: summary?.high_risk_batches ?? 0, total: summary?.total_batches || 1, color: 'var(--crit-text)' },
                { label: 'Medium Risk', val: summary?.medium_risk_batches ?? 0, total: summary?.total_batches || 1, color: 'var(--warn-text)' },
                { label: 'Low / Unassessed', val: Math.max(0, (summary?.total_batches ?? 0) - (summary?.high_risk_batches ?? 0) - (summary?.medium_risk_batches ?? 0)), total: summary?.total_batches || 1, color: 'var(--primary)' },
              ].map(({ label, val, total, color }) => (
                <div key={label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{val}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${total > 0 ? (val / total) * 100 : 0}%`,
                      background: color, borderRadius: 9999,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Total produce at risk</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--crit-text)', fontVariantNumeric: 'tabular-nums' }}>
                  {summary?.total_at_risk_kg ?? 0} kg
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── PRICE BAR CHART ── */}
      {priceBarData.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">Modal Price Comparison by Crop</span>
            <span className="badge badge-demo">DEMO DATA</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={priceBarData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCE6DD" vertical={false} />
                <XAxis dataKey="crop" tick={{ fontSize: 12, fill: '#607267' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#607267' }} axisLine={false} tickLine={false} width={45} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="price" name="Modal Price" fill="#276749" radius={[4, 4, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── RECENT BATCHES TABLE ── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">📋 Recent Crop Batches</span>
          <Link to="/batches" className="btn btn-secondary btn-sm">View all</Link>
        </div>

        {withDays.length === 0 ? (
          <div className="card-body">
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.5 }}>•</div>
              <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 16 }}>No batches registered yet.</div>
              <Link to="/register" className="btn btn-primary">Register First Batch</Link>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Farmer</th>
                  <th>Quantity</th>
                  <th>Harvest Date</th>
                  <th>Days Stored</th>
                  <th>Storage</th>
                  <th>Location</th>
                  <th>Storage Risk</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentBatches.map(b => {
                  const sRisk = STORAGE_RISK[b.storage_type] || 'Medium'
                  const daysColor = b.days_stored > 5 ? 'var(--crit-text)' : b.days_stored > 3 ? 'var(--warn-text)' : 'var(--text-1)'
                  return (
                    <tr key={b.id} style={{ cursor: 'pointer' }} onClick={() => handleAssess(b.id)}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={`badge ${CROP_BADGE[b.crop] || 'bg-ok'} crop-badge`}>{b.crop.charAt(0).toUpperCase() + b.crop.slice(1)}</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-1)', textTransform: 'capitalize' }}>{b.crop}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-1)', fontWeight: 500 }}>{b.farmer_name}</td>
                      <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-1)', fontWeight: 600 }}>{b.quantity_kg} kg</td>
                      <td className="td-muted">{b.harvest_date}</td>
                      <td>
                        <span style={{ fontSize: 13, fontWeight: 700, color: daysColor, fontVariantNumeric: 'tabular-nums' }}>
                          {b.days_stored}d
                        </span>
                      </td>
                      <td className="td-muted" style={{ textTransform: 'capitalize', fontSize: 12 }}>
                        {b.storage_type.replace(/_/g, ' ')}
                      </td>
                      <td className="td-muted">{[b.district, b.state].filter(Boolean).join(', ')}</td>
                      <td><RiskDot level={sRisk} /></td>
                      <td onClick={e => { e.stopPropagation(); handleAssess(b.id) }}>
                        <button className="btn btn-primary btn-sm">Assess</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── QUICK TIPS FOOTER ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginTop: 16 }}>
        {[
          { icon: '5', title: 'Temperature Control', body: 'Maintain 13–21°C for tomatoes. Every 5°C above optimal doubles spoilage speed.' },
          { icon: '6', title: 'Humidity Management', body: 'Keep relative humidity at 85–95% for tomatoes. Too low causes shrivelling.' },
          { icon: '7', title: 'Storage Upgrade', body: 'Cold storage can extend tomato shelf life from 3 days to 21 days.' },
          { icon: '8', title: 'Sell Timing', body: 'High spoilage risk overrides price advantage. Sell immediately when risk is high.' },
        ].map(tip => (
          <div key={tip.title} className="card card-pad" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{tip.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 3 }}>{tip.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.55 }}>{tip.body}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
    </LocalizedContent>
  )
}
