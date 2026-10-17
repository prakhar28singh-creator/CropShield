import axios from 'axios'

const API = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api' })

// Attach farmer token automatically when logged in
API.interceptors.request.use((cfg) => {
  const tok = localStorage.getItem('cs_token')
  if (tok) cfg.headers.Authorization = `Bearer ${tok}`
  return cfg
})

export const registerFarmer = (data) => API.post('/farmers/register', data)
export const loginFarmer = (data) => API.post('/farmers/login', data)
export const farmerMe = () => API.get('/farmers/me')

export const getCrops = () => API.get('/crops')
export const createBatch = (data) => API.post('/batches', data)
export const getBatches = () => API.get('/batches')
export const getBatch = (id) => API.get(`/batches/${id}`)
export const assessBatch = (id, daysToStore = 7) => API.post(`/batches/${id}/assess?days_to_store=${daysToStore}`)
export const computeBatch = (id, daysToStore = 7) => API.post(`/batches/${id}/compute?days_to_store=${daysToStore}`)
export const getAssessments = (id) => API.get(`/batches/${id}/assessments`)
export const getMarketPrices = (crop, filters = {}) => {
  const params = new URLSearchParams()
  if (filters.district) params.set('district', filters.district)
  if (filters.state) params.set('state', filters.state)
  if (filters.market) params.set('market', filters.market)
  const qs = params.toString()
  return API.get(`/market-prices/${crop}${qs ? `?${qs}` : ''}`)
}
export const getMarketMeta = () => API.get('/market-meta')
export const getDashboardSummary = () => API.get('/dashboard/summary')
