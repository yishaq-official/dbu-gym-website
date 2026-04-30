import { Link } from 'react-router-dom'

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

function MoonIcon({ className }) {
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
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  )
}

function SunIcon({ className }) {
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
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M6.34 17.66l-1.41 1.41" />
      <path d="M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function NavLink({ href, children }) {
  return (
    <a
      href={href}
      className="text-sm font-semibold tracking-wide text-white/70 transition hover:text-white"
    >
      {children}
    </a>
  )
}

export default function Header({ theme, onToggleTheme, toggleLabel }) {
  return (
    <header className="fixed inset-x-0 top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <Link to="/" className="flex items-center gap-3 text-lg font-semibold">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--accent)] glow-ring">
            <DumbbellIcon className="h-8 w-8" />
          </span>
          <span className="font-display text-4xl tracking-wide text-white md:text-5xl">
            <span className="text-[var(--accent)]">DBU</span>GYM
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <NavLink href="#home">Home</NavLink>
          <NavLink href="#about">About</NavLink>
          <NavLink href="#apparatus">Apparatus</NavLink>
          <NavLink href="#pricing">Pricing</NavLink>
          <NavLink href="#contact">Contact</NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={toggleLabel}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:border-[var(--accent)] hover:shadow-[0_0_25px_var(--accent-glow)]"
          >
            {theme === 'dark' ? (
              <SunIcon className="h-4 w-4 text-[var(--accent)]" />
            ) : (
              <MoonIcon className="h-4 w-4 text-[var(--accent)]" />
            )}
            <span className="uppercase tracking-[0.2em]">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>
          <Link
            to="/login"
            className="rounded-full border border-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent)] hover:text-black"
          >
            Login / Register
          </Link>
        </div>
      </div>
    </header>
  )
}
