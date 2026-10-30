/**
 * Formatting helpers for numbers, currency, dates, and badges
 */

let appCurrency = 'USD'

if (typeof sessionStorage !== 'undefined') {
  try {
    const raw = sessionStorage.getItem('adadiko_current_org')
    if (raw) {
      const org = JSON.parse(raw)
      if (org && org.currency) {
        appCurrency = org.currency
      }
    }
  } catch {
    // fallback
  }
}

export function setAppCurrency(curr?: string) {
  if (curr && curr.trim()) {
    appCurrency = curr.trim().toUpperCase()
  }
}

export function getAppCurrency(): string {
  return appCurrency
}

export function formatCurrency(amount: number, currency?: string): string {
  const curr = currency || appCurrency || 'USD'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    // Fallback if currency code is custom or invalid
    return `${curr} ${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`
  }
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat('en-US').format(val)
}

export function formatDate(dateString: string): string {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function formatRelativeTime(dateString: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateString)
}
