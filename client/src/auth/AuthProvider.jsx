import { useEffect, useMemo, useState } from 'react'
import {
  clearAuthToken,
  getAuthToken,
  login as apiLogin,
  logout as apiLogout,
  me as apiMe,
  register as apiRegister,
  setAuthToken,
} from '../lib/api'
import { AuthContext } from './context'

function extractAuth(data) {
  const user = data?.user || data?.data?.user || null
  const token =
    data?.token ||
    data?.access_token ||
    data?.data?.token ||
    data?.data?.access_token ||
    user?.token ||
    null
  return { user, token }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    let active = true

    const loadUser = async () => {
      const token = getAuthToken()
      if (!token) {
        if (active) {
          setUser(null)
          setSessionExpired(false)
          setLoading(false)
        }
        return
      }

      setLoading(true)
      try {
        const data = await apiMe()
        if (active) {
          const { user: nextUser } = extractAuth(data)
          setUser(nextUser)
          if (nextUser?.role) {
            window.localStorage.setItem('dbu-last-role', nextUser.role)
          }
          setSessionExpired(false)
        }
      } catch {
        if (active) {
          clearAuthToken()
          setUser(null)
          const hadRole = !!window.localStorage.getItem('dbu-last-role')
          setSessionExpired(hadRole)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadUser()

    return () => {
      active = false
    }
  }, [])

  const refreshUser = async () => {
    const token = getAuthToken()
    if (!token) {
      setUser(null)
      setSessionExpired(false)
      setLoading(false)
      return null
    }

    setLoading(true)
    try {
      const data = await apiMe()
      const { user: nextUser } = extractAuth(data)
      setUser(nextUser)
      if (nextUser?.role) {
        window.localStorage.setItem('dbu-last-role', nextUser.role)
      }
      setSessionExpired(false)
      return nextUser
    } catch {
      clearAuthToken()
      setUser(null)
      const hadRole = !!window.localStorage.getItem('dbu-last-role')
      setSessionExpired(hadRole)
      window.localStorage.removeItem('dbu-last-role')
      return null
    } finally {
      setLoading(false)
    }
  }

  const role = useMemo(() => {
    if (user?.role) return user.role
    const cached = window.localStorage.getItem('dbu-last-role')
    return cached || null
  }, [user])

  const login = async (payload) => {
    const data = await apiLogin(payload)
    const { user: nextUser, token } = extractAuth(data)
    if (!token) {
      throw new Error('Login succeeded but no access token was returned.')
    }
    setAuthToken(token)
    setUser(nextUser)
    setSessionExpired(false)
    if (nextUser?.role) {
      window.localStorage.setItem('dbu-last-role', nextUser.role)
    }
    return nextUser
  }

  const register = async (payload) => {
    const data = await apiRegister(payload)
    const { user: nextUser, token } = extractAuth(data)
    if (token) {
      setAuthToken(token)
    }
    setUser(nextUser)
    setSessionExpired(false)
    if (nextUser?.role) {
      window.localStorage.setItem('dbu-last-role', nextUser.role)
    }
    return nextUser
  }

  const logout = async () => {
    try {
      await apiLogout()
    } catch {
      // Ignore API logout failures and clear local auth state anyway.
    }
    clearAuthToken()
    setUser(null)
    setSessionExpired(false)
    window.localStorage.removeItem('dbu-last-role')
  }

  const value = useMemo(
    () => ({
      user,
      role,
      loading,
      login,
      register,
      logout,
      refreshUser,
      sessionExpired,
      clearSessionExpired: () => setSessionExpired(false),
    }),
    [user, role, loading, sessionExpired]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
