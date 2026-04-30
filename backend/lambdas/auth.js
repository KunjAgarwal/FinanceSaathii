'use strict'

const { GetCommand, PutCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb')
const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const { docClient }  = require('../utils/db')
const r              = require('../utils/response')
const { verifyToken } = require('../utils/authorizer')

const USERS_TABLE = process.env.USERS_TABLE || 'fs-users'
const JWT_SECRET  = process.env.JWT_SECRET
const JWT_EXPIRY  = '30d'

const VALID_CURRENCIES = ['INR','USD','EUR','GBP','JPY','AED','SGD','CAD','AUD','CHF']

// ─── POST /auth/signup ────────────────────────────────────────────────────────
exports.signup = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  try {
    const { name, email, password, currency = 'INR' } = JSON.parse(event.body || '{}')

    if (!name?.trim() || !email?.trim() || !password)
      return r.badReq('name, email and password are required')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return r.badReq('Invalid email address')
    if (password.length < 8)
      return r.badReq('Password must be at least 8 characters')
    if (!VALID_CURRENCIES.includes(currency))
      return r.badReq('Invalid currency')

    // Check existing
    const existing = await docClient.send(new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :e',
      ExpressionAttributeValues: { ':e': email.toLowerCase() },
      Limit: 1,
    }))
    if (existing.Count > 0) return r.conflict('An account with this email already exists')

    const userId   = uuidv4()
    const passHash = await bcrypt.hash(password, 12)
    const now      = new Date().toISOString()

    await docClient.send(new PutCommand({
      TableName: USERS_TABLE,
      Item: {
        userId, name: name.trim(), email: email.toLowerCase(),
        password: passHash, currency, createdAt: now, updatedAt: now,
      },
    }))

    const token = jwt.sign({ userId, email: email.toLowerCase() }, JWT_SECRET, { expiresIn: JWT_EXPIRY })
    return r.created({ token, user: { userId, name: name.trim(), email: email.toLowerCase(), currency } })
  } catch (e) {
    return r.error('Signup failed', e)
  }
}

// ─── POST /auth/login ─────────────────────────────────────────────────────────
exports.login = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  try {
    const { email, password } = JSON.parse(event.body || '{}')
    if (!email || !password) return r.badReq('email and password are required')

    const result = await docClient.send(new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'email-index',
      KeyConditionExpression: 'email = :e',
      ExpressionAttributeValues: { ':e': email.toLowerCase() },
      Limit: 1,
    }))

    const user = result.Items?.[0]
    if (!user) return r.unauth('Invalid email or password')

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return r.unauth('Invalid email or password')

    const token = jwt.sign({ userId: user.userId, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRY })
    const { password: _, ...safeUser } = user
    return r.ok({ token, user: safeUser })
  } catch (e) {
    return r.error('Login failed', e)
  }
}

// ─── GET /profile ─────────────────────────────────────────────────────────────
exports.getProfile = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  try {
    const { userId } = verifyToken(event)
    const result = await docClient.send(new GetCommand({ TableName: USERS_TABLE, Key: { userId } }))
    if (!result.Item) return r.notFound('User not found')
    const { password: _, ...user } = result.Item
    return r.ok(user)
  } catch (e) {
    if (e.statusCode) return r.unauth(e.message)
    return r.error('Get profile failed', e)
  }
}

// ─── PUT /profile ─────────────────────────────────────────────────────────────
exports.updateProfile = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  try {
    const { userId } = verifyToken(event)
    const { name, currency } = JSON.parse(event.body || '{}')

    const updates = {}
    if (name?.trim())                      updates.name     = name.trim()
    if (currency && VALID_CURRENCIES.includes(currency)) updates.currency = currency
    if (Object.keys(updates).length === 0) return r.badReq('Nothing to update')

    updates.updatedAt = new Date().toISOString()
    const exprParts = Object.keys(updates).map(k => `#${k} = :${k}`)
    const exprNames  = Object.fromEntries(Object.keys(updates).map(k => [`#${k}`, k]))
    const exprValues = Object.fromEntries(Object.keys(updates).map(k => [`:${k}`, updates[k]]))

    const result = await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: `SET ${exprParts.join(', ')}`,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues,
      ReturnValues: 'ALL_NEW',
    }))

    const { password: _, ...user } = result.Attributes
    return r.ok(user)
  } catch (e) {
    if (e.statusCode) return r.unauth(e.message)
    return r.error('Update profile failed', e)
  }
}

// ─── PUT /profile/security/password ───────────────────────────────────────────
exports.changePassword = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  try {
    const { userId } = verifyToken(event)
    const { currentPassword, newPassword } = JSON.parse(event.body || '{}')

    if (!currentPassword || !newPassword) return r.badReq('currentPassword and newPassword required')
    if (newPassword.length < 8) return r.badReq('New password must be at least 8 characters')

    const result = await docClient.send(new GetCommand({ TableName: USERS_TABLE, Key: { userId } }))
    const user = result.Item
    if (!user) return r.notFound('User not found')

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return r.unauth('Incorrect current password')

    const newHash = await bcrypt.hash(newPassword, 12)
    await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: { userId },
      UpdateExpression: 'SET password = :p, updatedAt = :u',
      ExpressionAttributeValues: { ':p': newHash, ':u': new Date().toISOString() },
    }))

    return r.ok({ message: 'Password updated successfully' })
  } catch (e) {
    if (e.statusCode) return r.unauth(e.message)
    return r.error('Change password failed', e)
  }
}

// ─── DELETE /profile ────────────────────────────────────────────────────────
exports.deleteAccount = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  try {
    const { userId } = verifyToken(event)
    await docClient.send(new (require('@aws-sdk/lib-dynamodb').DeleteCommand)({
      TableName: USERS_TABLE,
      Key: { userId }
    }))
    return r.ok({ message: 'Account deleted' })
  } catch (e) {
    if (e.statusCode) return r.unauth(e.message)
    return r.error('Delete account failed', e)
  }
}

// --- Router Wrapper ---
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return r.cors()
  const path = event.resource || event.path || ''
  if (path === '/auth/signup') return exports.signup(event)
  if (path === '/auth/login') return exports.login(event)
  if (path === '/profile' && event.httpMethod === 'GET') return exports.getProfile(event)
  if (path === '/profile' && event.httpMethod === 'PUT') return exports.updateProfile(event)
  if (path === '/profile/security/password' && event.httpMethod === 'PUT') return exports.changePassword(event)
  if (path === '/profile' && event.httpMethod === 'DELETE') return exports.deleteAccount(event)
  return r.notFound()
}
