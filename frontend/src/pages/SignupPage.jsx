import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { CURRENCIES } from '../components/CurrencySelector'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const { signup } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', currency: 'INR' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill all fields')
      return
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await signup(form.name, form.email, form.password, form.currency)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = isDark ? 'input-dark' : 'input-light'
  const labelClass = `block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`

  return (
    <div className={`min-h-screen flex items-center justify-center p-8 ${isDark ? 'bg-dark-900' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
      {isDark && (
        <>
          <div className="fixed inset-0 bg-grid pointer-events-none" />
          <div className="orb-cyan -top-40 -left-40" />
          <div className="orb-purple bottom-0 right-0" />
        </>
      )}

      <div className="relative w-full max-w-md">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center shadow-neon-cyan">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className={`font-display font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>FINANCE</span>
            <span className="neon-text-cyan font-display font-bold text-xl">SAATHI</span>
          </div>
        </div>

        <div className={`rounded-2xl p-8 ${isDark ? 'glass-card' : 'glass-card-light shadow-glass-light'}`}>
          <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Create account</h2>
          <p className="text-gray-500 text-sm mb-8">Start your financial journey</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                className={inputClass}
                placeholder="Rahul Sharma"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                className={inputClass}
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              />
            </div>

            <div>
              <label className={labelClass}>Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className={`${inputClass} pr-12`}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
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

            <div>
              <label className={labelClass}>Preferred Currency</label>
              <select
                className={`${inputClass} cursor-pointer`}
                value={form.currency}
                onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
                style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code} style={{ background: isDark ? '#111827' : '#fff' }}>
                    {c.symbol} {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </>
              )}
            </button>
          </form>

          <p className={`text-center text-sm mt-6 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            Already have an account?{' '}
            <Link to="/login" className="text-neon-cyan hover:text-neon-green font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
