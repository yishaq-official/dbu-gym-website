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

function MailIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  )
}

export default function ForgotPassword() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80')] bg-cover bg-center opacity-25" />
      <div className="absolute inset-0 bg-black/70" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <Link
              to="/"
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-[var(--accent)] shadow-[0_0_30px_var(--accent-glow)]"
            >
              <DumbbellIcon className="h-8 w-8" />
            </Link>
            <h1 className="font-display text-3xl font-semibold text-white">
              Reset Your Password
            </h1>
            <p className="mt-2 text-sm text-white/70">
              Enter your email and we’ll send reset instructions.
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-6 shadow-2xl md:p-8">
            <form className="space-y-5">
              <label className="block text-sm text-white/70">
                Email Address
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/20 bg-black/40 px-4 py-3 text-white">
                  <MailIcon className="h-5 w-5 text-[var(--accent)]" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                  />
                </div>
              </label>

              <button
                type="submit"
                className="w-full rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-black shadow-[0_15px_40px_var(--accent-glow)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]"
              >
                Send Reset Link
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-white/60">
              Remembered your password?{' '}
              <Link to="/login" className="text-[var(--accent)] hover:underline">
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
