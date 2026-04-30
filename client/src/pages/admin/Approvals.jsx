import { useEffect, useState } from 'react'
import AdminNavbar from '../../components/AdminNavbar'
import Footer from '../../components/Footer'
import {
  approveMember,
  exportAdminApprovalsCsv,
  getAdminApprovals,
  rejectMember,
} from '../../lib/api'

export default function Approvals() {
  const [theme, setTheme] = useState(
    document.documentElement.dataset.theme || 'dark'
  )
  const [pending, setPending] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [typeFilter, setTypeFilter] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all')
  const [minPlanCost, setMinPlanCost] = useState('')
  const [maxPlanCost, setMaxPlanCost] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  const pendingCount = pending.length

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    window.localStorage.setItem('dbu-theme', next)
  }

  useEffect(() => {
    let active = true
    const timeout = setTimeout(() => {
      const loadApprovals = async () => {
        try {
          const data = await getAdminApprovals({
            status: statusFilter || 'pending',
            search,
            member_type: typeFilter || undefined,
            payment_status: paymentStatusFilter === 'all' ? undefined : paymentStatusFilter,
            min_plan_cost: minPlanCost || undefined,
            max_plan_cost: maxPlanCost || undefined,
            from_date: fromDate || undefined,
            to_date: toDate || undefined,
          })
          if (!active) return
          const rows = (data?.data || []).map((user) => ({
            id: user.id,
            joinDate: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A',
            fullName: user.name,
            email: user.email,
            membershipId: user.member_id || 'N/A',
            membershipType: user.membership_type || 'N/A',
            membershipPlan: user.membership_plan || user.membership_type || 'N/A',
            planCost: user.plan_cost ?? null,
            isUniversityMember: user.member_type === 'university',
            universityId: user.university_id || '',
            department: user.department || '',
            nationalId: user.national_id || '',
            address: user.address || '',
            gender: user.gender || '',
            phone: user.phone || '',
            paymentStatus: (user.payment_status || '').toLowerCase() || 'pending',
            status: (user.membership_status || '').toLowerCase(),
          }))
          setPending(rows)
        } catch (err) {
          if (active) setError(err?.message || 'Unable to load approvals.')
        } finally {
          if (active) setLoading(false)
        }
      }

      loadApprovals()
    }, 300)

    return () => {
      clearTimeout(timeout)
      active = false
    }
  }, [search, statusFilter, typeFilter, paymentStatusFilter, minPlanCost, maxPlanCost, fromDate, toDate])

  const handleApprove = async () => {
    if (!selected) return
    try {
      await approveMember(selected.id)
      setPending((prev) => prev.filter((member) => member.id !== selected.id))
      setSelected(null)
      setRejectReason('')
    } catch (err) {
      setError(err?.message || 'Failed to approve member.')
    }
  }

  const handleReject = async () => {
    if (!selected) return
    try {
      await rejectMember(selected.id, rejectReason ? { reason: rejectReason } : undefined)
      setPending((prev) => prev.filter((member) => member.id !== selected.id))
      setSelected(null)
      setRejectReason('')
    } catch (err) {
      setError(err?.message || 'Failed to reject member.')
    }
  }

  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const applyPreset = (days) => {
    const today = new Date()
    const from = new Date()
    from.setDate(today.getDate() - days + 1)
    setFromDate(formatDate(from))
    setToDate(formatDate(today))
  }

  const exportCsv = async () => {
    try {
      await exportAdminApprovalsCsv({
        status: statusFilter || 'pending',
        search,
        member_type: typeFilter || undefined,
        payment_status: paymentStatusFilter === 'all' ? undefined : paymentStatusFilter,
        min_plan_cost: minPlanCost || undefined,
        max_plan_cost: maxPlanCost || undefined,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      })
    } catch (err) {
      setError(err?.message || 'Unable to export CSV.')
    }
  }

  const applyThisMonth = () => {
    const today = new Date()
    const first = new Date(today.getFullYear(), today.getMonth(), 1)
    setFromDate(formatDate(first))
    setToDate(formatDate(today))
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <AdminNavbar
        adminName="Admin Dawit"
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className="mx-auto w-full max-w-6xl px-6 py-10 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Approvals</h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Review and approve member applications.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs text-red-200">
              Results: {pendingCount}
            </span>
            <button
              type="button"
              onClick={() => {
                setLoading(true)
                setError('')
                getAdminApprovals({
                  status: statusFilter || 'pending',
                  search,
                  member_type: typeFilter || undefined,
                  payment_status: paymentStatusFilter === 'all' ? undefined : paymentStatusFilter,
                  min_plan_cost: minPlanCost || undefined,
                  max_plan_cost: maxPlanCost || undefined,
                  from_date: fromDate || undefined,
                  to_date: toDate || undefined,
                })
                  .then((data) => {
                    const rows = (data?.data || []).map((user) => ({
                      id: user.id,
                      joinDate: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A',
                      fullName: user.name,
                      email: user.email,
                      membershipId: user.member_id || 'N/A',
                      membershipType: user.membership_type || 'N/A',
                      membershipPlan: user.membership_plan || user.membership_type || 'N/A',
                      planCost: user.plan_cost ?? null,
                      isUniversityMember: user.member_type === 'university',
                      universityId: user.university_id || '',
                      department: user.department || '',
                      nationalId: user.national_id || '',
                      address: user.address || '',
                      gender: user.gender || '',
                      phone: user.phone || '',
                      paymentStatus: (user.payment_status || '').toLowerCase() || 'pending',
                      status: (user.membership_status || '').toLowerCase(),
                    }))
                    setPending(rows)
                  })
                  .catch((err) => setError(err?.message || 'Unable to load approvals.'))
                  .finally(() => setLoading(false))
              }}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text)]"
            >
              Refresh
            </button>
          </div>
        </div>
        {loading ? (
          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
            Loading approvals...
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, member ID..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm"
          >
            <option value="">All Types</option>
            <option value="university">University</option>
            <option value="external">External</option>
          </select>
          <select
            value={paymentStatusFilter}
            onChange={(event) => setPaymentStatusFilter(event.target.value)}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm"
          >
            <option value="all">All Payment</option>
            <option value="Paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <label className="text-xs text-[var(--text-soft)]">
            Min Plan Cost (ETB)
            <input
              type="number"
              min="0"
              value={minPlanCost}
              onChange={(event) => setMinPlanCost(event.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-[var(--text-soft)]">
            Max Plan Cost (ETB)
            <input
              type="number"
              min="0"
              value={maxPlanCost}
              onChange={(event) => setMaxPlanCost(event.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-[var(--text-soft)]">
            From
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-[var(--text-soft)]">
            To
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-soft)]">
          <div className="flex flex-wrap items-center gap-2">
            <span>Quick range:</span>
            <button
              type="button"
              onClick={() => applyPreset(7)}
              className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text)]"
            >
              Last 7 days
            </button>
            <button
              type="button"
              onClick={() => applyPreset(30)}
              className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text)]"
            >
              Last 30 days
            </button>
            <button
              type="button"
              onClick={() => applyPreset(90)}
              className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text)]"
            >
              Last 90 days
            </button>
            <button
              type="button"
              onClick={applyThisMonth}
              className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text)]"
            >
              This month
            </button>
            <button
              type="button"
              onClick={() => {
                setFromDate('')
                setToDate('')
                setMinPlanCost('')
                setMaxPlanCost('')
                setPaymentStatusFilter('all')
              }}
              className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text)]"
            >
              Clear
            </button>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-full border border-[var(--accent)] px-3 py-1 text-xs text-[var(--accent)]"
          >
            Export CSV
          </button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-strong)] text-xs uppercase text-[var(--text-soft)]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th>Name</th>
                <th>Type</th>
                <th>ID Number</th>
                <th>Plan</th>
                <th>Status</th>
                <th className="text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.length ? (
                pending.map((member) => (
                  <tr key={member.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3 text-[var(--text-soft)]">
                      {member.joinDate}
                    </td>
                    <td className="font-semibold">{member.fullName}</td>
                    <td>
                      <span className="rounded-full border border-[var(--border)] px-2 py-1 text-xs">
                        {member.isUniversityMember ? 'Uni' : 'Ext'}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-[var(--text-soft)]">
                      {member.isUniversityMember
                        ? member.universityId
                        : member.nationalId || 'N/A'}
                    </td>
                    <td>{member.membershipType}</td>
                    <td>
                      <span
                        className={`rounded-full border px-2 py-1 text-xs ${
                          member.status === 'approved' || member.status === 'active'
                            ? 'border-emerald-400/60 text-emerald-200'
                            : member.status === 'rejected'
                            ? 'border-red-400/60 text-red-200'
                            : 'border-amber-400/60 text-amber-200'
                        }`}
                      >
                        {member.status || 'pending'}
                      </span>
                    </td>
                    <td className="text-right pr-4">
                      <button
                        type="button"
                        disabled={member.status && member.status !== 'pending'}
                        onClick={() => {
                          setSelected(member)
                          setRejectReason('')
                        }}
                        className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {member.status && member.status !== 'pending' ? 'View' : 'Review'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-[var(--text-soft)]">
                    All caught up! No pending approvals.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <Footer />

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--bg)] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Review Application</h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-[var(--text-soft)]"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--surface)] text-2xl text-[var(--accent)]">
                {selected.fullName
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <h4 className="mt-4 text-lg font-semibold">{selected.fullName}</h4>
              <p className="text-sm text-[var(--text-soft)]">{selected.email}</p>
            </div>

            <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-strong)] p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-[var(--text-soft)]">Membership ID</span>
                <span className="font-semibold">{selected.membershipId}</span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-[var(--text-soft)]">Type</span>
                <span className="font-semibold">
                  {selected.isUniversityMember ? 'University' : 'External'}
                </span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-[var(--text-soft)]">Plan Paid</span>
                <span className="font-semibold">
                  {selected.membershipPlan}
                  {selected.planCost ? ` (${selected.planCost} ETB)` : ''}
                </span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-[var(--text-soft)]">Phone</span>
                <span className="font-semibold">{selected.phone}</span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-[var(--text-soft)]">Sex</span>
                <span className="font-semibold">{selected.gender || 'N/A'}</span>
              </div>
              {selected.isUniversityMember ? (
                <>
                  <div className="mt-2 flex justify-between gap-4">
                    <span className="text-[var(--text-soft)]">University ID</span>
                    <span className="font-semibold">{selected.universityId || 'N/A'}</span>
                  </div>
                  <div className="mt-2 flex justify-between gap-4">
                    <span className="text-[var(--text-soft)]">Department/College</span>
                    <span className="font-semibold">{selected.department || 'N/A'}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-2 flex justify-between gap-4">
                    <span className="text-[var(--text-soft)]">FAN / National ID</span>
                    <span className="font-semibold">{selected.nationalId || 'N/A'}</span>
                  </div>
                  <div className="mt-2 flex justify-between gap-4">
                    <span className="text-[var(--text-soft)]">Address</span>
                    <span className="font-semibold">{selected.address || 'N/A'}</span>
                  </div>
                </>
              )}
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-[var(--text-soft)]">Payment</span>
                <span
                  className={`font-semibold ${
                    selected.paymentStatus === 'paid' ? 'text-emerald-200' : 'text-amber-200'
                  }`}
                >
                  {selected.paymentStatus || 'pending'}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm text-[var(--text-soft)]">
                Reject Reason (optional)
                <textarea
                  rows="3"
                  value={rejectReason}
                  onChange={(event) => setRejectReason(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                  placeholder="Add a short reason for rejection..."
                />
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleReject}
                disabled={selected.status && selected.status !== 'pending'}
                className="w-full rounded-full border border-red-400/60 px-4 py-2 text-sm font-semibold text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={selected.status && selected.status !== 'pending'}
                className="w-full rounded-full bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
