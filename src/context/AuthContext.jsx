import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    if (!api.getApiUrl()) {
      setLoading(false)
      return
    }
    try {
      const data = await api.fetchMe()
      if (data?.user) setUser(data.user)
      else setUser(null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const signup = useCallback(async (email, password, name) => {
    const data = await api.signup(email, password, name)
    api.setToken(data.token)
    setUser(data.user)
    return data
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password)
    api.setToken(data.token)
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(() => {
    api.setToken(null)
    setUser(null)
  }, [])

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    refresh: loadUser,
    hasApi: !!api.getApiUrl(),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
