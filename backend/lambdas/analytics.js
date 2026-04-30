'use strict'

const { QueryCommand, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb')
const { docClient }   = require('../utils/db')
const r               = require('../utils/response')
const { verifyToken } = require('../utils/authorizer')
const dayjs           = require('dayjs')

const TXN_TABLE   = process.env.TRANSACTIONS_TABLE    || 'fs-transactions'
const BUDGET_TABLE= process.env.BUDGETS_TABLE         || 'fs-budgets'
const CACHE_TABLE = process.env.ANALYTICS_CACHE_TABLE || 'fs-analytics-cache'
const CACHE_TTL   = 300 // 5 minutes

async function getCached(userId, key) {
  try {
    const res = await docClient.send(new GetCommand({ TableName: CACHE_TABLE, Key: { userId, cacheKey: key } }))
    if (res.Item && res.Item.expiresAt > Math.floor(Date.now() / 1000)) {
      return JSON.parse(res.Item.data)
    }
  } catch { /* cache miss is fine */ }
  return null
}

async function setCache(userId, key, data) {
  try {
    await docClient.send(new PutCommand({
      TableName: CACHE_TABLE,
      Item: {
        userId, cacheKey: key,
        data: JSON.stringify(data),
        expiresAt: Math.floor(Date.now() / 1000) + CACHE_TTL,
      },
    }))
  } catch { /* non-critical */ }
}

async function getAllTransactions(userId, startDate) {
  const allItems = []
  let lastKey
  do {
    const params = {
      TableName: TXN_TABLE,
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :uid AND createdAt >= :start',
      ExpressionAttributeValues: { ':uid': userId, ':start': startDate },
      ScanIndexForward: true,
      ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
    }
    const res = await docClient.send(new QueryCommand(params))
    allItems.push(...(res.Items || []))
    lastKey = res.LastEvaluatedKey
  } while (lastKey)
  return allItems
}

// ─── GET /analytics ────────────────────────────────────────────────────────────
exports.getSummary = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  try {
    const { userId } = verifyToken(event)
    const cacheKey = `summary:${dayjs().format('YYYY-MM')}`

    const cached = await getCached(userId, cacheKey)
    if (cached) return r.ok(cached)

    const thisMonthStart = dayjs().startOf('month').toISOString()
    const lastMonthStart = dayjs().subtract(1, 'month').startOf('month').toISOString()
    const lastMonthEnd   = dayjs().startOf('month').toISOString()

    const [thisTxns, lastTxns, budgets] = await Promise.all([
      getAllTransactions(userId, thisMonthStart),
      docClient.send(new QueryCommand({
        TableName: TXN_TABLE,
        IndexName: 'userId-createdAt-index',
        KeyConditionExpression: 'userId = :uid AND createdAt BETWEEN :s AND :e',
        ExpressionAttributeValues: { ':uid': userId, ':s': lastMonthStart, ':e': lastMonthEnd },
      })).then(r => r.Items || []),
      docClient.send(new QueryCommand({
        TableName: BUDGET_TABLE,
        IndexName: 'userId-index',
        KeyConditionExpression: 'userId = :uid',
        FilterExpression: 'begins_with(#month, :m)',
        ExpressionAttributeValues: { ':uid': userId, ':m': dayjs().format('YYYY-MM') },
        ExpressionAttributeNames: { '#month': 'month' },
      })).then(r => r.Items || []),
    ])

    const sum = (arr, type) => arr.filter(t => t.type === type).reduce((s, t) => s + t.amount, 0)
    const totalIncome   = sum(thisTxns, 'income')
    const totalExpenses = sum(thisTxns, 'expense')
    const lastIncome    = sum(lastTxns, 'income')
    const lastExpenses  = sum(lastTxns, 'expense')

    const pctChange = (curr, prev) => prev === 0 ? 0 : Math.round(((curr - prev) / prev) * 100)

    // Calculate budget used %
    const totalBudget = budgets.reduce((s, b) => s + b.limit, 0)
    const budgetUsed = totalBudget > 0 ? Math.round((totalExpenses / totalBudget) * 100) : 0

    const result = {
      totalIncome, totalExpenses,
      savings: totalIncome - totalExpenses,
      budgetUsed: Math.min(budgetUsed, 999),
      incomeChange:  pctChange(totalIncome, lastIncome),
      expenseChange: pctChange(totalExpenses, lastExpenses),
      savingsChange: pctChange(totalIncome - totalExpenses, lastIncome - lastExpenses),
      budgetChange:  0,
      month: dayjs().format('MMMM YYYY'),
    }

    await setCache(userId, cacheKey, result)
    return r.ok(result)
  } catch (e) {
    if (e.statusCode) return r.unauth(e.message)
    return r.error('Get analytics failed', e)
  }
}

// ─── GET /analytics/trend ─────────────────────────────────────────────────────
exports.getMonthlyTrend = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  try {
    const { userId } = verifyToken(event)
    const cached = await getCached(userId, 'trend:6m')
    if (cached) return r.ok(cached)

    const sixMonthsAgo = dayjs().subtract(5, 'month').startOf('month').toISOString()
    const allTxns = await getAllTransactions(userId, sixMonthsAgo)

    const months = []
    for (let i = 5; i >= 0; i--) {
      const month  = dayjs().subtract(i, 'month')
      const prefix = month.format('YYYY-MM')
      const txns   = allTxns.filter(t => t.createdAt.startsWith(prefix))
      months.push({
        month:    month.format('MMM'),
        year:     month.format('YYYY'),
        income:   txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        expenses: txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      })
    }

    await setCache(userId, 'trend:6m', months)
    return r.ok(months)
  } catch (e) {
    if (e.statusCode) return r.unauth(e.message)
    return r.error('Get trend failed', e)
  }
}

// ─── GET /analytics/categories ────────────────────────────────────────────────
exports.getCategoryBreakdown = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  try {
    const { userId } = verifyToken(event)
    const qs    = event.queryStringParameters || {}
    const month = qs.month || dayjs().format('YYYY-MM')
    const cacheKey = `cats:${month}`
    const cached = await getCached(userId, cacheKey)
    if (cached) return r.ok(cached)

    const startDate = dayjs(month).startOf('month').toISOString()
    const endDate   = dayjs(month).endOf('month').toISOString()

    const result = await docClient.send(new QueryCommand({
      TableName: TXN_TABLE,
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :uid AND createdAt BETWEEN :s AND :e',
      FilterExpression: '#type = :expense',
      ExpressionAttributeValues: { ':uid': userId, ':s': startDate, ':e': endDate, ':expense': 'expense' },
      ExpressionAttributeNames: { '#type': 'type' },
    }))

    const byCategory = {}
    for (const t of result.Items || []) {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount
    }

    const total = Object.values(byCategory).reduce((s, v) => s + v, 0)
    const breakdown = Object.entries(byCategory)
      .map(([category, amount]) => ({ category, amount, percent: total > 0 ? (amount / total) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount)

    await setCache(userId, cacheKey, breakdown)
    return r.ok(breakdown)
  } catch (e) {
    if (e.statusCode) return r.unauth(e.message)
    return r.error('Get categories failed', e)
  }
}

// --- Router Wrapper ---
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  const path = event.resource || event.path || ''
  if (path === '/analytics') return exports.getSummary(event)
  if (path === '/analytics/trend') return exports.getMonthlyTrend(event)
  if (path === '/analytics/categories') return exports.getCategoryBreakdown(event)
  return r.notFound()
}
