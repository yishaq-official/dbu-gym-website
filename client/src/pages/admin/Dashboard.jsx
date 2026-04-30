import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import AdminNavbar from '../../components/AdminNavbar'
import Footer from '../../components/Footer'
import {
  createAdminMember,
  getAdminDashboard,
  getAdminMembers,
  updateAdminMember,
  updateAdminMemberStatus,
} from '../../lib/api'

const priceMap = {
  Monthly: 300,
  '3Months': 800,
  '6Months': 1500,
  '1Year': 2500,
}

const initialMembers = [
  {
    id: '1',
    fullName: 'Mekdes Alemu',
    membershipId: 'DBU-2026-0001',
    membershipType: 'Monthly',
    isUniversityMember: true,
    phone: '+251911111111',
    joinDate: '2026-02-01',
    expiryDate: '2026-03-01',
  },
  {
    id: '2',
    fullName: 'Samuel Bekele',
    membershipId: 'EXT-2026-0001',
    membershipType: '3Months',
    isUniversityMember: false,
    phone: '+251911222222',
    joinDate: '2026-01-15',
    expiryDate: '2026-04-15',
  },
  {
    id: '3',
    fullName: 'Liya Girma',
    membershipId: 'DBU-2026-0002',
    membershipType: '6Months',
    isUniversityMember: true,
    phone: '+251911333333',
    joinDate: '2025-11-01',
    expiryDate: '2026-05-01',
  },
  {
    id: '4',
    fullName: 'Daniel Tadesse',
    membershipId: 'EXT-2026-0002',
    membershipType: '1Year',
    isUniversityMember: false,
    phone: '+251911444444',
    joinDate: '2025-06-01',
    expiryDate: '2026-06-01',
  },
  {
    id: '5',
    fullName: 'Sara Kebede',
    membershipId: 'DBU-2026-0003',
    membershipType: 'Monthly',
    isUniversityMember: true,
    phone: '+251911555555',
    joinDate: '2026-01-05',
    expiryDate: '2026-02-05',
  },
  {
    id: '6',
    fullName: 'Yonatan Fisseha',
    membershipId: 'EXT-2026-0003',
    membershipType: 'Monthly',
    isUniversityMember: false,
    phone: '+251911666666',
    joinDate: '2025-12-01',
    expiryDate: '2026-01-01',
  },
  {
    id: '7',
    fullName: 'Hana Solomon',
    membershipId: 'DBU-2026-0004',
    membershipType: '3Months',
    isUniversityMember: true,
    phone: '+251911777777',
    joinDate: '2026-02-10',
    expiryDate: '2026-05-10',
  },
  {
    id: '8',
    fullName: 'Abel Tesfaye',
    membershipId: 'EXT-2026-0004',
    membershipType: '6Months',
    isUniversityMember: false,
    phone: '+251911888888',
    joinDate: '2025-10-01',
    expiryDate: '2026-04-01',
  },
  {
    id: '9',
    fullName: 'Eden Hailu',
    membershipId: 'DBU-2026-0005',
    membershipType: '1Year',
    isUniversityMember: true,
    phone: '+251911999999',
    joinDate: '2025-03-01',
    expiryDate: '2026-03-01',
  },
]

const adminUser = {
  name: 'Admin Dawit',
}

function getStatus(expiryDate) {
  if (!expiryDate) return { computedStatus: 'unknown', badge: 'bg-slate-500/20 text-slate-200' }
  const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
  if (days < 0) return { computedStatus: 'expired', badge: 'bg-red-500/20 text-red-200' }
  if (days <= 7) return { computedStatus: 'expiring_soon', badge: 'bg-amber-500/20 text-amber-200' }
  return { computedStatus: 'active', badge: 'bg-emerald-500/20 text-emerald-200' }
}

function getMembershipCost(member) {
  const base = priceMap[member.membershipType] || 0
  return member.isUniversityMember ? base * 0.8 : base
}

function formatMemberDate(value) {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toISOString().split('T')[0]
}

function mapUserToMember(user) {
  return {
    id: String(user.id),
    fullName: user.name || 'Unknown',
    membershipId: user.member_id || 'N/A',
    membershipType:
      user.member_profile?.membership_type ||
      user.membership_plan ||
      user.membership_type ||
      'N/A',
    isUniversityMember:
      (user.member_profile?.member_type || user.member_type) === 'university',
    phone: user.phone || 'N/A',
    joinDate: formatMemberDate(user.plan_start_at || user.created_at),
    expiryDate: formatMemberDate(
      user.member_profile?.membership_expiry_date || user.plan_expires_at
    ),
    accountStatus: (user.account_status || 'PendingApproval').toLowerCase().replace(/_/g, ''),
    gender: user.gender || '',
    email: user.email || '',
    universityId: user.university_id || '',
    department: user.department || '',
    nationalId: user.national_id || '',
    address: user.address || '',
  }
}

// IMPROVED: Responsive LineChart that fills container properly
function LineChart({ labels, joined, expired, pending }) {
  const uid = useId()
  const max = Math.max(...joined, ...expired, 1)
  const pendingMax = pending?.length ? Math.max(max, ...pending) : max
  const safeMax = Math.max(pendingMax, 1)
  
  // Dynamic bottom margin that adapts to container height
  const chartBottom = 88
  const chartTop = 12
  
  const getX = (index, length) => {
    const padding = 32
    return padding + (index / (length - 1 || 1)) * (100 - padding * 2)
  }
  
  const getY = (value) => {
    return chartTop + (1 - value / safeMax) * (chartBottom - chartTop)
  }
  
  const points = (data) =>
    data
      .map((value, index) => {
        const x = getX(index, data.length - 1 || 1)
        const y = getY(value)
        return `${x},${y}`
      })
      .join(' ')
  
  const areaPath = (data) => {
    if (!data?.length) return ''
    const coords = data.map((value, index) => ({
      x: getX(index, data.length - 1 || 1),
      y: getY(value)
    }))
    const start = coords[0]
    const end = coords[coords.length - 1]
    const linePath = coords.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ')
    return `${linePath} L${end.x},${chartBottom + 4} L${start.x},${chartBottom + 4} Z`
  }

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <linearGradient id={`${uid}-joined`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--accent-strong)" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id={`${uid}-joined-area`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}-expired`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fca5a5" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={`${uid}-pending`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
        </linearGradient>
        <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map((line) => {
        const y = chartTop + (line / 100) * (chartBottom - chartTop)
        return (
          <line
            key={`grid-${line}`}
            x1="28"
            y1={y}
            x2="96"
            y2={y}
            stroke="var(--border)"
            strokeDasharray="2 3"
            strokeWidth="0.5"
          />
        )
      })}
      
      {/* Y-axis labels */}
      {[0, 25, 50, 75, 100].map((line) => {
        const y = chartTop + (line / 100) * (chartBottom - chartTop)
        return (
          <text
            key={`tick-${line}`}
            x="24"
            y={y + 1.5}
            fontSize="3.5"
            fill="var(--text-soft)"
            textAnchor="end"
          >
            {Math.round((1 - line / 100) * safeMax)}
          </text>
        )
      })}
      
      {/* Area and lines */}
      <path d={areaPath(joined)} fill={`url(#${uid}-joined-area)`} />
      
      <polyline
        fill="none"
        stroke={`url(#${uid}-joined)`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${uid}-glow)`}
        points={points(joined)}
      />
      
      <polyline
        fill="none"
        stroke={`url(#${uid}-expired)`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points(expired)}
      />
      
      {pending?.length ? (
        <polyline
          fill="none"
          stroke={`url(#${uid}-pending)`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points(pending)}
        />
      ) : null}
      
      {/* Data points */}
      {joined.map((value, index) => {
        const x = getX(index, joined.length - 1 || 1)
        const y = getY(value)
        return (
          <circle key={`joined-${index}`} cx={x} cy={y} r="1.5" fill="var(--accent)">
            <title>{`${labels[index]} • Joined: ${value}`}</title>
          </circle>
        )
      })}
      
      {expired.map((value, index) => {
        const x = getX(index, expired.length - 1 || 1)
        const y = getY(value)
        return (
          <circle key={`expired-${index}`} cx={x} cy={y} r="1.3" fill="#ef4444">
            <title>{`${labels[index]} • Expired: ${value}`}</title>
          </circle>
        )
      })}
      
      {pending?.map((value, index) => {
        const x = getX(index, pending.length - 1 || 1)
        const y = getY(value)
        return (
          <circle key={`pending-${index}`} cx={x} cy={y} r="1.3" fill="#f59e0b">
            <title>{`${labels[index]} • Pending: ${value}`}</title>
          </circle>
        )
      })}
      
      {/* X-axis labels */}
      {labels.map((label, index) => (
        <text
          key={label}
          x={getX(index, labels.length - 1 || 1)}
          y="96"
          fontSize="3.5"
          textAnchor="middle"
          fill="var(--text-soft)"
        >
          {label}
        </text>
      ))}
    </svg>
  )
}

// IMPROVED: DoughnutChart that scales properly
function DoughnutChart({ uniCount, extCount }) {
  const uid = useId()
  const total = uniCount + extCount || 1
  const uniPercent = (uniCount / total) * 100
  const extPercent = 100 - uniPercent
  const circumference = 2 * Math.PI * 14 // r=14
  const uniDash = (uniPercent / 100) * circumference
  const extDash = (extPercent / 100) * circumference

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <defs>
        <linearGradient id={`${uid}-uni`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--accent-strong)" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={`${uid}-ext`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#64748b" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      
      <g transform="translate(50, 50)">
        {/* Background circle */}
        <circle
          cx="0"
          cy="0"
          r="38"
          fill="none"
          stroke="var(--border)"
          strokeWidth="10"
        />
        
        {/* University segment */}
        <circle
          cx="0"
          cy="0"
          r="38"
          fill="none"
          stroke={`url(#${uid}-uni)`}
          strokeWidth="10"
          strokeDasharray={`${uniDash} ${circumference}`}
          strokeDashoffset="0"
          transform="rotate(-90)"
        />
        
        {/* External segment */}
        <circle
          cx="0"
          cy="0"
          r="38"
          fill="none"
          stroke={`url(#${uid}-ext)`}
          strokeWidth="10"
          strokeDasharray={`${extDash} ${circumference}`}
          strokeDashoffset={`-${uniDash}`}
          transform="rotate(-90)"
        />
        
        {/* Center text */}
        <text x="0" y="4" textAnchor="middle" fontSize="14" fill="var(--text)" fontWeight="bold">
          {total}
        </text>
        <text x="0" y="18" textAnchor="middle" fontSize="6" fill="var(--text-soft)">
          Total
        </text>
      </g>
    </svg>
  )
}

// IMPROVED: Legend component for charts
function ChartLegend({ items }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
          <span className="text-[var(--text-soft)]">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const [members, setMembers] = useState(initialMembers)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [memberType, setMemberType] = useState('university')
  const [editingMember, setEditingMember] = useState(null)
  const [dashboardStats, setDashboardStats] = useState(null)
  const [dashboardError, setDashboardError] = useState('')
  const [dashboardChart, setDashboardChart] = useState(null)
  const [membersError, setMembersError] = useState('')
  const [membersMeta, setMembersMeta] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    perPage: 8,
  })
  const [savingMember, setSavingMember] = useState(false)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: 'dbugym123',
    universityId: '',
    department: '',
    nationalId: '',
    address: '',
    membershipType: 'Monthly',
    gender: 'Male',
  })
  const [phoneError, setPhoneError] = useState('')
  const [theme, setTheme] = useState(
    document.documentElement.dataset.theme || 'dark'
  )
  const itemsPerPage = membersMeta.perPage || 8
  const totalPages = membersMeta.lastPage || 1

  const resetForm = () => {
    setForm({
      fullName: '',
      email: '',
      phone: '',
      password: 'dbugym123',
      universityId: '',
      department: '',
      nationalId: '',
      address: '',
      membershipType: 'Monthly',
      gender: 'Male',
    })
    setMemberType('university')
    setEditingMember(null)
    setPhoneError('')
  }

  const enrichedMembers = useMemo(
    () =>
      members.map((member) => ({
        ...member,
        ...getStatus(member.expiryDate),
      })),
    [members]
  )

  const stats = useMemo(() => {
    const total = enrichedMembers.length
    const active = enrichedMembers.filter((m) =>
      ['active', 'expiring_soon'].includes(m.computedStatus)
    ).length
    const expired = enrichedMembers.filter((m) => m.computedStatus === 'expired')
      .length
    const uni = enrichedMembers.filter((m) => m.isUniversityMember).length
    const ext = total - uni
    const revenue = enrichedMembers.reduce(
      (sum, m) => sum + getMembershipCost(m),
      0
    )
    return { total, active, expired, uni, ext, revenue }
  }, [enrichedMembers])

  useEffect(() => {
    let active = true

    const loadStats = async () => {
      try {
        const data = await getAdminDashboard()
        if (!active) return
        setDashboardStats(data?.data?.stats || null)
        setDashboardChart(data?.data?.chart || null)
      } catch (err) {
        if (active) setDashboardError(err?.message || 'Unable to load admin stats.')
      }
    }

    loadStats()

    return () => {
      active = false
    }
  }, [])

  const loadMembers = useCallback(async (pageOverride) => {
    try {
      const data = await getAdminMembers({
        page: pageOverride || page,
        per_page: itemsPerPage,
        search,
        status: statusFilter || undefined,
        member_type: typeFilter || undefined,
      })
      const rows = (data?.data?.data || data?.data || []).map(mapUserToMember)
      setMembers(rows)
      setMembersError('')
      setMembersMeta({
        currentPage: data?.meta?.current_page || page,
        lastPage: data?.meta?.last_page || 1,
        total: data?.meta?.total || rows.length,
        perPage: data?.meta?.per_page || itemsPerPage,
      })
    } catch (err) {
      setMembersError(err?.message || 'Unable to load members.')
    }
  }, [itemsPerPage, page, search, statusFilter, typeFilter])

  useEffect(() => {
    let active = true

    const safeLoad = async () => {
      if (!active) return
      await loadMembers()
    }

    safeLoad()

    return () => {
      active = false
    }
  }, [loadMembers])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const statsView = {
    total: dashboardStats?.total_members ?? stats.total,
    active: dashboardStats?.active_members ?? stats.active,
    pending: dashboardStats?.pending_members ?? 0,
    approved: dashboardStats?.approved_members ?? 0,
    rejected: dashboardStats?.rejected_members ?? 0,
    revenue: dashboardStats?.total_revenue ?? stats.revenue,
  }

  const chartData = useMemo(() => {
    if (dashboardChart?.labels?.length) {
      return {
        labels: dashboardChart.labels,
        joined: dashboardChart.joined || [],
        expired: dashboardChart.expired || [],
        pending: dashboardChart.pending || [],
      }
    }
    const labels = Array.from({ length: 6 }, (_, index) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (5 - index))
      return date.toLocaleString('default', { month: 'short' })
    })
    const joined = Array(6).fill(0)
    const expired = Array(6).fill(0)

    enrichedMembers.forEach((member) => {
      const joinDate = new Date(member.joinDate)
      const diff =
        (new Date().getMonth() - joinDate.getMonth() + 12) % 12
      if (diff < 6) joined[5 - diff] += 1
      if (member.computedStatus === 'expired') expired[5] += 1
    })

    const pending = Array(6).fill(0)
    return { labels, joined, expired, pending }
  }, [dashboardChart, enrichedMembers])

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value)
    setPage(1)
  }

  const handleAddMember = async (event) => {
    event.preventDefault()
    setPhoneError('')
    setSavingMember(true)

    const phoneValid = /^(\+251(9|7)\d{8}|0(9|7)\d{8})$/.test(form.phone)
    if (!phoneValid) {
      setPhoneError('Invalid Ethiopian phone number.')
      setSavingMember(false)
      return
    }

    if (memberType === 'external' && form.nationalId.length !== 16) {
      alert('National ID must be 16 digits.')
      setSavingMember(false)
      return
    }

    const payload = {
      name: form.fullName,
      email: form.email,
      password: form.password,
      phone: form.phone,
      gender: form.gender,
      member_type: memberType,
      membership_type: form.membershipType,
      membership_plan: form.membershipType,
      university_id: memberType === 'university' ? form.universityId : undefined,
      department: memberType === 'university' ? form.department : undefined,
      national_id: memberType === 'external' ? form.nationalId : undefined,
      address: memberType === 'external' ? form.address : undefined,
    }

    try {
      if (editingMember) {
        await updateAdminMember(editingMember.id, payload)
        setToast({ type: 'success', message: 'Member updated successfully.' })
      } else {
        await createAdminMember(payload)
        setToast({ type: 'success', message: 'Member created successfully.' })
      }
      await loadMembers(1)
      setPage(1)
      setShowModal(false)
      resetForm()
    } catch (err) {
      alert(err?.message || 'Unable to save member.')
    } finally {
      setSavingMember(false)
    }
  }

  const handleToggleStatus = async (member) => {
    const nextStatus =
      member.accountStatus === 'inactive'
        ? 'Active'
        : member.accountStatus === 'pendingapproval'
        ? 'Active'
        : 'Inactive'
    const label = nextStatus === 'Active' ? 'activate' : 'deactivate'
    if (!window.confirm(`Are you sure you want to ${label} this member?`)) return
    try {
      await updateAdminMemberStatus(member.id, nextStatus)
      await loadMembers()
      setToast({
        type: 'success',
        message: `Member ${nextStatus === 'Active' ? 'activated' : 'deactivated'} successfully.`,
      })
    } catch (err) {
      alert(err?.message || 'Unable to update status.')
    }
  }

  const handleEditMember = (member) => {
    setEditingMember(member)
    setMemberType(member.isUniversityMember ? 'university' : 'external')
    setForm({
      fullName: member.fullName,
      email: member.email,
      phone: member.phone,
      password: '',
      universityId: member.universityId || '',
      department: member.department || '',
      nationalId: member.nationalId || '',
      address: member.address || '',
      membershipType: member.membershipType || 'Monthly',
      gender: member.gender || 'Male',
    })
    setShowModal(true)
  }

  const modalCost = useMemo(() => {
    const base = priceMap[form.membershipType] || 0
    return memberType === 'university' ? base * 0.8 : base
  }, [form.membershipType, memberType])

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    window.localStorage.setItem('dbu-theme', next)
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <AdminNavbar
        adminName={adminUser.name}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className="mx-auto w-full max-w-7xl px-6 py-10 md:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Admin Overview</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Monitor members, revenue, and system activity
            </p>
          </div>
        </div>

        {/* Stats Cards - Improved spacing and hover effect */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: 'Total Members', value: statsView.total, icon: '👥' },
            { label: 'Active', value: statsView.active, icon: '✅' },
            { label: 'Pending', value: statsView.pending, icon: '⏳' },
            { label: 'Approved', value: statsView.approved, icon: '✓' },
            { label: 'Est. Revenue', value: statsView.revenue.toLocaleString(), icon: '💰' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all duration-200 hover:border-[var(--accent)]/30 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-soft)]">
                  {stat.label}
                </p>
                <span className="text-lg opacity-50">{stat.icon}</span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Alerts */}
        {dashboardError ? (
          <div className="mt-6 rounded-2xl border border-red-400/40 bg-red-500/10 px-5 py-3 text-sm text-red-100">
            ⚠️ {dashboardError}
          </div>
        ) : null}
        
        {statsView.pending > 0 ? (
          <div className="mt-4 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-5 py-3 text-sm text-amber-100">
            🔔 Attention: {statsView.pending} pending members awaiting approval.
          </div>
        ) : null}

        {/* Charts Section - IMPROVED LAYOUT with proper graph fitting */}
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {/* Main Trends Chart - Takes more space */}
          <div className="lg:col-span-2 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all duration-200 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Membership Trends</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Joined vs expired members (6 months)
                </p>
              </div>
              <div className="flex gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
                  <span className="text-[var(--text-soft)]">Joined</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="text-[var(--text-soft)]">Expired</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="text-[var(--text-soft)]">Pending</span>
                </div>
              </div>
            </div>
            <div className="mt-6 h-80 w-full">
              <LineChart
                labels={chartData.labels}
                joined={chartData.joined}
                expired={chartData.expired}
                pending={chartData.pending}
              />
            </div>
          </div>

          {/* User Distribution - Fits perfectly */}
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all duration-200 hover:shadow-lg">
            <h2 className="text-lg font-semibold">User Distribution</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              University vs External members
            </p>
            <div className="mt-4 h-56 w-full">
              <DoughnutChart uniCount={stats.uni} extCount={stats.ext} />
            </div>
            <div className="mt-4 flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[var(--accent)]" />
                <span>University ({stats.uni})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-slate-500" />
                <span>External ({stats.ext})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approvals Row - Now properly aligned */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all duration-200 hover:shadow-lg">
            <h2 className="text-lg font-semibold">Pending Approvals</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Registrations waiting for review
            </p>
            <div className="mt-6 h-64 w-full">
              <LineChart
                labels={chartData.labels}
                joined={chartData.pending}
                expired={Array(chartData.pending.length).fill(0)}
                pending={[]}
              />
            </div>
          </div>

          {/* Financial Summary - Enhanced design */}
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all duration-200 hover:shadow-lg">
            <h2 className="text-lg font-semibold">Financial Summary</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Revenue and member statistics
            </p>
            <div className="mt-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <span className="text-[var(--text-soft)]">Total Revenue (YTD)</span>
                <span className="text-xl font-semibold text-[var(--accent)]">
                  {statsView.revenue.toLocaleString()} ETB
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <span className="text-[var(--text-soft)]">Pending Members</span>
                <span className="text-lg font-semibold text-amber-200">
                  {statsView.pending}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <span className="text-[var(--text-soft)]">Rejected Members</span>
                <span className="text-lg font-semibold text-red-200">
                  {statsView.rejected}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[var(--text-soft)]">System Status</span>
                <span className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                  </span>
                  <span className="text-sm font-medium text-emerald-200">Operational</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Member Management Table - Improved styling */}
        <section id="member-management" className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Member Management</h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Manage and monitor all registered members
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-black transition-all duration-200 hover:opacity-90 hover:shadow-lg"
            >
              + Add New Member
            </button>
          </div>

          {toast ? (
            <div
              className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
                toast.type === 'success'
                  ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                  : 'border-amber-400/40 bg-amber-500/10 text-amber-100'
              }`}
            >
              {toast.message}
            </div>
          ) : null}
          {membersError ? (
            <div className="mt-4 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              ⚠️ {membersError}
            </div>
          ) : null}

          {/* Filters - Better spacing */}
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="🔍 Search by ID or Name..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm transition-all duration-200 focus:border-[var(--accent)] focus:outline-none"
            />
            <select
              value={statusFilter}
              onChange={handleFilterChange(setStatusFilter)}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm transition-all duration-200 focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="">📊 All Statuses</option>
              <option value="active">✅ Active</option>
              <option value="expiring_soon">⚠️ Expiring Soon</option>
              <option value="expired">❌ Expired</option>
            </select>
            <select
              value={typeFilter}
              onChange={handleFilterChange(setTypeFilter)}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm transition-all duration-200 focus:border-[var(--accent)] focus:outline-none"
            >
              <option value="">👥 All Types</option>
              <option value="university">🎓 University</option>
              <option value="external">🌍 External</option>
            </select>
          </div>

          {/* Table - Improved readability */}
          <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-strong)] text-xs uppercase text-[var(--text-soft)]">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrichedMembers.length ? (
                  enrichedMembers.map((member, idx) => (
                    <tr key={member.id} className={`border-t border-[var(--border)] ${idx % 2 === 0 ? 'bg-[var(--bg)]/30' : ''} transition-colors hover:bg-[var(--surface)]`}>
                      <td className="px-4 py-3 font-mono text-xs">{member.membershipId}</td>
                      <td className="px-4 py-3 font-medium">{member.fullName}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full border px-2.5 py-1 text-xs ${
                          member.isUniversityMember 
                            ? 'border-[var(--accent)]/30 text-[var(--accent)]' 
                            : 'border-slate-500/30 text-slate-300'
                        }`}>
                          {member.isUniversityMember ? '🎓 University' : '🌍 External'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">{member.phone}</td>
                      <td className="px-4 py-3 text-xs">{member.membershipType}</td>
                      <td className="px-4 py-3 text-xs">{member.expiryDate}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${member.badge}`}>
                          {member.computedStatus === 'expiring_soon'
                            ? '⚠️ Expiring Soon'
                            : member.computedStatus === 'active'
                            ? '✅ Active'
                            : member.computedStatus === 'expired'
                            ? '❌ Expired'
                            : member.computedStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            member.accountStatus === 'inactive'
                              ? 'bg-slate-500/20 text-slate-200'
                              : member.accountStatus === 'pendingapproval'
                              ? 'bg-amber-500/20 text-amber-200'
                              : 'bg-emerald-500/20 text-emerald-200'
                          }`}
                        >
                          {member.accountStatus === 'inactive'
                            ? 'Inactive'
                            : member.accountStatus === 'pendingapproval'
                            ? 'Pending Approval'
                            : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditMember(member)}
                            className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text)] transition-all duration-200 hover:border-[var(--accent)]/40"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(member)}
                            className={`rounded-full border px-3 py-1 text-xs transition-all duration-200 ${
                              member.accountStatus === 'inactive'
                                ? 'border-emerald-400/60 text-emerald-200 hover:bg-emerald-500/10'
                                : 'border-amber-400/60 text-amber-200 hover:bg-amber-500/10'
                            }`}
                          >
                            {member.accountStatus === 'inactive'
                              ? 'Activate'
                              : member.accountStatus === 'pendingapproval'
                              ? 'Activate'
                              : 'Deactivate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-[var(--text-soft)]">
                      📭 No members found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination - Improved styling */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="rounded-full border border-[var(--border)] px-4 py-2 transition-all duration-200 hover:border-[var(--accent)] disabled:opacity-40 disabled:hover:border-[var(--border)]"
            >
              ← Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }).map((_, index) => {
                let pageNum = index + 1
                if (totalPages > 7 && page > 4) {
                  if (index < 3) pageNum = index + 1
                  else if (index === 3) pageNum = page - 1
                  else if (index === 4) pageNum = page
                  else if (index === 5) pageNum = page + 1
                  else pageNum = totalPages
                }
                if (totalPages > 7 && page > 4 && index === 2 && pageNum !== 3) {
                  return <span key="ellipsis1" className="px-2 py-2">...</span>
                }
                if (totalPages > 7 && page < totalPages - 3 && index === 5 && pageNum !== totalPages - 1) {
                  return <span key="ellipsis2" className="px-2 py-2">...</span>
                }
                if (index === 0 && pageNum !== 1 && page > 4) return null
                if (index === 6 && pageNum !== totalPages && page < totalPages - 3) return null
                
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={`min-w-[36px] rounded-full px-3 py-2 transition-all duration-200 ${
                      page === pageNum
                        ? 'bg-[var(--accent)] font-semibold text-black'
                        : 'border border-[var(--border)] hover:border-[var(--accent)]'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="rounded-full border border-[var(--border)] px-4 py-2 transition-all duration-200 hover:border-[var(--accent)] disabled:opacity-40 disabled:hover:border-[var(--border)]"
            >
              Next →
            </button>
          </div>
        </section>
      </main>

      <Footer />

      {/* Modal - Same functionality, slightly improved styling */}
      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[var(--border)] bg-[var(--bg)] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">
                  {editingMember ? 'Edit Member' : 'Add New Member'}
                </h3>
                <p className="text-sm text-[var(--text-muted)]">
                  {editingMember ? 'Update member details below' : 'Fill in the details below'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="rounded-full p-2 text-[var(--text-soft)] transition-colors hover:bg-[var(--surface)]"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setMemberType('university')}
                className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  memberType === 'university'
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-black'
                    : 'border-[var(--border)] text-[var(--text-soft)] hover:border-[var(--accent)]'
                }`}
              >
                🎓 University Member
              </button>
              <button
                type="button"
                onClick={() => setMemberType('external')}
                className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  memberType === 'external'
                    ? 'border-[var(--accent)] bg-[var(--accent)] text-black'
                    : 'border-[var(--border)] text-[var(--text-soft)] hover:border-[var(--accent)]'
                }`}
              >
                🌍 External Member
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-4 py-3 text-sm">
              <span className="font-semibold">📋 Summary:</span>{' '}
              {editingMember ? `ID: ${editingMember.membershipId}` : 'ID will be auto-generated'} · 💰 Cost:{' '}
              {modalCost} ETB
            </div>

            <form className="mt-6 grid gap-4" onSubmit={handleAddMember}>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-[var(--text-muted)]">
                  Full Name *
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, fullName: event.target.value.replace(/[0-9]/g, '') }))
                    }
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm transition-all duration-200 focus:border-[var(--accent)] focus:outline-none"
                    required
                  />
                </label>
                <label className="text-sm text-[var(--text-muted)]">
                  Email *
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm transition-all duration-200 focus:border-[var(--accent)] focus:outline-none"
                    required
                  />
                </label>
                <label className="text-sm text-[var(--text-muted)]">
                  Phone *
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value.replace(/[^0-9+]/g, '') }))}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm transition-all duration-200 focus:border-[var(--accent)] focus:outline-none"
                    required
                  />
                  {phoneError ? (
                    <span className="mt-1 block text-xs text-red-200">{phoneError}</span>
                  ) : null}
                </label>
                <label className="text-sm text-[var(--text-muted)]">
                  {editingMember ? 'Reset Password' : 'Default Password'}
                  <input
                    type="text"
                    value={form.password}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder={editingMember ? 'Leave blank to keep current' : 'dbugym123'}
                    readOnly={!editingMember}
                    className={`mt-2 w-full rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm font-mono ${
                      editingMember ? 'bg-[var(--bg)]' : 'bg-[var(--surface-strong)]'
                    }`}
                  />
                </label>

                {memberType === 'university' ? (
                  <>
                    <label className="text-sm text-[var(--text-muted)]">
                      University ID *
                      <input
                        type="text"
                        value={form.universityId}
                        onChange={(event) => setForm((prev) => ({ ...prev, universityId: event.target.value }))}
                        className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm transition-all duration-200 focus:border-[var(--accent)] focus:outline-none"
                        required
                      />
                    </label>
                    <label className="text-sm text-[var(--text-muted)]">
                      Department *
                      <input
                        type="text"
                        value={form.department}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, department: event.target.value.replace(/[0-9]/g, '') }))
                        }
                        className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm transition-all duration-200 focus:border-[var(--accent)] focus:outline-none"
                        required
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label className="text-sm text-[var(--text-muted)]">
                      National ID (16 digits) *
                      <input
                        type="text"
                        value={form.nationalId}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            nationalId: event.target.value.replace(/\D/g, '').slice(0, 16),
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm transition-all duration-200 focus:border-[var(--accent)] focus:outline-none"
                        required
                      />
                    </label>
                    <label className="text-sm text-[var(--text-muted)]">
                      Address *
                      <input
                        type="text"
                        value={form.address}
                        onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                        className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm transition-all duration-200 focus:border-[var(--accent)] focus:outline-none"
                        required
                      />
                    </label>
                  </>
                )}

                <label className="text-sm text-[var(--text-muted)]">
                  Membership Plan *
                  <select
                    value={form.membershipType}
                    onChange={(event) => setForm((prev) => ({ ...prev, membershipType: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm transition-all duration-200 focus:border-[var(--accent)] focus:outline-none"
                  >
                    <option value="Monthly">📅 Monthly - 300 ETB</option>
                    <option value="3Months">📅 3 Months - 800 ETB</option>
                    <option value="6Months">📅 6 Months - 1500 ETB</option>
                    <option value="1Year">📅 1 Year - 2500 ETB</option>
                  </select>
                </label>
                <label className="text-sm text-[var(--text-muted)]">
                  Gender *
                  <select
                    value={form.gender}
                    onChange={(event) => setForm((prev) => ({ ...prev, gender: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-sm transition-all duration-200 focus:border-[var(--accent)] focus:outline-none"
                  >
                    <option value="Male">👨 Male</option>
                    <option value="Female">👩 Female</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm transition-all duration-200 hover:border-[var(--accent)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMember}
                  className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-black transition-all duration-200 hover:opacity-90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingMember ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/60 border-t-transparent"></span>
                      Saving...
                    </span>
                  ) : (
                    <span>{editingMember ? 'Update Member' : 'Save Member'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
