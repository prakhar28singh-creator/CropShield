import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { assessBatch, computeBatch } from '../api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { LocalizedContent } from '../i18n'

export default function AssessmentResult() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [daysToStore, setDaysToStore] = useState(7)
  const [recalculating, setRecalculating] = useState(false)

  // Initial load — POST /assess (persists to DB)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await assessBatch(id, daysToStore)
        if (!cancelled) setData(res.data)
      } catch {
        if (!cancelled) setError('Could not load assessment. Please go back and try again.')
      } finally {
        if (!cancelled) { setLoading(false); setRecalculating(false) }
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Recalculate — POST /compute (pure computation, no DB write)
  const handleRecalc = async () => {
    setRecalculating(true)
    try {
      const res = await computeBatch(id, daysToStore)
      setData(prev => ({ ...prev, risk: res.data.risk, market_prices: res.data.market_prices, decision: res.data.decision }))
    } catch {
      // Keep the previous assessment if a recalculation fails.
    } finally {
      setRecalculating(false)
    }
  }

  if (loading) return (
    <LocalizedContent>
    <div className="page-body loading-center">
      <div className="spinner" /><span>Running risk assessment…</span>
    </div>
    </LocalizedContent>
  )
  if (error) return (
    <LocalizedContent>
    <div className="page-body">
      <div className="alert alert-crit" style={{ marginTop: 40 }}>{error}</div>
      <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginTop: 12 }}>Go Back</button>
    </div>
    </LocalizedContent>
  )

  const { batch, risk, market_prices, decision } = data
  const markets = market_prices?.markets || []
  const history = market_prices?.price_history || []
  const { risk_score, risk_category, risk_factors, quantity_at_risk_kg, recommended_actions, days_stored } = risk

  const recClass = decision.recommendation === 'Sell Now' ? 'sell'
    : decision.recommendation === 'Store Safely' ? 'store' : 'market'
  const recIcon = decision.recommendation === 'Sell Now' ? 'Sell Now'
    : decision.recommendation === 'Store Safely' ? 'Store Safely' : 'Move Mandi'

  const riskColor = risk_category === 'High' ? 'var(--crit-text)'
    : risk_category === 'Medium' ? 'var(--warn-text)' : 'var(--primary)'

  return (
    <LocalizedContent>
    <div className="page-body">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:700, color:'var(--text-1)', letterSpacing:'-0.015em', marginBottom:2 }}>
            Assessment Report
          </div>
          <div style={{ fontSize:13, color:'var(--text-2)' }}>
            {batch.crop.charAt(0).toUpperCase() + batch.crop.slice(1)} · {batch.quantity_kg} kg · {batch.farmer_name}
          </div>
        </div>
        <div className="flex-row">
          <Link to="/register" className="btn btn-secondary">+ New Batch</Link>
          <Link to="/" className="btn btn-secondary">Dashboard</Link>
        </div>
      </div>

      {/* Stepper */}
      <div className="stepper">
        <div className="step-item done">
          <div className="step-num">1</div>
          <span className="step-lbl">Registered</span>
        </div>
        <div className="step-line" />
        <div className="step-item active">
          <div className="step-num">2</div>
          <span className="step-lbl">Risk Report</span>
        </div>
        <div className="step-line" />
        <div className="step-item active">
          <div className="step-num">3</div>
          <span className="step-lbl">Market Prices</span>
        </div>
        <div className="step-line" />
        <div className="step-item active">
          <div className="step-num">4</div>
          <span className="step-lbl">Recommendation</span>
        </div>
      </div>

      {/* ── Risk Assessment Card ── */}
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-header">
          <span className="card-title">Spoilage Risk Assessment</span>
          <span className={`badge ${risk_category === 'High' ? 'badge-crit' : risk_category === 'Medium' ? 'badge-warn' : 'badge-ok'}`}>
            {risk_category} Risk
          </span>
        </div>
        <div className="card-body">
          <div className="res-stats">
            <div className="res-stat">
              <div className="section-label">Risk Score</div>
              <div className="res-stat-val" style={{ color: riskColor }}>
                {risk_score}<small>/100</small>
              </div>
            </div>
            <div className="res-stat">
              <div className="section-label">Days in Storage</div>
              <div className="res-stat-val">{days_stored}</div>
            </div>
            <div className="res-stat">
              <div className="section-label">Estimated Loss</div>
              <div className="res-stat-val" style={{ color: 'var(--crit-text)' }}>
                {quantity_at_risk_kg}<small>kg</small>
              </div>
            </div>
            <div className="res-stat">
              <div className="section-label">Storage Method</div>
              <div className="res-stat-sub" style={{ marginTop: 0 }}>{batch.storage_type.replace(/_/g, ' ')}</div>
            </div>
          </div>

          <div className="risk-meter-wrap">
            <div className="risk-meter-track">
              <div className={`risk-meter-fill risk-fill-${risk_category}`} style={{ width:`${risk_score}%` }} />
            </div>
            <div className="risk-labels">
              <span>0 — Low</span><span>35 — Medium</span><span>60 — High</span><span>100</span>
            </div>
          </div>

          {risk_category === 'High' && (
            <div className="alert alert-crit" style={{ marginTop:12 }}>
              <strong>High Risk:</strong> Immediate action required. Inspect produce and arrange early sale or improved storage.
            </div>
          )}
          {risk_category === 'Medium' && (
            <div className="alert alert-warn" style={{ marginTop:12 }}>
              ⚡ <strong>Medium Risk:</strong> Monitor closely and plan sale within the next 1–2 days.
            </div>
          )}
          {risk_category === 'Low' && (
            <div className="alert alert-ok" style={{ marginTop:12 }}>
              <strong>Low Risk:</strong> Produce is in good condition. Continue monitoring temperature and humidity.
            </div>
          )}

          <div className="divider" />

          <div className="two-col">
            <div>
              <div className="section-label">Risk Factors</div>
              <ul className="factor-list">
                {risk_factors.map((f, i) => (
                  <li key={i}>
                    <span className={`factor-dot ${risk_category === 'High' ? 'dot-crit' : risk_category === 'Medium' ? 'dot-warn' : 'dot-ok'}`} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="section-label">Recommended Actions</div>
              <ul className="factor-list">
                {recommended_actions.map((a, i) => (
                  <li key={i}>
                    <span className="factor-dot dot-ok" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ marginTop:16, fontSize:11, color:'var(--text-3)', borderTop:'1px solid var(--border)', paddingTop:10 }}>
            Risk scores are based on crop-specific agricultural guidance. Actual losses depend on produce quality, handling, and local conditions. These are estimates, not measured outcomes.
          </div>
        </div>
      </div>

      {/* ── Market Prices Card ── */}
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-header">
          <span className="card-title">Market Price Comparison</span>
          <span className="badge badge-demo">DEMO DATA</span>
        </div>
        <div className="card-body">
          <div className="table-wrap" style={{ marginBottom:16 }}>
            <table>
              <thead>
                <tr>
                  <th style={{ width:36 }}>#</th>
                  <th>Market</th>
                  <th>State</th>
                  <th className="text-right">Modal (₹/qtl)</th>
                  <th className="text-right">Transport (₹/qtl)</th>
                  <th className="text-right">Net (₹/qtl)</th>
                  <th className="text-right">Distance</th>
                </tr>
              </thead>
              <tbody>
                {markets.map((m, i) => (
                  <tr key={i}>
                    <td><span className={`rank-num ${i === 0 ? 'top' : ''}`}>{i + 1}</span></td>
                    <td className="strong">{m.market}</td>
                    <td className="td-muted">{m.state}</td>
                    <td className="text-right tabnum">{m.modal_price}</td>
                    <td className="text-right tabnum td-muted">{m.transport_cost_per_quintal}</td>
                    <td className="text-right tabnum strong" style={{ color:'var(--primary)' }}>
                      {m.net_price_per_quintal}
                    </td>
                    <td className="text-right tabnum td-muted">{m.distance_km} km</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {history.length > 1 && (
            <div>
              <div className="section-label" style={{ marginBottom:8 }}>Price Trend — Last 14 Days</div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={history} margin={{ top:4, right:16, left:0, bottom:4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize:10, fill:'var(--text-2)' }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize:10, fill:'var(--text-2)' }} domain={['auto','auto']} />
                  <Tooltip formatter={v => [`₹${v}/qtl`,'Modal Price']} labelFormatter={l => `Date: ${l}`}
                    contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, fontSize:12 }} />
                  <Line type="monotone" dataKey="modal_price" stroke="var(--primary)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{ marginTop:12, fontSize:11, color:'var(--text-3)', borderTop:'1px solid var(--border)', paddingTop:10 }}>
            Wholesale mandi price ≠ farmer take-home. Deduct commission (6–10%), weighing, loading, and transport charges from modal price.
          </div>
        </div>
      </div>

      {/* ── Recommendation Card ── */}
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-header">
          <span className="card-title">💡 Sell vs Store Decision</span>
        </div>
        <div className="card-body">
          <div className="recalc-bar">
            <span>If storing, plan to sell in</span>
            <input
              type="number" min={1} max={90}
              value={daysToStore}
              onChange={e => setDaysToStore(Number(e.target.value))}
            />
            <span>days</span>
            <button className="btn btn-primary btn-sm" onClick={handleRecalc} disabled={recalculating}>
              {recalculating ? 'Recalculating…' : 'Recalculate'}
            </button>
            <span style={{ fontSize:11, color:'var(--text-3)' }}>Change days to see how recommendation responds</span>
          </div>

          {decision.season_outlook && (
            <div className="season-strip">
              <span className="ss-item">
                Sale window <span className="ss-val">{decision.sale_date_display}</span>
              </span>
              <span className="ss-sep">·</span>
              <span className="ss-item">{decision.season_outlook}</span>
              <span className="ss-sep">·</span>
              <span className="ss-item">
                Forecast <span className="ss-val">
                  ₹{decision.forecast_price_per_quintal}/qt
                </span>
              </span>
              <span className="ss-sep">·</span>
              <span className="ss-item">
                Confidence{" "}
                <span className={`ss-conf ${decision.forecast_confidence || ""}`}>
                  {decision.forecast_confidence}
                </span>
              </span>
            </div>
          )}

          <div className={`rec-box ${recClass}`}>
            <div className="rec-icon">{recIcon}</div>
            <div>
              <div className="rec-label">{decision.recommendation}</div>
              <div className="rec-reason">{decision.recommendation_reason}</div>
            </div>
          </div>

          <div className="returns-grid">
            <div className="return-card sell-now">
              <div className="rc-label">Sell Now (Estimated)</div>
              <div className="rc-value">
                ₹{decision.sell_now_return?.toLocaleString('en-IN', { maximumFractionDigits:0 }) ?? '—'}
              </div>
              <div className="rc-sub">{decision.quantity_sellable_now} kg saleable × net price</div>
            </div>
            <div className="return-card store-later">
              <div className="rc-label">Store {daysToStore} Days (Estimated)</div>
              <div className="rc-value">
                ₹{decision.store_return?.toLocaleString('en-IN', { maximumFractionDigits:0 }) ?? '—'}
              </div>
              <div className="rc-sub">After storage losses &amp; costs</div>
            </div>
          </div>

          <div className="divider" />

          <div className="section-label">Assumptions &amp; Inputs Used</div>
          <ul className="assumptions-box">
            {decision.assumptions?.map((a, i) => <li key={i}>{a}</li>)}
          </ul>

          {(decision.future_price_confidence === 'very_low' || decision.future_price_confidence === 'low') && (
            <div className="alert alert-warn" style={{ marginTop:12 }}>
              Future price estimate has <strong>{decision.future_price_confidence}</strong> confidence.
              The "Store" return is uncertain — actual future prices may differ significantly.
            </div>
          )}

          <div style={{ marginTop:14, fontSize:11, color:'var(--text-3)', borderTop:'1px solid var(--border)', paddingTop:10 }}>
            Financial estimates are illustrative. Actual returns depend on real market prices, actual storage losses, transport availability, and other factors.
            This tool does not guarantee prices or prevent losses. Consult your local agricultural extension officer for verified guidance.
          </div>
        </div>
      </div>

      <div className="flex-row" style={{ justifyContent:'flex-end', marginBottom:24 }}>
        <Link to="/" className="btn btn-secondary">Dashboard</Link>
        <Link to="/register" className="btn btn-primary">+ Assess Another Crop</Link>
      </div>
    </div>
    </LocalizedContent>
  )
}
