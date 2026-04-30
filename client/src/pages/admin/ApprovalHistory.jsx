import { useEffect, useMemo, useState } from 'react'
import AdminNavbar from '../../components/AdminNavbar'
import Footer from '../../components/Footer'
import { exportAdminApprovalHistoryCsv, getAdminApprovalHistory } from '../../lib/api'

export default function ApprovalHistory() {
  const [theme, setTheme] = useState(
    document.documentElement.dataset.theme || 'dark'
  )
  const [records, setRecords] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all')
  const [minPlanCost, setMinPlanCost] = useState('')
  const [maxPlanCost, setMaxPlanCost] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sortBy, setSortBy] = useState('date_desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    window.localStorage.setItem('dbu-theme', next)
  }

  useEffect(() => {
    let active = true
    const timeout = setTimeout(() => {
      const loadHistory = async () => {
        try {
          const data = await getAdminApprovalHistory({
            status: statusFilter || 'all',
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
            name: user.name,
            email: user.email,
            memberId: user.member_id || 'N/A',
            memberType: user.member_type || 'N/A',
            status: (user.membership_status || '').toLowerCase(),
            approvedBy: user.approved_by_name || '—',
            approvedAt: user.approved_at
              ? new Date(user.approved_at).toLocaleString()
              : '—',
            approvedAtRaw: user.approved_at || null,
            rejectedBy: user.rejected_by_name || '—',
            rejectedAt: user.rejected_at
              ? new Date(user.rejected_at).toLocaleString()
              : '—',
            rejectedAtRaw: user.rejected_at || null,
            reason: user.rejection_reason || '—',
          }))
          setRecords(rows)
        } catch (err) {
          if (active) setError(err?.message || 'Unable to load approval history.')
        } finally {
          if (active) setLoading(false)
        }
      }

      loadHistory()
    }, 300)

    return () => {
      clearTimeout(timeout)
      active = false
    }
  }, [search, statusFilter, typeFilter, paymentStatusFilter, minPlanCost, maxPlanCost, fromDate, toDate])

  const sortedRecords = useMemo(() => {
    const statusOrder = { approved: 1, active: 1, rejected: 2, pending: 3, '': 4 }
    const getDateValue = (record) => {
      const raw = record.approvedAtRaw || record.rejectedAtRaw
      return raw ? new Date(raw).getTime() : 0
    }
    const data = [...records]
    if (sortBy === 'date_asc') {
      return data.sort((a, b) => getDateValue(a) - getDateValue(b))
    }
    if (sortBy === 'status') {
      return data.sort(
        (a, b) =>
          (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9) ||
          getDateValue(b) - getDateValue(a)
      )
    }
    return data.sort((a, b) => getDateValue(b) - getDateValue(a))
  }, [records, sortBy])

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
      await exportAdminApprovalHistoryCsv({
        status: statusFilter || 'all',
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
            <h1 className="text-2xl font-semibold">Approval History</h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Track approvals, rejections, and audit details.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
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
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
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
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="status">Status Grouped</option>
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

        {loading ? (
          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
            Loading approval history...
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mt-6 overflow-x-auto rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-strong)] text-xs uppercase text-[var(--text-soft)]">
              <tr>
                <th className="px-4 py-3">Member</th>
                <th>Status</th>
                <th>Approved By</th>
                <th>Approved At</th>
                <th>Rejected By</th>
                <th>Rejected At</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {sortedRecords.length ? (
                sortedRecords.map((record) => (
                  <tr key={record.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{record.name}</div>
                      <div className="text-xs text-[var(--text-soft)]">
                        {record.memberId}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`rounded-full border px-2 py-1 text-xs ${
                          record.status === 'approved' || record.status === 'active'
                            ? 'border-emerald-400/60 text-emerald-200'
                            : record.status === 'rejected'
                            ? 'border-red-400/60 text-red-200'
                            : 'border-amber-400/60 text-amber-200'
                        }`}
                      >
                        {record.status || 'pending'}
                      </span>
                    </td>
                    <td>{record.approvedBy}</td>
                    <td className="text-xs text-[var(--text-soft)]">{record.approvedAt}</td>
                    <td>{record.rejectedBy}</td>
                    <td className="text-xs text-[var(--text-soft)]">{record.rejectedAt}</td>
                    <td className="text-xs text-[var(--text-soft)]">{record.reason}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-10 text-center text-[var(--text-soft)]">
                    No approval history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <Footer />
    </div>
  )
}
