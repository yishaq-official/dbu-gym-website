import { Link, useSearchParams } from 'react-router-dom'

export default function PendingApproval() {
  const [searchParams] = useSearchParams()
  const txRef = searchParams.get('tx_ref') || ''

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(81,204,249,0.25),transparent_35%),radial-gradient(circle_at_90%_85%,rgba(16,185,129,0.15),transparent_35%),linear-gradient(145deg,#070b10,#101826)] text-[var(--text)]">
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.18),rgba(0,0,0,0.58))]" />
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-6 py-16">
        <div className="glass-panel z-10 w-full rounded-3xl border border-white/15 p-8 shadow-2xl backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--accent)]">Registration Completed</p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-slate-100">Pending Admin Approval</h1>
          <p className="mt-4 text-sm text-slate-200/80">
            Your payment was received and your account has been created. An admin will review your membership request.
            You will be able to fully access member features after approval.
          </p>

          <div className="mt-6 rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-sm text-slate-200/90">
            <p>Status: <span className="font-semibold text-amber-300">PendingApproval</span></p>
            {txRef ? <p className="mt-1 text-xs text-slate-300/70">Transaction Reference: {txRef}</p> : null}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-black"
            >
              Go to Login
            </Link>
            <Link
              to="/"
              className="rounded-full border border-white/25 px-5 py-2 text-sm font-semibold text-slate-100/90"
            >
              Back Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
