import { useEffect, useMemo, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute'
import { useAuth } from './auth/useAuth'
import ForgotPassword from './pages/ForgotPassword'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Terms from './pages/Terms'
import PaymentReturn from './pages/PaymentReturn'
import PendingApproval from './pages/PendingApproval'
import MembersDashboard from './pages/members/dashboard'
import EditProfile from './pages/members/EditProfile'
import AdminDashboard from './pages/admin/Dashboard'
import Approvals from './pages/admin/Approvals'
import ApprovalHistory from './pages/admin/ApprovalHistory'
import AdminProfile from './pages/admin/Profile'
import AdminSettings from './pages/admin/Settings'

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark'
  const stored = window.localStorage.getItem('dbu-theme')
  if (stored === 'light' || stored === 'dark') return stored
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
  return prefersLight ? 'light' : 'dark'
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme)
  const { sessionExpired, clearSessionExpired } = useAuth()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('dbu-theme', theme)
  }, [theme])

  const toggleLabel = useMemo(
    () => (theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'),
    [theme]
  )

  const handleToggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <>
      {sessionExpired ? (
        <div className="fixed top-4 left-1/2 z-50 w-[min(92vw,540px)] -translate-x-1/2 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">Session expired</p>
              <p className="text-xs text-amber-200/80">
                Please log in again to continue.
              </p>
            </div>
            <button
              type="button"
              onClick={clearSessionExpired}
              className="rounded-full border border-amber-400/50 px-3 py-1 text-xs font-semibold text-amber-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
      <Routes>
      <Route
        path="/"
        element={
          <Home
            theme={theme}
            onToggleTheme={handleToggleTheme}
            toggleLabel={toggleLabel}
          />
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/register" element={<Register />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/payments/chapa/return" element={<PaymentReturn />} />
      <Route path="/pending-approval" element={<PendingApproval />} />

      <Route element={<ProtectedRoute role="member" />}>
        <Route path="/members/dashboard" element={<MembersDashboard />} />
        <Route path="/members/profile" element={<EditProfile />} />
      </Route>

      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/approvals" element={<Approvals />} />
        <Route path="/admin/approvals/history" element={<ApprovalHistory />} />
        <Route path="/admin/profile" element={<AdminProfile />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>
      </Routes>
    </>
  )
}
