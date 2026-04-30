import { useState, useEffect } from 'react'
import {
  TrendingUp, TrendingDown, Wallet, Target, RefreshCw,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useData } from '../context/DataContext'
import { analyticsService, transactionService } from '../services/api'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

const CATEGORY_COLORS = {
  Food:       '#00f5ff',
  Travel:     '#7b2fff',
  Bills:      '#ff2d78',
  Shopping:   '#00ff88',
  Health:     '#f59e0b',
  Education:  '#3b82f6',
  Other:      '#6366f1',
}

function StatCard({ title, value, change, icon: Icon, color, currency }) {
  const { isDark } = useTheme()
  const isPositive = change >= 0

  return (
    <div className={`glass-card ${isDark ? '' : 'glass-card-light'} p-5 group hover:scale-[1.01] transition-all duration-200`}>
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}22`, border: `1px solid ${color}44` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
          isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(change)}%
        </div>
      </div>
      <p className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{title}</p>
      <p className="stat-value" style={{ color }}>
        {currency} {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </p>
      <p className="text-xs text-gray-600 mt-1">vs last month</p>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card p-3 text-xs border border-neon-cyan/20">
      <p className="text-gray-400 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-300">{p.name}:</span>
          <span className="text-white font-mono">₹{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const { dataVersion } = useData()
  const [summary, setSummary] = useState(null)
  const [trend, setTrend] = useState([])
  const [categories, setCategories] = useState([])
  const [recentTxns, setRecentTxns] = useState([])
  const [loading, setLoading] = useState(true)
  const currency = user?.currency || 'INR'

  useEffect(() => {
    fetchDashboard()
  }, [dataVersion])

  const fetchDashboard = async () => {
    // Only show full loading shimmer on initial load
    if (!summary) setLoading(true)
    try {
      const [summaryRes, trendRes, catRes, txnRes] = await Promise.all([
        analyticsService.getSummary(),
        analyticsService.getMonthlyTrend(),
        analyticsService.getCategoryBreakdown(),
        transactionService.getAll({ limit: 5 }),
      ])
      setSummary(summaryRes.data)
      setTrend(trendRes.data)
      setCategories(catRes.data)
      setRecentTxns(txnRes.data?.transactions || [])
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { title: 'Total Income',    value: summary?.totalIncome   || 0, change: summary?.incomeChange   || 0, icon: TrendingUp,   color: '#00ff88' },
    { title: 'Total Expenses',  value: summary?.totalExpenses || 0, change: summary?.expenseChange  || 0, icon: TrendingDown,  color: '#ff2d78' },
    { title: 'Net Savings',     value: summary?.savings       || 0, change: summary?.savingsChange  || 0, icon: Wallet,        color: '#00f5ff' },
    { title: 'Budget Used',     value: `${summary?.budgetUsed || 0}%`, change: summary?.budgetChange || 0, icon: Target,    color: '#7b2fff' },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded-lg shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-2xl shimmer" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 rounded-2xl shimmer" />
          <div className="h-64 rounded-2xl shimmer" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Good {getGreeting()}, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{dayjs().format('dddd, MMMM D, YYYY')}</p>
        </div>
        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-neon-cyan transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => <StatCard key={s.title} {...s} currency={getCurrencySymbol(currency)} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly trend */}
        <div className={`glass-card ${isDark ? '' : 'glass-card-light'} p-5 lg:col-span-2`}>
          <div className="flex items-center justify-between mb-5">
            <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Monthly Trend</h2>
            <span className="text-xs text-gray-500">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff88" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff2d78" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ff2d78" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="income" stroke="#00ff88" strokeWidth={2} fill="url(#incGrad)" name="Income" />
              <Area type="monotone" dataKey="expenses" stroke="#ff2d78" strokeWidth={2} fill="url(#expGrad)" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown */}
        <div className={`glass-card ${isDark ? '' : 'glass-card-light'} p-5`}>
          <h2 className={`text-sm font-semibold mb-5 ${isDark ? 'text-white' : 'text-gray-900'}`}>Expense Breakdown</h2>
          {categories.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={categories}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="amount"
                  >
                    {categories.map((entry, idx) => (
                      <Cell key={idx} fill={CATEGORY_COLORS[entry.category] || '#6366f1'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [`₹${v.toLocaleString()}`, '']}
                    contentStyle={{ background: 'rgba(13,17,23,0.95)', border: '1px solid rgba(0,245,255,0.2)', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {categories.slice(0, 4).map((cat, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[cat.category] || '#6366f1' }} />
                      <span className="text-xs text-gray-400">{cat.category}</span>
                    </div>
                    <span className="text-xs font-mono text-gray-300">₹{cat.amount?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-600 text-sm">
              No expense data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className={`glass-card ${isDark ? '' : 'glass-card-light'} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Transactions</h2>
          <a href="/transactions" className="text-xs text-neon-cyan hover:text-neon-green transition-colors">View all →</a>
        </div>
        {recentTxns.length > 0 ? (
          <div className="space-y-3">
            {recentTxns.map((txn, i) => (
              <div key={txn.id || i} className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-black/[0.02]'
              }`}>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: `${CATEGORY_COLORS[txn.category] || '#6366f1'}22` }}
                >
                  {getCategoryEmoji(txn.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{txn.description}</p>
                  <p className="text-xs text-gray-500">{txn.category} · {dayjs(txn.createdAt).format('MMM D')}</p>
                </div>
                <span className={`text-sm font-mono font-medium ${
                  txn.type === 'income' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {txn.type === 'income' ? '+' : '-'}{getCurrencySymbol(currency)}{txn.amount?.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-24 flex items-center justify-center text-gray-600 text-sm">
            No transactions yet. Add your first one!
          </div>
        )}
      </div>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function getCurrencySymbol(code) {
  const map = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥', AED: 'د.إ', SGD: 'S$' }
  return map[code] || code
}

function getCategoryEmoji(cat) {
  const map = { Food: '🍔', Travel: '✈️', Bills: '📄', Shopping: '🛍️', Health: '💊', Education: '📚', Other: '💰' }
  return map[cat] || '💳'
}
