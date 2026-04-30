import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
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

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [touched, setTouched] = useState({ email: false, password: false })
  const [showPassword, setShowPassword] = useState(false)
  const API_BASE =
    import.meta.env.VITE_API_BASE || 'http://localhost/gym-website/server/public'

  useEffect(() => {
    const oauthError = (searchParams.get('oauth_error') || '').toLowerCase()
    if (!oauthError) return

    const messages = {
      google_callback_failed: 'Google login failed. Please try again.',
      google_email_missing: 'Your Google account does not provide an email address.',
      account_not_found: 'No account found for this Google email. Use email/password login.',
    }

    setError(messages[oauthError] || 'Google login failed. Please try again.')
  }, [searchParams])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedEmail = email.trim()

    if (!trimmedEmail || !password) {
      setTouched({ email: true, password: true })
      setError('Please enter your email and password.')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      const user = await login({ email: trimmedEmail, password })
      const resolvedRole = user?.role === 'admin' ? 'admin' : 'member'
      navigate(resolvedRole === 'admin' ? '/admin/dashboard' : '/members/dashboard')
    } catch (err) {
      setError(err?.message || 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.assign(`${API_BASE}/api/auth/google/redirect`)
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
              DBU Gym System
            </h1>
            <p className="mt-2 text-sm text-white/70">Member & Admin Login</p>
          </div>

          <div className="glass-panel rounded-3xl p-6 shadow-2xl md:p-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block text-sm text-white/70">
                Email Address
                <div className={`mt-2 flex items-center gap-3 rounded-2xl border bg-black/40 px-4 py-3 text-white ${
                  touched.email && !email.trim()
                    ? 'border-red-400/60'
                    : 'border-white/20'
                }`}>
                  <MailIcon className="h-5 w-5 text-[var(--accent)]" />
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                    disabled={submitting}
                    className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                  />
                </div>
                {touched.email && !email.trim() ? (
                  <span className="mt-2 block text-xs text-red-200">Email is required.</span>
                ) : null}
              </label>

              <label className="block text-sm text-white/70">
                Password
                <div className={`mt-2 flex items-center gap-3 rounded-2xl border bg-black/40 px-4 py-3 text-white ${
                  touched.password && !password
                    ? 'border-red-400/60'
                    : 'border-white/20'
                }`}>
                  <LockIcon className="h-5 w-5 text-[var(--accent)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                    disabled={submitting}
                    className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-[var(--accent)]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                  </button>
                </div>
                {touched.password && !password ? (
                  <span className="mt-2 block text-xs text-red-200">Password is required.</span>
                ) : null}
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-black shadow-[0_15px_40px_var(--accent-glow)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/60 border-t-transparent"></span>
                    Signing in…
                  </span>
                ) : (
                  'Log In'
                )}
              </button>
            </form>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
                <span className="font-semibold">Login error:</span> {error}
              </div>
            ) : null}

            <div className="mt-5">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:border-[var(--accent)] hover:text-white"
              >
                <i className="fab fa-google text-[var(--accent)]"></i>
                Continue with Google
              </button>
            </div>

            <div className="mt-6 text-center text-sm text-white/60">
              <Link to="/forgot" className="text-[var(--accent)] hover:underline">
                Forgot password
              </Link>
            </div>
            <p className="mt-3 text-center text-sm text-white/60">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-[var(--accent)] hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
