$authCode = @"

// --- Router Wrapper ---
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  const path = event.resource || event.path || ''
  if (path === '/auth/signup') return exports.signup(event)
  if (path === '/auth/login') return exports.login(event)
  if (path === '/profile' && event.httpMethod === 'GET') return exports.getProfile(event)
  if (path === '/profile' && event.httpMethod === 'PUT') return exports.updateProfile(event)
  return r.notFound()
}
"@
Add-Content -Path "d:\financesaathi\financesaathi\backend\lambdas\auth.js" -Value $authCode

$txnCode = @"

// --- Router Wrapper ---
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  const path = event.resource || event.path || ''
  const method = event.httpMethod
  if (method === 'GET' && path === '/transactions') return exports.getAll(event)
  if (method === 'POST' && path === '/transactions') return exports.create(event)
  if (method === 'PUT' && path.startsWith('/transactions/')) return exports.update(event)
  if (method === 'DELETE' && path.startsWith('/transactions/')) return exports.deleteTransaction(event)
  return r.notFound()
}
"@
Add-Content -Path "d:\financesaathi\financesaathi\backend\lambdas\transactions.js" -Value $txnCode

$analyticsCode = @"

// --- Router Wrapper ---
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  const path = event.resource || event.path || ''
  if (path === '/analytics') return exports.getSummary(event)
  if (path === '/analytics/trend') return exports.getMonthlyTrend(event)
  if (path === '/analytics/categories') return exports.getCategoryBreakdown(event)
  return r.notFound()
}
"@
Add-Content -Path "d:\financesaathi\financesaathi\backend\lambdas\analytics.js" -Value $analyticsCode

$budgetCode = @"

// --- Router Wrapper ---
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  const path = event.resource || event.path || ''
  const method = event.httpMethod
  if (method === 'GET' && path === '/budget/recommendations') return exports.getRecommendations(event)
  if (method === 'GET' && path === '/budget') return exports.getAll(event)
  if (method === 'POST' && path === '/budget') return exports.create(event)
  if (method === 'PUT' && path.startsWith('/budget/')) return exports.update(event)
  if (method === 'DELETE' && path.startsWith('/budget/')) return exports.deleteBudget(event)
  return r.notFound()
}
"@
Add-Content -Path "d:\financesaathi\financesaathi\backend\lambdas\budget.js" -Value $budgetCode

$currencyCode = @"

// --- Router Wrapper ---
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  const path = event.resource || event.path || ''
  if (path === '/currency/rates') return exports.getRates(event)
  if (path === '/currency/convert') return exports.convert(event)
  return r.notFound()
}
"@
Add-Content -Path "d:\financesaathi\financesaathi\backend\lambdas\currency.js" -Value $currencyCode
