import { useState, useEffect } from 'react'
import { Plus, Target, Trash2, AlertTriangle, CheckCircle, Sparkles, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { budgetService } from '../services/api'
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

function BudgetCard({ budget, sym, onDelete, isDark }) {
  const spent = budget.spent || 0
  const limit = budget.limit
  const pct = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0
  const isOver = spent > limit
  const isWarning = pct >= 80 && !isOver
  const color = isOver ? '#ff2d78' : isWarning ? '#f59e0b' : CATEGORY_COLORS[budget.category] || '#6366f1'

  return (
    <div className={`glass-card ${isDark ? '' : 'glass-card-light'} p-5 hover:scale-[1.01] transition-all duration-200`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: `${color}18` }}>
            {CATEGORY_ICONS[budget.category] || '💰'}
          </div>
          <div>
            <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{budget.category}</h3>
            <p className="text-xs text-gray-500">{dayjs().format('MMMM YYYY')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOver && <AlertTriangle className="w-4 h-4 text-red-400" />}
          {pct < 80 && <CheckCircle className="w-4 h-4 text-green-500" />}
          <button onClick={() => onDelete(budget.budgetId)} className="text-gray-600 hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className={`h-2 rounded-full overflow-hidden mb-3 ${isDark ? 'bg-white/[0.06]' : 'bg-gray-200'}`}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}66` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <div>
          <span className="font-mono font-semibold" style={{ color }}>
            {sym}{spent.toLocaleString('en-IN')}
          </span>
          <span className="text-gray-500"> / {sym}{limit.toLocaleString('en-IN')}</span>
        </div>
        <span className={`font-mono font-bold ${isOver ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-gray-400'}`}>
          {pct}%
        </span>
      </div>

      {isOver && (
        <div className="mt-3 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          Over budget by {sym}{(spent - limit).toLocaleString('en-IN')}
        </div>
      )}
    </div>
  )
}

function AddBudgetModal({ onClose, onAdded, isDark, currency, existingCategories }) {
  const [form, setForm] = useState({ category: '', limit: '', month: dayjs().format('YYYY-MM') })
  const [loading, setLoading] = useState(false)
  const sym = getCurrencySymbol(currency)
  const available = CATEGORIES.filter(c => !existingCategories.includes(c))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.category) { toast.error('Select a category'); return }
    if (!form.limit || Number(form.limit) <= 0) { toast.error('Enter a valid limit'); return }
    setLoading(true)
    try {
      const res = await budgetService.create({ ...form, limit: Number(form.limit) })
      toast.success('Budget created!')
      onAdded(res.data)
      onClose()
    } catch { toast.error('Failed to create budget') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-2xl p-6 ${isDark ? 'glass-card border border-white/10' : 'bg-white shadow-xl'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Set Budget</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-xs font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Category</label>
            {available.length === 0 ? (
              <p className="text-xs text-amber-400">All categories have budgets set.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {available.map(cat => (
                  <button key={cat} type="button" onClick={() => setForm(p => ({ ...p, category: cat }))}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all ${
                      form.category === cat ? 'border' : isDark ? 'bg-white/[0.04] text-gray-400 hover:bg-white/[0.08]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={form.category === cat ? { background: `${CATEGORY_COLORS[cat]}22`, borderColor: `${CATEGORY_COLORS[cat]}66`, color: CATEGORY_COLORS[cat] } : {}}>
                    <span className="text-base">{CATEGORY_ICONS[cat]}</span>
                    <span className="truncate w-full text-center">{cat}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Monthly Limit ({sym})</label>
            <input type="number" min="0" step="1" className={isDark ? 'input-dark' : 'input-light'}
              placeholder="e.g. 5000" value={form.limit} onChange={e => setForm(p => ({ ...p, limit: e.target.value }))} />
          </div>
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Month</label>
            <input type="month" className={isDark ? 'input-dark' : 'input-light'}
              value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))}
              style={{ colorScheme: isDark ? 'dark' : 'light' }} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading || available.length === 0}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Target className="w-4 h-4" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function BudgetPage() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [budgets, setBudgets] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [loadingRecs, setLoadingRecs] = useState(false)
  const currency = user?.currency || 'INR'
  const sym = getCurrencySymbol(currency)

  useEffect(() => { fetchBudgets() }, [])

  const fetchBudgets = async () => {
    setLoading(true)
    try {
      const res = await budgetService.getAll()
      setBudgets(res.data?.budgets || [])
    } catch { toast.error('Failed to load budgets') }
    finally { setLoading(false) }
  }

  const fetchRecommendations = async () => {
    setLoadingRecs(true)
    try {
      const res = await budgetService.getRecommendations()
      setRecommendations(res.data?.recommendations || [])
    } catch { toast.error('Failed to get recommendations') }
    finally { setLoadingRecs(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this budget?')) return
    try {
      await budgetService.delete(id)
      setBudgets(prev => prev.filter(b => b.budgetId !== id))
      toast.success('Budget removed')
    } catch { toast.error('Failed to delete budget') }
  }

  const totalBudget = budgets.reduce((s, b) => s + b.limit, 0)
  const totalSpent  = budgets.reduce((s, b) => s + (b.spent || 0), 0)
  const overBudget  = budgets.filter(b => (b.spent || 0) > b.limit)
  const existingCategories = budgets.map(b => b.category)

  return (
    <div className="space-y-6">
      {showModal && (
        <AddBudgetModal
          onClose={() => setShowModal(false)}
          onAdded={b => setBudgets(prev => [b, ...prev])}
          isDark={isDark}
          currency={currency}
          existingCategories={existingCategories}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Budget Planner</h1>
          <p className="text-gray-500 text-sm mt-0.5">{dayjs().format('MMMM YYYY')}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Set Budget
        </button>
      </div>

      {/* Overview card */}
      <div className={`glass-card ${isDark ? '' : 'glass-card-light'} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Budget</p>
            <p className="font-mono text-2xl font-bold text-white">{sym}{totalBudget.toLocaleString('en-IN')}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">Total Spent</p>
            <p className={`font-mono text-2xl font-bold ${totalSpent > totalBudget ? 'text-red-400' : 'text-green-400'}`}>
              {sym}{totalSpent.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
        <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-gray-200'}`}>
          <div className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0}%`,
              background: totalSpent > totalBudget ? '#ff2d78' : 'linear-gradient(90deg, #00f5ff, #00ff88)',
              boxShadow: totalSpent > totalBudget ? '0 0 12px rgba(255,45,120,0.5)' : '0 0 12px rgba(0,245,255,0.4)',
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>{totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0}% used</span>
          <span>{sym}{Math.max(totalBudget - totalSpent, 0).toLocaleString('en-IN')} remaining</span>
        </div>
        {overBudget.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            {overBudget.length} {overBudget.length === 1 ? 'category' : 'categories'} over budget: {overBudget.map(b => b.category).join(', ')}
          </div>
        )}
      </div>

      {/* Budget cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-48 rounded-2xl shimmer" />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className={`glass-card ${isDark ? '' : 'glass-card-light'} py-16 flex flex-col items-center gap-3 text-gray-600`}>
          <Target className="w-12 h-12 text-gray-700" />
          <p className="text-sm">No budgets set yet</p>
          <button onClick={() => setShowModal(true)} className="text-xs text-neon-cyan hover:text-neon-green transition-colors">
            + Set your first budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map(budget => (
            <BudgetCard key={budget.budgetId} budget={budget} sym={sym} onDelete={handleDelete} isDark={isDark} />
          ))}
        </div>
      )}

      {/* AI Recommendations */}
      <div className={`glass-card ${isDark ? '' : 'glass-card-light'} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-neon-purple" />
            <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Budget Recommendations</h2>
          </div>
          <button
            onClick={fetchRecommendations}
            disabled={loadingRecs}
            className="text-xs text-neon-cyan hover:text-neon-green transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {loadingRecs ? <div className="w-3 h-3 border border-neon-cyan/50 border-t-neon-cyan rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {loadingRecs ? 'Analyzing...' : 'Get Recommendations'}
          </button>
        </div>

        {recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                <div className="w-7 h-7 rounded-lg bg-neon-purple/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm">{CATEGORY_ICONS[rec.category] || '💡'}</span>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{rec.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{rec.message}</p>
                  {rec.suggestedLimit && (
                    <p className="text-xs text-neon-cyan mt-1">Suggested limit: {sym}{rec.suggestedLimit.toLocaleString('en-IN')}/month</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600 text-center py-4">
            Click "Get Recommendations" to receive AI-powered budget advice based on your spending patterns.
          </p>
        )}
      </div>
    </div>
  )
}
