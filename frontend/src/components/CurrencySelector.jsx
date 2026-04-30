import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
]

export default function CurrencySelector() {
  const { user, updateUser } = useAuth()
  const { isDark } = useTheme()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const current = CURRENCIES.find(c => c.code === (user?.currency || 'INR')) || CURRENCIES[0]

  const handleSelect = async (currency) => {
    setOpen(false)
    if (currency.code === user?.currency) return
    setLoading(true)
    try {
      await api.put('/profile', { currency: currency.code })
      updateUser({ currency: currency.code })
      toast.success(`Currency set to ${currency.code}`)
    } catch {
      toast.error('Failed to update currency')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
          isDark
            ? 'bg-white/[0.05] text-gray-300 hover:bg-white/[0.08]'
            : 'bg-black/[0.05] text-gray-600 hover:bg-black/[0.08]'
        }`}
      >
        <span className="text-base">{current.symbol}</span>
        <span>{current.code}</span>
        <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`absolute bottom-full mb-1 left-0 right-0 rounded-xl overflow-hidden z-50 shadow-glass ${
          isDark
            ? 'bg-dark-700 border border-white/10'
            : 'bg-white border border-black/10'
        }`}>
          {CURRENCIES.map(currency => (
            <button
              key={currency.code}
              onClick={() => handleSelect(currency)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-xs transition-all ${
                currency.code === current.code
                  ? isDark ? 'bg-neon-cyan/10 text-neon-cyan' : 'bg-neon-purple/10 text-neon-purple'
                  : isDark ? 'text-gray-300 hover:bg-white/[0.05]' : 'text-gray-700 hover:bg-black/[0.04]'
              }`}
            >
              <span className="text-sm w-4">{currency.symbol}</span>
              <span className="font-medium">{currency.code}</span>
              <span className="text-gray-500 truncate">{currency.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export { CURRENCIES }
