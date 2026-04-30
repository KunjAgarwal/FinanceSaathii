'use strict'

const { PutCommand, QueryCommand, UpdateCommand, DeleteCommand, GetCommand } = require('@aws-sdk/lib-dynamodb')
const { v4: uuidv4 }  = require('uuid')
const { docClient }   = require('../utils/db')
const r               = require('../utils/response')
const { verifyToken } = require('../utils/authorizer')
const dayjs           = require('dayjs')

const BUDGET_TABLE = process.env.BUDGETS_TABLE     || 'fs-budgets'
const TXN_TABLE    = process.env.TRANSACTIONS_TABLE || 'fs-transactions'
const CATEGORIES   = ['Food','Travel','Bills','Shopping','Health','Education','Other']

// ─── POST /budget ─────────────────────────────────────────────────────────────
exports.create = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  try {
    const { userId } = verifyToken(event)
    const { category, limit, month } = JSON.parse(event.body || '{}')

    if (!CATEGORIES.includes(category)) return r.badReq('Invalid category')
    if (!limit || isNaN(Number(limit)) || Number(limit) <= 0) return r.badReq('Invalid limit')

    const budgetMonth = month || dayjs().format('YYYY-MM')
    const now = new Date().toISOString()
    const budgetId = uuidv4()

    // Check for existing budget for same category+month
    const existing = await docClient.send(new QueryCommand({
      TableName: BUDGET_TABLE,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :uid',
      FilterExpression: 'category = :cat AND #month = :m',
      ExpressionAttributeValues: { ':uid': userId, ':cat': category, ':m': budgetMonth },
      ExpressionAttributeNames: { '#month': 'month' },
    }))
    if (existing.Count > 0) return r.conflict(`Budget for ${category} in ${budgetMonth} already exists`)

    const item = { budgetId, userId, category, limit: Number(limit), month: budgetMonth, spent: 0, createdAt: now, updatedAt: now }
    await docClient.send(new PutCommand({ TableName: BUDGET_TABLE, Item: item }))
    return r.created(item)
  } catch (e) {
    if (e.statusCode) return r.unauth(e.message)
    return r.error('Create budget failed', e)
  }
}

// ─── GET /budget ──────────────────────────────────────────────────────────────
exports.getAll = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  try {
    const { userId } = verifyToken(event)
    const qs    = event.queryStringParameters || {}
    const month = qs.month || dayjs().format('YYYY-MM')

    // Get budgets
    const budgetRes = await docClient.send(new QueryCommand({
      TableName: BUDGET_TABLE,
      IndexName: 'userId-index',
      KeyConditionExpression: 'userId = :uid',
      FilterExpression: '#month = :m',
      ExpressionAttributeValues: { ':uid': userId, ':m': month },
      ExpressionAttributeNames: { '#month': 'month' },
    }))
    const budgets = budgetRes.Items || []

    if (budgets.length === 0) return r.ok({ budgets: [], month })

    // Get actual spending for each budget category this month
    const startDate = dayjs(month).startOf('month').toISOString()
    const endDate   = dayjs(month).endOf('month').toISOString()

    const txnRes = await docClient.send(new QueryCommand({
      TableName: TXN_TABLE,
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :uid AND createdAt BETWEEN :s AND :e',
      FilterExpression: '#type = :expense',
      ExpressionAttributeValues: { ':uid': userId, ':s': startDate, ':e': endDate, ':expense': 'expense' },
      ExpressionAttributeNames: { '#type': 'type' },
    }))

    // Sum spending per category
    const spending = {}
    for (const t of txnRes.Items || []) {
      spending[t.category] = (spending[t.category] || 0) + t.amount
    }

    const enriched = budgets.map(b => ({ ...b, spent: spending[b.category] || 0 }))
    return r.ok({ budgets: enriched, month })
  } catch (e) {
    if (e.statusCode) return r.unauth(e.message)
    return r.error('Get budgets failed', e)
  }
}

// ─── PUT /budget/{budgetId} ───────────────────────────────────────────────────
exports.update = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  try {
    const { userId } = verifyToken(event)
    const { budgetId } = event.pathParameters || {}
    const { limit } = JSON.parse(event.body || '{}')

    if (!budgetId) return r.badReq('Budget ID required')
    if (!limit || isNaN(Number(limit)) || Number(limit) <= 0) return r.badReq('Invalid limit')

    const existing = await docClient.send(new GetCommand({ TableName: BUDGET_TABLE, Key: { budgetId } }))
    if (!existing.Item) return r.notFound('Budget not found')
    if (existing.Item.userId !== userId) return r.forbidden()

    const result = await docClient.send(new UpdateCommand({
      TableName: BUDGET_TABLE,
      Key: { budgetId },
      UpdateExpression: 'SET #limit = :l, updatedAt = :u',
      ExpressionAttributeNames: { '#limit': 'limit' },
      ExpressionAttributeValues: { ':l': Number(limit), ':u': new Date().toISOString() },
      ReturnValues: 'ALL_NEW',
    }))
    return r.ok(result.Attributes)
  } catch (e) {
    if (e.statusCode) return r.unauth(e.message)
    return r.error('Update budget failed', e)
  }
}

// ─── DELETE /budget/{budgetId} ────────────────────────────────────────────────
exports.deleteBudget = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  try {
    const { userId } = verifyToken(event)
    const { budgetId } = event.pathParameters || {}
    if (!budgetId) return r.badReq('Budget ID required')

    const existing = await docClient.send(new GetCommand({ TableName: BUDGET_TABLE, Key: { budgetId } }))
    if (!existing.Item) return r.notFound('Budget not found')
    if (existing.Item.userId !== userId) return r.forbidden()

    await docClient.send(new DeleteCommand({ TableName: BUDGET_TABLE, Key: { budgetId } }))
    return r.ok({ message: 'Budget deleted', budgetId })
  } catch (e) {
    if (e.statusCode) return r.unauth(e.message)
    return r.error('Delete budget failed', e)
  }
}

// ─── GET /budget/recommendations ──────────────────────────────────────────────
exports.getRecommendations = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  try {
    const { userId } = verifyToken(event)

    // Fetch 3-month spending history
    const threeMonthsAgo = dayjs().subtract(2, 'month').startOf('month').toISOString()
    const txnRes = await docClient.send(new QueryCommand({
      TableName: TXN_TABLE,
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :uid AND createdAt >= :s',
      FilterExpression: '#type = :expense',
      ExpressionAttributeValues: { ':uid': userId, ':s': threeMonthsAgo, ':expense': 'expense' },
      ExpressionAttributeNames: { '#type': 'type' },
    }))

    const spending = {}
    for (const t of txnRes.Items || []) {
      if (!spending[t.category]) spending[t.category] = []
      spending[t.category].push(t.amount)
    }

    // Generate rule-based recommendations
    const recommendations = []
    const SUGGESTED_LIMITS = { Food: 0.3, Shopping: 0.15, Travel: 0.1, Bills: 0.2, Health: 0.1, Education: 0.1, Other: 0.05 }

    for (const [category, amounts] of Object.entries(spending)) {
      const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length
      const trend = amounts.length > 1 ? amounts[amounts.length - 1] - amounts[0] : 0

      if (trend > avg * 0.2) {
        recommendations.push({
          category,
          title: `${category} spending is rising`,
          message: `Your ${category} expenses increased by ${Math.round((trend / amounts[0]) * 100)}% over the past months. Consider setting a tighter limit.`,
          suggestedLimit: Math.round(avg * 1.1 / 100) * 100,
          priority: 'high',
        })
      } else if (avg > 5000) {
        recommendations.push({
          category,
          title: `High ${category} spending detected`,
          message: `You're averaging ₹${Math.round(avg).toLocaleString('en-IN')} on ${category} per month. The suggested allocation is ${Math.round(SUGGESTED_LIMITS[category] * 100)}% of income.`,
          suggestedLimit: Math.round(avg * 0.9 / 100) * 100,
          priority: 'medium',
        })
      }
    }

    // General tips if no specific recommendations
    if (recommendations.length === 0) {
      recommendations.push(
        { category: 'General', title: 'Add transactions to get insights', message: 'Start tracking your income and expenses to receive personalized budget recommendations.', priority: 'info' },
        { category: 'Savings', title: 'Aim for 20% savings rate', message: 'Financial experts recommend saving at least 20% of your monthly income for long-term wealth building.', priority: 'info' },
      )
    }

    return r.ok({ recommendations: recommendations.slice(0, 5) })
  } catch (e) {
    if (e.statusCode) return r.unauth(e.message)
    return r.error('Get recommendations failed', e)
  }
}

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
