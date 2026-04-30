import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Search, Filter, Trash2, TrendingUp, TrendingDown,
  ChevronDown, X, Check, Calendar
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useData } from '../context/DataContext'
import { transactionService } from '../services/api'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

const CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Education', 'Other']
const CATEGORY_COLORS = {
  Food: '#00f5ff', Travel: '#7b2fff', Bills: '#ff2d78',
  Shopping: '#00ff88', Health: '#f59e0b', Education: '#3b82f6', Other: '#6366f1',
}
const CATEGORY_ICONS = {
  Food: '🍔', Travel: '✈️', Bills: '📄', Shopping: '🛍️',
  Health: '💊', Education: '📚', Other: '💰',
}

function getCurrencySymbol(code) {
  const map = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥', AED: 'د.إ', SGD: 'S$' }
  return map[code] || code
}

function AddTransactionModal({ onClose, onAdded, isDark, currency }) {
  const [form, setForm] = useState({
    type: 'expense', amount: '', category: 'Food', description: '', date: dayjs().format('YYYY-MM-DD'),
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Enter a valid amount'); return }
    setLoading(true)
    try {
      const res = await transactionService.create({ ...form, amount: Number(form.amount) })
      toast.success('Transaction added!')
      onAdded(res.data)
      onClose()
    } catch { toast.error('Failed to add transaction') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl p-6 ${isDark ? 'glass-card border border-white/10' : 'bg-white shadow-xl'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Add Transaction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div className={`flex rounded-xl p-1 ${isDark ? 'bg-white/[0.05]' : 'bg-gray-100'}`}>
            {['expense', 'income'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setForm(p => ({ ...p, type: t }))}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  form.type === t
                    ? t === 'expense'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500'
                }`}
              >
                {t === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Amount ({getCurrencySymbol(currency)})</label>
            <input
              type="number" min="0" step="0.01"
              className={isDark ? 'input-dark' : 'input-light'}
              placeholder="0.00"
              value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
            />
          </div>

          {/* Category */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Category</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, category: cat }))}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all ${
                    form.category === cat
                      ? 'border text-white'
                      : isDark ? 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={form.category === cat ? { background: `${CATEGORY_COLORS[cat]}22`, borderColor: `${CATEGORY_COLORS[cat]}66`, color: CATEGORY_COLORS[cat] } : {}}
                >
                  <span className="text-base">{CATEGORY_ICONS[cat]}</span>
                  <span className="truncate w-full text-center">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Description</label>
            <input
              type="text"
              className={isDark ? 'input-dark' : 'input-light'}
              placeholder="e.g. Lunch at office"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>

          {/* Date */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Date</label>
            <input
              type="date"
              className={isDark ? 'input-dark' : 'input-light'}
              value={form.date}
              onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
              style={{ colorScheme: isDark ? 'dark' : 'light' }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TransactionsPage() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const { notifyDataChange } = useData()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const currency = user?.currency || 'INR'
  const sym = getCurrencySymbol(currency)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await transactionService.getAll({ limit: 100 })
      setTransactions(res.data?.transactions || [])
    } catch { toast.error('Failed to load transactions') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return
    try {
      await transactionService.delete(id)
      setTransactions(prev => prev.filter(t => t.id !== id))
      notifyDataChange()
      toast.success('Deleted')
    } catch { toast.error('Failed to delete') }
  }

  const filtered = transactions.filter(t => {
    const matchSearch = !search || t.description.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || t.type === filterType
    const matchCat = filterCategory === 'all' || t.category === filterCategory
    return matchSearch && matchType && matchCat
  })

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const selectClass = `px-3 py-2 rounded-xl text-sm outline-none transition-all cursor-pointer ${
    isDark
      ? 'bg-white/[0.05] border border-white/10 text-gray-300 hover:border-neon-cyan/30'
      : 'bg-white border border-gray-200 text-gray-700'
  }`

  return (
    <div className="space-y-6">
      {showModal && (
        <AddTransactionModal
          onClose={() => setShowModal(false)}
          onAdded={txn => {
            setTransactions(prev => [txn, ...prev])
            notifyDataChange()
          }}
          isDark={isDark}
          currency={currency}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Transactions</h1>
          <p className="text-gray-500 text-sm mt-0.5">{filtered.length} records</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm ${isDark ? 'bg-green-500/10 border border-green-500/20' : 'bg-green-50 border border-green-200'}`}>
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-gray-400 text-xs">Income</span>
          <span className="text-green-400 font-mono font-semibold">{sym}{totalIncome.toLocaleString('en-IN')}</span>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
          <TrendingDown className="w-4 h-4 text-red-400" />
          <span className="text-gray-400 text-xs">Expenses</span>
          <span className="text-red-400 font-mono font-semibold">{sym}{totalExpense.toLocaleString('en-IN')}</span>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
          <span className="text-gray-400 text-xs">Net</span>
          <span className={`font-mono font-semibold ${totalIncome - totalExpense >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {sym}{Math.abs(totalIncome - totalExpense).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className={`flex items-center gap-2 flex-1 min-w-40 px-3 py-2 rounded-xl ${
          isDark ? 'bg-white/[0.05] border border-white/10' : 'bg-white border border-gray-200'
        }`}>
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search transactions..."
            className={`bg-transparent outline-none text-sm flex-1 ${isDark ? 'text-white placeholder-gray-600' : 'text-gray-800 placeholder-gray-400'}`}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch('')} className="text-gray-500 hover:text-gray-300"><X className="w-3.5 h-3.5" /></button>}
        </div>

        <select value={filterType} onChange={e => setFilterType(e.target.value)} className={selectClass}
          style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'white' }}>
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={selectClass}
          style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'white' }}>
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Transactions list */}
      <div className={`glass-card ${isDark ? '' : 'glass-card-light'} overflow-hidden`}>
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl shimmer flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-40 rounded shimmer" />
                  <div className="h-3 w-24 rounded shimmer" />
                </div>
                <div className="h-4 w-20 rounded shimmer" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-gray-600">
            <div className="text-5xl">💳</div>
            <p className="text-sm">No transactions found</p>
            <button onClick={() => setShowModal(true)} className="text-xs text-neon-cyan hover:text-neon-green transition-colors">
              + Add your first transaction
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((txn, i) => (
              <div
                key={txn.id}
                className={`txn-item flex items-center gap-4 px-5 py-4 transition-colors group ${
                  isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.01]'
                }`}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: `${CATEGORY_COLORS[txn.category] || '#6366f1'}18` }}
                >
                  {CATEGORY_ICONS[txn.category] || '💳'}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {txn.description || txn.category}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: `${CATEGORY_COLORS[txn.category] || '#6366f1'}22`, color: CATEGORY_COLORS[txn.category] || '#6366f1' }}
                    >
                      {txn.category}
                    </span>
                    <span className="text-xs text-gray-600">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {dayjs(txn.date || txn.createdAt).format('MMM D, YYYY')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-sm font-mono font-semibold ${txn.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {txn.type === 'income' ? '+' : '-'}{sym}{Number(txn.amount).toLocaleString('en-IN')}
                  </span>
                  <button
                    onClick={() => handleDelete(txn.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
