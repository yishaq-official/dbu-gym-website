import { useEffect, useState } from 'react'
import AdminNavbar from '../../components/AdminNavbar'
import Footer from '../../components/Footer'
import { getAuditLogs } from '../../lib/api'

const adminUser = {
  name: 'Admin Dawit',
}

export default function AdminActivity() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [theme, setTheme] = useState(document.documentElement.dataset.theme || 'dark')

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await getAuditLogs(50)
        setLogs(data?.logs || [])
      } catch (err) {
        setError(err?.message || 'Unable to load activity.')
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [])

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    window.localStorage.setItem('dbu-theme', next)
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <AdminNavbar adminName={adminUser.name} theme={theme} onToggleTheme={handleToggleTheme} />

      <main className="mx-auto w-full max-w-6xl px-6 py-10 md:px-8">
        <div className="mb-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm shadow-black/5">
          <h1 className="text-2xl font-semibold">Activity & Audit Log</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Review the latest admin actions and system events in one place.
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--text-muted)]">
            Loading recent activity...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-400/40 bg-red-500/10 p-6 text-sm text-red-100">
            {error}
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="grid grid-cols-4 gap-4 border-b border-[var(--border)] bg-[var(--surface-strong)] px-6 py-4 text-xs uppercase tracking-[0.2em] text-[var(--text-soft)] sm:grid-cols-[2fr_1fr_1fr_1fr]">
              <span>Action</span>
              <span>User</span>
              <span>Details</span>
              <span className="hidden sm:block">When</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {logs.length === 0 ? (
                <div className="px-6 py-8 text-sm text-[var(--text-muted)]">No activity recorded yet.</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="grid grid-cols-4 gap-4 px-6 py-4 text-sm sm:grid-cols-[2fr_1fr_1fr_1fr]">
                    <span className="font-semibold text-[var(--text)]">{log.action.replace(/_/g, ' ')}</span>
                    <span className="text-[var(--text-soft)]">{log.user_name || 'System'}</span>
                    <span className="text-[var(--text-muted)] truncate">
                      {(() => {
                        if (!log.details) return '—'
                        try {
                          const parsed = JSON.parse(log.details)
                          return typeof parsed === 'string' ? parsed : JSON.stringify(parsed)
                        } catch {
                          return log.details
                        }
                      })()}
                    </span>
                    <span className="hidden text-[var(--text-soft)] sm:block">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
