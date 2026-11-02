/**
 * Formatting helpers for numbers, currency, dates, and badges
 */

// Global Dashboard Currency Setting: 'USD' or 'ETB'
export type DashboardCurrency = 'USD' | 'ETB'
export const DASHBOARD_CURRENCY: DashboardCurrency = 'USD'

export function formatCurrency(amount: number, currency: DashboardCurrency = DASHBOARD_CURRENCY): string {
  if (currency === 'ETB') {
    return `ETB ${new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0)}`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0)
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat('en-US').format(val || 0)
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
