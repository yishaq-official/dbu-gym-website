import { useEffect, useMemo, useState } from 'react'
import AdminNavbar from '../../components/AdminNavbar'
import Footer from '../../components/Footer'
import { getSystemSettings, updateSystemSettings, uploadSystemLogo } from '../../lib/api'
import { applyAccentColor } from '../../lib/theme'

const defaultSettings = {
  systemName: 'DBU Gym System',
  language: 'en',
  timezone: 'UTC+3',
  maintenanceMode: false,
  twoFA: true,
  passwordPolicy: {
    minLength: 8,
    expiryDays: 90,
    specialChars: true,
  },
  sessionTimeout: 30,
  maxLoginAttempts: 3,
  emailNotifications: true,
  smsNotifications: false,
  senderEmail: 'support@dbugym.com',
  apiKey: '*************',
  autoBackup: true,
  backupFrequency: 'weekly',
  theme: 'dark',
  accentColor: '#51CCF9',
  layoutStyle: 'comfortable',
}

export default function AdminSettings() {
  const [settings, setSettings] = useState(defaultSettings)
  const [savedSnapshot, setSavedSnapshot] = useState(defaultSettings)
  const [savingSection, setSavingSection] = useState(null)
  const [toast, setToast] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [logoUrl, setLogoUrl] = useState('')
  const [logoUploading, setLogoUploading] = useState(false)
  const [theme, setTheme] = useState(
    document.documentElement.dataset.theme || 'dark'
  )

  useEffect(() => {
    setSettings((prev) => ({ ...prev, theme }))
  }, [theme])

  useEffect(() => {
    let active = true

    const loadSettings = async () => {
      try {
        const data = await getSystemSettings()
        if (!active) return
        const loaded = data?.settings
        if (loaded) {
          setSettings((prev) => ({
            ...prev,
            systemName: loaded.system_name ?? prev.systemName,
            language: loaded.language ?? prev.language,
            timezone: loaded.timezone ?? prev.timezone,
            maintenanceMode: !!loaded.maintenance_mode,
            twoFA: !!loaded.two_fa,
            passwordPolicy: {
              minLength: loaded.password_min_length ?? prev.passwordPolicy.minLength,
              expiryDays: loaded.password_expiry_days ?? prev.passwordPolicy.expiryDays,
              specialChars: !!loaded.password_special_chars,
            },
            sessionTimeout: loaded.session_timeout ?? prev.sessionTimeout,
            maxLoginAttempts: loaded.max_login_attempts ?? prev.maxLoginAttempts,
            emailNotifications: !!loaded.email_notifications,
            smsNotifications: !!loaded.sms_notifications,
            senderEmail: loaded.sender_email ?? prev.senderEmail,
            apiKey: loaded.api_key ?? prev.apiKey,
            autoBackup: !!loaded.auto_backup,
            backupFrequency: loaded.backup_frequency ?? prev.backupFrequency,
            theme: loaded.theme ?? prev.theme,
            accentColor: loaded.accent_color ?? prev.accentColor,
            layoutStyle: loaded.layout_style ?? prev.layoutStyle,
          }))
          setSavedSnapshot((prev) => ({
            ...prev,
            systemName: loaded.system_name ?? prev.systemName,
            language: loaded.language ?? prev.language,
            timezone: loaded.timezone ?? prev.timezone,
            maintenanceMode: !!loaded.maintenance_mode,
            twoFA: !!loaded.two_fa,
            passwordPolicy: {
              minLength: loaded.password_min_length ?? prev.passwordPolicy.minLength,
              expiryDays: loaded.password_expiry_days ?? prev.passwordPolicy.expiryDays,
              specialChars: !!loaded.password_special_chars,
            },
            sessionTimeout: loaded.session_timeout ?? prev.sessionTimeout,
            maxLoginAttempts: loaded.max_login_attempts ?? prev.maxLoginAttempts,
            emailNotifications: !!loaded.email_notifications,
            smsNotifications: !!loaded.sms_notifications,
            senderEmail: loaded.sender_email ?? prev.senderEmail,
            apiKey: loaded.api_key ?? prev.apiKey,
            autoBackup: !!loaded.auto_backup,
            backupFrequency: loaded.backup_frequency ?? prev.backupFrequency,
            theme: loaded.theme ?? prev.theme,
            accentColor: loaded.accent_color ?? prev.accentColor,
            layoutStyle: loaded.layout_style ?? prev.layoutStyle,
          }))
          if (loaded.theme) {
            setTheme(loaded.theme)
            document.documentElement.dataset.theme = loaded.theme
            window.localStorage.setItem('dbu-theme', loaded.theme)
          }
          if (loaded.logo_url) {
            setLogoUrl(loaded.logo_url)
          }
          if (loaded.accent_color) {
            applyAccentColor(loaded.accent_color)
            window.localStorage.setItem('dbu-accent', loaded.accent_color)
          }
        }
      } catch (err) {
        if (active) setError(err?.message || 'Unable to load settings.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSettings()

    return () => {
      active = false
    }
  }, [])

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    window.localStorage.setItem('dbu-theme', next)
  }

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const updatePasswordPolicy = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      passwordPolicy: { ...prev.passwordPolicy, [key]: value },
    }))
  }

  const handleSave = async (sectionLabel = 'Settings') => {
    setSavingSection(sectionLabel)
    setError('')
    document.documentElement.dataset.theme = settings.theme
    window.localStorage.setItem('dbu-theme', settings.theme)
    setTheme(settings.theme)
    try {
      const payload = {
        system_name: settings.systemName,
        language: settings.language,
        timezone: settings.timezone,
        maintenance_mode: settings.maintenanceMode,
        two_fa: settings.twoFA,
        password_min_length: settings.passwordPolicy.minLength,
        password_expiry_days: settings.passwordPolicy.expiryDays,
        password_special_chars: settings.passwordPolicy.specialChars,
        session_timeout: settings.sessionTimeout,
        max_login_attempts: settings.maxLoginAttempts,
        email_notifications: settings.emailNotifications,
        sms_notifications: settings.smsNotifications,
        sender_email: settings.senderEmail,
        api_key: settings.apiKey === '*************' ? null : settings.apiKey,
        auto_backup: settings.autoBackup,
        backup_frequency: settings.backupFrequency,
        theme: settings.theme,
        accent_color: settings.accentColor,
        layout_style: settings.layoutStyle,
      }

      await updateSystemSettings(payload)
      applyAccentColor(settings.accentColor)
      window.localStorage.setItem('dbu-accent', settings.accentColor)
      setSavedSnapshot(settings)
      setToast({ type: 'success', message: `${sectionLabel} saved successfully.` })
    } catch (err) {
      setError(err?.message || 'Failed to save settings.')
      setToast({ type: 'error', message: err?.message || 'Failed to save settings.' })
    } finally {
      setSavingSection(null)
    }
  }

  const handleReload = () => {
    setSettings(defaultSettings)
  }

  const handleLogoChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    try {
      setLogoUploading(true)
      const data = await uploadSystemLogo(file)
      if (data?.logo_url) {
        setLogoUrl(data.logo_url)
        setToast({ type: 'success', message: 'Logo updated successfully.' })
      }
    } catch (err) {
      setError(err?.message || 'Logo upload failed.')
      setToast({ type: 'error', message: err?.message || 'Logo upload failed.' })
    } finally {
      setLogoUploading(false)
      event.target.value = ''
    }
  }

  const handleDownloadBackup = () => {
    const data = {
      users: [],
      admins: [],
      settings,
      logs: [],
      passwordResets: [],
    }
    const dataStr = JSON.stringify(data, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const date = new Date().toISOString().split('T')[0]
    link.download = `dbu_gym_backup_${date}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const previewTheme = useMemo(() => settings.theme, [settings.theme])

  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSnapshot),
    [settings, savedSnapshot]
  )

  const isSectionDirty = (section) => {
    const current = settings
    const saved = savedSnapshot
    const match = (value, savedValue) => JSON.stringify(value) === JSON.stringify(savedValue)

    if (section === 'General System Settings') {
      return !match(current.systemName, saved.systemName) ||
        !match(current.language, saved.language) ||
        !match(current.timezone, saved.timezone) ||
        !match(current.maintenanceMode, saved.maintenanceMode)
    }
    if (section === 'Security Settings') {
      return !match(current.twoFA, saved.twoFA) ||
        !match(current.passwordPolicy, saved.passwordPolicy) ||
        !match(current.sessionTimeout, saved.sessionTimeout) ||
        !match(current.maxLoginAttempts, saved.maxLoginAttempts)
    }
    if (section === 'Notification Settings') {
      return !match(current.emailNotifications, saved.emailNotifications) ||
        !match(current.smsNotifications, saved.smsNotifications) ||
        !match(current.senderEmail, saved.senderEmail) ||
        !match(current.apiKey, saved.apiKey)
    }
    if (section === 'Backup Settings') {
      return !match(current.autoBackup, saved.autoBackup) ||
        !match(current.backupFrequency, saved.backupFrequency)
    }
    if (section === 'UI Preferences') {
      return !match(current.theme, saved.theme) ||
        !match(current.accentColor, saved.accentColor) ||
        !match(current.layoutStyle, saved.layoutStyle)
    }
    return false
  }

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2500)
    return () => window.clearTimeout(timer)
  }, [toast])

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
            <h1 className="text-2xl font-semibold">
              <i className="fas fa-cog mr-2 text-[var(--text-soft)]"></i>
              Configuration
            </h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Review and update operational parameters for the system.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {hasUnsavedChanges ? (
              <span className="rounded-full border border-amber-400/50 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
                Unsaved changes
              </span>
            ) : (
              <span className="rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                All changes saved
              </span>
            )}
            <button
              type="button"
              onClick={handleReload}
              className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text)]"
            >
              <i className="fas fa-sync-alt mr-2"></i>Reload
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 space-y-4">
            <div className="h-36 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface)]"></div>
            <div className="h-44 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface)]"></div>
            <div className="h-40 animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface)]"></div>
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 font-semibold">
                <span>
                <i className="fas fa-desktop mr-2 text-[var(--text-soft)]"></i>
                General System Settings
                </span>
                {!isSectionDirty('General System Settings') ? (
                  <span className="text-xs font-semibold text-emerald-200">
                    <i className="fas fa-check-circle mr-2"></i>Saved
                  </span>
                ) : null}
              </div>
              <div className="grid gap-4 p-6 md:grid-cols-2">
                <label className="text-sm text-[var(--text-muted)]">
                  System Name
                  <input
                    type="text"
                    value={settings.systemName}
                    onChange={(event) => updateSetting('systemName', event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm"
                  />
                </label>
                <label className="text-sm text-[var(--text-muted)]">
                  System Logo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] px-4 py-3 text-sm"
                  />
                  {logoUrl ? (
                    <span className="mt-2 block text-xs text-[var(--text-soft)]">
                      {logoUploading ? 'Uploading...' : `Current logo: ${logoUrl}`}
                    </span>
                  ) : (
                    <span className="mt-2 block text-xs text-[var(--text-soft)]">
                      {logoUploading ? 'Uploading...' : 'Upload a PNG/JPG (max 2MB)'}
                    </span>
                  )}
                </label>
                <label className="text-sm text-[var(--text-muted)]">
                  Default Language
                  <select
                    value={settings.language}
                    onChange={(event) => updateSetting('language', event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm"
                  >
                    <option value="en">English (US)</option>
                    <option value="am">Amharic</option>
                    <option value="es">Spanish</option>
                  </select>
                </label>
                <label className="text-sm text-[var(--text-muted)]">
                  Default Timezone
                  <select
                    value={settings.timezone}
                    onChange={(event) => updateSetting('timezone', event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm"
                  >
                    <option value="UTC">UTC</option>
                    <option value="UTC+3">EAT (UTC+3)</option>
                    <option value="EST">EST (UTC-5)</option>
                  </select>
                </label>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                    <input
                      type="checkbox"
                      checked={settings.maintenanceMode}
                      onChange={(event) => updateSetting('maintenanceMode', event.target.checked)}
                    />
                    <span className="font-semibold text-[var(--text)]">Maintenance Mode</span>
                  </label>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">
                    System access restricted to administrators.
                  </p>
                </div>
              </div>
              <div className="border-t border-[var(--border)] px-6 py-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSave('General System Settings')}
                  disabled={savingSection === 'General System Settings'}
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingSection === 'General System Settings' ? 'Saving...' : 'Save General Settings'}
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 font-semibold">
                <span>
                <i className="fas fa-shield-alt mr-2 text-[var(--text-soft)]"></i>
                Security Settings
                </span>
                {!isSectionDirty('Security Settings') ? (
                  <span className="text-xs font-semibold text-emerald-200">
                    <i className="fas fa-check-circle mr-2"></i>Saved
                  </span>
                ) : null}
              </div>
              <div className="p-6">
                <label className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                  <input
                    type="checkbox"
                    checked={settings.twoFA}
                    onChange={(event) => updateSetting('twoFA', event.target.checked)}
                  />
                  <span className="font-semibold text-[var(--text)]">
                    Enable Two-Factor Authentication (2FA)
                  </span>
                </label>

                <h6 className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-soft)]">
                  Password Policy
                </h6>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <label className="text-sm text-[var(--text-muted)]">
                    Min Length
                    <input
                      type="number"
                      min="6"
                      value={settings.passwordPolicy.minLength}
                      onChange={(event) =>
                        updatePasswordPolicy('minLength', Number(event.target.value))
                      }
                      className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm"
                    />
                  </label>
                  <label className="text-sm text-[var(--text-muted)]">
                    Expiry (Days)
                    <input
                      type="number"
                      min="1"
                      value={settings.passwordPolicy.expiryDays}
                      onChange={(event) =>
                        updatePasswordPolicy('expiryDays', Number(event.target.value))
                      }
                      className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm"
                    />
                  </label>
                  <label className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                    <input
                      type="checkbox"
                      checked={settings.passwordPolicy.specialChars}
                      onChange={(event) =>
                        updatePasswordPolicy('specialChars', event.target.checked)
                      }
                    />
                    Require Symbols
                  </label>
                </div>

                <h6 className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--text-soft)]">
                  Session Management
                </h6>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="text-sm text-[var(--text-muted)]">
                    Timeout (Minutes)
                    <input
                      type="number"
                      min="5"
                      value={settings.sessionTimeout}
                      onChange={(event) => updateSetting('sessionTimeout', Number(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm"
                    />
                  </label>
                  <label className="text-sm text-[var(--text-muted)]">
                    Max Attempts
                    <input
                      type="number"
                      min="1"
                      value={settings.maxLoginAttempts}
                      onChange={(event) => updateSetting('maxLoginAttempts', Number(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm"
                    />
                  </label>
                </div>
              </div>
              <div className="border-t border-[var(--border)] px-6 py-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSave('Security Settings')}
                  disabled={savingSection === 'Security Settings'}
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingSection === 'Security Settings' ? 'Saving...' : 'Save Security Settings'}
                </button>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 font-semibold">
                <span>
                <i className="fas fa-bell mr-2 text-[var(--text-soft)]"></i>
                Notification Settings
                </span>
                {!isSectionDirty('Notification Settings') ? (
                  <span className="text-xs font-semibold text-emerald-200">
                    <i className="fas fa-check-circle mr-2"></i>Saved
                  </span>
                ) : null}
              </div>
              <div className="p-6">
                <div className="flex gap-6">
                  <label className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(event) => updateSetting('emailNotifications', event.target.checked)}
                    />
                    Email
                  </label>
                  <label className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                    <input
                      type="checkbox"
                      checked={settings.smsNotifications}
                      onChange={(event) => updateSetting('smsNotifications', event.target.checked)}
                    />
                    SMS
                  </label>
                </div>
                <label className="mt-4 block text-sm text-[var(--text-muted)]">
                  Sender Email
                  <input
                    type="email"
                    value={settings.senderEmail}
                    onChange={(event) => updateSetting('senderEmail', event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm"
                  />
                </label>
                <label className="mt-4 block text-sm text-[var(--text-muted)]">
                  API Key
                  <input
                    type="password"
                    value={settings.apiKey}
                    onChange={(event) => updateSetting('apiKey', event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm"
                  />
                </label>
              </div>
              <div className="border-t border-[var(--border)] px-6 py-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSave('Notification Settings')}
                  disabled={savingSection === 'Notification Settings'}
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingSection === 'Notification Settings' ? 'Saving...' : 'Save Notifications'}
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 font-semibold">
                <span>
                <i className="fas fa-database mr-2 text-[var(--text-soft)]"></i>
                Backup & Data
                </span>
                {!isSectionDirty('Backup Settings') ? (
                  <span className="text-xs font-semibold text-emerald-200">
                    <i className="fas fa-check-circle mr-2"></i>Saved
                  </span>
                ) : null}
              </div>
              <div className="p-6">
                <label className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
                  <input
                    type="checkbox"
                    checked={settings.autoBackup}
                    onChange={(event) => updateSetting('autoBackup', event.target.checked)}
                  />
                  Auto Backup
                </label>
                <label className="mt-4 block text-sm text-[var(--text-muted)]">
                  Frequency
                  <select
                    value={settings.backupFrequency}
                    onChange={(event) => updateSetting('backupFrequency', event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>
                <div className="mt-4 grid gap-3">
                  <button
                    type="button"
                    onClick={handleDownloadBackup}
                    className="rounded-full border border-emerald-400/50 px-4 py-2 text-sm font-semibold text-emerald-200"
                  >
                    <i className="fas fa-download mr-2"></i>Download Latest Backup
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text)]"
                  >
                    <i className="fas fa-redo mr-2"></i>Trigger New Backup
                  </button>
                </div>
              </div>
              <div className="border-t border-[var(--border)] px-6 py-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSave('Backup Settings')}
                  disabled={savingSection === 'Backup Settings'}
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingSection === 'Backup Settings' ? 'Saving...' : 'Save Backup Settings'}
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 font-semibold">
                <span>
                <i className="fas fa-palette mr-2 text-[var(--text-soft)]"></i>
                UI Preferences
                </span>
                {!isSectionDirty('UI Preferences') ? (
                  <span className="text-xs font-semibold text-emerald-200">
                    <i className="fas fa-check-circle mr-2"></i>Saved
                  </span>
                ) : null}
              </div>
              <div className="p-6">
                <p className="text-sm text-[var(--text-muted)]">Theme</p>
                <div className="mt-3 flex gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={previewTheme === 'light'}
                      onChange={() => updateSetting('theme', 'light')}
                    />
                    Light
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={previewTheme === 'dark'}
                      onChange={() => updateSetting('theme', 'dark')}
                    />
                    Dark
                  </label>
                </div>

                <label className="mt-4 block text-sm text-[var(--text-muted)]">
                  Accent Color
                  <input
                    type="color"
                    value={settings.accentColor}
                    onChange={(event) => updateSetting('accentColor', event.target.value)}
                    className="mt-2 h-10 w-full rounded-xl border border-[var(--border)] bg-transparent"
                  />
                </label>

                <label className="mt-4 block text-sm text-[var(--text-muted)]">
                  Layout Style
                  <select
                    value={settings.layoutStyle}
                    onChange={(event) => updateSetting('layoutStyle', event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm"
                  >
                    <option value="comfortable">Comfortable</option>
                    <option value="compact">Compact</option>
                  </select>
                </label>
              </div>
              <div className="border-t border-[var(--border)] px-6 py-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSave('UI Preferences')}
                  disabled={savingSection === 'UI Preferences'}
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingSection === 'UI Preferences' ? 'Saving...' : 'Save UI Preferences'}
                </button>
              </div>
            </section>
          </div>
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
          <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} mr-2`}></i>
          {toast.message}
        </div>
      ) : null}
    </div>
  )
}
