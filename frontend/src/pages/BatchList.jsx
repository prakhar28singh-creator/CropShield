import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getBatches, assessBatch } from '../api'
import { LocalizedContent } from '../i18n'
import { useLanguage } from '../i18n'

export default function BatchList() {
  const { language } = useLanguage()
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    getBatches()
      .then(r => { if (active) setBatches(r.data) })
      .catch(err => {
        if (active) setError(err?.response?.data?.detail || 'Could not load your batches. Please try again.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [retry])

  const handleAssess = async (id) => {
    try { await assessBatch(id); navigate(`/batches/${id}/result`) }
    catch { alert('Assessment failed.') }
  }

  if (loading) return <LocalizedContent><div className="page-body loading-center"><div className="spinner" /></div></LocalizedContent>

  return (
    <LocalizedContent>
    <div className="page-body">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.015em', marginBottom: 2 }}>Crop Batches</div>
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
            {batches.length} {language === 'hi'
              ? (batches.length === 1 ? 'फसल दर्ज' : 'फसलें दर्ज')
              : `batch${batches.length !== 1 ? 'es' : ''} registered`}
          </div>
        </div>
        <Link to="/register" className="btn btn-primary">+ Register New Batch</Link>
      </div>

      {error && (
        <div className="alert alert-crit" role="alert" style={{ marginBottom: 16 }}>
          {error}{' '}
          <button className="link-btn" onClick={() => {
            setError('')
            setLoading(true)
            setRetry(value => value + 1)
          }}>Try again</button>
        </div>
      )}

      <div className="card">
        {error ? null : batches.length === 0 ? (
          <div className="card-body">
            <div className="empty-state">
              <div className="empty-icon">•</div>
              <p>No batches registered yet.</p>
              <Link to="/register" className="btn btn-primary" style={{ marginTop: 14 }}>
                Register First Batch
              </Link>
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Farmer</th>
                  <th>Crop</th>
                  <th>Quantity</th>
                  <th>Harvest Date</th>
                  <th>Storage Method</th>
                  <th>Temp</th>
                  <th>Humidity</th>
                  <th>District</th>
                  <th>Condition</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {batches.map(b => (
                  <tr key={b.id}>
                    <td className="td-muted" style={{ fontSize: 12, width: 40 }}>#{b.id}</td>
                    <td className="strong">{b.farmer_name}</td>
                    <td>
                      <span className="badge badge-ok cap">{b.crop}</span>
                    </td>
                    <td className="tabnum">{b.quantity_kg} kg</td>
                    <td className="td-muted">{b.harvest_date}</td>
                    <td className="td-muted cap">{b.storage_type.replace(/_/g, ' ')}</td>
                    <td className="td-muted tabnum">
                      {b.temperature_c != null ? `${b.temperature_c}°C` : <span className="subtle">—</span>}
                    </td>
                    <td className="td-muted tabnum">
                      {b.humidity_pct != null ? `${b.humidity_pct}%` : <span className="subtle">—</span>}
                    </td>
                    <td className="td-muted">{[b.district, b.state].filter(Boolean).join(', ')}</td>
                    <td className="td-muted cap" style={{ fontSize: 12 }}>
                      {(b.visible_condition || 'fresh').replace(/_/g, ' ')}
                    </td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => handleAssess(b.id)}>
                        Assess
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </LocalizedContent>
  )
}
