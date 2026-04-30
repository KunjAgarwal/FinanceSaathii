import dayjs from 'dayjs'

// ─── Currency ─────────────────────────────────────────────────────────────────
export const CURRENCY_SYMBOLS = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥',
  AED: 'د.إ', SGD: 'S$', CAD: 'CA$', AUD: 'A$', CHF: 'CHF',
}

export function getCurrencySymbol(code) {
  return CURRENCY_SYMBOLS[code] || code || '₹'
}

export function formatCurrency(amount, currencyCode = 'INR', options = {}) {
  const { decimals = 0, showSymbol = true } = options
  const sym = getCurrencySymbol(currencyCode)
  const formatted = Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return showSymbol ? `${sym}${formatted}` : formatted
}

// ─── Categories ───────────────────────────────────────────────────────────────
export const CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Education', 'Other']

export const CATEGORY_META = {
  Food:      { icon: '🍔', color: '#00f5ff' },
  Travel:    { icon: '✈️', color: '#7b2fff' },
  Bills:     { icon: '📄', color: '#ff2d78' },
  Shopping:  { icon: '🛍️', color: '#00ff88' },
  Health:    { icon: '💊', color: '#f59e0b' },
  Education: { icon: '📚', color: '#3b82f6' },
  Other:     { icon: '💰', color: '#6366f1' },
}

export function getCategoryIcon(category)  { return CATEGORY_META[category]?.icon  || '💳' }
export function getCategoryColor(category) { return CATEGORY_META[category]?.color || '#6366f1' }

// ─── Dates ────────────────────────────────────────────────────────────────────
export function formatDate(date, fmt = 'MMM D, YYYY') {
  return dayjs(date).format(fmt)
}

export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

export function thisMonthRange() {
  return {
    start: dayjs().startOf('month').toISOString(),
    end:   dayjs().endOf('month').toISOString(),
  }
}

// ─── Numbers ──────────────────────────────────────────────────────────────────
export function pctChange(current, previous) {
  if (!previous || previous === 0) return 0
  return Math.round(((current - previous) / Math.abs(previous)) * 100)
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function abbreviate(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

// ─── Validation ───────────────────────────────────────────────────────────────
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidAmount(val) {
  return !isNaN(Number(val)) && Number(val) > 0
}

// ─── Chart helpers ────────────────────────────────────────────────────────────
export const CHART_COLORS = [
  '#00f5ff', '#7b2fff', '#ff2d78', '#00ff88',
  '#f59e0b', '#3b82f6', '#6366f1', '#ec4899',
]

export function getChartColor(index) {
  return CHART_COLORS[index % CHART_COLORS.length]
}
