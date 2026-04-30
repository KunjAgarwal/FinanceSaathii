'use strict'

const {
  PutCommand, QueryCommand, UpdateCommand, DeleteCommand, GetCommand
} = require('@aws-sdk/lib-dynamodb')
const { v4: uuidv4 }   = require('uuid')
const { docClient }    = require('../utils/db')
const r                = require('../utils/response')
const { verifyToken }  = require('../utils/authorizer')
const { invalidateAnalyticsCache } = require('../utils/cache')
const dayjs            = require('dayjs')

const TABLE    = process.env.TRANSACTIONS_TABLE || 'fs-transactions'
const TYPES    = ['income', 'expense']
const CATEGORIES = ['Food','Travel','Bills','Shopping','Health','Education','Other']

// ─── POST /transactions ───────────────────────────────────────────────────────
exports.create = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  try {
    const { userId } = verifyToken(event)
    const { amount, type, category, description = '', date } = JSON.parse(event.body || '{}')

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return r.badReq('Invalid amount')
    if (!TYPES.includes(type))      return r.badReq(`type must be one of: ${TYPES.join(', ')}`)
    if (!CATEGORIES.includes(category)) return r.badReq(`category must be one of: ${CATEGORIES.join(', ')}`)

    const txnDate = date || dayjs().format('YYYY-MM-DD')
    const now     = new Date().toISOString()
    const id      = uuidv4()

    const item = {
      id, userId,
      amount: Number(amount),
      type, category,
      description: description.trim().slice(0, 200),
      date: txnDate,
      createdAt: now,
      updatedAt: now,
    }

    await docClient.send(new PutCommand({ TableName: TABLE, Item: item }))
    await invalidateAnalyticsCache(userId)
    return r.created(item)
  } catch (e) {
    if (e.statusCode) return r.unauth(e.message)
    return r.error('Create transaction failed', e)
  }
}

// ─── GET /transactions ────────────────────────────────────────────────────────
exports.getAll = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  try {
    const { userId } = verifyToken(event)
    const qs = event.queryStringParameters || {}
    const limit    = Math.min(Number(qs.limit || 50), 200)
    const type     = qs.type
    const category = qs.category
    const month    = qs.month  // e.g. "2024-01"
    const startDate = qs.startDate
    const endDate   = qs.endDate

    const params = {
      TableName: TABLE,
      IndexName: 'userId-createdAt-index',
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
      ScanIndexForward: false,
      Limit: limit,
    }

    const filters = []
    if (type)     { params.ExpressionAttributeValues[':t'] = type;     filters.push('#type = :t'); params.ExpressionAttributeNames = { ...(params.ExpressionAttributeNames || {}), '#type': 'type' } }
    if (category) { params.ExpressionAttributeValues[':cat'] = category; filters.push('category = :cat') }
    if (month)    { params.ExpressionAttributeValues[':m'] = month; filters.push('begins_with(#date, :m)'); params.ExpressionAttributeNames = { ...(params.ExpressionAttributeNames || {}), '#date': 'date' } }
    if (startDate){ params.ExpressionAttributeValues[':sd'] = startDate; filters.push('#date >= :sd'); params.ExpressionAttributeNames = { ...(params.ExpressionAttributeNames || {}), '#date': 'date' } }
    if (endDate)  { params.ExpressionAttributeValues[':ed'] = endDate;   filters.push('#date <= :ed'); params.ExpressionAttributeNames = { ...(params.ExpressionAttributeNames || {}), '#date': 'date' } }
    if (filters.length) params.FilterExpression = filters.join(' AND ')

    const result = await docClient.send(new QueryCommand(params))
    return r.ok({ transactions: result.Items || [], count: result.Count })
  } catch (e) {
    if (e.statusCode) return r.unauth(e.message)
    return r.error('Get transactions failed', e)
  }
}

// ─── PUT /transactions/{id} ───────────────────────────────────────────────────
exports.update = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  try {
    const { userId } = verifyToken(event)
    const { id } = event.pathParameters || {}
    if (!id) return r.badReq('Transaction ID required')

    const { amount, type, category, description, date } = JSON.parse(event.body || '{}')

    // Verify ownership
    const existing = await docClient.send(new GetCommand({ TableName: TABLE, Key: { id } }))
    if (!existing.Item) return r.notFound('Transaction not found')
    if (existing.Item.userId !== userId) return r.forbidden()

    const updates = { updatedAt: new Date().toISOString() }
    if (amount   !== undefined && !isNaN(Number(amount)) && Number(amount) > 0) updates.amount = Number(amount)
    if (type     && TYPES.includes(type))      updates.type = type
    if (category && CATEGORIES.includes(category)) updates.category = category
    if (description !== undefined) updates.description = description.trim().slice(0, 200)
    if (date) updates.date = date

    const exprParts  = Object.keys(updates).map(k => `#${k} = :${k}`)
    const exprNames  = Object.fromEntries(Object.keys(updates).map(k => [`#${k}`, k]))
    const exprValues = Object.fromEntries(Object.keys(updates).map(k => [`:${k}`, updates[k]]))

    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE,
      Key: { id },
      UpdateExpression: `SET ${exprParts.join(', ')}`,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues,
      ReturnValues: 'ALL_NEW',
    }))
    await invalidateAnalyticsCache(userId)
    return r.ok(result.Attributes)
  } catch (e) {
    if (e.statusCode) return r.unauth(e.message)
    return r.error('Update transaction failed', e)
  }
}

// ─── DELETE /transactions/{id} ────────────────────────────────────────────────
exports.deleteTransaction = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  try {
    const { userId } = verifyToken(event)
    const { id } = event.pathParameters || {}
    if (!id) return r.badReq('Transaction ID required')

    // Verify ownership
    const existing = await docClient.send(new GetCommand({ TableName: TABLE, Key: { id } }))
    if (!existing.Item) return r.notFound('Transaction not found')
    if (existing.Item.userId !== userId) return r.forbidden()

    await docClient.send(new DeleteCommand({ TableName: TABLE, Key: { id } }))
    await invalidateAnalyticsCache(userId)
    return r.ok({ message: 'Transaction deleted', id })
  } catch (e) {
    if (e.statusCode) return r.unauth(e.message)
    return r.error('Delete transaction failed', e)
  }
}

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
