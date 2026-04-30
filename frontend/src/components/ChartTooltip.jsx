/**
 * Shared dark-themed Recharts tooltip.
 *
 * Usage inside a chart:
 *   <Tooltip content={<ChartTooltip currencySymbol="₹" />} />
 */
export default function ChartTooltip({ active, payload, label, currencySymbol = '₹' }) {
  if (!active || !payload?.length) return null

  return (
    <div
      className="rounded-xl px-3 py-2.5 text-xs border border-neon-cyan/20 shadow-glass"
      style={{
        background: 'rgba(8, 11, 18, 0.95)',
        backdropFilter: 'blur(16px)',
        minWidth: '120px',
      }}
    >
      {label && (
        <p className="text-gray-400 font-medium mb-2">{label}</p>
      )}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: entry.color }}
            />
            <span className="text-gray-400">{entry.name}</span>
          </div>
          <span className="text-white font-mono font-medium">
            {currencySymbol}{Number(entry.value).toLocaleString('en-IN')}
          </span>
        </div>
      ))}
    </div>
  )
}
