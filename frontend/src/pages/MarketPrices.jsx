import { useState, useEffect } from 'react'
import { getMarketPrices } from '../api'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

const CROPS = ['tomato', 'potato', 'onion', 'wheat']

export default function MarketPrices() {
  const [crop, setCrop] = useState('tomato')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    getMarketPrices(crop)
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [crop])

  const markets = data?.markets || []
  const history = data?.price_history || []
  const future  = data?.future_estimates || {}

  const barData = markets.map(m => ({
    name: m.market.length > 14 ? m.market.slice(0, 14) + '…' : m.market,
    'Modal': m.modal_price,
    'Net':   m.net_price_per_quintal,
  }))

  const futureRows = Object.entries(future).map(([k, v]) => ({
    horizon: k.replace('_', ' '),
    price: v.price,
    confidence: v.confidence,
    note: v.note,
  }))
  return (
    <div className="page-body">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:700, color:'var(--text-1)', letterSpacing:'-0.015em', marginBottom:2 }}>
            Market Prices
          </div>
          <div style={{ fontSize:13, color:'var(--text-2)' }}>
            Mandi wholesale prices across markets — select a crop to compare
          </div>
        </div>
        <span className="badge badge-demo">DEMO DATA — Not live prices</span>
      </div>

      {/* Crop selector */}
      <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
        {CROPS.map(c => (
          <button
            key={c}
            onClick={() => setCrop(c)}
            className={`btn ${crop === c ? 'btn-primary' : 'btn-secondary'}`}
            style={{ textTransform:'capitalize' }}
          >
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <>
          {/* Market table */}
          <div className="card" style={{ marginBottom:16 }}>
            <div className="card-header">
              <span className="card-title" style={{ textTransform:'capitalize' }}>
                {crop} — Mandi Prices
              </span>
              <span style={{ fontSize:12, color:'var(--text-2)' }}>
                Date: {markets[0]?.price_date || 'N/A'}
              </span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width:36 }}>#</th>
                    <th>Market</th>
                    <th>State</th>
                    <th className="text-right">Min (₹/qtl)</th>
                    <th className="text-right">Max (₹/qtl)</th>
                    <th className="text-right">Modal (₹/qtl)</th>
                    <th className="text-right">Transport</th>
                    <th className="text-right">Net Price</th>
                    <th className="text-right">Arrivals (t)</th>
                  </tr>
                </thead>
                <tbody>
                  {markets.map((m, i) => (
                    <tr key={i}>
                      <td><span className={`rank-num ${i === 0 ? 'top' : ''}`}>{i + 1}</span></td>
                      <td className="strong">{m.market}</td>
                      <td className="td-muted">{m.state}</td>
                      <td className="text-right tabnum td-muted">{m.min_price}</td>
                      <td className="text-right tabnum td-muted">{m.max_price}</td>
                      <td className="text-right tabnum strong">{m.modal_price}</td>
                      <td className="text-right tabnum td-muted">{m.transport_cost_per_quintal}</td>
                      <td className="text-right tabnum strong" style={{ color:'var(--primary)' }}>
                        {m.net_price_per_quintal}
                      </td>
                      <td className="text-right tabnum td-muted">{m.arrivals_tonnes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bar chart */}
            {barData.length > 0 && (
              <div style={{ padding:'16px 20px 4px' }}>
                <div className="section-label" style={{ marginBottom:10 }}>Modal vs Net Price by Market</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} margin={{ top:0, right:16, left:0, bottom:0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize:10, fill:'var(--text-2)' }} />
                    <YAxis tick={{ fontSize:10, fill:'var(--text-2)' }} domain={['auto','auto']} />
                    <Tooltip
                      formatter={v => `₹${v}/qtl`}
                      contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, fontSize:12 }}
                    />
                    <Legend wrapperStyle={{ fontSize:12, color:'var(--text-2)' }} />
                    <Bar dataKey="Modal" fill="#276749" radius={[3,3,0,0]} />
                    <Bar dataKey="Net" fill="#93d4af" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Price history */}
          {history.length > 1 && (
            <div className="card" style={{ marginBottom:16 }}>
              <div className="card-header">
                <span className="card-title">Price Trend — Last 14 Days</span>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={history} margin={{ top:4, right:16, left:0, bottom:4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize:10, fill:'var(--text-2)' }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize:10, fill:'var(--text-2)' }} domain={['auto','auto']} />
                    <Tooltip
                      formatter={v => [`₹${v}/qtl`,'Modal Price']}
                      labelFormatter={l => `Date: ${l}`}
                      contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:6, fontSize:12 }}
                    />
                    <Line type="monotone" dataKey="modal_price" stroke="var(--primary)" strokeWidth={2} dot={{ r:3, fill:'var(--primary)' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Future estimates */}
          {futureRows.length > 0 && (
            <div className="card" style={{ marginBottom:16 }}>
              <div className="card-header">
                <span className="card-title">Future Price Estimates (Indicative)</span>
                <span className="badge badge-warn">Low–Medium Confidence</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Horizon</th>
                      <th className="text-right">Est. Price (₹/qtl)</th>
                      <th>Confidence</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {futureRows.map((r, i) => (
                      <tr key={i}>
                        <td className="strong">{r.horizon}</td>
                        <td className="text-right tabnum strong" style={{ color:'var(--primary)' }}>₹{r.price}</td>
                        <td>
                          <span className={`badge ${r.confidence === 'high' ? 'badge-ok' : r.confidence === 'medium' ? 'badge-info' : 'badge-warn'}`}>
                            {r.confidence}
                          </span>
                        </td>
                        <td className="td-muted" style={{ fontSize:12 }}>{r.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* Data source notice */}
          <div className="alert alert-info">
            {data?.demo_notice} Official mandi data is available on{' '}
            <a href="https://agmarknet.gov.in" target="_blank" rel="noopener noreferrer" style={{ color:'var(--info-text)', fontWeight:500 }}>
              AGMARKNET
            </a>{' '}and the{' '}
            <a href="https://data.gov.in" target="_blank" rel="noopener noreferrer" style={{ color:'var(--info-text)', fontWeight:500 }}>
              Open Government Data Platform
            </a>.
          </div>
        </>
      )}
    </div>
  )
}
