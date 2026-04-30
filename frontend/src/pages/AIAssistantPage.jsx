import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, TrendingUp, Target, Wallet, RefreshCw } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { aiService, analyticsService } from '../services/api'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

const SUGGESTED_PROMPTS = [
  { icon: TrendingUp, label: 'Analyze my spending', text: 'Analyze my recent spending patterns and give me insights.' },
  { icon: Target, label: 'Budget tips', text: 'Give me practical tips to stick to my monthly budget.' },
  { icon: Wallet, label: 'Save more', text: 'How can I increase my savings rate this month?' },
  { icon: Sparkles, label: 'Investment basics', text: 'What are some beginner-friendly investment options in India?' },
]

function TypingIndicator({ isDark }) {
  return (
    <div className="flex items-end gap-3 bubble-in">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className={`px-4 py-3 rounded-2xl rounded-bl-sm ${isDark ? 'bg-white/[0.06] border border-white/[0.08]' : 'bg-gray-100'}`}>
        <div className="flex items-center gap-1.5">
          <div className="typing-dot w-2 h-2 rounded-full bg-neon-cyan" />
          <div className="typing-dot w-2 h-2 rounded-full bg-neon-cyan" />
          <div className="typing-dot w-2 h-2 rounded-full bg-neon-cyan" />
        </div>
      </div>
    </div>
  )
}

function ChatMessage({ msg, isDark }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex items-end gap-3 bubble-in ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isUser
          ? 'bg-gradient-to-br from-neon-cyan to-neon-green'
          : 'bg-gradient-to-br from-neon-purple to-neon-pink'
        }`}>
        {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isUser
            ? 'bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/20 text-white rounded-br-sm'
            : isDark
              ? 'bg-white/[0.06] border border-white/[0.08] text-gray-100 rounded-bl-sm'
              : 'bg-gray-100 text-gray-800 rounded-bl-sm'
          }`}>
          {msg.content}
        </div>
        <span className="text-xs text-gray-600 px-1">{dayjs(msg.timestamp).format('HH:mm')}</span>
      </div>
    </div>
  )
}

export default function AIAssistantPage() {
  const { user } = useAuth()
  const { isDark } = useTheme()
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: `Namaste! 🙏 I'm FinanceSaathi AI, your personal financial advisor.\n\nI can help you with:\n• Budget planning & optimization\n• Spending pattern analysis\n• Savings strategies\n• Investment guidance for the Indian market\n\nWhat would you like to know?`,
      timestamp: new Date().toISOString(),
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [context, setContext] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    // Load financial context and chat history
    loadContext()
    loadHistory()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const loadHistory = async () => {
    try {
      const res = await aiService.getHistory()
      if (res.data && res.data.length > 0) {
        // Map DB items to UI message format
        const historyMsgs = res.data.map((h, i) => ({
          id: `h-${i}`,
          role: h.role,
          content: h.content,
          timestamp: new Date().toISOString()
        }))
        setMessages(historyMsgs)
      }
    } catch { /* non-critical */ }
  }

  const loadContext = async () => {
    try {
      const res = await analyticsService.getSummary()
      setContext(res.data)
    } catch { /* non-critical */ }
  }

  const sendMessage = async (text) => {
    const msgText = text || input.trim()
    if (!msgText || loading) return

    const userMsg = { id: Date.now(), role: 'user', content: msgText, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const financialContext = context ? {
        currency: user?.currency || 'INR',
        thisMonthIncome: context.totalIncome,
        thisMonthExpenses: context.totalExpenses,
        savings: context.savings,
        budgetUsed: context.budgetUsed,
      } : { currency: user?.currency || 'INR' }

      const res = await aiService.query(msgText, financialContext, messages)

      if (res.data?.error) {
        throw new Error(res.data.error)
      }

      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: res.data?.reply || 'I could not process that. Please try again.',
        timestamp: new Date().toISOString(),
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      console.error('AI Error:', err)
      const errMsg = {
        id: Date.now() + 2,
        role: 'assistant',
        content: `I'm having trouble thinking right now (${err.message || 'Network error'}). Would you like to try again?`,
        timestamp: new Date().toISOString(),
        isError: true
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const retryLastMessage = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')
    if (lastUserMsg) {
      sendMessage(lastUserMsg.content)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([{
      id: Date.now(),
      role: 'assistant',
      content: 'Chat cleared! How can I help you with your finances today?',
      timestamp: new Date().toISOString(),
    }])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-purple to-neon-pink flex items-center justify-center shadow-neon-purple">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Financial Advisor</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-gray-500">Online · Powered by OpenAI</span>
            </div>
          </div>
        </div>
        <button onClick={clearChat} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      {/* Chat area */}
      <div className={`flex-1 overflow-y-auto rounded-2xl p-4 space-y-4 ${isDark ? 'glass-card border border-white/[0.06]' : 'glass-card-light border border-black/[0.06]'
        }`}>
        {messages.map(msg => <ChatMessage key={msg.id} msg={msg} isDark={isDark} />)}
        {loading && <TypingIndicator isDark={isDark} />}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts (show only if few messages) */}
      {messages.length <= 2 && (
        <div className="flex-shrink-0 mt-3 grid grid-cols-2 gap-2">
          {SUGGESTED_PROMPTS.map(({ icon: Icon, label, text }) => (
            <button
              key={label}
              onClick={() => sendMessage(text)}
              disabled={loading}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-left transition-all disabled:opacity-50 ${isDark
                  ? 'bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:bg-white/[0.07] hover:text-gray-200 hover:border-neon-purple/30'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-neon-purple/30 hover:text-gray-900'
                }`}
            >
              <Icon className="w-3.5 h-3.5 text-neon-purple flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className={`flex-shrink-0 mt-3 flex items-end gap-3 p-3 rounded-2xl ${isDark ? 'glass-card border border-white/[0.08]' : 'glass-card-light border border-black/[0.06]'
        }`}>
        <textarea
          ref={inputRef}
          rows={1}
          className={`flex-1 bg-transparent outline-none text-sm resize-none leading-relaxed max-h-32 ${isDark ? 'text-white placeholder-gray-600' : 'text-gray-800 placeholder-gray-400'
            }`}
          placeholder="Ask about your finances... (Enter to send)"
          value={input}
          onChange={e => {
            setInput(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${input.trim() && !loading
              ? 'bg-gradient-to-br from-neon-cyan to-neon-purple text-white shadow-neon-cyan hover:scale-105'
              : 'bg-white/[0.05] text-gray-600 cursor-not-allowed'
            }`}
        >
          {loading
            ? <div className="w-4 h-4 border-2 border-gray-600 border-t-neon-cyan rounded-full animate-spin" />
            : <Send className="w-4 h-4" />
          }
        </button>
      </div>
    </div>
  )
}
