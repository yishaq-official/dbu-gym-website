import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import adminLogo from '../assets/admin-logo.png'
import { useAuth } from '../auth/useAuth'

const navLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/approvals', label: 'Approvals' },
  { to: '/admin/approvals/history', label: 'Approval Log' },
  { to: '/admin/activity', label: 'Activity' },
  { to: '/admin/equipment', label: 'Equipment' },
  { to: '/admin/settings', label: 'Settings' },
]

export default function AdminNavbar({ adminName, theme, onToggleTheme }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/login')
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface-strong)]/95 backdrop-blur-xl shadow-sm shadow-black/10">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Link to="/admin/dashboard" className="flex items-center gap-3 rounded-2xl border border-transparent bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]/30 hover:bg-[var(--surface-strong)]">
            <img src={adminLogo} alt="DBU Gym Logo" className="h-10 w-10 rounded-full object-cover" />
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">DBU Gym Admin</p>
              <p className="text-xs text-[var(--text-soft)]">Control center</p>
            </div>
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]/40 lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label="Toggle admin menu"
        >
          <i className={menuOpen ? 'fas fa-times' : 'fas fa-bars'}></i>
          Menu
        </button>

        <nav className={`w-full transition-all duration-200 ${menuOpen ? 'max-h-96' : 'max-h-0'} overflow-hidden lg:max-h-none lg:w-auto`}>
          <ul className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
            {navLinks.map((link) => {
              const active = location.pathname === link.to || location.pathname.startsWith(link.to + '/')
              return (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className={`block rounded-full border px-4 py-2 text-sm font-medium transition ${active ? 'bg-[var(--accent)] text-black shadow-sm shadow-[var(--accent-glow)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]/40 hover:text-[var(--text)] hover:bg-[var(--surface)]'}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
            aria-label="Toggle theme"
          >
            <i className={theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon'}></i>
          </button>
          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]/40">
              {adminName}
              <span className="text-[var(--text-soft)]">▾</span>
            </summary>
            <div className="absolute right-0 z-50 mt-3 w-64 rounded-3xl border border-[var(--border)] bg-[var(--bg)] p-4 shadow-xl shadow-black/10">
              <p className="px-3 pb-2 text-xs uppercase tracking-[0.3em] text-[var(--text-soft)]">Profile</p>
              <Link to="/admin/profile" className="block rounded-2xl px-3 py-2 text-sm text-[var(--text)] transition hover:bg-[var(--surface)] hover:text-[var(--accent)]">
                Profile Settings
              </Link>
              <div className="my-3 border-t border-[var(--border)]"></div>
              <p className="px-3 pb-2 text-xs uppercase tracking-[0.3em] text-[var(--text-soft)]">System</p>
              <Link to="/admin/settings" className="block rounded-2xl px-3 py-2 text-sm text-[var(--text)] transition hover:bg-[var(--surface)] hover:text-[var(--accent)]">
                System Settings
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 w-full rounded-2xl border border-red-400/50 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200 transition hover:border-red-400 hover:bg-red-500/15"
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
