import { useState, useEffect, useCallback } from 'react'
import { transactionService } from '../services/api'
import toast from 'react-hot-toast'

/**
 * Custom hook for transaction data management.
 *
 * const { transactions, loading, refresh, addTransaction, removeTransaction } = useTransactions()
 */
export function useTransactions(params = {}) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await transactionService.getAll({ limit: 200, ...params })
      setTransactions(res.data?.transactions || [])
    } catch (e) {
      setError(e)
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(params)])

  useEffect(() => { fetch() }, [fetch])

  const addTransaction = useCallback((txn) => {
    setTransactions(prev => [txn, ...prev])
  }, [])

  const removeTransaction = useCallback((id) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }, [])

  const updateTransaction = useCallback((id, updates) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }, [])

  return { transactions, loading, error, refresh: fetch, addTransaction, removeTransaction, updateTransaction }
}
