import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ArrowLeftRight, BarChart3, Target,
  Bot, User, LogOut, Sun, Moon, Menu, X, TrendingUp, Zap
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import CurrencySelector from '../CurrencySelector'

const NAV_ITEMS = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions',  icon: ArrowLeftRight,  label: 'Transactions' },
  { to: '/analytics',     icon: BarChart3,        label: 'Analytics' },
  { to: '/budget',        icon: Target,           label: 'Budget' },
  { to: '/ai-assistant',  icon: Bot,              label: 'AI Assistant' },
  { to: '/profile',       icon: User,             label: 'Profile' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className={`flex h-screen overflow-hidden ${isDark ? 'bg-dark-900' : 'bg-light-100'}`}>
      {/* Background effects */}
      {isDark && (
        <>
          <div className="orb-cyan -top-40 -left-40 pointer-events-none" />
          <div className="orb-purple top-1/2 right-0 pointer-events-none" />
          <div className="fixed inset-0 bg-grid pointer-events-none" />
        </>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 flex flex-col
        transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isDark
          ? 'border-r border-white/[0.06]'
          : 'border-r border-black/[0.06] bg-white/80 backdrop-blur-xl'
        }
      `}
        style={isDark ? {
          background: 'linear-gradient(180deg, rgba(13,17,23,0.98) 0%, rgba(8,11,18,0.98) 100%)',
          backdropFilter: 'blur(24px)'
        } : {}}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-6 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center flex-shrink-0 shadow-neon-cyan">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`font-display font-bold text-sm tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
              FINANCE
            </h1>
            <p className="neon-text-cyan text-xs font-display tracking-widest">SAATHI</p>
          </div>
          <button
            className="ml-auto lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User quick info */}
        <div className="px-4 py-4 border-b border-white/[0.04]">
          <div className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-white/[0.04]' : 'bg-black/[0.03]'}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">{user?.name?.[0]?.toUpperCase() || 'U'}</span>
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.currency || 'INR'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${isActive
                  ? isDark
                    ? 'bg-white/[0.08] text-white border border-neon-cyan/20 shadow-neon-cyan'
                    : 'bg-neon-purple/10 text-neon-purple border border-neon-purple/20'
                  : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-black/[0.04]'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? (isDark ? 'text-neon-cyan' : 'text-neon-purple') : ''}`} />
                  {label}
                  {isActive && (
                    <div className={`ml-auto w-1.5 h-1.5 rounded-full ${isDark ? 'bg-neon-cyan' : 'bg-neon-purple'}`} />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-white/[0.06] space-y-2">
          <CurrencySelector />
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isDark
                  ? 'bg-white/[0.05] text-gray-400 hover:text-white hover:bg-white/[0.08]'
                  : 'bg-black/[0.05] text-gray-500 hover:text-gray-900 hover:bg-black/[0.08]'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {isDark ? 'Light' : 'Dark'}
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className={`flex items-center gap-4 px-4 py-4 lg:hidden border-b ${
          isDark ? 'border-white/[0.06] bg-dark-800/80' : 'border-black/[0.06] bg-white/80'
        } backdrop-blur-sm`}>
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-neon-cyan" />
            <span className={`font-display font-bold text-sm tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>
              FINANCE<span className="neon-text-cyan">SAATHI</span>
            </span>
          </div>
          <button onClick={toggleTheme} className="ml-auto text-gray-400 hover:text-white">
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 lg:p-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
