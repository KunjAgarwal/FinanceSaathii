import { useTheme } from '../context/ThemeContext'

/**
 * Consistent page header with title, subtitle, and optional right-side action.
 *
 * Usage:
 *   <PageHeader title="Dashboard" subtitle="Overview" action={<button>...</button>} />
 */
export default function PageHeader({ title, subtitle, action }) {
  const { isDark } = useTheme()

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
