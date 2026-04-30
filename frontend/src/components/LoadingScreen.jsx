export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-dark-900">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
            <span className="text-2xl font-display font-bold text-white">FS</span>
          </div>
          <div className="absolute -inset-2 rounded-2xl border border-neon-cyan/30 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-neon-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-neon-purple animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-neon-pink animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-gray-500 text-sm font-mono">Loading FinanceSaathi...</p>
      </div>
    </div>
  )
}
