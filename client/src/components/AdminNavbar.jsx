import { Link, useNavigate } from 'react-router-dom'
import adminLogo from '../assets/admin-logo.png'
import { useAuth } from '../auth/useAuth'

export default function AdminNavbar({ adminName, theme, onToggleTheme }) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/login')
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface-strong)]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 md:px-8">
        <Link to="/" className="flex items-center gap-3 text-lg font-semibold text-[var(--text)]">
          <img src={adminLogo} alt="DBU Gym Logo" className="h-9 w-9 rounded-full object-cover" />
          <span>
            <span className="text-[var(--accent)]">DBU</span>-GYM Admin
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-6 text-sm">
          <Link className="text-[var(--accent)]" to="/admin/dashboard">
            Dashboard
          </Link>
          <Link className="text-[var(--text-muted)]" to="/admin/approvals">
            Approvals
          </Link>
          <Link className="text-[var(--text-muted)]" to="/admin/approvals/history">
            Approval Log
          </Link>
          <Link className="text-[var(--text-muted)]" to="#member-management">
            Members
          </Link>
          <Link className="text-[var(--text-muted)]" to="/admin/settings">
            Settings
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)]"
            aria-label="Toggle theme"
          >
            <i className={theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'}></i>
          </button>
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)]">
              {adminName}
              <span className="text-[var(--text-soft)]">▾</span>
            </summary>
            <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3 shadow-xl">
              <p className="px-3 pb-2 text-xs uppercase tracking-[0.3em] text-[var(--text-soft)]">
                Profile
              </p>
              <Link to="/admin/profile" className="block rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)]">
                Profile Settings
              </Link>
              <div className="my-2 border-t border-[var(--border)]"></div>
              <p className="px-3 pb-2 text-xs uppercase tracking-[0.3em] text-[var(--text-soft)]">
                System
              </p>
              <Link to="/admin/settings" className="block rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)]">
                System Settings
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 block w-full rounded-lg border border-red-400/60 px-3 py-2 text-center text-xs font-semibold text-red-200"
              >
                Logout
              </button>
            </div>
          </details>
        </div>
      </div>
    </header>
  )
}
