function hexToRgb(hex) {
  const sanitized = hex.replace('#', '')
  if (sanitized.length !== 6) return null
  const num = parseInt(sanitized, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

function clamp(value) {
  return Math.max(0, Math.min(255, value))
}

function shadeColor(hex, percent) {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  const t = percent < 0 ? 0 : 255
  const p = Math.abs(percent) / 100
  const r = Math.round((t - rgb.r) * p) + rgb.r
  const g = Math.round((t - rgb.g) * p) + rgb.g
  const b = Math.round((t - rgb.b) * p) + rgb.b
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`
}

export function applyAccentColor(accent) {
  if (!accent) return
  const root = document.documentElement
  root.style.setProperty('--accent', accent)
  root.style.setProperty('--accent-strong', shadeColor(accent, -12))
  const rgb = hexToRgb(accent)
  if (rgb) {
    root.style.setProperty('--accent-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`)
  }
}

export function loadAccentFromStorage() {
  if (typeof window === 'undefined') return
  const stored = window.localStorage.getItem('dbu-accent')
  if (stored) applyAccentColor(stored)
}
