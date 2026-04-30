import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      toast.error('Please fill all fields')
      return
    }
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-dark-900' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative overflow-hidden bg-dark-900">
        <div className="absolute inset-0 bg-grid" />
        <div className="orb-cyan -top-20 -left-20" />
        <div className="orb-purple bottom-0 right-0" />

        <div className="relative z-10 text-center px-12">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center shadow-neon-cyan">
              <Zap className="w-9 h-9 text-white" />
            </div>
          </div>
          <h1 className="font-display text-5xl font-bold text-white mb-2 tracking-wide">FINANCE</h1>
          <h1 className="font-display text-5xl font-bold neon-text-cyan tracking-widest mb-6">SAATHI</h1>
          <p className="text-gray-400 text-lg leading-relaxed max-w-sm mx-auto">
            Your AI-powered financial companion for smarter budgeting and wealth tracking
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { label: 'Users', value: '50K+' },
              { label: 'Saved', value: '₹2Cr+' },
              { label: 'Accuracy', value: '99.9%' },
            ].map(({ label, value }) => (
              <div key={label} className="glass-card p-4 text-center">
                <div className="text-2xl font-display font-bold neon-text-green">{value}</div>
                <div className="text-xs text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className={`flex-1 flex items-center justify-center p-8 ${isDark ? '' : ''}`}>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className={`font-display font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>FINANCE</span>
              <span className="neon-text-cyan font-display font-bold">SAATHI</span>
            </div>
          </div>

          <div className={`rounded-2xl p-8 ${isDark ? 'glass-card' : 'glass-card-light shadow-glass-light'}`}>
            <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Welcome back</h2>
            <p className="text-gray-500 text-sm mb-8">Sign in to your account</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email
                </label>
                <input
                  type="email"
                  className={isDark ? 'input-dark' : 'input-light'}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  autoComplete="email"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className={`${isDark ? 'input-dark' : 'input-light'} pr-12`}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <p className={`text-center text-sm mt-6 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              Don't have an account?{' '}
              <Link to="/signup" className="text-neon-cyan hover:text-neon-green font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
