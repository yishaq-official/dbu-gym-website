import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { verifyChapaPayment } from '../lib/api'

export default function PaymentReturn() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('Verifying your payment...')
  const [details, setDetails] = useState('')

  const txRef = useMemo(
    () =>
      searchParams.get('tx_ref') ||
      searchParams.get('trx_ref') ||
      searchParams.get('reference') ||
      window.localStorage.getItem('dbu_pending_tx_ref') ||
      '',
    [searchParams]
  )

  useEffect(() => {
    let active = true
    const getFailureCopy = (raw) => {
      const text = String(raw || '').toLowerCase()
      if (text.includes('missing transaction reference')) {
        return {
          title: 'We could not detect your payment reference.',
          details: 'Please retry from registration. If payment was already charged, contact support with your receipt.',
        }
      }
      if (text.includes('cancel')) {
        return {
          title: 'Payment was canceled before completion.',
          details: 'You can return to registration and try payment again.',
        }
      }
      if (text.includes('insufficient') || text.includes('declin')) {
        return {
          title: 'Payment was not approved by your bank or wallet.',
          details: 'Use another payment method or retry after confirming your balance.',
        }
      }
      if (text.includes('expired') || text.includes('timeout')) {
        return {
          title: 'The payment session expired.',
          details: 'Please restart payment from registration.',
        }
      }
      return {
        title: 'Payment verification failed.',
        details: raw || 'Please try again or contact support with your transaction reference.',
      }
    }

    const verifyPayment = async () => {
      if (!txRef) {
        if (!active) return
        const copy = getFailureCopy('missing transaction reference')
        setStatus('failed')
        setMessage(copy.title)
        setDetails(copy.details)
        return
      }

      try {
        const response = await verifyChapaPayment(txRef)
        if (!active) return

        if (response?.data?.status === 'success') {
          window.localStorage.removeItem('dbu_pending_tx_ref')
          setStatus('success')
          setMessage('Payment verified. Redirecting to pending approval page...')
          setDetails('')
          window.setTimeout(() => {
            navigate(`/pending-approval?tx_ref=${encodeURIComponent(txRef)}`, { replace: true })
          }, 1200)
          return
        }

        const copy = getFailureCopy(response?.data?.failure_reason || response?.message)
        setStatus('failed')
        setMessage(copy.title)
        setDetails(copy.details)
      } catch (err) {
        if (!active) return
        const copy = getFailureCopy(err?.message)
        setStatus('failed')
        setMessage(copy.title)
        setDetails(copy.details)
      }
    }

    verifyPayment()

    return () => {
      active = false
    }
  }, [navigate, txRef])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(81,204,249,0.25),transparent_35%),radial-gradient(circle_at_90%_85%,rgba(16,185,129,0.15),transparent_35%),linear-gradient(145deg,#070b10,#101826)] text-[var(--text)]">
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-emerald-400/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.18),rgba(0,0,0,0.58))]" />
      <main className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-6 py-16">
        <div className="glass-panel z-10 w-full rounded-3xl border border-white/15 p-8 text-center shadow-2xl backdrop-blur-xl">
          <h1 className="font-display text-2xl font-semibold text-slate-100">Payment Status</h1>
          <p className="mt-4 text-sm text-slate-200/80">{message}</p>
          {details ? <p className="mt-2 text-xs text-slate-300/75">{details}</p> : null}

          {status === 'verifying' ? (
            <div className="mt-6 inline-flex items-center gap-2 text-sm text-[var(--accent)]">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)]/60 border-t-transparent"></span>
              Checking transaction
            </div>
          ) : null}

          {status === 'failed' ? (
            <div className="mt-6 space-y-3">
              <Link
                to="/register"
                className="inline-flex rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-black"
              >
                Back to Registration
              </Link>
              <p className="text-xs text-slate-300/70">Reference: {txRef || 'N/A'}</p>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
