import { useState, useEffect } from 'react'
import { getMarketPrices, getMarketMeta } from '../api'
import { LocalizedContent, useLanguage } from '../i18n'

export default function MandiFinder() {
  const { language } = useLanguage()
  const [meta, setMeta] = useState(null)
  const [state, setState] = useState('')
  const [district, setDistrict] = useState('')
  const [crop, setCrop] = useState('tomato')
  const [market, setMarket] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getMarketMeta()
      .then(r => { setMeta(r.data); setState(r.data.states[0]?.name || '') })
      .catch(() => setError('Could not load market metadata.'))
  }, [])

  const districts = meta?.states.find(s => s.name === state)?.districts || []

  const search = () => {
    setLoading(true)
    setSearched(true)
    setError(null)
    getMarketPrices(crop, { state, district, market })
      .then(r => setResults(r.data))
      .catch(() => setError('Search failed. Please try again.'))
      .finally(() => setLoading(false))
  }

  // Auto-search on first load with default crop+state
  useEffect(() => {
    if (meta && !results && !loading && !error) {
      search()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta])

  const foundMarkets = results?.markets || []

  return (
    <LocalizedContent>
    <div className="page-body">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.015em', marginBottom: 2 }}>
          Mandi Price Finder
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
          Select your state, district, crop and market — no login required
        </div>
      </div>

      {/* Search panel */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div className="form-grid">
            <div className="form-group">
              <label>State *</label>
              <select value={state} onChange={e => {
                setState(e.target.value)
                setDistrict('')
                setMarket('')
                setResults(null)
                setSearched(false)
                setError(null)
              }}>
                {meta?.states.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>District</label>
              <select value={district} onChange={e => {
                setDistrict(e.target.value)
                setResults(null)
                setSearched(false)
                setError(null)
              }}>
                <option value="">All districts</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Crop *</label>
              <select value={crop} onChange={e => {
                setCrop(e.target.value)
                setResults(null)
                setSearched(false)
                setError(null)
              }}>
                {meta?.crops.map(c => <option key={c.key} value={c.key}>{c.display_name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Market (optional)</label>
              <input value={market} onChange={e => {
                setMarket(e.target.value)
                setResults(null)
                setSearched(false)
                setError(null)
              }} placeholder="e.g. Azadpur" />
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={search} disabled={loading}>
              {loading ? 'Searching…' : 'Search Prices'}
            </button>
            {results && (
              <span className={`badge ${results.is_demo ? 'badge-demo' : 'badge-ok'}`}>
                {results.is_demo ? 'DEMO FALLBACK' : 'OFFICIAL DATA'}
              </span>
            )}
          </div>
        </div>
      </div>

      {error && <div className="alert alert-crit" style={{ marginBottom: 16 }}>{error}</div>}

      {loading ? (
        <div className="loading-center"><div className="spinner" /><span>Searching mandi prices…</span></div>
      ) : searched && results ? (
        <>
          {/* Result summary */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <span className="card-title">
                📋 {results.markets.length} {language === 'hi'
                  ? (results.markets.length === 1 ? 'मंडी मिली' : 'मंडियां मिलीं')
                  : `market${results.markets.length !== 1 ? 's' : ''} found`}
                <span className="muted" style={{ fontWeight: 400 }}>
                  {' '}— {crop.charAt(0).toUpperCase() + crop.slice(1)}
                  {state ? `, ${state}` : ''}
                  {district ? ` (${district})` : ''}
                </span>
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                Price date: {results.markets[0]?.price_date || 'N/A'}
              </span>
            </div>

            {foundMarkets.length === 0 ? (
              <div className="card-body">
                <div className="empty-state">
                  <div className="empty-icon">•</div>
                  <p>No markets match your filters. Try widening the district or clearing the market name.</p>
                </div>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}>#</th>
                      <th>Market</th>
                      <th>District</th>
                      <th>State</th>
                      <th className="text-right">Min (₹/qtl)</th>
                      <th className="text-right">Max (₹/qtl)</th>
                      <th className="text-right">Modal (₹/qtl)</th>
                      <th className="text-right">{results.is_demo ? 'Net* (₹/qtl)' : 'Modal / gross (₹/qtl)'}</th>
                      <th className="text-right">Arrivals (t)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {foundMarkets.map((m, i) => (
                      <tr key={i}>
                        <td><span className={`rank-num ${i === 0 ? 'top' : ''}`}>{i + 1}</span></td>
                        <td className="strong">{m.market}</td>
                        <td className="td-muted">{m.district}</td>
                        <td className="td-muted">{m.state}</td>
                        <td className="text-right tabnum td-muted">{m.min_price}</td>
                        <td className="text-right tabnum td-muted">{m.max_price}</td>
                        <td className="text-right tabnum strong">{m.modal_price}</td>
                        <td className="text-right tabnum strong" style={{ color: 'var(--primary)' }}>
                          {results.is_demo ? m.net_price_per_quintal : m.modal_price}
                        </td>
                        <td className="text-right tabnum td-muted">{m.arrivals_tonnes ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Source & notes */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body">
              <div className="two-col">
                <div>
                  <div className="section-label">Price Details</div>
                  <ul className="assumptions-box">
                    <li><strong>Price date:</strong> {foundMarkets[0]?.price_date}</li>
                    <li><strong>Source:</strong> {foundMarkets[0]?.source}</li>
                    <li><strong>Unit:</strong> ₹ per quintal (100 kg)</li>
                    {results.is_demo
                      ? <li><strong>*Net price</strong> = modal price minus estimated transport cost</li>
                      : <li>Official feed does not include transport costs; displayed modal price is gross, before expenses.</li>}
                    <li><strong>Arrivals:</strong> {results.is_demo ? 'tonnes reported at the market' : 'not supplied by this feed'}</li>
                  </ul>
                </div>
                <div>
                  <div className="section-label">Important</div>
                  <div className="alert alert-info" style={{ marginBottom: 10 }}>
                    Wholesale mandi price is not the amount a farmer receives.
                    Deduct commission (6–10%), weighing, loading and local transport
                    charges to estimate your take-home price.
                  </div>
                  <div className="alert alert-warn">
                    {results.demo_notice}{' '}
                    Visit <a href="https://agmarknet.gov.in" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--info-text)', fontWeight: 500 }}>AGMARKNET</a>.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Price trend */}
          {results.price_history?.length > 1 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">{crop.charAt(0).toUpperCase() + crop.slice(1)} Monthly Price Samples</span>
                <span className="badge badge-demo">DEMO</span>
              </div>
              <div className="card-body">
                <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
                  {results.is_demo
                    ? 'May–Sep 2026 · Illustrative crop-level samples, not location-specific · Monthly min/max/modal · ₹ per quintal'
                    : 'Monthly range aggregated only from official feed records returned for this search · ₹ per quintal'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {results.price_history.map((h, i) => (
                    <div key={i} style={{
                      padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: 'var(--r)', fontSize: 12, fontVariantNumeric: 'tabular-nums',
                      display: 'grid', gap: 4
                    }}>
                      <span className="muted">{h.date.slice(0, 7)}</span>
                      <span>Min ₹{h.min_price} · Max ₹{h.max_price}</span>
                      <span className="strong">Modal ₹{h.modal_price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}

      <div className="home-footer-note">
        Mandi Price Finder is free and does not require an account.
        Prices are indicative wholesale rates; verify before making selling decisions.
      </div>
    </div>
    </LocalizedContent>
  )
}
