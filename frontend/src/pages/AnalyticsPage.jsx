import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, BarChart3, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useData } from '../context/DataContext'
import { analyticsService } from '../services/api'
import toast from 'react-hot-toast'

const COLORS = ['#00f5ff','#7b2fff','#ff2d78','#00ff88','#f59e0b','#3b82f6','#6366f1']

function getCurrencySymbol(code) {
  const map = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥', AED: 'د.إ', SGD: 'S$' }
  return map[code] || code
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-3 text-xs border border-neon-cyan/20 min-w-32">
      <p className="text-gray-400 mb-2 font-medium">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-gray-300">{p.name}</span>
          </div>
          <span className="text-white font-mono">₹{Number(p.value).toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  )
}

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-2.5 text-xs border border-neon-cyan/20">
      <p style={{ color: payload[0].payload.fill }}>{payload[0].name}</p>
      <p className="text-white font-mono mt-0.5">₹{Number(payload[0].value).toLocaleString('en-IN')}</p>
      <p className="text-gray-500">{payload[0].payload.percent?.toFixed(1)}%</p>
    </div>
  )
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const { dataVersion } = useData()
  const [trend, setTrend] = useState([])
  const [categories, setCategories] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const sym = getCurrencySymbol(user?.currency || 'INR')

  useEffect(() => { fetchData() }, [dataVersion])

  const fetchData = async () => {
    // Only show full loading shimmer on initial load
    if (!summary) setLoading(true)
    try {
      const [trendRes, catRes, sumRes] = await Promise.all([
        analyticsService.getMonthlyTrend(),
        analyticsService.getCategoryBreakdown(),
        analyticsService.getSummary(),
      ])
      setTrend(trendRes.data || [])
      const cats = catRes.data || []
      const total = cats.reduce((s, c) => s + c.amount, 0)
      setCategories(cats.map(c => ({ ...c, percent: total > 0 ? (c.amount / total) * 100 : 0 })))
      setSummary(sumRes.data)
    } catch { toast.error('Failed to load analytics') }
    finally { setLoading(false) }
  }

  const cardBase = `glass-card ${isDark ? '' : 'glass-card-light'} p-5`
  const titleClass = `text-sm font-semibold mb-5 ${isDark ? 'text-white' : 'text-gray-900'}`

  if (loading) return (
    <div className="space-y-6">
      <div className="h-8 w-40 rounded-lg shimmer" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-72 rounded-2xl shimmer" />)}
      </div>
    </div>
  )

  // Compute savings rate
  const savingsRate = summary?.totalIncome > 0
    ? Math.round((summary.savings / summary.totalIncome) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">Financial insights & trends</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 text-xs text-gray-400 hover:text-neon-cyan transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'This Month Income', value: summary?.totalIncome || 0, color: '#00ff88', icon: TrendingUp },
          { label: 'This Month Expenses', value: summary?.totalExpenses || 0, color: '#ff2d78', icon: TrendingDown },
          { label: 'Net Savings', value: summary?.savings || 0, color: '#00f5ff', icon: BarChart3 },
          { label: 'Savings Rate', value: `${savingsRate}%`, color: '#7b2fff', icon: TrendingUp, isPercent: true },
        ].map(({ label, value, color, icon: Icon, isPercent }) => (
          <div key={label} className={cardBase}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4" style={{ color }} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className="font-mono text-xl font-semibold" style={{ color }}>
              {isPercent ? value : `${sym}${Number(value).toLocaleString('en-IN')}`}
            </p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense area chart */}
        <div className={`${cardBase} lg:col-span-2`}>
          <h2 className={titleClass}>Income vs Expenses — 6 Month Trend</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="incG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff2d78" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ff2d78" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="savG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#00f5ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${sym}${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }} />
              <Area type="monotone" dataKey="income"   stroke="#00ff88" strokeWidth={2} fill="url(#incG)" name="Income" />
              <Area type="monotone" dataKey="expenses" stroke="#ff2d78" strokeWidth={2} fill="url(#expG)" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly bar chart */}
        <div className={cardBase}>
          <h2 className={titleClass}>Monthly Comparison</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={trend} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${sym}${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income"   fill="#00ff88" name="Income"   radius={[4,4,0,0]} fillOpacity={0.8} />
              <Bar dataKey="expenses" fill="#ff2d78" name="Expenses" radius={[4,4,0,0]} fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className={cardBase}>
          <h2 className={titleClass}>Expense by Category</h2>
          {categories.length > 0 ? (
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={categories}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="amount"
                      nameKey="category"
                    >
                      {categories.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 pt-2">
                {categories.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className={`truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{cat.category}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-mono" style={{ color: COLORS[i % COLORS.length] }}>
                        {sym}{Number(cat.amount).toLocaleString('en-IN')}
                      </span>
                      <span className="text-gray-600 w-10 text-right">{cat.percent?.toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-gray-600 text-sm">
              No expense data for this period
            </div>
          )}
        </div>
      </div>

      {/* Savings progress bar */}
      <div className={cardBase}>
        <h2 className={titleClass}>Savings Health Score</h2>
        <div className="space-y-4">
          {[
            { label: 'Savings Rate',   value: Math.max(0, savingsRate), target: 20, color: '#00f5ff' },
            { label: 'Budget Adherence', value: Math.max(0, 100 - (summary?.budgetUsed || 0)), target: 80, color: '#00ff88' },
          ].map(({ label, value, target, color }) => (
            <div key={label}>
              <div className="flex justify-between text-xs mb-2">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{label}</span>
                <span className="font-mono" style={{ color }}>{value}% <span className="text-gray-600">(target: {target}%)</span></span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.06]' : 'bg-gray-200'}`}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(value, 100)}%`, background: color, boxShadow: `0 0 8px ${color}66` }}
                />
              </div>
              <div className="relative mt-1" style={{ marginLeft: `${Math.min(target, 100)}%` }}>
                <div className="w-px h-2 bg-gray-600 absolute -top-3 left-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
