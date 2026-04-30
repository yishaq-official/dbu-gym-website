import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { resetPassword } from '../lib/api'

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
      <path d="M17 7v10" />
      <path d="M20 9v6" />
      <rect x="9" y="10" width="6" height="4" rx="2" />
    </svg>
  )
}

function LockIcon({ className }) {
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
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [token, setToken] = useState(searchParams.get('token') || '')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!email.trim() || !token.trim() || !password || !passwordConfirmation) {
      setError('Please complete all reset fields.')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      await resetPassword({
        email: email.trim(),
        token: token.trim(),
        password,
        password_confirmation: passwordConfirmation,
      })
      navigate('/login')
    } catch (err) {
      setError(err?.message || 'Unable to reset password.')
    } finally {
      setSubmitting(false)
    }
  }

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
              Create New Password
            </h1>
            <p className="mt-2 text-sm text-white/70">
              Use your reset token to secure your account.
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-6 shadow-2xl md:p-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error ? (
                <div className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {error}
                </div>
              ) : null}

              <label className="block text-sm text-white/70">
                Email Address
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={submitting}
                  className="mt-2 w-full rounded-2xl border border-white/20 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none"
                />
              </label>

              <label className="block text-sm text-white/70">
                Reset Token
                <input
                  type="text"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  disabled={submitting}
                  className="mt-2 w-full rounded-2xl border border-white/20 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none"
                />
              </label>

              <label className="block text-sm text-white/70">
                New Password
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/20 bg-black/40 px-4 py-3 text-white">
                  <LockIcon className="h-5 w-5 text-[var(--accent)]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={submitting}
                    className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                  />
                </div>
              </label>

              <label className="block text-sm text-white/70">
                Confirm Password
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/20 bg-black/40 px-4 py-3 text-white">
                  <LockIcon className="h-5 w-5 text-[var(--accent)]" />
                  <input
                    type="password"
                    value={passwordConfirmation}
                    onChange={(event) => setPasswordConfirmation(event.target.value)}
                    disabled={submitting}
                    className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-black shadow-[0_15px_40px_var(--accent-glow)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)]"
              >
                {submitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
