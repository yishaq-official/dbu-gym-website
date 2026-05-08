import { useEffect, useMemo, useState } from 'react'
import AdminNavbar from '../../components/AdminNavbar'
import Footer from '../../components/Footer'
import {
  createAdminEquipment,
  deleteAdminEquipment,
  getAdminEquipment,
  updateAdminEquipment,
} from '../../lib/api'

const emptyForm = {
  equipment_code: '',
  name: '',
  type: '',
  status: 'available',
  notes: '',
}

function readEquipment(response) {
  return response?.data?.equipment || response?.equipment || []
}

function statusClass(status) {
  if (status === 'maintenance') return 'border-amber-400/50 bg-amber-500/10 text-amber-100'
  if (status === 'out_of_service') return 'border-red-400/50 bg-red-500/10 text-red-100'
  return 'border-emerald-400/50 bg-emerald-500/10 text-emerald-100'
}

function statusLabel(status) {
  return (status || 'available').replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function Equipment() {
  const [equipment, setEquipment] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  const sortedEquipment = useMemo(
    () => [...equipment].sort((a, b) => String(a.name).localeCompare(String(b.name))),
    [equipment]
  )

  const loadEquipment = async () => {
    const data = await getAdminEquipment()
    setEquipment(readEquipment(data))
  }

  useEffect(() => {
    let active = true

    getAdminEquipment()
      .then((data) => {
        if (active) setEquipment(readEquipment(data))
      })
      .catch((err) => {
        if (active) setError(err?.message || 'Unable to load equipment.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleEdit = (item) => {
    setEditingId(item.id)
    setForm({
      equipment_code: item.equipment_code || '',
      name: item.name || '',
      type: item.type || '',
      status: item.status || 'available',
      notes: item.notes || item.description || '',
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setToast(null)

    try {
      if (editingId) {
        await updateAdminEquipment(editingId, form)
        setToast({ type: 'success', message: 'Equipment updated successfully.' })
      } else {
        await createAdminEquipment(form)
        setToast({ type: 'success', message: 'Equipment created successfully.' })
      }
      resetForm()
      await loadEquipment()
    } catch (err) {
      setError(err?.message || 'Unable to save equipment.')
      setToast({ type: 'error', message: err?.message || 'Unable to save equipment.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete ${item.name}?`)) return

    setError('')
    setToast(null)
    try {
      await deleteAdminEquipment(item.id)
      setToast({ type: 'success', message: 'Equipment deleted successfully.' })
      await loadEquipment()
      if (editingId === item.id) resetForm()
    } catch (err) {
      setError(err?.message || 'Unable to delete equipment.')
      setToast({ type: 'error', message: err?.message || 'Unable to delete equipment.' })
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <AdminNavbar adminName="Admin" />

      <main className="mx-auto w-full max-w-6xl px-6 py-10 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--text-soft)]">
              Equipment
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Equipment control</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
              Manage the apparatus shown on the public landing page.
            </p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]/50"
          >
            New equipment
          </button>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[380px_1fr]">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <h2 className="text-lg font-semibold">{editingId ? 'Edit equipment' : 'Add equipment'}</h2>
            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm text-[var(--text-muted)]">
                Equipment Code
                <input
                  name="equipment_code"
                  value={form.equipment_code}
                  onChange={updateField}
                  placeholder="EQ-FW-001"
                  required
                  className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                />
              </label>

              <label className="block text-sm text-[var(--text-muted)]">
                Name
                <input
                  name="name"
                  value={form.name}
                  onChange={updateField}
                  placeholder="Free Weights"
                  required
                  className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-[var(--text-muted)]">
                  Type
                  <input
                    name="type"
                    value={form.type}
                    onChange={updateField}
                    placeholder="Strength"
                    className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </label>
                <label className="block text-sm text-[var(--text-muted)]">
                  Status
                  <select
                    name="status"
                    value={form.status}
                    onChange={updateField}
                    className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                  >
                    <option value="available">Available</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="out_of_service">Out of service</option>
                  </select>
                </label>
              </div>

              <label className="block text-sm text-[var(--text-muted)]">
                Public Description
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={updateField}
                  rows="4"
                  placeholder="Describe this apparatus for the landing page."
                  className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                />
              </label>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingId ? 'Update equipment' : 'Create equipment'}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--text-muted)] transition hover:border-[var(--accent)]/40"
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold">Equipment list</h2>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-soft)]">
                {sortedEquipment.length} items
              </span>
            </div>

            <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--border)]">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--surface-strong)] text-xs uppercase text-[var(--text-soft)]">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-[var(--text-soft)]">
                        Loading equipment...
                      </td>
                    </tr>
                  ) : sortedEquipment.length ? (
                    sortedEquipment.map((item) => (
                      <tr key={item.id} className="border-t border-[var(--border)] hover:bg-[var(--surface-strong)]">
                        <td className="px-4 py-3 font-mono text-xs">{item.equipment_code}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold">{item.name}</p>
                          {item.notes ? <p className="mt-1 max-w-sm text-xs text-[var(--text-soft)]">{item.notes}</p> : null}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{item.type || 'General'}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(item.status)}`}>
                            {statusLabel(item.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(item)}
                              className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold transition hover:border-[var(--accent)]/40"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item)}
                              className="rounded-full border border-red-400/50 px-3 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/10"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-[var(--text-soft)]">
                        No equipment added yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      <Footer />

      {toast ? (
        <div
          className={`fixed bottom-6 right-6 rounded-2xl px-4 py-3 text-sm font-semibold shadow-xl ${
            toast.type === 'success'
              ? 'bg-emerald-500/90 text-black'
              : 'bg-red-500/90 text-white'
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  )
}
