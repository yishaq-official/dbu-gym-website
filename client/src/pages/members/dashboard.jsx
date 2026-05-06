import { useEffect, useState } from 'react'
import Footer from '../../components/Footer'
import MemberNavbar from '../../components/MemberNavbar'
import { useAuth } from '../../auth/useAuth'
import { getMemberDashboard, initializeChapaPayment } from '../../lib/api'
import { useNavigate } from 'react-router-dom'
import {
  membershipPackages,
  getMembershipPackagePrice,
  getMembershipPackageLabel,
  normalizeMembershipPackageKey,
} from '../../lib/pricing'

const member = {
  name: 'Mekdes Alemu',
  memberId: 'DBU-10245',
  accountType: 'Student',
  status: 'Active',
  uniId: 'DBU-2023-1542',
  department: 'Software Engineering',
  planType: 'Monthly',
  startDate: 'Mar 01, 2026',
  expiryDate: 'Mar 31, 2026',
  planCost: '800 ETB',
  paymentStatus: 'Paid',
  remainingDays: '14',
}

export default function Dashboard() {
  const { user } = useAuth()
  const displayName = user?.name || member.name
  const avatarUrl = user?.avatar_url || ''
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [renewing, setRenewing] = useState(false)
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [renewPlan, setRenewPlan] = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    let active = true

    const loadDashboard = async () => {
      try {
        const data = await getMemberDashboard()
        if (!active) return
        setDashboard(data?.data || null)
      } catch (err) {
        if (active) setError(err?.message || 'Unable to load dashboard data.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [refreshTrigger])

  useEffect(() => {
    const shouldRefresh = window.localStorage.getItem('dbu_force_dashboard_refresh') === 'true'
    if (shouldRefresh) {
      window.localStorage.removeItem('dbu_force_dashboard_refresh')
      setRefreshTrigger(Date.now())
    }
  }, [])

  const memberInfo = dashboard?.member || {}
  const planInfo = dashboard?.plan || {}
  const notifications = Array.isArray(dashboard?.notifications) ? dashboard.notifications : []
  const resolvedName = memberInfo.name || displayName

  const renewalPlan = renewPlan || normalizeMembershipPackageKey(planInfo.type || member.planType)
  const isUniversityMember = (memberInfo.member_type || '').toLowerCase() === 'university'
  const estimatedPrice = getMembershipPackagePrice(renewalPlan, isUniversityMember ? 'university' : 'external')
  const navigate = useNavigate();

  const handleRenew = async () => {
    setError('')
    setRenewing(true)

    const membershipType = renewalPlan
    const memberType = (memberInfo.member_type || user?.member_type || 'university').toString()
    const customerName = resolvedName
    const customerEmail = user?.email || memberInfo.email || ''
    const customerPhone = user?.phone || memberInfo.phone || ''

    if (!customerEmail) {
      setError('Your account email is required to start payment.')
      setRenewing(false)
      return
    }

    try {
      const origin = window.location.origin
      const response = await initializeChapaPayment({
        renewal: true,
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        membership_type: membershipType,
        member_type: memberType,
        return_url: `${origin}/payments/chapa/return?source=renewal`,
      })

      const checkoutUrl = response?.data?.checkout_url || response?.checkout_url
      const txRef = response?.data?.tx_ref || response?.tx_ref
      if (!checkoutUrl) {
        throw new Error('Missing payment checkout URL.')
      }
      if (txRef) {
        window.localStorage.setItem('dbu_pending_tx_ref', txRef)
      }

      window.location.assign(checkoutUrl)
    } catch (err) {
      setError(err?.message || 'Failed to start payment.')
    } finally {
      setRenewing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <MemberNavbar memberName={resolvedName} avatarUrl={memberInfo.avatar_url || avatarUrl} />

      <main className="mx-auto w-full max-w-6xl px-6 py-10 md:px-8">
        <h1 className="text-2xl font-semibold">
          Welcome Back, <span className="text-[var(--accent)]">{resolvedName}</span>!
        </h1>
        {loading ? (
          <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
            Loading dashboard data...
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <h2 className="text-lg font-semibold">Account Details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-soft)]">
                    Full Name
                  </p>
                  <p className="mt-2 text-lg font-semibold">{resolvedName}</p>
                </div>
                <div className="flex items-center gap-3">
                  {memberInfo.avatar_url || avatarUrl ? (
                    <img
                      src={memberInfo.avatar_url || avatarUrl}
                      alt={resolvedName}
                      className="h-12 w-12 rounded-full border border-[var(--border)] object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-strong)] text-sm font-semibold text-[var(--text-muted)]">
                      {resolvedName?.[0] || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-soft)]">
                      Member Avatar
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">Profile photo</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-soft)]">
                    Gym Member ID
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--accent)]">
                    {memberInfo.member_id || member.memberId}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-soft)]">
                    Account Type
                  </p>
                  <span className="mt-2 inline-flex rounded-full border border-[var(--border)] px-3 py-1 text-sm text-[var(--text-muted)]">
                    {memberInfo.member_type || member.accountType}
                  </span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-soft)]">
                    Membership Status
                  </p>
                  <span className="mt-2 inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-200">
                    {memberInfo.status || member.status}
                  </span>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4">
                <p className="text-sm font-semibold text-[var(--text-muted)]">
                  Identity & Emergency
                </p>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-soft)]">
                      University ID
                    </p>
                    <p className="mt-2 text-sm font-semibold">{memberInfo.university_id || member.uniId}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-soft)]">
                      Department
                    </p>
                    <p className="mt-2 text-sm font-semibold">{memberInfo.department || member.department}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-soft)]">
                      Date of Birth
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {memberInfo.date_of_birth
                        ? new Date(memberInfo.date_of_birth).toLocaleDateString()
                        : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-soft)]">
                      Emergency Contact
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {memberInfo.emergency_contact_name || 'Not set'}
                    </p>
                    <p className="text-xs text-[var(--text-soft)]">
                      {memberInfo.emergency_contact_phone || ''}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <h2 className="text-lg font-semibold">Membership Summary</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-soft)]">
                    Membership Package
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {getMembershipPackageLabel(normalizeMembershipPackageKey(planInfo.type || member.planType)) || planInfo.type || member.planType}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-soft)]">
                    Start Date
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {planInfo.start_date ? new Date(planInfo.start_date).toLocaleDateString() : member.startDate}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-soft)]">
                    Expiry Date
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {planInfo.expiry_date ? new Date(planInfo.expiry_date).toLocaleDateString() : member.expiryDate}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-soft)]">
                    Plan Cost
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--accent)]">
                    {planInfo.cost ? `${planInfo.cost} ETB` : member.planCost}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-soft)]">
                    Payment Status
                  </p>
                  <span className="mt-2 inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-sm text-emerald-200">
                    {planInfo.payment_status || member.paymentStatus}
                  </span>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-soft)]">
                    Remaining Days
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {typeof planInfo.remaining_days === 'number' ? planInfo.remaining_days : member.remainingDays}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--text-soft)]">
                Notifications
              </h3>
              <div className="mt-4 space-y-3">
                {notifications.length ? (
                  notifications.map((note, idx) => {
                    const severity = (note?.severity || '').toString().toLowerCase()
                    const accent =
                      severity === 'danger'
                        ? 'border-red-400/40 bg-red-500/10 text-red-100'
                        : severity === 'warning'
                          ? 'border-amber-400/40 bg-amber-500/10 text-amber-50'
                          : 'border-[var(--border)] bg-[var(--surface-strong)] text-[var(--text)]'

                    return (
                      <div
                        key={`${note?.type || 'note'}-${idx}`}
                        className={`rounded-2xl border px-4 py-3 text-sm ${accent}`}
                      >
                        {note?.message || 'Notification'}
                      </div>
                    )
                  })
                ) : (
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--text-muted)]">
                    No notifications right now.
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--text-soft)]">
                Quick Actions
              </h3>
              <div className="mt-4 grid gap-3">
                <button className="rounded-2xl border border-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--accent)] hover:text-black" 
                  onClick={() => navigate('/members/profile')}>
                  Update Profile
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowRenewModal(true)}
                  disabled={renewing}
                  className="rounded-2xl border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--text-soft)] transition hover:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-70"
                >

                  Renew Membership
                </button>
              </div>
            </section>
          </aside>
        </div>
      </main>
      <Footer />

      {showRenewModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[var(--text)]">Renew Membership</h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Choose a plan to renew your membership.
            </p>
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--text-muted)]">
              Estimated total:{' '}
              <span className="font-semibold text-[var(--accent)]">
                {estimatedPrice ? `${estimatedPrice} ETB` : 'Select a plan'}
              </span>
            </div>
            <label className="mt-4 block text-sm text-[var(--text-muted)]">
              Membership Package
              <select
                value={renewPlan}
                onChange={(event) => setRenewPlan(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
              >
                <option value="">
                  Keep Current ({getMembershipPackageLabel(normalizeMembershipPackageKey(planInfo.type || member.planType)) || planInfo.type || member.planType})
                </option>
                {membershipPackages.map((plan) => (
                  <option key={plan.key} value={plan.key}>
                    {plan.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowRenewModal(false)}
                className="flex-1 rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-soft)] transition hover:border-[var(--accent)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRenew}
                disabled={renewing || !renewalPlan || estimatedPrice === 0}
                className="flex-1 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {renewing ? 'Renewing...' : 'Confirm Renewal'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
