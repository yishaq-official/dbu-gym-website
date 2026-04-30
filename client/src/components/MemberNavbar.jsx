import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

function DumbbellIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 9v6" />
      <path d="M7 7v10" />
      <path d="M10 8h4" />
      <path d="M10 16h4" />
      <path d="M14 8h0" />
      <path d="M14 16h0" />
      <path d="M17 7v10" />
      <path d="M20 9v6" />
      <rect x="9" y="10" width="6" height="4" rx="2" />
    </svg>
  )
}

function NavLink({ to, children, active }) {
  return (
    <Link
      to={to}
      className={`text-sm font-semibold transition ${
        active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
      } hover:text-[var(--accent)]`}
    >
      {children}
    </Link>
  )
}

export default function MemberNavbar({ memberName, avatarUrl }) {
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
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-alt)]">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4 md:px-8">
        <Link to="/" className="flex items-center gap-3 text-lg font-semibold">
          <span className="text-[var(--accent)]">
            <DumbbellIcon className="h-6 w-6" />
          </span>
          <span className="font-display text-2xl tracking-wide text-[var(--text)]">
            <span className="text-[var(--accent)]">DBU</span> Gym
          </span>
        </Link>

        <details className="relative">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={memberName}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/20 text-xs font-semibold text-emerald-200">
                {memberName?.[0] || 'U'}
              </span>
            )}
            {memberName}
            <svg
              className="h-4 w-4 text-[var(--text-soft)]"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z"
                clipRule="evenodd"
              />
            </svg>
          </summary>
          <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3 shadow-xl">
            <div className="px-2 pb-2 text-xs uppercase tracking-[0.3em] text-[var(--text-soft)]">
              Navigation
            </div>
            <div className="flex flex-col gap-2">
              <NavLink to="/members/dashboard" active>
                Dashboard
              </NavLink>
              <NavLink to="/members/profile">Edit Profile</NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-2 rounded-full border border-red-400/60 px-4 py-2 text-center text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
              >
                Logout
              </button>
            </div>
          </div>
        </details>
      </div>
    </header>
  )
}
