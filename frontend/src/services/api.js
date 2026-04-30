import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://gcbtpkop3h.execute-api.ap-south-1.amazonaws.com'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fs-token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (name, email, password, currency) => api.post('/auth/signup', { name, email, password, currency }),
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
}

// ─── Transactions ─────────────────────────────────────────────────────────────
export const transactionService = {
  getAll: (params) => api.get('/transactions', { params }),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export const analyticsService = {
  getSummary: (params) => api.get('/analytics', { params }),
  getMonthlyTrend: () => api.get('/analytics/trend'),
  getCategoryBreakdown: (params) => api.get('/analytics/categories', { params }),
}

// ─── Budget ───────────────────────────────────────────────────────────────────
export const budgetService = {
  getAll: () => api.get('/budget'),
  create: (data) => api.post('/budget', data),
  update: (id, data) => api.put(`/budget/${id}`, data),
  delete: (id) => api.delete(`/budget/${id}`),
  getRecommendations: () => api.get('/budget/recommendations'),
}

// ─── AI Assistant ─────────────────────────────────────────────────────────────
export const aiService = {
  query: (message, context, history = []) => api.post('/ai/query', { message, context, history }),
  getHistory: () => api.get('/ai/history'),
}

// ─── Currency ─────────────────────────────────────────────────────────────────
export const currencyService = {
  convert: (from, to, amount) => api.get('/currency/convert', { params: { from, to, amount } }),
  getRates: (base) => api.get('/currency/rates', { params: { base } }),
}
