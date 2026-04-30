import { useEffect, useRef, useState } from 'react'
import Footer from '../../components/Footer'
import MemberNavbar from '../../components/MemberNavbar'
import { useAuth } from '../../auth/useAuth'
import { getMemberProfile, updateMemberProfile, updateMemberPassword, uploadMemberAvatar } from '../../lib/api'

const member = {
  name: 'Mekdes Alemu',
  memberId: 'DBU-10245',
  membershipType: 'Student',
  universityId: 'DBU-2023-1542',
  department: 'Software Engineering',
  email: 'member@dbugym.com',
  phone: '+251 911 000 000',
}

export default function EditProfile() {
  const { user } = useAuth()
  const displayName = user?.name || member.name
  const [previewUrl, setPreviewUrl] = useState('')
  const fileInputRef = useRef(null)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [formValues, setFormValues] = useState({
    name: displayName,
    email: user?.email || member.email,
    email_confirmation: user?.email || member.email,
    phone: member.phone,
    department: member.department,
    member_id: member.memberId,
    membership_type: member.membershipType,
    university_id: member.universityId,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [passwordValues, setPasswordValues] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  useEffect(() => {
    let active = true

    const loadProfile = async () => {
      try {
        const data = await getMemberProfile()
        if (!active) return
        const fetched = data?.user
        if (fetched) {
          setFormValues((current) => ({
            ...current,
            name: fetched.name || current.name,
            email: fetched.email || current.email,
            email_confirmation: fetched.email || current.email_confirmation,
            phone: fetched.phone || current.phone,
            department: fetched.department || current.department,
            member_id: fetched.member_id || current.member_id,
            membership_type: fetched.membership_type || current.membership_type,
            university_id: fetched.university_id || current.university_id,
          }))
          if (fetched.avatar_url) setAvatarUrl(fetched.avatar_url)
        }
      } catch (err) {
        if (active) setError(err?.message || 'Unable to load member profile.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadProfile()

    return () => {
      active = false
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handlePickImage = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    const nextUrl = URL.createObjectURL(file)
    setPreviewUrl(nextUrl)

    try {
      setAvatarUploading(true)
      const data = await uploadMemberAvatar(file)
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url)
      }
    } catch (err) {
      setError(err?.message || 'Avatar upload failed.')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleRemoveImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSaveProfile = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (formValues.email.trim() !== formValues.email_confirmation.trim()) {
      setError('Email confirmation does not match.')
      return
    }

    setSaving(true)

    try {
      const data = await updateMemberProfile({
        name: formValues.name.trim(),
        email: formValues.email.trim(),
        email_confirmation: formValues.email_confirmation.trim(),
        phone: formValues.phone.trim() || null,
        department: formValues.department.trim() || null,
        member_id: formValues.member_id || null,
        membership_type: formValues.membership_type || null,
        university_id: formValues.university_id || null,
      })
      const updated = data?.user
      if (updated) {
        setFormValues((current) => ({
          ...current,
          name: updated.name || current.name,
          email: updated.email || current.email,
          email_confirmation: updated.email || current.email_confirmation,
          phone: updated.phone || current.phone,
          department: updated.department || current.department,
          member_id: updated.member_id || current.member_id,
          membership_type: updated.membership_type || current.membership_type,
          university_id: updated.university_id || current.university_id,
        }))
      }
      setSuccess(data?.message || 'Profile updated.')
    } catch (err) {
      setError(err?.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = (event) => {
    const { name, value } = event.target
    setPasswordValues((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleSavePassword = async (event) => {
    event.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    setPasswordSaving(true)

    try {
      const data = await updateMemberPassword({
        current_password: passwordValues.current_password,
        password: passwordValues.password,
        password_confirmation: passwordValues.password_confirmation,
      })
      setPasswordSuccess(data?.message || 'Password updated.')
      setPasswordValues({
        current_password: '',
        password: '',
        password_confirmation: '',
      })
    } catch (err) {
      setPasswordError(err?.message || 'Failed to update password.')
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <MemberNavbar memberName={displayName} avatarUrl={avatarUrl || user?.avatar_url} />

      <main className="mx-auto w-full max-w-6xl px-6 py-10 md:px-8">
        <h1 className="text-2xl font-semibold">Edit Profile & Settings</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Keep your account details up to date. (Simulation page)
        </p>
        {loading ? (
          <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-muted)]">
            Loading member profile...
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_2fr]">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-strong)] text-2xl text-[var(--accent)]">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  className="h-full w-full object-cover"
                />
              ) : avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                'ME'
              )}
            </div>
            <h2 className="mt-4 text-lg font-semibold">{displayName}</h2>
            <p className="text-xs text-[var(--text-soft)]">ID: {member.memberId}</p>

            <div className="mt-6 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={handlePickImage}
                className="w-full rounded-full border border-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--accent)] hover:text-black"
              >
                {avatarUploading ? 'Uploading...' : 'Update Picture'}
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="w-full rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-soft)] transition hover:border-[var(--accent)]"
              >
                Remove Picture
              </button>
            </div>
          </section>

          <section className="space-y-6">
            <form
              onSubmit={handleSaveProfile}
              className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6"
            >
              <h2 className="text-lg font-semibold">Personal Information</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="text-sm text-[var(--text-muted)]">
                  Full Name
                  <input
                    type="text"
                    name="name"
                    value={formValues.name}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </label>
                <label className="text-sm text-[var(--text-muted)]">
                  Email
                  <input
                    type="email"
                    name="email"
                    value={formValues.email}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </label>
                <label className="text-sm text-[var(--text-muted)]">
                  Confirm Email
                  <input
                    type="email"
                    name="email_confirmation"
                    value={formValues.email_confirmation}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </label>
                <label className="text-sm text-[var(--text-muted)]">
                  Phone Number
                  <input
                    type="tel"
                    name="phone"
                    value={formValues.phone}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </label>
                <label className="text-sm text-[var(--text-muted)]">
                  Gym Member ID (Read Only)
                  <input
                    type="text"
                    readOnly
                    value={formValues.member_id}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--text-soft)]"
                  />
                </label>
                <label className="text-sm text-[var(--text-muted)]">
                  Membership Type (Read Only)
                  <input
                    type="text"
                    readOnly
                    value={formValues.membership_type}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--text-soft)]"
                  />
                </label>
                <label className="text-sm text-[var(--text-muted)]">
                  University ID (Read Only)
                  <input
                    type="text"
                    readOnly
                    value={formValues.university_id}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--text-soft)]"
                  />
                </label>
                <label className="text-sm text-[var(--text-muted)] md:col-span-2">
                  Department
                  <input
                    type="text"
                    name="department"
                    value={formValues.department}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </label>
              </div>
              {success ? (
                <div className="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  {success}
                </div>
              ) : null}
              {error ? (
                <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {error}
                </div>
              ) : null}
              <button
                type="submit"
                disabled={saving}
                className="mt-6 w-full rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>

            <form
              onSubmit={handleSavePassword}
              className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6"
            >
              <h2 className="text-lg font-semibold">Change Password</h2>
              <div className="mt-4 grid gap-4">
                <label className="text-sm text-[var(--text-muted)]">
                  Old Password
                  <input
                    type="password"
                    name="current_password"
                    value={passwordValues.current_password}
                    onChange={handlePasswordChange}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </label>
                <label className="text-sm text-[var(--text-muted)]">
                  New Password
                  <input
                    type="password"
                    name="password"
                    value={passwordValues.password}
                    onChange={handlePasswordChange}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </label>
                <label className="text-sm text-[var(--text-muted)]">
                  Confirm New Password
                  <input
                    type="password"
                    name="password_confirmation"
                    value={passwordValues.password_confirmation}
                    onChange={handlePasswordChange}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)] focus:border-[var(--accent)] focus:outline-none"
                  />
                </label>
              </div>
              {passwordSuccess ? (
                <div className="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  {passwordSuccess}
                </div>
              ) : null}
              {passwordError ? (
                <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {passwordError}
                </div>
              ) : null}
              <button
                type="submit"
                disabled={passwordSaving}
                className="mt-6 w-full rounded-full border border-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--accent)] hover:text-black disabled:cursor-not-allowed disabled:opacity-70"
              >
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
