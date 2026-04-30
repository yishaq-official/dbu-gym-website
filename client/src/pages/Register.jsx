import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { initializeChapaPayment } from '../lib/api'

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

function UserIcon({ className }) {
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
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}

export default function Register() {
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [memberType, setMemberType] = useState('university')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    gender: '',
    membership_type: '',
    university_id: '',
    department: '',
    national_id: '',
    address: '',
  })
  const [phoneError, setPhoneError] = useState('')

  const isUniversity = memberType === 'university'
  const submitLabel = useMemo(() => (submitting ? 'Submitting…' : 'Proceed to Payment'), [submitting])
  const previewMemberId = useMemo(() => {
    const prefix = isUniversity ? 'DBU' : 'EXT'
    const year = new Date().getFullYear()
    const seq = String(Math.floor(Math.random() * 9000) + 1000)
    return `${prefix}-${year}-${seq}`
  }, [isUniversity])

  const estimatedTotal = useMemo(() => {
    const prices = {
      Monthly: 300,
      '3Months': 800,
      '6Months': 1500,
      '1Year': 2500,
    }
    const base = prices[formValues.membership_type] || 0
    return isUniversity ? Math.round(base * 0.8) : base
  }, [formValues.membership_type, isUniversity])

  const handleChange = (event) => {
    const { name, value } = event.target
    if (name === 'phone') {
      const sanitized = value.replace(/[^0-9+]/g, '')
      setFormValues((current) => ({
        ...current,
        phone: sanitized,
      }))
      setPhoneError(getPhoneError(sanitized))
      return
    }
    setFormValues((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const getPhoneError = (value) => {
    if (!value) return ''
    if (value.startsWith('+2519') || value.startsWith('+2517')) {
      return value.length === 13 ? '' : 'Use +2519/+2517 followed by 9 digits.'
    }
    if (value.startsWith('09') || value.startsWith('07')) {
      return value.length === 10 ? '' : 'Use 09/07 followed by 8 digits.'
    }
    return 'Start with +2519, +2517, 09, or 07.'
  }

  const hasMinLength = formValues.password.length >= 8
  const hasNumberOrSymbol = /[0-9]/.test(formValues.password) && /[!@#$%^&*]/.test(formValues.password)
  const passwordStrong = hasMinLength && hasNumberOrSymbol

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitted(true)
    const payload = {
      ...formValues,
      member_type: memberType,
      terms_accepted: termsAccepted,
    }

    if (!payload.name || !payload.email || !payload.password || !payload.password_confirmation) {
      setError('Please complete all required fields.')
      return
    }

    if (!payload.phone || !payload.gender || !payload.membership_type) {
      setError('Please complete all required fields.')
      return
    }

    if (getPhoneError(payload.phone)) {
      setError('Please enter a valid phone number.')
      return
    }

    if (isUniversity && (!payload.university_id || !payload.department)) {
      setError('Please enter your university ID and department.')
      return
    }

    if (!isUniversity && (!payload.national_id || !payload.address)) {
      setError('Please enter your national ID and address.')
      return
    }

    if (!passwordStrong) {
      setError('Password must be at least 8 characters and include a number & symbol.')
      return
    }

    if (payload.password !== payload.password_confirmation) {
      setError('Passwords do not match.')
      return
    }

    if (!payload.terms_accepted) {
      setError('Please accept the terms and conditions.')
      return
    }

    setError('')
    setSubmitting(true)

    try {
      const origin = window.location.origin
      const response = await initializeChapaPayment({
        ...payload,
        membership_plan: payload.membership_type,
        return_url: `${origin}/payments/chapa/return`,
        callback_url: `${origin}/payments/chapa/return`,
      })

      if (!response?.data?.checkout_url) {
        throw new Error('Missing Chapa checkout URL.')
      }
      if (response?.data?.tx_ref) {
        window.localStorage.setItem('dbu_pending_tx_ref', response.data.tx_ref)
      }

      window.location.assign(response.data.checkout_url)
    } catch (err) {
      setError(err?.message || 'Could not start payment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const stepLabels = ['Account', 'Membership', 'Payment']

  const canProceedStep = () => {
    if (step === 1) {
      return (
        formValues.name &&
        formValues.email &&
        formValues.password &&
        formValues.password_confirmation &&
        passwordStrong &&
        formValues.password === formValues.password_confirmation
      )
    }
    if (step === 2) {
      if (!formValues.phone || getPhoneError(formValues.phone)) return false
      if (!formValues.gender || !formValues.membership_type) return false
      if (isUniversity) {
        return !!formValues.university_id && !!formValues.department
      }
      return !!formValues.national_id && !!formValues.address
    }
    return true
  }

  const handleNext = () => {
    setSubmitted(true)
    if (!canProceedStep()) return
    setStep((prev) => Math.min(prev + 1, 3))
  }

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(81,204,249,0.25),transparent_35%),radial-gradient(circle_at_90%_85%,rgba(16,185,129,0.15),transparent_35%),linear-gradient(145deg,#070b10,#101826)] text-[var(--text)]">
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.18),rgba(0,0,0,0.58))]" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-4xl">
          <div className="mb-6 text-center">
            <Link
              to="/"
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[var(--accent)] shadow-[0_0_30px_var(--accent-glow)]"
            >
              <DumbbellIcon className="h-8 w-8" />
            </Link>
            <h1 className="font-display text-3xl font-semibold text-slate-100">
              Join DBU Gym
            </h1>
            <p className="mt-2 text-sm text-slate-200/75">Create your account</p>
          </div>

          <div className="glass-panel rounded-3xl border border-white/15 p-6 shadow-2xl backdrop-blur-xl md:p-8">
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="uppercase tracking-[0.3em] text-white/40">Registration Steps</span>
                <span className="text-[var(--accent)]">Step {step} of 3</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                {stepLabels.map((label, index) => {
                  const current = index + 1
                  const active = step >= current
                  return (
                    <div key={label} className="flex flex-1 items-center gap-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
                          active
                            ? 'border-[var(--accent)] bg-[var(--accent)] text-black'
                            : 'border-white/20 text-white/50'
                        }`}
                      >
                        {current}
                      </div>
                      <span className={`text-xs ${active ? 'text-white' : 'text-white/50'}`}>
                        {label}
                      </span>
                      {index < stepLabels.length - 1 ? (
                        <div className="mx-2 h-px flex-1 bg-white/10"></div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.3em] text-white/50">Gym Member ID</div>
                    <div className="mt-1 text-sm font-semibold text-white">{previewMemberId}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-[0.3em] text-white/50">Estimated Total</div>
                    <div className="mt-1 text-sm font-semibold text-[var(--accent)]">{estimatedTotal} ETB</div>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-white/50">
                  Final member ID is generated after registration.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setMemberType('university')}
                  disabled={submitting}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    isUniversity
                      ? 'bg-[var(--accent)] text-black'
                      : 'border border-white/20 text-white/80'
                  }`}
                >
                  University Member
                </button>
                <button
                  type="button"
                  onClick={() => setMemberType('external')}
                  disabled={submitting}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    !isUniversity
                      ? 'bg-[var(--accent)] text-black'
                      : 'border border-white/20 text-white/80'
                  }`}
                >
                  External Member
                </button>
              </div>

              {step === 1 ? (
                <div className="animate-fade-up">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block text-sm text-white/70">
                      Full Name
                      <div className={`mt-2 flex items-center gap-3 rounded-2xl border bg-black/40 px-4 py-3 text-white ${
                        submitted && !formValues.name ? 'border-red-400/60' : 'border-white/20'
                      }`}>
                        <UserIcon className="h-5 w-5 text-[var(--accent)]" />
                        <input
                          type="text"
                          name="name"
                          value={formValues.name}
                          onChange={handleChange}
                          disabled={submitting}
                          placeholder="Your name"
                          className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                        />
                      </div>
                      {submitted && !formValues.name ? (
                        <span className="mt-2 block text-xs text-red-200">Full name is required.</span>
                      ) : null}
                    </label>

                    <label className="block text-sm text-white/70">
                      Email Address
                      <div className={`mt-2 flex items-center gap-3 rounded-2xl border bg-black/40 px-4 py-3 text-white ${
                        submitted && !formValues.email ? 'border-red-400/60' : 'border-white/20'
                      }`}>
                        <MailIcon className="h-5 w-5 text-[var(--accent)]" />
                        <input
                          type="email"
                          name="email"
                          value={formValues.email}
                          onChange={handleChange}
                          disabled={submitting}
                          placeholder="you@example.com"
                          className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                        />
                      </div>
                      {submitted && !formValues.email ? (
                        <span className="mt-2 block text-xs text-red-200">Email is required.</span>
                      ) : null}
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block text-sm text-white/70">
                      Password
                      <div className={`mt-2 flex items-center gap-3 rounded-2xl border bg-black/40 px-4 py-3 text-white ${
                        submitted && !formValues.password ? 'border-red-400/60' : 'border-white/20'
                      }`}>
                        <LockIcon className="h-5 w-5 text-[var(--accent)]" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formValues.password}
                          onChange={handleChange}
                          placeholder="••••••••"
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
                      <div className="mt-2 flex flex-wrap gap-3 text-xs">
                        <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-300' : 'text-red-300'}`}>
                          <span className="h-2 w-2 rounded-full bg-current"></span> 8+ chars
                        </span>
                        <span className={`flex items-center gap-1 ${hasNumberOrSymbol ? 'text-emerald-300' : 'text-red-300'}`}>
                          <span className="h-2 w-2 rounded-full bg-current"></span> Number & symbol
                        </span>
                      </div>
                    </label>
                    <label className="block text-sm text-white/70">
                      Confirm Password
                      <div className={`mt-2 flex items-center gap-3 rounded-2xl border bg-black/40 px-4 py-3 text-white ${
                        submitted && (!formValues.password_confirmation || formValues.password_confirmation !== formValues.password)
                          ? 'border-red-400/60'
                          : 'border-white/20'
                      }`}>
                        <LockIcon className="h-5 w-5 text-[var(--accent)]" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="password_confirmation"
                          value={formValues.password_confirmation}
                          onChange={handleChange}
                          disabled={submitting}
                          placeholder="••••••••"
                          className="w-full bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="text-[var(--accent)]"
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          <i className={showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                        </button>
                      </div>
                      {submitted && formValues.password_confirmation && formValues.password_confirmation !== formValues.password ? (
                        <span className="mt-2 block text-xs text-red-200">Passwords do not match.</span>
                      ) : null}
                    </label>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="animate-fade-up">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block text-sm text-white/70">
                      Phone Number
                      <input
                        type="tel"
                        name="phone"
                        value={formValues.phone}
                        onChange={handleChange}
                        disabled={submitting}
                        placeholder="09... or +251..."
                        className={`mt-2 w-full rounded-2xl border bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none ${
                          submitted && (!formValues.phone || phoneError) ? 'border-red-400/60' : 'border-white/20'
                        }`}
                      />
                      {phoneError ? (
                        <span className="mt-2 block text-xs text-red-300">{phoneError}</span>
                      ) : null}
                    </label>
                    <label className="block text-sm text-white/70">
                      Gender
                      <select
                        name="gender"
                        value={formValues.gender}
                        onChange={handleChange}
                        disabled={submitting}
                        className="mt-2 w-full rounded-2xl border border-white/20 bg-black/40 px-4 py-3 text-sm text-white focus:outline-none"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </label>
                  </div>

                  <label className="block text-sm text-white/70">
                    Membership Plan
                    <select
                      name="membership_type"
                      value={formValues.membership_type}
                      onChange={handleChange}
                      disabled={submitting}
                      className={`mt-2 w-full rounded-2xl border bg-black/40 px-4 py-3 text-sm text-white focus:outline-none ${
                        submitted && !formValues.membership_type ? 'border-red-400/60' : 'border-white/20'
                      }`}
                    >
                      <option value="">Select Plan Duration</option>
                      <option value="Monthly">Monthly</option>
                      <option value="3Months">3 Months</option>
                      <option value="6Months">6 Months</option>
                      <option value="1Year">1 Year</option>
                    </select>
                  </label>

                  {isUniversity ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block text-sm text-white/70">
                        University ID
                        <input
                          type="text"
                          name="university_id"
                          value={formValues.university_id}
                          onChange={handleChange}
                          disabled={submitting}
                          className={`mt-2 w-full rounded-2xl border bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none ${
                            submitted && isUniversity && !formValues.university_id ? 'border-red-400/60' : 'border-white/20'
                          }`}
                        />
                      </label>
                      <label className="block text-sm text-white/70">
                        Department/College
                        <input
                          type="text"
                          name="department"
                          value={formValues.department}
                          onChange={handleChange}
                          disabled={submitting}
                          className={`mt-2 w-full rounded-2xl border bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none ${
                            submitted && isUniversity && !formValues.department ? 'border-red-400/60' : 'border-white/20'
                          }`}
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block text-sm text-white/70">
                        National ID / Passport
                        <input
                          type="text"
                          name="national_id"
                          value={formValues.national_id}
                          onChange={handleChange}
                          disabled={submitting}
                          className={`mt-2 w-full rounded-2xl border bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none ${
                            submitted && !isUniversity && !formValues.national_id ? 'border-red-400/60' : 'border-white/20'
                          }`}
                        />
                      </label>
                      <label className="block text-sm text-white/70">
                        Address
                        <input
                          type="text"
                          name="address"
                          value={formValues.address}
                          onChange={handleChange}
                          disabled={submitting}
                          className={`mt-2 w-full rounded-2xl border bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none ${
                            submitted && !isUniversity && !formValues.address ? 'border-red-400/60' : 'border-white/20'
                          }`}
                        />
                      </label>
                    </div>
                  )}
                </div>
              ) : null}

              {step === 3 ? (
                <div className="animate-fade-up">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
                    After clicking <span className="font-semibold text-[var(--accent)]">Perform Payment</span>,
                    you will be redirected to Chapa checkout to complete your payment.
                  </div>

                  <label className="flex items-center gap-2 text-xs text-white/70">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(event) => setTermsAccepted(event.target.checked)}
                      disabled={submitting}
                      className="h-4 w-4 rounded border-white/30 bg-black/40 text-[var(--accent)]"
                    />
                    I agree to the{' '}
                    <Link to="/terms" className="text-[var(--accent)] hover:underline">
                      terms and conditions
                    </Link>
                    .
                  </label>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={submitting}
                    className="flex-1 rounded-full border border-white/20 px-4 py-3 text-sm font-semibold text-white/70 transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Back
                  </button>
                ) : null}
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={submitting}
                    className="flex-1 rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-black shadow-[0_15px_40px_var(--accent-glow)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting || !termsAccepted}
                    className="flex-1 rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-black shadow-[0_15px_40px_var(--accent-glow)] transition hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitting ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/60 border-t-transparent"></span>
                        Redirecting…
                      </span>
                    ) : (
                      submitLabel
                    )}
                  </button>
                )}
              </div>
            </form>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-100">
                <span className="font-semibold">Registration error:</span> {error}
              </div>
            ) : null}

            <p className="mt-6 text-center text-sm text-white/60">
              Already have an account?{' '}
              <Link to="/login" className="text-[var(--accent)] hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
