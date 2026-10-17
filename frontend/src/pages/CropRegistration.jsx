import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBatch, assessBatch, getCrops, getMarketMeta } from '../api'
import { useAuth } from '../auth'
import { LocalizedContent } from '../i18n'

const STORAGE_OPTIONS = [
  { value: 'cold_storage',   label: 'Cold Storage' },
  { value: 'ventilated_room',label: 'Ventilated Room' },
  { value: 'open_room',      label: 'Open Room' },
  { value: 'bamboo_basket',  label: 'Bamboo Basket' },
  { value: 'gunny_bag',      label: 'Gunny Bag' },
]
const CONDITION_OPTIONS = [
  { value: 'fresh',           label: 'Fresh — no visible damage' },
  { value: 'slight_damage',   label: 'Slight damage' },
  { value: 'moderate_damage', label: 'Moderate damage' },
  { value: 'severe_damage',   label: 'Severe damage' },
]
const TODAY = new Date().toISOString().split('T')[0]
// Defined at module scope (NOT inside the page component) so React keeps the
// same component identity across renders — an inner definition would remount
// the inputs on every keystroke and steal focus.
function Field({ id, label, required, hint, error, children, span = 'span-4' }) {
  return (
    <div className={`reg-field ${span}`}>
      <label className="reg-label" htmlFor={id}>{label}{required && <span className="req"> *</span>}</label>
      {children}
      {error ? <span className="reg-err">{error}</span>
        : hint ? <span className="reg-hint">{hint}</span> : null}
    </div>
  )
}

export default function CropRegistration() {
  const navigate = useNavigate()
  const { farmer } = useAuth()
  const [crops, setCrops] = useState([])
  const [cropsLoading, setCropsLoading] = useState(true)
  const [locations, setLocations] = useState([])
  const [locationsLoading, setLocationsLoading] = useState(true)
  const [locationsError, setLocationsError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({
    farmer_name: '', crop: 'tomato', variety: '',
    quantity_kg: '', harvest_date: TODAY, location: '',
    state: 'Maharashtra', district: 'Nashik', storage_type: 'open_room',
    temperature_c: '', humidity_pct: '',
    intended_sell_date: '', visible_condition: 'fresh',
  })

  useEffect(() => {
    let live = true
    setCropsLoading(true)
    getCrops()
      .then(r => { if (live) setCrops(r.data.crops) })
      .catch(() => {})
      .finally(() => { if (live) setCropsLoading(false) })
    return () => { live = false }
  }, [])

  useEffect(() => {
    let live = true
    getMarketMeta()
      .then(r => { if (live) setLocations(r.data.states) })
      .catch(() => { if (live) setLocationsError('Could not load state and district options. Please refresh and try again.') })
      .finally(() => { if (live) setLocationsLoading(false) })
    return () => { live = false }
  }, [])

  const districts = locations.find(option => option.name === form.state)?.districts || []

  // Logged-in farmer: name locked to account, village/district pre-filled
  useEffect(() => {
    if (farmer) {
      const profileState = locations.find(option => option.name === farmer.state)
      const districtState = profileState || locations.find(option => option.districts.includes(farmer.district))
      const profileDistrict = districtState?.districts.includes(farmer.district)
      setForm(p => ({
        ...p,
        farmer_name: p.farmer_name || farmer.name || '',
        location: p.location || farmer.village || '',
        state: districtState?.name || p.state,
        district: profileDistrict ? farmer.district : districtState ? '' : p.district,
      }))
    }
  }, [farmer, locations])

  const set = (f, v) => { setForm(p => ({ ...p, [f]: v })); setErrors(e => ({ ...e, [f]: null })) }

  const validate = () => {
    const e = {}
    if (!form.farmer_name.trim()) e.farmer_name = 'Required'
    if (!form.quantity_kg || isNaN(form.quantity_kg) || Number(form.quantity_kg) <= 0)
      e.quantity_kg = 'Enter a positive number'
    if (!form.harvest_date) e.harvest_date = 'Required'
    else if (form.harvest_date > TODAY) e.harvest_date = 'Cannot be in the future'
    if (!form.location.trim()) e.location = 'Required'
    if (!form.state) e.state = 'Required'
    if (!form.district) e.district = 'Required'
    if (form.temperature_c !== '' && (isNaN(form.temperature_c) || +form.temperature_c < -10 || +form.temperature_c > 60))
      e.temperature_c = 'Must be −10 to 60°C'
    if (form.humidity_pct !== '' && (isNaN(form.humidity_pct) || +form.humidity_pct < 0 || +form.humidity_pct > 100))
      e.humidity_pct = 'Must be 0–100%'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        farmer_name: farmer?.name || form.farmer_name,
        quantity_kg: Number(form.quantity_kg),
        temperature_c: form.temperature_c !== '' ? Number(form.temperature_c) : null,
        humidity_pct:  form.humidity_pct  !== '' ? Number(form.humidity_pct)  : null,
        variety: form.variety || null,
        intended_sell_date: form.intended_sell_date || null,
      }
      const res = await createBatch(payload)
      await assessBatch(res.data.id)
      navigate(`/batches/${res.data.id}/result`)
    } catch (err) {
      const msg = err?.response?.data?.detail
      if (typeof msg === 'string') alert(msg)
      else if (Array.isArray(msg)) alert(msg.map(m => m.msg).join('\n'))
      else alert('Submission failed. Please check your inputs.')
    } finally { setSubmitting(false) }
  }

  return (
    <LocalizedContent>
    <div className="reg-wrap">
      <div className="reg-head">
        <h1>Register Crop Batch</h1>
        <p>Enter storage and crop details to receive an instant risk assessment &amp; recommendation</p>
      </div>
      <div className="reg-card">
        <div className="reg-farmer">
          <div className="reg-avatar">{(farmer?.name || 'F').charAt(0).toUpperCase()}</div>
          <div>
            <div className="reg-farmer-name">{farmer?.name || 'Farmer'}</div>
            <div className="reg-farmer-sub">
              {[farmer?.village, farmer?.district].filter(Boolean).join(' · ')}{farmer?.phone ? ` · ${farmer.phone}` : ''}
            </div>
          </div>
          <span className="reg-lock">Locked to your account</span>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="reg-body">
            <div className="reg-section">
              <h3 className="reg-section-title">Farmer &amp; Crop Details</h3>
              <p className="reg-section-sub">Crop specifics for this harvest lot.</p>
              <div className="reg-grid">
                <Field id="farmer_name" label="Farmer Name" required
                  error={errors.farmer_name}
                  hint={farmer ? 'Locked to your logged-in account' : ''}>
                  {farmer ? (
                    <div className="locked-field">{form.farmer_name || farmer.name}
                      <span className="locked-badge">Your account</span>
                    </div>
                  ) : (
                  <input id="farmer_name" value={form.farmer_name}
                    onChange={e => set('farmer_name', e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className={errors.farmer_name ? 'err-input' : ''} />
                  )}
                </Field>
                <Field id="crop" label="Crop" required span="span-3" error={errors.crop}>
                  {cropsLoading
                    ? <div className="reg-skel" style={{ height: 46 }} />
                    : <select id="crop" value={form.crop} onChange={e => set('crop', e.target.value)}>
                      {(crops.length ? crops : [
                      { key: 'tomato', display_name: 'Tomato' },
                      { key: 'potato', display_name: 'Potato' },
                      { key: 'onion',  display_name: 'Onion'  },
                      { key: 'wheat',  display_name: 'Wheat'  },
                    ]).map(c => <option key={c.key} value={c.key}>{c.display_name}</option>)}
                  </select>
                  }
                </Field>
                <Field id="variety" label="Variety" hint="Optional — e.g. Roma, Hybrid" error={errors.variety}>
                  <input id="variety" value={form.variety}
                    onChange={e => set('variety', e.target.value)}
                    placeholder="e.g. Roma" />
                </Field>
                <Field id="quantity_kg" label="Quantity (kg)" required error={errors.quantity_kg}>
                  <input id="quantity_kg" type="number" min="1"
                    value={form.quantity_kg}
                    onChange={e => set('quantity_kg', e.target.value)}
                    placeholder="e.g. 500"
                    className={errors.quantity_kg ? 'err-input' : ''} />
                </Field>
                <Field id="harvest_date" label="Harvest Date" required error={errors.harvest_date}>
                  <input id="harvest_date" type="date" max={TODAY}
                    value={form.harvest_date}
                    onChange={e => set('harvest_date', e.target.value)}
                    className={errors.harvest_date ? 'err-input' : ''} />
                </Field>
                <Field id="intended_sell_date" label="Intended Sell Date" hint="Optional" error={errors.intended_sell_date}>
                  <input id="intended_sell_date" type="date" min={TODAY}
                    value={form.intended_sell_date}
                    onChange={e => set('intended_sell_date', e.target.value)} />
                </Field>
              </div>
            </div>

            <div className="reg-section">
              <h3 className="reg-section-title">Location</h3>
              <p className="reg-section-sub">Where is this lot stored right now?</p>
              <div className="reg-grid">
                <Field id="location" label="Village / Town" required span="span-6" error={errors.location}>
                  <input id="location" value={form.location}
                    onChange={e => set('location', e.target.value)}
                    placeholder="e.g. Igatpuri"
                    className={errors.location ? 'input-err' : ''} />
                </Field>
                <Field id="state" label="State / Union Territory" required span="span-6" error={errors.state}>
                  <select id="state" value={form.state}
                    onChange={e => { set('state', e.target.value); set('district', '') }}
                    disabled={locationsLoading || !!locationsError}>
                    <option value="">Select a state or union territory</option>
                    {locations.map(option => <option key={option.name} value={option.name}>{option.name}</option>)}
                  </select>
                </Field>
                <Field id="district" label="District" required span="span-6" error={errors.district}>
                  <select id="district" value={form.district}
                    onChange={e => set('district', e.target.value)}
                    disabled={!form.state || locationsLoading || !!locationsError}>
                    <option value="">Select a district</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </Field>
                {locationsError && <div className="alert alert-crit" role="alert">{locationsError}</div>}
              </div>
            </div>

            <div className="reg-section" style={{ marginBottom: 0 }}>
              <h3 className="reg-section-title">Storage Conditions</h3>
              <p className="reg-section-sub">How and where the harvest is kept today.</p>
              <div className="reg-grid">
                <Field id="storage_type" label="Storage Method" required span="span-6" error={errors.storage_type}>
                  <select id="storage_type" value={form.storage_type}
                    onChange={e => set('storage_type', e.target.value)}>
                    {STORAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field id="visible_condition" label="Visible Condition" span="span-6" error={errors.visible_condition}>
                  <select id="visible_condition" value={form.visible_condition}
                    onChange={e => set('visible_condition', e.target.value)}>
                    {CONDITION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </Field>
                <Field id="temperature_c" label="Temperature (°C)" span="span-6" hint="Leave blank if unknown" error={errors.temperature_c}>
                  <input id="temperature_c" type="number" step="0.1" min="-10" max="60"
                    value={form.temperature_c}
                    onChange={e => set('temperature_c', e.target.value)}
                    placeholder="e.g. 28"
                    className={errors.temperature_c ? 'input-err' : ''} />
                </Field>
                <Field id="humidity_pct" label="Relative Humidity (%)" span="span-6" hint="Leave blank if unknown" error={errors.humidity_pct}>
                  <input id="humidity_pct" type="number" step="1" min="0" max="100"
                    value={form.humidity_pct}
                    onChange={e => set('humidity_pct', e.target.value)}
                    placeholder="e.g. 80"
                    className={errors.humidity_pct ? 'input-err' : ''} />
                </Field>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
              {submitting ? 'Processing…' : 'Register & Assess Crop'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </LocalizedContent>
  )
}
