import { useState, useEffect, useCallback } from 'react'
import { analyticsService } from '../services/api'

/**
 * Custom hook that fetches all analytics data in parallel.
 *
 * const { summary, trend, categories, loading, refresh } = useAnalytics()
 */
export function useAnalytics() {
  const [summary,    setSummary]    = useState(null)
  const [trend,      setTrend]      = useState([])
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [sumRes, trendRes, catRes] = await Promise.all([
        analyticsService.getSummary(),
        analyticsService.getMonthlyTrend(),
        analyticsService.getCategoryBreakdown(),
      ])
      setSummary(sumRes.data)
      setTrend(trendRes.data || [])

      // Enrich categories with percent
      const cats  = catRes.data || []
      const total = cats.reduce((s, c) => s + c.amount, 0)
      setCategories(cats.map(c => ({ ...c, percent: total > 0 ? (c.amount / total) * 100 : 0 })))
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { summary, trend, categories, loading, error, refresh: fetch }
}
