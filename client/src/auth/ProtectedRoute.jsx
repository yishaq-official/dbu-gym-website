import { useEffect, useRef } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'

export default function ProtectedRoute({ role }) {
  const { user, loading, role: userRole, refreshUser } = useAuth()
  const hasRefreshed = useRef(false)

  useEffect(() => {
    if (hasRefreshed.current) return
    hasRefreshed.current = true
    refreshUser()
  }, [refreshUser])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-[var(--text-muted)]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)]/40 border-t-transparent"></div>
          Checking your session...
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (role && userRole !== role) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
