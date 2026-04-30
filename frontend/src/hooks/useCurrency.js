import { useState, useCallback } from 'react'
import { currencyService } from '../services/api'
import { useAuth } from '../context/AuthContext'

const SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥', AED: 'د.إ', SGD: 'S$', CAD: 'CA$', AUD: 'A$', CHF: 'CHF' }

/**
 * Hook for currency conversion and display utilities.
 *
 * const { symbol, format, convert, converting } = useCurrency()
 */
export function useCurrency() {
  const { user } = useAuth()
  const currency = user?.currency || 'INR'
  const symbol   = SYMBOLS[currency] || currency

  const [converting, setConverting] = useState(false)

  /** Format a number as a currency string in the user's preferred currency */
  const format = useCallback((amount, options = {}) => {
    const { showSymbol = true, decimals = 0 } = options
    const formatted = Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    return showSymbol ? `${symbol}${formatted}` : formatted
  }, [symbol])

  /** Convert an amount from one currency to user's currency via API */
  const convert = useCallback(async (amount, fromCurrency) => {
    if (!amount || fromCurrency === currency) return amount
    setConverting(true)
    try {
      const res = await currencyService.convert(fromCurrency, currency, amount)
      return res.data.result
    } catch {
      return amount
    } finally {
      setConverting(false)
    }
  }, [currency])

  return { currency, symbol, format, convert, converting, allSymbols: SYMBOLS }
}
