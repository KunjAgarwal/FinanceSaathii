import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Mail, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../context/ThemeContext'
import { sendOtp, verifyOtp } from '../services/cognitoOtp'
import toast from 'react-hot-toast'

export default function VerifyEmailPage() {
  const { isDark } = useTheme()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState(1) // 1: Email, 2: OTP
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email')
      return
    }

    setLoading(true)
    try {
      await sendOtp(email)
      toast.success('OTP sent to your email!')
      setStep(2)
    } catch (err) {
      if (err.name === 'UsernameExistsException') {
        // In this specific flow, if user exists we can still proceed to OTP step 
        // if we want to support re-verifying, but Cognito might not auto-resend.
        // For simplicity, we'll suggest they might already be verified or try another email.
        toast.error('This email is already registered or verification is in progress.')
        // We can optionally force move to step 2 if they claim they have a code
        setStep(2)
      } else {
        toast.error(err.message || 'Failed to send OTP')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (!otp || otp.length < 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    setLoading(true)
    try {
      await verifyOtp(email, otp)
      toast.success('Email verified successfully!')
      setStep(3) // Success state
    } catch (err) {
      toast.error(err.message || 'Invalid or expired OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    try {
      await sendOtp(email)
      toast.success('New OTP sent!')
    } catch (err) {
      toast.error('Failed to resend OTP. Please try again later.')
    } finally {
      setResending(false)
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
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Verify Email</h2>
                <p className="text-gray-500 text-sm mb-8">Enter your email to receive a verification code</p>

                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <label className={labelClass}>Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        className={`${inputClass} pl-11`}
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Send Verification Code
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <button 
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-sm text-neon-cyan hover:text-neon-green mb-4 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Change Email
                </button>
                
                <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Enter OTP</h2>
                <p className="text-gray-500 text-sm mb-8">We've sent a 6-digit code to <span className="text-neon-cyan">{email}</span></p>

                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div>
                    <label className={labelClass}>6-Digit Code</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        maxLength="6"
                        className={`${inputClass} pl-11 text-center tracking-[0.5em] text-xl font-bold`}
                        placeholder="000000"
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Verify Code
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="text-sm text-gray-500 hover:text-neon-cyan transition-colors flex items-center gap-2 mx-auto"
                    >
                      {resending ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Resend OTP
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="w-10 h-10 text-neon-green" />
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Verified!</h2>
                <p className="text-gray-500 mb-8">Your email has been successfully verified with Amazon Cognito.</p>
                
                <Link to="/login" className="btn-primary inline-block">
                  Back to Login
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {step !== 3 && (
            <p className={`text-center text-sm mt-8 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              Already verified?{' '}
              <Link to="/login" className="text-neon-cyan hover:text-neon-green font-medium transition-colors">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
