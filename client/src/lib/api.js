const API_BASE =
  import.meta.env.VITE_API_BASE || 'http://localhost/gym-website/server/public'
const AUTH_TOKEN_KEY = 'dbu-auth-token'

export function getAuthToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

export function setAuthToken(token) {
  if (typeof window === 'undefined') return
  if (!token) return
  window.localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearAuthToken() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
}

function getAuthHeaders() {
  const token = getAuthToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const message = errorBody.message || 'Request failed'
    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}

export async function login(payload) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function register(payload) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function initializeChapaPayment(payload) {
  return request('/api/payments/chapa/initialize', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function verifyChapaPayment(txRef) {
  return request(`/api/payments/chapa/verify/${encodeURIComponent(txRef)}`, {
    method: 'GET',
  })
}

export async function logout() {
  return request('/api/auth/logout', {
    method: 'POST',
  })
}

export async function forgotPassword(payload) {
  return request('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function resetPassword(payload) {
  return request('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function me() {
  return request('/api/auth/me', {
    method: 'GET',
  })
}

export async function getAdminProfile() {
  return request('/api/admin/profile', {
    method: 'GET',
  })
}

export async function updateAdminProfile(payload) {
  return request('/api/admin/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function getAdminDashboard() {
  return request('/api/admin/dashboard', {
    method: 'GET',
  })
}

export async function getAdminMembers(params = {}) {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )
  const query = new URLSearchParams(cleaned).toString()
  const path = query ? `/api/admin/members?${query}` : '/api/admin/members'
  return request(path, {
    method: 'GET',
  })
}

export async function createAdminMember(payload) {
  return request('/api/admin/members', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateAdminMember(memberId, payload) {
  return request(`/api/admin/members/${memberId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function updateAdminMemberStatus(memberId, status) {
  return request(`/api/admin/members/${memberId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ account_status: status }),
  })
}

export async function getAdminApprovals(params = {}) {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )
  const query = new URLSearchParams(cleaned).toString()
  const path = query ? `/api/admin/approvals?${query}` : '/api/admin/approvals'
  return request(path, {
    method: 'GET',
  })
}

export async function getAdminApprovalHistory(params = {}) {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )
  const query = new URLSearchParams(cleaned).toString()
  const path = query
    ? `/api/admin/approvals/history?${query}`
    : '/api/admin/approvals/history'
  return request(path, {
    method: 'GET',
  })
}

async function downloadCsv(path, filename) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: 'text/csv',
      ...getAuthHeaders(),
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(errorBody || 'Export failed')
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function exportAdminApprovalsCsv(params = {}) {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )
  const query = new URLSearchParams(cleaned).toString()
  const path = query ? `/api/admin/approvals/export?${query}` : '/api/admin/approvals/export'
  const today = new Date().toISOString().split('T')[0]
  return downloadCsv(path, `approvals-${today}.csv`)
}

export async function exportAdminApprovalHistoryCsv(params = {}) {
  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )
  const query = new URLSearchParams(cleaned).toString()
  const path = query
    ? `/api/admin/approvals/history/export?${query}`
    : '/api/admin/approvals/history/export'
  const today = new Date().toISOString().split('T')[0]
  return downloadCsv(path, `approval-history-${today}.csv`)
}

export async function approveMember(memberId) {
  return request(`/api/admin/approvals/${memberId}/approve`, {
    method: 'POST',
  })
}

export async function rejectMember(memberId, payload) {
  return request(`/api/admin/approvals/${memberId}/reject`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  })
}

export async function getSystemSettings() {
  return request('/api/admin/settings', {
    method: 'GET',
  })
}

export async function updateSystemSettings(payload) {
  return request('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function triggerSystemBackup() {
  return request('/api/admin/settings/backup', {
    method: 'POST',
  })
}

export async function downloadSystemBackup() {
  const response = await fetch(`${API_BASE}/api/admin/settings/backup/download`, {
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
    method: 'GET',
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const message = errorBody.message || 'Backup download failed'
    throw new Error(message)
  }

  const blob = await response.blob()
  const contentDisposition = response.headers.get('Content-Disposition') || ''
  const match = contentDisposition.match(/filename="?([^";]+)"?/) || []
  const filename = match[1] || `dbugym-backup-${new Date().toISOString()}.json`

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function getAuditLogs(limit = 50) {
  return request(`/api/admin/audit?limit=${encodeURIComponent(limit)}`, {
    method: 'GET',
  })
}

export async function uploadSystemLogo(file) {
  const formData = new FormData()
  formData.append('logo', file)

  const response = await fetch(`${API_BASE}/api/admin/settings/logo`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
    body: formData,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const message = errorBody.message || 'Upload failed'
    throw new Error(message)
  }

  return response.json()
}

export async function updateAdminPassword(payload) {
  return request('/api/admin/password', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function uploadAdminAvatar(file) {
  const formData = new FormData()
  formData.append('avatar', file)

  const response = await fetch(`${API_BASE}/api/admin/profile/avatar`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
    body: formData,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const message = errorBody.message || 'Upload failed'
    throw new Error(message)
  }

  return response.json()
}

export async function getMemberProfile() {
  return request('/api/member/profile', {
    method: 'GET',
  })
}

export async function updateMemberProfile(payload) {
  return request('/api/member/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function updateMemberPassword(payload) {
  return request('/api/member/password', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function getMemberDashboard() {
  return request('/api/member/dashboard', {
    method: 'GET',
  })
}

export async function renewMembership(payload) {
  return request('/api/member/renew', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function uploadMemberAvatar(file) {
  const formData = new FormData()
  formData.append('avatar', file)

  const response = await fetch(`${API_BASE}/api/member/profile/avatar`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
    body: formData,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const message = errorBody.message || 'Upload failed'
    throw new Error(message)
  }

  return response.json()
}
