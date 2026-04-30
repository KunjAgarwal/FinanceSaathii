import { useState } from 'react'
import { User, Mail, Globe, Save, Camera, Shield, Bell, X, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { CURRENCIES } from '../components/CurrencySelector'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth()
  const { isDark } = useTheme()
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currency: user?.currency || 'INR',
  })
  const [loading, setLoading] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name) { toast.error('Name is required'); return }
    setLoading(true)
    try {
      await api.put('/profile', { name: form.name, currency: form.currency })
      updateUser({ name: form.name, currency: form.currency })
      toast.success('Profile updated!')
    } catch { toast.error('Failed to update profile') }
    finally { setLoading(false) }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pwdForm.newPassword !== pwdForm.confirmPassword) return toast.error('Passwords do not match')
    if (pwdForm.newPassword.length < 8) return toast.error('Password must be at least 8 characters')
    setLoading(true)
    try {
      await api.put('/profile/security/password', { currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword })
      toast.success('Password updated successfully')
      setShowPasswordModal(false)
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password')
    } finally { setLoading(false) }
  }

  const handleDeleteAccount = async () => {
    setLoading(true)
    try {
      await api.delete('/profile')
      toast.success('Account deleted successfully')
      logout()
    } catch {
      toast.error('Failed to delete account')
      setLoading(false)
    }
  }

  const cardBase = `glass-card ${isDark ? '' : 'glass-card-light'} p-6`
  const labelClass = `block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`
  const inputClass = isDark ? 'input-dark' : 'input-light'

  return (
    <div className="space-y-6 max-w-2xl relative">
      <div>
        <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Profile</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account settings</p>
      </div>

      {/* Avatar + info */}
      <div className={cardBase}>
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center text-3xl font-bold text-white shadow-neon-purple">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-dark-600 border border-white/20 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{user?.name}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 font-medium">
                {user?.currency || 'INR'}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className={cardBase}>
        <h3 className={`text-sm font-semibold mb-5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <User className="w-4 h-4 text-neon-cyan" />
          Personal Information
        </h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className={labelClass}>Full Name</label>
            <input type="text" className={inputClass} value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name" />
          </div>
          <div>
            <label className={labelClass}>Email Address</label>
            <div className="relative">
              <input type="email" className={`${inputClass} opacity-60 cursor-not-allowed`} value={form.email} disabled />
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            </div>
            <p className="text-xs text-gray-600 mt-1">Email cannot be changed</p>
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
          <button type="submit" disabled={loading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50">
            {loading
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Save className="w-4 h-4" />
            }
            Save Changes
          </button>
        </form>
      </div>

      {/* Security section */}
      <div className={cardBase}>
        <h3 className={`text-sm font-semibold mb-5 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <Shield className="w-4 h-4 text-neon-purple" />
          Security
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Two-factor authentication', status: 'Disabled', color: 'text-red-400', action: 'Enable', onClick: () => toast('Two-factor authentication coming soon!') },
            { label: 'Password', status: 'Last changed: Never', color: 'text-gray-500', action: 'Change', onClick: () => setShowPasswordModal(true) },
          ].map(({ label, status, color, action, onClick }) => (
            <div key={label} className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{label}</p>
                <p className={`text-xs mt-0.5 ${color}`}>{status}</p>
              </div>
              <button type="button" onClick={onClick} className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                isDark
                  ? 'bg-white/[0.06] text-gray-300 hover:bg-white/[0.1] hover:text-white'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}>
                {action}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className={`${cardBase} border border-red-500/20`}>
        <h3 className="text-sm font-semibold mb-4 text-red-400 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Danger Zone
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>Delete Account</p>
            <p className="text-xs text-gray-500 mt-0.5">Permanently delete your account and all data</p>
          </div>
          <button type="button" onClick={() => setShowDeleteModal(true)} className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all">
            Delete
          </button>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`${cardBase} w-full max-w-sm relative border-neon-cyan/20`}>
            <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
            <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className={labelClass}>Current Password</label>
                <input type="password" required className={inputClass} value={pwdForm.currentPassword}
                  onChange={e => setPwdForm({ ...pwdForm, currentPassword: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>New Password</label>
                <input type="password" required className={inputClass} value={pwdForm.newPassword}
                  onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Confirm New Password</label>
                <input type="password" required className={inputClass} value={pwdForm.confirmPassword}
                  onChange={e => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`${cardBase} w-full max-w-sm relative border-red-500/30`}>
            <button onClick={() => setShowDeleteModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Delete Account?</h3>
              <p className="text-sm text-gray-400 mb-6">
                Are you absolutely sure? This action cannot be undone and will permanently delete your financial data.
              </p>
              <div className="flex gap-3 w-full">
                <button type="button" onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 rounded-xl text-sm font-medium bg-gray-800 text-white hover:bg-gray-700 transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={handleDeleteAccount} disabled={loading} className="flex-1 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50">
                  {loading ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
