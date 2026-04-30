import { useTheme } from '../context/ThemeContext'

/**
 * Consistent empty state for lists and tables.
 *
 * Usage:
 *   <EmptyState emoji="💳" message="No transactions yet" action={<button>+ Add</button>} />
 */
export default function EmptyState({ emoji = '📭', message = 'Nothing here yet', action }) {
  const { isDark } = useTheme()

  return (
    <div className={`glass-card ${isDark ? '' : 'glass-card-light'} py-16 flex flex-col items-center gap-3`}>
      <div className="text-5xl select-none">{emoji}</div>
      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{message}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
