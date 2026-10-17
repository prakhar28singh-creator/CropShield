import { createContext, useContext, useState, useEffect } from 'react'
import { farmerMe } from './api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [farmer, setFarmer] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('cs_token') || '')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    if (!token) {
      setFarmer(null)
      setReady(true)
      return () => { active = false }
    }
    setReady(false)
    farmerMe()
      .then(r => { if (active) setFarmer(r.data.farmer) })
      .catch(() => {
        if (active) {
          localStorage.removeItem('cs_token')
          setToken('')
          setFarmer(null)
        }
      })
      .finally(() => { if (active) setReady(true) })
    return () => { active = false }
  }, [token])

  const login = (tok, f) => {
    localStorage.setItem('cs_token', tok)
    setToken(tok); setFarmer(f)
  }
  const logout = () => {
    localStorage.removeItem('cs_token')
    setToken(''); setFarmer(null)
  }
  return <AuthCtx.Provider value={{ farmer, token, ready, login, logout }}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
