import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function StatCard({ title, value, change, icon: Icon, color, prefix = '' }) {
  const { isDark } = useTheme()
  const isPositive = Number(change) >= 0

  return (
    <div className={`glass-card ${isDark ? '' : 'glass-card-light'} p-5 hover:scale-[1.01] transition-all duration-200 cursor-default`}>
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}20`, border: `1px solid ${color}40` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>

        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
            isPositive
              ? 'bg-green-500/10 text-green-400'
              : 'bg-red-500/10 text-red-400'
          }`}>
            {isPositive
              ? <ArrowUpRight className="w-3 h-3" />
              : <ArrowDownRight className="w-3 h-3" />
            }
            {Math.abs(Number(change))}%
          </div>
        )}
      </div>

      {/* Label */}
      <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>

      {/* Value */}
      <p
        className="font-mono text-2xl font-semibold tracking-tight truncate"
        style={{ color }}
      >
        {prefix}{typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </p>

      {change !== undefined && (
        <p className="text-xs text-gray-600 mt-1">vs last month</p>
      )}
    </div>
  )
}
